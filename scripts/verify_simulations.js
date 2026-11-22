const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.createContext(context);
for (const file of ['assets/js/simulations.js', 'assets/js/content/javahistory.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
}
const sim = context.window.HUB_SIM;
const calc = sim.calculator();
'12+7='.split('').forEach(k => calc.press(k));
assert.equal(calc.screen, '19.0');
'*3='.split('').forEach(k => calc.press(k));
assert.equal(calc.screen, '57.0');
'/4='.split('').forEach(k => calc.press(k));
assert.equal(calc.screen, '14.25');
'/0='.split('').forEach(k => calc.press(k));
assert.equal(calc.screen, 'NaN');
const decimal = sim.calculator();
'.5+1.2='.split('').forEach(k => decimal.press(k));
assert.equal(decimal.screen, '1.7');
assert.equal(sim.bounce({ x: 378, y: 20, vx: 4, vy: 3 }, 400, 260).vx, -4);
assert.equal(sim.bounce({ x: 10, y: 238, vx: 4, vy: 3 }, 400, 260).vy, -3);
const block = { x: 19, y: 4, dx: 1, dy: 0 };
assert.equal(sim.tick(block).x, 0);
sim.move(block, -1, 0); // Reversing directly is disallowed by this course example.
assert.equal(block.dx, 1);
sim.move(block, 0, -1);
assert.equal(block.dy, -1);
const found = [];
for (const chapter of context.window.CONTENT.javahistory.chapters) {
  for (const match of chapter.content.matchAll(/```java[^\n]*\n([\s\S]*?)```/g)) {
    const kind = sim.detect(match[1]);
    if (kind) found.push(kind);
  }
}
assert.deepEqual(found.sort(), ['ball', 'calculator', 'canvas', 'countdown', 'midlet', 'recordstore']);
assert.deepEqual(Array.from(sim.recordBytes(980)), [0,0,3,212]);
assert.deepEqual(Array.from(sim.recordBytes(-1)), [255,255,255,255]);
assert.throws(() => sim.recordBytes(2147483648));
assert.equal(sim.detect('public class Main {}'), null);
console.log('PASS: calculator chains/decimals/zero, ball edges, Canvas wrap/direction, RecordStore int bytes and 6 course adapters');
