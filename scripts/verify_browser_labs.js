/* Pure calculation checks and an inventory from the actual Markdown renderer. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const context = { console, TextEncoder, TextDecoder, Uint8Array, DataView, setTimeout, clearTimeout, setInterval, clearInterval };
context.window = context;
vm.createContext(context);
for (const match of fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/<script src="([^"?]+)/g)) {
  if (!match[1].endsWith('/app.js')) vm.runInContext(fs.readFileSync(path.join(root, match[1]), 'utf8'), context, { filename: match[1] });
}
const M = context.HUB_MODELS, S = context.HUB_SORT;
function plain(x) { return JSON.parse(JSON.stringify(x)); }
let sortChecks = 0;
const inputs = [[5,2,4,2,8,1], [3,2,3,1,2], [-9999,0,9999,-1], [0,0], [2,1], [1,2], [1.5,-.2,1.5]];
for (let length = 2; length <= 6; length++) {
  for (let mask = 0; mask < 3 ** length; mask++) {
    let x = mask; const values = [];
    for (let i = 0; i < length; i++) { values.push(x % 3 - 1); x = Math.floor(x / 3); }
    inputs.push(values);
  }
}
for (const kind of ['bubble','selection','insertion','quick']) for (const values of inputs) {
  const source = values.slice(), trace = S.trace(values, kind), frames = trace.frames;
  assert.deepEqual(plain(trace.sorted), source.slice().sort((a,b)=>a-b), kind + ': ' + source);
  assert.deepEqual(values, source, 'must not mutate input');
  assert.deepEqual(plain(frames[0].array.map(x=>x.value)), source);
  assert.deepEqual(plain(frames.at(-1).array.map(x=>x.id)).sort((a,b)=>a-b), source.map((_,i)=>i));
  if (['bubble','insertion'].includes(kind)) {
    const final = frames.at(-1).array;
    for (let i=1;i<final.length;i++) if (final[i-1].value===final[i].value) assert.ok(final[i-1].id < final[i].id, 'stability');
  }
  if (kind === 'insertion') assert.equal(trace.metrics.swaps, 0);
  for (let i=1;i<frames.length;i++) {
    assert.ok(frames[i].line >= -1 && frames[i].line < trace.code.length);
    assert.ok(frames[i].state['比较次数'] >= frames[i-1].state['比较次数']);
  }
  sortChecks++;
}
assert.equal(S.inversions([4,3,2,1]), 6);
assert.throws(()=>S.trace([1,NaN],'quick'));
assert.throws(()=>S.trace([1],'bubble'));
for (const n of [-2147483648,-1,0,2,3,2147483647]) {
  const model=M.bytecode(n);
  assert.equal(model.output,(Math.imul(n,3)+1)|0);
  assert.equal(model.frames.at(-1).state['操作数栈'],'[]');
  assert.equal(M.assembly(n).frames.at(-1).state['返回'], model.output>=10?'ok':'retry');
}
assert.throws(()=>M.bytecode(2147483648));
for (const format of ['class','PE','ELF','DEX']) assert.equal(M.inspectBinary(M.binarySample(format)).format,format);
assert.throws(()=>M.inspectBinary('ca fe ba be'));
assert.throws(()=>M.inspectBinary('ca fe b'));
const badPe=M.unhex(M.binarySample('PE')); new DataView(badPe.buffer).setUint32(60,0xffffffff,true);
assert.throws(()=>M.inspectBinary(M.hex(badPe)));
const messages='OK\n你好\n\nEND', encoded=M.hex(M.encodeMessages(messages));
for(let size=1;size<=64;size++) { const result=M.protocol(encoded,size); assert.deepEqual(plain(result.messages),messages.split('\n')); assert.equal(result.remaining.length,0); }
assert.equal(M.protocol('00 05 4f 4b',2).remaining.length,4);
assert.throws(()=>M.protocol('ff ff',2));
assert.throws(()=>M.protocol('00 01 ff',3));
assert.throws(()=>M.protocol('00 00',0));
for (const key of [0,1,42,255]) assert.equal(M.xor('你好 Java',key).decoded,'你好 Java');
assert.throws(()=>M.xor('x',256));
assert.equal(Object.keys(context.HUB_REVERSE_LABS.profiles).length,18);
for (const id of Object.keys(context.DEMOS)) assert.ok(context.HUB_DEMO_SYSTEM.guides[id], 'Missing interaction guide: '+id);
for (const chapter of context.CONTENT.reverse.chapters) assert.ok(context.HUB_REVERSE_LABS.profiles[chapter.id], 'Missing reverse lab: '+chapter.id);
function decode(s) { return s.replace(/&quot;/g,'"').replace(/&gt;/g,'>').replace(/&lt;/g,'<').replace(/&amp;/g,'&'); }
const blocks=[], counts={};
for(const module of Object.values(context.CONTENT)) for(const chapter of module.chapters) {
  const html=context.MD.render(chapter.content).html;
  let ordinal=0;
  const demos=Array.from(chapter.content.matchAll(/```demo:([\w-]+)/g),m=>m[1]);
  for(const match of html.matchAll(/<div class="code-wrap" data-language="([^"]*)" data-file="([^"]*)">([\s\S]*?)<\/table><\/div><\/div>/g)) {
    ordinal++;
    const code=Array.from(match[3].matchAll(/<td class="cl">([\s\S]*?)<\/td>/g),m=>decode(m[1].replace(/<[^>]+>/g,''))).join('\n');
    const category=context.HUB_WALK.classify(decode(match[1]),code);
    counts[category]=(counts[category]||0)+1;
    blocks.push({ chapter:module.id+'/'+chapter.id, example:ordinal, language:decode(match[1]), file:decode(match[2]), category, reading:category!=='文本展示', chapterDemos:demos, url:'#/m/'+module.id+'/'+chapter.id });
  }
  assert.equal(ordinal,(html.match(/class="code-wrap"/g)||[]).length, 'inventory must see all rendered code blocks');
}
assert.ok(blocks.length>500);
const chapters=Object.values(context.CONTENT).flatMap(m=>m.chapters.map(c=>({id:m.id+'/'+c.id,title:c.title,url:'#/m/'+m.id+'/'+c.id,chapterLab:m.id==='reverse'?{kind:context.HUB_REVERSE_LABS.profiles[c.id][0],section:context.HUB_REVERSE_LABS.placements[c.id][0]}:null})));
const report={ date:'2026-11-15', fencedBlocks:blocks.length, codeBlocks:blocks.filter(b=>b.reading).length, textBlocks:blocks.filter(b=>!b.reading).length, categories:counts, reverseChapters:18, demos:28, sortChecks, note:'TEXT 仅展示与复制；代码/配置提供逐行释义。原理实验每章一个，在对应小节展开，与任意源码的执行入口分开。类别不保证依赖片段完整可运行。', chapters, blocks };
fs.writeFileSync(path.join(root,'docs/simulation-coverage.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({ ...report, chapters:chapters.length, blocks:undefined },null,2));
