/* Verify actual lesson coverage, UML notation and SVG references without a browser dependency. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = { console, setTimeout, clearTimeout, setInterval, clearInterval };
context.window = context;
vm.createContext(context);
for (const m of fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/<script src="([^"?]+)/g)) {
  if (!m[1].endsWith('/app.js')) vm.runInContext(fs.readFileSync(path.join(root, m[1]), 'utf8'), context, {filename: m[1]});
}
const coverage = {
  pat2: ['class-basics', 'relations'],
  pat3: ['singleton','simple-factory','factory-method','abstract-factory','builder','prototype'],
  pat4: ['proxy','decorator','adapter','facade','bridge','composite','flyweight'],
  pat5: ['strategy','observer','chain','template-method','state','command'],
  pat6: ['iterator','mediator','memento','visitor','interpreter']
};
let count = 0;
for (const [chapterId, ids] of Object.entries(coverage)) {
  const chapter = context.CONTENT.patterns.chapters.find(c => c.id === chapterId);
  const refs = [...chapter.content.matchAll(/```diagram:u-([\w-]+)/g)].map(m => m[1]);
  assert.deepEqual(refs, ids, chapterId + ' must include every pattern in lesson order');
  if (chapterId !== 'pat2') assert.doesNotMatch(chapter.content, /```text\n[\s\S]*?[┌─┐│▲]/, 'No ASCII pattern structure left');
  for (const id of ids) {
    const spec = context.PATTERN_UML[id];
    assert.ok(spec && spec.read.length > 45, id + ' has a reading guide');
    const d = context.DIAGRAMS['u-' + id];
    const svg = d.svg();
    const allIds = [...svg.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(allIds).size, allIds.length, id + ' unique IDs');
    for (const m of svg.matchAll(/url\(#([^\)]+)\)/g)) assert.ok(allIds.includes(m[1]), id + ' marker resolves');
    const nodeIds = spec.nodes.map(n => n.id);
    assert.equal(new Set(nodeIds).size, nodeIds.length);
    for (const edge of spec.edges) {
      assert.ok(nodeIds.includes(edge.from) && nodeIds.includes(edge.to), id + ' endpoints exist');
      assert.ok(['realize','inherit','depend','associate','aggregate','compose'].includes(edge.type));
    }
    for (const node of spec.nodes) {
      assert.ok(node.x >= 0 && node.x + node.w <= 1140 && node.y >= 0, id + ' node stays inside canvas');
      assert.ok(node.role && node.name);
    }
    count++;
  }
}
assert.equal(count, 26, '23 GoF + simple factory + 2 UML foundations');
assert.ok(context.DIAGRAMS['u-strategy'].svg().includes('DiscountStrategy'));
assert.ok(context.DIAGRAMS['u-strategy'].svg().includes('PriceCalculator'));
const relationSVG = context.DIAGRAMS['u-relations'].svg();
for (const kind of ['inherit','realize','depend','associate','aggregate','compose']) assert.ok(relationSVG.includes('data-relation="' + kind + '"'));
console.log('PASS: all 23 GoF patterns + simple factory, 2 UML foundations, lesson placements, endpoints and SVG marker references.');
