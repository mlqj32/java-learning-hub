(function () {
  'use strict';
  var active = new Set(), fieldSequence = 0;
  function el(tag, cls, text) { var node = document.createElement(tag); if (cls) node.className = cls; if (text !== undefined) node.textContent = text; return node; }
  function button(text, fn) { var b = el('button', 'runtime-button', text); b.type = 'button'; b.onclick = fn; return b; }
  function language(lang) { return ({ py: 'python', python3: 'python', js: 'javascript', mysql: 'sql', htm: 'html' })[lang] || lang; }
  function isGui(code) { return /\b(?:javax\.swing|java\.awt|javafx\.|javax\.microedition)/.test(code); }
  function supported(lang) { return ['java', 'python', 'sql', 'javascript', 'html', 'svg'].indexOf(lang) >= 0; }
  function boundaryType(lang, code) {
    if (lang !== 'java') return '';
    var executable = code.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, ' ');
    // An explicit lesson marker identifies an intentionally incomplete source extract.
    // Do not reject ordinary statement snippets or complete experiments with main.
    if (/^\s*\/\/\s*源码摘录[^\n]*\n/.test(code) && !/\bstatic\s+void\s+main\s*\(/.test(executable)) return 'source';
    if (/\borg\.springframework\b|@(?:Service|Component|Controller|RestController|Repository|Configuration|Bean|Autowired|EventListener|TransactionalEventListener)\b|\b(?:ApplicationEventPublisher|ApplicationEvent|jdbcTemplate)\b/.test(executable)) {
      return 'framework';
    }
    return '';
  }
  function boundary(lang, code) {
    var type = boundaryType(lang, code);
    if (type === 'source') return '这是 JDK 源码摘录，省略了构造器、其他成员或依赖，只用于观察内部结构，不能当作完整程序编译。请使用“逐行阅读”理解各行含义，再运行同节的完整示例验证行为。JDK 17 的源码用于版本对照，完整实验使用网站支持的 Java 8 写法。';
    if (type === 'framework') return '这是 Spring 框架集成片段，包含容器、注解或数据库模板依赖，不能作为独立 Java 程序运行。可先运行本章对应的完整 Java 示例，观察策略分派、事件通知或模板流程；此处用于对照框架中的写法。';
    return '';
  }
  function explain(host, lang, code) {
    host.appendChild(el('p', 'runtime-note', boundary(lang, code) || (lang === 'java' && isGui(code) ? '此图形片段尚无对应窗口模型。网站提供计算器、倒计时、小球、方块、MIDlet 和 RecordStore 六个课程模型。' : '这类配置或工具片段尚未接入网站虚拟执行器。可逐行阅读，或打开本章实验观察对应原理；不会执行操作系统命令或启动外部服务。')));
    if (boundaryType(lang, code) === 'source') return;
    host.appendChild(el('p', 'runtime-note', 'Java 8、Python、JavaScript、HTML 与 SQLite 可在网站虚拟环境中运行，无需安装语言环境。Spring 等框架依赖和真实数据库服务不包含在当前虚拟环境中。'));
    var link = el('a', 'runtime-link', '打开运行实验室 →'); link.href = '#/playground'; host.appendChild(link);
  }
  function editor(host, initial, lang, file) {
    var worker = null, killed = false, timer = null, serial = 0, pendingFinish = null;
    host.classList.add('runtime-editor');
    var mode = lang === 'sql' ? '网站虚拟环境 · SQLite / WebAssembly' : ['html', 'svg'].indexOf(lang) >= 0 ? '网站虚拟环境 · 隔离网页窗口' : lang === 'javascript' ? '网站虚拟环境 · JavaScript Worker' : lang === 'java' ? '网站虚拟环境 · Java 8 JVM' : '网站虚拟环境 · Python / WebAssembly';
    host.appendChild(el('div', 'runtime-mode', mode));
    host.appendChild(el('p', 'runtime-note', lang === 'java' ? '源码在浏览器 JVM 内编译运行，无需 JDK。支持 Java 8 标准库与语句片段，Java 9～21 新语法和 Spring 等依赖尚不支持。首次加载网站自带编译器资源约 42 MB；执行过程可随时停止。线程由网页 JVM 调度，单次计数正确不代表没有竞态。' : lang === 'sql' ? 'SQLite 在浏览器 WebAssembly 中执行，每次创建独立内存库，无需数据库安装。MySQL 专有语法、锁与存储引擎不能在这里验证。' : lang === 'python' ? 'Python 在浏览器 WebAssembly 与虚拟文件系统中执行，无需本机 Python。网站已打包标准库；第三方包不自动安装。首次加载资源约 14 MB。' : lang === 'javascript' ? '可使用 console.log、input 和 args；独立 Worker 中没有 DOM。无限循环会在 10 秒后终止。' : '在隔离窗口中预览 HTML/CSS/JavaScript；外部网络资源、弹窗与表单提交不开放。'));
    var sourceLabel = el('label', 'runtime-field', '可编辑代码' + (file ? ' · ' + file : ''));
    var codeEditor = el('div', 'runtime-code-editor'), highlighted = el('pre', 'runtime-highlight'), highlightedCode = el('code'); highlighted.setAttribute('aria-hidden', 'true'); highlighted.appendChild(highlightedCode);
    var source = el('textarea', 'runtime-source'); source.value = initial; source.spellcheck = false; source.setAttribute('aria-label', '可编辑代码'); source.setAttribute('wrap', 'off'); source.setAttribute('autocapitalize', 'off'); source.setAttribute('autocomplete', 'off'); source.rows = Math.min(16, Math.max(6, initial.split('\n').length));
    codeEditor.appendChild(highlighted); codeEditor.appendChild(source); sourceLabel.appendChild(codeEditor); host.appendChild(sourceLabel);
    function syncHighlight() { highlightedCode.innerHTML = window.HL(source.value, lang) + '\n'; syncScroll(); }
    function syncScroll() { highlighted.style.width = (source.clientWidth + 2) + 'px'; highlighted.style.height = (source.clientHeight + 2) + 'px'; highlighted.scrollTop = source.scrollTop; highlighted.scrollLeft = source.scrollLeft; }
    source.addEventListener('input', syncHighlight); source.addEventListener('scroll', syncScroll); syncHighlight();
    var resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(syncScroll) : null; if (resizeObserver) resizeObserver.observe(source);
    var inputs = el('div', 'runtime-inputs'), stdin, args, main, inputGuide;
    function help(wrap, control, text) { var note = el('small', 'runtime-field-help', text); note.id = 'runtime-field-help-' + (++fieldSequence); control.setAttribute('aria-describedby', note.id); wrap.appendChild(note); }
    function field(label, placeholder, explanation) { var wrap = el('label', 'runtime-field', label), area = el('textarea'); area.rows = 2; area.placeholder = placeholder; wrap.appendChild(area); help(wrap, area, explanation); inputs.appendChild(wrap); return area; }
    if (['java', 'python', 'javascript'].indexOf(lang) >= 0) {
      inputGuide = el('p', 'runtime-input-guide', '下方仅显示当前代码使用的输入项。'); host.appendChild(inputGuide);
      stdin = field('标准输入（按需填写）', '例如：小夏', lang === 'java' ? '运行前准备给 System.in 的文本。例如填“小夏”，Scanner.nextLine() 就能读到它；未读取 System.in 时留空。' : lang === 'python' ? '运行前准备给 input() / sys.stdin 的文本。多次 input() 按行读取；例如两次 input() 就填写两行。' : '整段文本作为 input 字符串传入代码。例如 console.log(input) 会打印这里的内容；不使用 input 时留空。'); stdin.setAttribute('aria-label', '标准输入');
      args = field('程序参数（每行一个，选填）', '小夏\n3', lang === 'python' ? '第一行是 sys.argv[1]，第二行是 sys.argv[2]；sys.argv[0] 是脚本名。每项都是字符串，空行忽略。不读取 sys.argv 时留空。' : '第一行是 args[0]，第二行是 args[1]。例如填“小夏”和“3”两行，会得到两个字符串参数；空行忽略。不读取 args 时留空。'); args.setAttribute('aria-label', '程序参数');
    }
    if (lang === 'java') {
      var mainLabel = el('label', 'runtime-field', '主类名（通常留空）'); main = el('input'); main.placeholder = '例如 Main 或 lab.Main'; main.setAttribute('aria-label', '主类名（选填）'); mainLabel.appendChild(main); help(mainLabel, main, '指定从哪个类的 main 开始运行。通常自动识别；同一源码有多个入口时再填写。带 package lab 的 Main 填 lab.Main。'); inputs.appendChild(mainLabel);
    }
    if (inputs.childNodes.length) host.appendChild(inputs);
    function updateOptions() {
      var needs = window.HUB_RUNTIME_OPTIONS.inspect(source.value, lang);
      [[stdin, needs.stdin], [args, needs.args], [main, needs.main]].forEach(function (item) { if (item[0]) item[0].parentElement.hidden = !item[1]; });
      inputs.hidden = !needs.stdin && !needs.args && !needs.main;
      if (inputGuide) inputGuide.hidden = inputs.hidden;
    }
    source.addEventListener('input', updateOptions); updateOptions();
    var actions = el('div', 'runtime-actions'), status = el('span', 'runtime-status', '修改代码后点击运行，观察结果如何变化。'); status.setAttribute('role', 'status');
    var run = button(['html', 'svg'].indexOf(lang) >= 0 ? '▶ 预览页面' : '▶ 运行代码', execute);
    actions.appendChild(run);
    actions.appendChild(button('恢复原例', function () { if (run.disabled) return; source.value = initial; source.scrollTop = source.scrollLeft = 0; syncHighlight(); if (stdin) stdin.value = ''; if (args) args.value = ''; if (main) main.value = ''; updateOptions(); output.replaceChildren(); status.textContent = '已恢复原例。'; }));
    var cancel = button('停止运行', function () { stop(); run.disabled = false; cancel.disabled = true; status.textContent = '虚拟环境已终止，程序与本次虚拟文件一并释放。'; }); cancel.disabled = true; actions.appendChild(cancel);
    host.appendChild(actions); host.appendChild(status);
    var output = el('div', 'runtime-result'); output.setAttribute('aria-label', '代码运行结果'); host.appendChild(output);
    function stop() { serial++; killed = true; if (worker) worker.terminate(); worker = null; if (timer) clearTimeout(timer); timer = null; if (pendingFinish) { pendingFinish(); pendingFinish = null; } }
    function result(data) {
      output.replaceChildren();
      if (data.output) output.appendChild(el('pre', 'runtime-console', data.output));
      (data.tables || []).forEach(function (item) {
        if (!item.columns) { output.appendChild(el('p', 'runtime-note', '语句执行成功 · 影响行数 ' + item.changed)); return; }
        var scroll = el('div', 'runtime-table-scroll'), table = el('table'), head = el('thead'), row = el('tr');
        item.columns.forEach(function (name) { row.appendChild(el('th', '', String(name))); }); head.appendChild(row); table.appendChild(head);
        var body = el('tbody'); item.rows.forEach(function (values) { var tr = el('tr'); values.forEach(function (value) { tr.appendChild(el('td', '', value === null ? 'NULL' : String(value))); }); body.appendChild(tr); }); table.appendChild(body); scroll.appendChild(table); output.appendChild(scroll);
        if (!item.rows.length) output.appendChild(el('p', 'runtime-note', '查询成功，0 行。'));
        if (item.truncated) output.appendChild(el('p', 'runtime-note', '仅展示前 200 行。'));
      });
      if (data.message) output.appendChild(el('p', 'runtime-error', data.message));
      if (!output.childNodes.length) output.appendChild(el('pre', 'runtime-console', '程序正常结束，没有控制台输出。'));
      status.textContent = (data.ok ? '✓ 执行成功' : '执行失败') + (data.stage ? ' · ' + data.stage : '') + (data.elapsedMs !== undefined ? ' · ' + data.elapsedMs + ' ms' : '');
    }
    async function execute() {
      stop(); killed = false; var current = serial; run.disabled = true; cancel.disabled = false; output.replaceChildren(); status.textContent = '正在执行…';
      try {
        if (lang === 'html' || lang === 'svg') {
          var frame = el('iframe', 'runtime-preview'); frame.title = '网页运行预览'; frame.setAttribute('sandbox', 'allow-scripts'); frame.referrerPolicy = 'no-referrer';
          frame.srcdoc = '<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\' \'unsafe-eval\'; style-src \'unsafe-inline\'; img-src data: blob:; font-src data:; connect-src \'none\'"><style>body{font:16px/1.6 system-ui,sans-serif;padding:16px;overflow-wrap:anywhere}*{box-sizing:border-box}img,svg,canvas{max-width:100%}</style>' + source.value;
          output.appendChild(frame); status.textContent = '✓ 已更新网页预览';
        } else if (lang === 'javascript') {
          await new Promise(function (resolve) {
            var lines = [], finished = false; pendingFinish = resolve;
            var blob = new Blob(['self.onmessage=async function(e){var stringify=function(v){try{return typeof v==="string"?v:JSON.stringify(v)}catch(_){return String(v)}};var console={log:function(){self.postMessage({line:Array.from(arguments).map(stringify).join(" ")})},error:function(){this.log.apply(this,arguments)},warn:function(){this.log.apply(this,arguments)}};try{await new Function("console","input","args",e.data.code)(console,e.data.input,e.data.args);self.postMessage({done:true})}catch(err){self.postMessage({done:true,error:err.name+": "+err.message})}}'], { type: 'text/javascript' });
            var url = URL.createObjectURL(blob); worker = new Worker(url); URL.revokeObjectURL(url);
            function finish(error) { if (finished) return; finished = true; clearTimeout(timer); if (worker) worker.terminate(); worker = null; pendingFinish = null; if (!killed && current === serial) result({ ok: !error, output: lines.join('\n'), message: error || '' }); resolve(); }
            worker.onmessage = function (e) { if (e.data.line !== undefined) { lines.push(String(e.data.line)); if (lines.join('\n').length > 65536) finish('输出超过 65,536 字符，已停止。'); } if (e.data.done) finish(e.data.error); };
            worker.onerror = function (e) { finish(e.message); };
            timer = setTimeout(function () { finish('运行超过 10 秒，已停止。'); }, 10000);
            worker.postMessage({ code: source.value, input: stdin.parentElement.hidden ? '' : stdin.value, args: args.parentElement.hidden ? [] : args.value.split('\n').filter(Boolean) });
          });
        } else {
          await new Promise(function (resolve) {
            var finished = false, text = '', liveOutput = el('pre', 'runtime-console'); output.appendChild(liveOutput);
            pendingFinish = resolve;
            function finish(data) { if (finished) return; finished = true; clearTimeout(timer); if (worker) worker.terminate(); worker = null; pendingFinish = null; if (!killed && current === serial) { data.output = text + (data.output || ''); result(data); } resolve(); }
            worker = new Worker(new URL('assets/js/virtual-worker.js?v=10.0', document.baseURI));
            function deadline(ms, message) { clearTimeout(timer); timer = setTimeout(function () { finish({ ok: false, message: message }); }, ms); }
            deadline(120000, '虚拟环境加载或编译超过 120 秒。请检查网站资源是否完整，或减少程序规模后重试。');
            worker.onmessage = function (event) {
              if (killed || current !== serial) return;
              var message = event.data;
              if (message.type === 'status') { status.textContent = message.message; if (/源码已编译|虚拟文件系统中执行/.test(message.message)) deadline(30000, '程序在网页虚拟环境运行超过 30 秒，已终止。'); }
              if (message.type === 'output') { text += message.text; liveOutput.textContent = text; if (text.length > 65536) finish({ ok: false, message: '输出超过 65,536 字符，已终止。' }); }
              if (message.type === 'done') finish(message.data);
            };
            worker.onerror = function (event) { finish({ ok: false, message: event.message || '网站虚拟运行资源加载失败，请刷新后重试。' }); };
            worker.postMessage({ language: lang, code: source.value, stdin: stdin && !stdin.parentElement.hidden ? stdin.value : '', args: args && !args.parentElement.hidden ? args.value.split('\n').filter(Boolean) : [], mainClass: main && !main.parentElement.hidden ? main.value : '' });
          });
        }
      } catch (error) {
        if (!killed && current === serial) result({ ok: false, message: error.message });
      } finally { if (current === serial) { run.disabled = false; cancel.disabled = true; } }
    }
    return function () { stop(); if (resizeObserver) resizeObserver.disconnect(); };
  }
  function mount(root) {
    root.querySelectorAll('.code-wrap[data-language]').forEach(function (wrap) {
      if (!wrap.dataset.language || wrap.dataset.language.toLowerCase() === 'text') return;
      if (wrap.dataset.runnerMounted) return; wrap.dataset.runnerMounted = '1';
      var lang = language(wrap.dataset.language), code = Array.from(wrap.querySelectorAll('td.cl')).map(function (td) { return td.textContent; }).join('\n');
      var kind = lang === 'java' && window.HUB_SIM ? window.HUB_SIM.detect(code) : null;
      var canRun = supported(lang) && !(lang === 'java' && isGui(code)) && !boundary(lang, code);
      var trigger = button(kind ? '▣ 模拟窗口' : canRun ? '▶ 运行 / 修改' : boundaryType(lang, code) === 'source' ? '源码阅读说明' : '运行说明', function () {
        var readingPosition = !kind && !canRun ? { left: window.scrollX, top: window.scrollY, behavior: 'instant' } : null;
        var existing = wrap.querySelector('.runtime-panel');
        if (existing) { var cleanup = existing._cleanup; if (cleanup) { cleanup(); active.delete(cleanup); } trigger.focus({ preventScroll: true }); existing.remove(); trigger.setAttribute('aria-expanded', 'false'); if (readingPosition) window.scrollTo(readingPosition); return; }
        var panel = el('section', 'runtime-panel'); panel.setAttribute('aria-label', kind ? '图形程序模拟窗口' : '代码实验区'); wrap.appendChild(panel); trigger.setAttribute('aria-expanded', 'true');
        var close = button('关闭实验区 ×', function () { trigger.click(); }); close.classList.add('runtime-close'); panel.appendChild(close);
        var cleanup;
        if (kind) cleanup = window.HUB_SIM.mount(panel, code, kind);
        else if (canRun) cleanup = editor(panel, code, lang, wrap.dataset.file);
        else explain(panel, lang, code);
        if (cleanup) { panel._cleanup = cleanup; active.add(cleanup); }
        panel.tabIndex = -1;
        if (kind || canRun) { panel.focus({ preventScroll: true }); panel.scrollIntoView({ block: 'start' }); }
        else window.scrollTo(readingPosition);
      });
      trigger.classList.add('code-run'); trigger.setAttribute('aria-expanded', 'false'); wrap.querySelector('.code-head').insertBefore(trigger, wrap.querySelector('[data-copy]'));
    });
  }
  var samples = {
    java: 'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        String name = scanner.hasNextLine() ? scanner.nextLine() : "Java";\n        int count = args.length == 0 ? 3 : Integer.parseInt(args[0]);\n        for (int i = 1; i <= count; i++) {\n            System.out.println(i + ": 你好，" + name);\n        }\n    }\n}',
    python: 'name = input("你的名字：")\nfor i in range(1, 4):\n    print(f"{i}: 你好，{name}")',
    sql: "CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT, score INTEGER);\nINSERT INTO students VALUES (1, '小林', 86), (2, '小夏', 92), (3, '小周', 72);\nSELECT name, score FROM students WHERE score >= 80 ORDER BY score DESC;",
    javascript: 'const numbers = [2, 4, 6];\nconsole.log("原数组", numbers);\nconsole.log("每个数加 1", numbers.map(n => n + 1));\nconsole.log("总和", numbers.reduce((a, b) => a + b, 0));',
    html: '<h1>我的第一个运行窗口</h1>\n<p>点击按钮，看看页面如何变化。</p>\n<button id="counter">已点击 0 次</button>\n<style>button{background:#4f46e5;color:white;border:0;border-radius:10px;padding:12px 20px;cursor:pointer}</style>\n<script>let count=0;document.querySelector("#counter").onclick=function(){this.textContent="已点击 "+(++count)+" 次"}</script>'
  };
  function page(root) {
    root.innerHTML = '<article class="doc playground"><header class="doc-header"><div class="doc-kicker">CODE PLAYGROUND · 运行实验室</div><h1 class="doc-title">改一行，运行一次，看见变化。</h1><p>代码由网站内置虚拟环境在浏览器中运行，无需安装 JDK、Python 或数据库，也无需启动代码执行服务。控制台、网页和课程图形窗口均可直接操作。</p></header><div class="playground-tabs" role="group" aria-label="实验语言"></div><div class="playground-editor"></div><section class="playground-gui"><h2>打开一个图形程序窗口</h2><p>与课程代码对应的教学模拟，可点击、暂停、单步和重置。</p><div class="playground-gui-links"></div></section></article>';
    var tabs = root.querySelector('.playground-tabs'), target = root.querySelector('.playground-editor'), cleanup = null;
    Object.keys(samples).forEach(function (lang) { var b = button(({ java: 'Java', python: 'Python', sql: 'SQL · SQLite', javascript: 'JavaScript', html: 'HTML 页面' })[lang], function () { if (cleanup) { cleanup(); active.delete(cleanup); } tabs.querySelectorAll('button').forEach(function (item) { item.setAttribute('aria-pressed', String(item === b)); }); target.replaceChildren(); cleanup = editor(target, samples[lang], lang); active.add(cleanup); }); b.dataset.lang = lang; tabs.appendChild(b); });
    var links = root.querySelector('.playground-gui-links');
    [['Swing 计算器 / JavaFX 倒计时 / 弹跳小球', '#/m/javahistory/ch05'], ['功能机 Canvas 移动方块', '#/m/javahistory/ch03']].forEach(function (item) { var a = el('a', 'runtime-link', item[0] + ' →'); a.href = item[1]; links.appendChild(a); });
    tabs.querySelector('button').click();
  }
  function dispose() { active.forEach(function (cleanup) { cleanup(); }); active.clear(); }
  window.HUB_RUNNER = { mount: mount, page: page, dispose: dispose, samples: samples, language: language, boundary: boundary, boundaryType: boundaryType };
})();
