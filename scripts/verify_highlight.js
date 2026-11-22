/* Editable source must keep its exact text, escape HTML, and color supported languages. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const c = {window:{}};
vm.createContext(c);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/highlight.js'),'utf8'),c);
const HL = c.window.HL;
function plain(html) { return html.replace(/<span class="tk-\w+">|<\/span>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&'); }
const examples = {
  java:'import java.io.*;\npublic class RecordBytes {\n  // 中文注释\n  int value = 980;\n  String s = "<script>&";\n}',
  python:'import hashlib\ndef sign(text):\n    # 中文说明\n    return hashlib.md5(text.encode("utf-8")).hexdigest()\n',
  javascript:'const values = [1, 2];\nconsole.log(values.map(n => n + 1), "你好"); // comment\n',
  sql:"SELECT name FROM students WHERE score >= 80 AND name != '<tag>';",
  html:'<h1 class="title">你好</h1>\n<button>运行</button>'
};
for (const [lang,source] of Object.entries(examples)) {
  const html = HL(source,lang);
  assert.equal(plain(html),source,lang+': exact source text');
  assert.match(html,/class="tk-kw"/,lang+': keywords/tags');
  assert.match(html,/class="tk-str"/,lang+': strings');
  assert.doesNotMatch(html,/<script>|<h1|<button/);
}
assert.match(HL('int n = 980;','java'), /tk-num">980/);
assert.match(HL('/* unfinished\npublic class Hidden','java'),/^<span class="tk-com">/);
assert.match(HL('"""doc\nsecond line"""','python'),/^<span class="tk-str">/);
assert.equal(HL('<tag>','text'),'&lt;tag&gt;');
assert.equal(HL(examples.python,'py'),HL(examples.python,'python'));
assert.equal(HL(examples.javascript,'js'),HL(examples.javascript,'javascript'));
const large = ('int value = 980; // comment\n').repeat(2500);
const started = Date.now();
assert.equal(plain(HL(large,'java')),large);
console.log('PASS: Java/Python/JavaScript/SQL/HTML highlighting, exact text, escaping, incomplete edits and '+large.length+' characters ('+(Date.now()-started)+' ms).');
