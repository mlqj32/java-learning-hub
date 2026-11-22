/* Runs entirely in a browser Worker. No /api endpoint or native subprocess. */
'use strict';
var runtimeRoot = new URL('../vendor/', self.location.href).href;
// Doppio's cooperative scheduler uses the Node-style immediate queue.
var immediateChannel = new MessageChannel(), immediateTasks = new Map(), immediateId = 0;
immediateChannel.port1.onmessage = function (event) { var task = immediateTasks.get(event.data); immediateTasks.delete(event.data); if (task) task(); };
self.setImmediate = function (fn) { var args = Array.prototype.slice.call(arguments, 1), id = ++immediateId; immediateTasks.set(id, function () { fn.apply(null, args); }); immediateChannel.port2.postMessage(id); return id; };
self.clearImmediate = function (id) { immediateTasks.delete(id); };
var runStart = Date.now(), outputSize = 0;
function status(message) { self.postMessage({ type: 'status', message: message }); }
function output(text) { outputSize += text.length; if (outputSize > 65536) throw Error('输出超过 65,536 字符，已停止。'); self.postMessage({ type: 'output', text: text }); }
function done(data) { data.elapsedMs = Date.now() - runStart; self.postMessage({ type: 'done', data: data }); }
function load(url) { importScripts(runtimeRoot + url); }
function mkdir(fs, path) { var current = ''; path.split('/').filter(Boolean).forEach(function (part) { current += '/' + part; if (!fs.existsSync(current)) fs.mkdirSync(current); }); }
function javaSource(code, selected) {
  if (!code.trim()) throw Error('请输入 Java 源码。');
  // Mask comments and literals before finding top-level declarations; retain offsets/newlines.
  var masked = code.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, function (s) { return s.replace(/[^\n]/g, ' '); });
  var pkg = masked.match(/\bpackage\s+([\w.]+)\s*;/), publicClass = null, anyClass = null;
  var declarations = /[{}]|\b(public\s+)?(?:(?:final|abstract|strictfp)\s+)*(?:class|interface|enum|record)\s+(\w+)/g, match, depth = 0;
  while ((match = declarations.exec(masked))) {
    if (match[0] === '{') depth++;
    else if (match[0] === '}') depth--;
    else if (depth === 0) { if (!anyClass) anyClass = [match[0], match[2]]; if (match[1] && !publicClass) publicClass = [match[0], match[2]]; }
  }
  var name = publicClass ? publicClass[1] : anyClass ? anyClass[1] : 'Main';
  if (!anyClass) {
    var imports = [], ranges = [], directive = /\b(?:package\s+[\w.]+|import\s+(?:static\s+)?[\w.*]+)\s*;/g;
    while ((match = directive.exec(masked))) { imports.push(code.slice(match.index, directive.lastIndex)); ranges.push([match.index, directive.lastIndex]); }
    var body = code; ranges.reverse().forEach(function (range) { body = body.slice(0, range[0]) + body.slice(range[0], range[1]).replace(/[^\n]/g, ' ') + body.slice(range[1]); });
    code = imports.join('\n') + '\npublic class Main { public static void main(String[] args) throws Exception {\n' + body + '\n}}';
  }
  var prefix = pkg ? pkg[1] + '.' : '', chosen = selected.trim(), main = chosen ? (chosen.indexOf('.') < 0 ? prefix + chosen : chosen) : prefix + name;
  if (!/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/.test(main)) throw Error('主类名格式不正确。');
  return { source: code, filename: name + '.java', main: main };
}
async function javaRun(task) {
  var prepared = javaSource(task.code, task.mainClass || '');
  status('正在加载网页 JVM 与 Java 8 编译器（首次约 42 MB）…');
  load('browserfs/browserfs.min.js'); load('doppio/doppio.js');
  await new Promise(function (resolve, reject) {
    BrowserFS.configure({ fs: 'MountableFileSystem', options: {
      '/sys': { fs: 'XmlHttpRequest', options: { index: runtimeRoot + 'doppio/listings.json', baseUrl: runtimeRoot + 'doppio/' } },
      '/home': { fs: 'InMemory' }, '/tmp': { fs: 'InMemory' }
    } }, function (err) { if (err) reject(err); else resolve(); });
  });
  var fs = BrowserFS.BFSRequire('fs'), process = BrowserFS.BFSRequire('process');
  if (process.initializeTTYs) process.initializeTTYs();
  var decoder = new TextDecoder('utf-8');
  function stream(data) { var text = decoder.decode(new Uint8Array(data), { stream: true }); if (text) output(text); }
  process.stdout.on('data', stream); process.stderr.on('data', stream);
  process.chdir('/home');
  fs.writeFileSync('/home/' + prepared.filename, prepared.source, 'utf8');
  fs.writeFileSync('/home/.stdin', task.stdin || '', 'utf8');
  // A real virtual file gives Scanner/readLine correct UTF-8 and EOF semantics.
  // BrowserFS's interactive TTY otherwise waits forever after the supplied input.
  var launcher = 'package org.learninghub.runtime; public class HubVirtualEntry { public static void main(String[] args) throws Throwable { try { System.setIn(new java.io.FileInputStream("/home/.stdin")); Class<?> c = Class.forName(args[0]); java.lang.reflect.Method m = c.getMethod("main", String[].class); if (!java.lang.reflect.Modifier.isStatic(m.getModifiers()) || m.getReturnType() != void.class) throw new NoSuchMethodException("Expected public static void main(String[] args)"); m.setAccessible(true); try { m.invoke(null, (Object) java.util.Arrays.copyOfRange(args, 1, args.length)); } catch (java.lang.reflect.InvocationTargetException e) { throw e.getCause(); } } catch (Throwable e) { new java.io.FileOutputStream("/home/.failed").close(); e.printStackTrace(); System.exit(1); } } }';
  fs.writeFileSync('/home/HubVirtualEntry.java', launcher, 'utf8');
  var home = '/sys/vendor/java_home';
  var bootstrap = ['rt.jar', 'doppio.jar', 'resources.jar', 'charsets.jar', 'jce.jar', 'jsse.jar'].map(function (name) { return home + '/lib/' + name; });
  function jvmRun(main, args, compiler) {
    return new Promise(function (resolve, reject) {
      new Doppio.VM.JVM({ doppioHomePath: '/sys', javaHomePath: home, bootstrapClasspath: bootstrap, classpath: compiler ? ['/home', home + '/lib/tools.jar'] : ['/home'], tmpDir: '/tmp', responsiveness: 10, properties: { 'file.encoding': 'UTF-8', 'user.language': 'en', 'user.country': 'US' } }, function (err, jvm) {
        if (err) { reject(Error(String(err))); return; }
        jvm.runClass(main, args, resolve);
      });
    });
  }
  status('网页 JVM 正在编译源码…');
  var code = await jvmRun('com.sun.tools.javac.Main', ['-encoding', 'UTF-8', '-proc:none', '-source', '8', '-target', '8', '-d', '/home', '/home/' + prepared.filename, '/home/HubVirtualEntry.java'], true);
  if (code !== 0) { done({ ok: false, stage: '网页编译', message: '编译失败。网页 JVM 当前支持 Java 8；Java 9～21 语法或外部依赖会报告编译错误。', exitCode: code }); return; }
  status('源码已编译，正在网页 JVM 中执行…');
  code = await jvmRun('org.learninghub.runtime.HubVirtualEntry', [prepared.main].concat(task.args || []), false);
  if (fs.existsSync('/home/.failed')) code = code || 1;
  var rest = decoder.decode(); if (rest) output(rest);
  done({ ok: code === 0, stage: '网页 JVM · Java 8', message: code === 0 ? '' : '虚拟机中的程序以非零状态结束。', exitCode: code });
}
async function pythonRun(task) {
  status('正在加载网站内置 Python / WebAssembly（首次约 14 MB）…');
  load('pyodide/pyodide.js');
  var input = task.stdin || '', lines = input ? input.replace(/\r\n/g, '\n').split('\n') : [], cursor = 0;
  if (input.endsWith('\n')) lines.pop();
  var py = await loadPyodide({ indexURL: runtimeRoot + 'pyodide/', stdin: function () { return cursor < lines.length ? lines[cursor++] : null; }, stdout: function (s) { output(s + '\n'); }, stderr: function (s) { output(s + '\n'); } });
  status('正在浏览器 Python 虚拟文件系统中执行…');
  py.globals.set('__hub_source', task.code); py.globals.set('__hub_args', JSON.stringify(task.args || []));
  await py.runPythonAsync('import sys, json, os\nos.makedirs("/home/lesson", exist_ok=True)\nos.chdir("/home/lesson")\nsys.argv = ["main.py"] + json.loads(__hub_args)\nexec(compile(__hub_source, "main.py", "exec"), {"__name__": "__main__", "__file__": "main.py"})');
  done({ ok: true, stage: '浏览器 Python · WebAssembly' });
}
async function sqlRun(task) {
  status('正在加载网站内置 SQLite / WebAssembly…'); load('sql.js/sql-wasm.js');
  var SQL = await initSqlJs({ locateFile: function (file) { return runtimeRoot + 'sql.js/' + file; } }), db = new SQL.Database(), tables = [];
  try {
    for (var statement of db.iterateStatements(task.code)) {
      try {
        var columns = statement.getColumnNames(), rows = [], truncated = false;
        while (statement.step()) { if (rows.length >= 200) { truncated = true; break; } rows.push(statement.get().map(function (v) { return v instanceof Uint8Array ? Array.from(v).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('') : v; })); }
        if (columns.length) tables.push({ columns: columns, rows: rows, truncated: truncated }); else tables.push({ changed: db.getRowsModified() });
      } finally { statement.free(); }
    }
    done({ ok: true, stage: '浏览器 SQLite · WebAssembly', tables: tables });
  } finally { db.close(); }
}
self.onmessage = async function (event) {
  runStart = Date.now(); outputSize = 0;
  try {
    var task = event.data;
    if (typeof task.code !== 'string' || !task.code.trim() || task.code.length > 80000) throw Error('请输入 1～80000 字符的代码。');
    if (typeof task.stdin !== 'string' || task.stdin.length > 10000) throw Error('标准输入最多 10000 字符。');
    if (!Array.isArray(task.args) || task.args.length > 30 || task.args.some(function (arg) { return typeof arg !== 'string' || arg.length > 1000; })) throw Error('参数最多 30 个，每个不超过 1000 字符。');
    if (task.language === 'java') await javaRun(task); else if (task.language === 'python') await pythonRun(task); else if (task.language === 'sql') await sqlRun(task); else throw Error('未知的虚拟运行语言。');
  }
  catch (err) { done({ ok: false, stage: '网站虚拟环境', message: err && err.message ? err.message : String(err) }); }
};
