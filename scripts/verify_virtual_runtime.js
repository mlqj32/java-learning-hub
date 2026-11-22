/* Verify the browser runtime contract without invoking native compilers. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const worker = fs.readFileSync(path.join(root, 'assets/js/virtual-worker.js'), 'utf8');
new vm.Script(worker, {filename: 'virtual-worker.js'});
class FakeChannel { constructor() { this.port1 = {}; this.port2 = {postMessage() {}}; } }
const context = {URL, MessageChannel: FakeChannel, self: {location: {href: 'https://example.test/assets/js/virtual-worker.js'}, postMessage() {}}, TextDecoder};
vm.createContext(context);
vm.runInContext(worker, context);
function source(code, main = '') { return context.javaSource(code, main); }
assert.match(source('System.out.println(2+3);').source, /public class Main/);
assert.equal(source('// public class Fake {}\npublic class Real {}').filename, 'Real.java');
assert.equal(source('System.out.println("class Fake {}");').filename, 'Main.java');
assert.equal(source('package lab; class Helper {} public class Main {}').main, 'lab.Main');
assert.equal(source('package lab; class Helper {} class Entry {}', 'Entry').main, 'lab.Entry');
assert.equal(source('package lab; class Helper {}', 'other.Main').main, 'other.Main');
assert.equal(source('class Outer { public class Inner {} }').filename, 'Outer.java');
assert.equal(source('public record Pair(int a, int b) {}').filename, 'Pair.java');
const snippet = source('package lab; import java.util.*; System.out.println(Arrays.asList(1, 2));');
assert.equal(snippet.main, 'lab.Main');
assert.match(snippet.source, /import java.util.\*;\npublic class Main/);
assert.throws(() => source('class Main {}', '../invalid'));
assert.throws(() => source('   '));
assert.match(worker, /FileInputStream\("\/home\/\.stdin"\)/);
assert.match(worker, /InvocationTargetException/);
const vendor = path.join(root, 'assets/vendor');
const manifest = JSON.parse(fs.readFileSync(path.join(vendor, 'manifest.json'), 'utf8'));
let bytes = 0;
for (const [name, expected] of Object.entries(manifest.files)) {
  const data = fs.readFileSync(path.join(vendor, name));
  assert.equal(data.length, expected.bytes, name + ' length');
  assert.equal(crypto.createHash('sha256').update(data).digest('hex'), expected.sha256, name + ' SHA-256');
  bytes += data.length;
}
assert.equal(bytes, manifest.totalBytes);
for (const name of ['browserfs/browserfs.min.js','doppio/doppio.js','doppio/doppio.jar','doppio/listings.json','doppio/vendor/java_home/lib/rt.jar','doppio/vendor/java_home/lib/tools.jar','pyodide/pyodide.js','pyodide/pyodide.asm.js','pyodide/pyodide.asm.wasm','pyodide/python_stdlib.zip','sql.js/sql-wasm.js','sql.js/sql-wasm.wasm']) assert.ok(manifest.files[name], name);
const runner = fs.readFileSync(path.join(root, 'assets/js/runner.js'), 'utf8');
assert.doesNotMatch(runner, /fetch\s*\(|\/api\/(?:run|runner)|localhost:8766/);
assert.match(runner, /worker\.terminate\(\)/);
const server = fs.readFileSync(path.join(root, 'scripts/serve.py'), 'utf8');
assert.doesNotMatch(server, /import (?:subprocess|sqlite3)|Popen|run_code|shutil\.which/);
console.log('PASS: Java source handling, stdin/exception launcher, ' + Object.keys(manifest.files).length + ' pinned asset hashes, browser-only runner and static preview (' + bytes + ' bytes).');
