/* Guard independent Java 8 examples and honest framework boundaries; no native JDK. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = { window: {}, Set };
vm.createContext(context);
for (const file of ['assets/js/content/patterns_ext2.js', 'assets/js/runner.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}
const blocks = [...context.window.PATTERNS_EXTRA.p04.content.matchAll(/```java\s*\n([\s\S]*?)```/g)].map(m => m[1]);
assert.equal(blocks.length, 18);
const boundary = context.window.HUB_RUNNER.boundary;
const framework = [];
blocks.forEach((code, i) => {
  if (boundary('java', code)) { framework.push(i + 1); return; }
  assert.match(code, /public\s+(?:final\s+)?class\s+\w+/, 'Public entry class in block ' + (i + 1));
  assert.match(code, /public\s+static\s+void\s+main\s*\(String\[\]\s+args\)/, 'Entry point in block ' + (i + 1));
  assert.doesNotMatch(code, /\b(?:Map|List|Set)\.of(?:Entries)?\s*\(/, 'Java 8 collection APIs in block ' + (i + 1));
});
assert.deepEqual(framework, [5, 8, 14]);
assert.equal(boundary('java', '// @Service\nclass Demo { String label = "ApplicationEvent"; }'), '');
assert.equal(boundary('java', 'class Demo { /* @Component */ char c = \'@\'; }'), '');
assert.equal(boundary('javascript', '@Service'), '');
assert.ok(boundary('java', 'import org.springframework.context.ApplicationEvent;'));
const factory = blocks[2];
for (const type of ['DiscountStrategy', 'NormalPrice', 'FullReduce', 'VipPrice', 'PriceCalculator', 'PriceCalculatorFactory', 'FactoryStrategyDemo']) {
  assert.match(factory, new RegExp('(?:interface|class)\\s+' + type + '\\b'), type + ' included');
}
assert.match(factory, /Collections\.unmodifiableMap/);
assert.match(factory, /quote\(29999\)/);
assert.match(factory, /quote\(30000\)/);
assert.match(factory, /of\("UNKNOWN"\)/);
console.log('PASS: 15 independent Java 8 entries, 3 Spring reading boundaries, factory dependencies and boundary branches.');
