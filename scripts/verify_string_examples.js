/* Source-reading boundaries must not hide runnable Java snippets. No native JDK. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = {window: {}, Set};
vm.createContext(context);
for (const file of ['assets/js/content/javase.js', 'assets/js/runner.js', 'assets/js/walkthrough.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, {filename: file});
}
const runner = context.window.HUB_RUNNER;
const classify = context.window.HUB_WALK.classify;
context.window.HUB_SIM = {detect: () => null};
const chapter = context.window.CONTENT.javase.chapters.find(c => c.id === 'ch03');
const blocks = [...chapter.content.matchAll(/```java[^\n]*\n([\s\S]*?)```/g)].map(m => m[1]);
assert.equal(blocks.length, 15);
assert.equal(runner.boundaryType('java', blocks[0]), 'source');
assert.equal(classify('java', blocks[0]), 'JDK 源码阅读');
assert.match(runner.boundary('java', blocks[0]), /构造器/);
for (const code of blocks.slice(1)) {
  assert.equal(runner.boundary('java', code), '');
  assert.match(code, /public\s+static\s+void\s+main\s*\(/);
  assert.doesNotMatch(code, /\brecord\s+\w+|\b(?:List|Map|Set)\.of\s*\(/);
}
for (const code of [
  'System.out.println("源码摘录");',
  '// 普通注释\nint n = 1; System.out.println(n);',
  '// 源码摘录(JDK 8)\nclass Demo { public static void main(String[] args) {} }',
  'class Demo { String text = "// 源码摘录"; }'
]) assert.equal(runner.boundary('java', code), '');
assert.equal(runner.boundaryType('python', '// 源码摘录\nx = 1'), '');
assert.equal(classify('java', '@Service class Demo {}'), '框架集成阅读');
let extracts = 0;
for (const c of context.window.CONTENT.javase.chapters) {
  for (const m of c.content.matchAll(/```java[^\n]*\n([\s\S]*?)```/g)) {
    if (/^\s*\/\/\s*源码摘录/.test(m[1])) {
      extracts++;
      assert.equal(runner.boundaryType('java', m[1]), 'source', c.id);
    }
  }
}
assert.equal(extracts, 3);
console.log('PASS: 3 JDK extracts classified for reading; 14 complete Java 8 String/API experiments; ordinary snippets and Spring boundaries preserved.');
