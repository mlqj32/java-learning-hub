/* Content duplication and reuse of already-mounted chapter demos. */
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
const audit = [];
for (const module of Object.values(context.CONTENT)) for (const chapter of module.chapters) {
  const refs = [...chapter.content.matchAll(/```(diagram|demo):([\w-]+)/g)].map(m => ({type:m[1],id:m[2]}));
  const keys = refs.map(r => r.type + ':' + r.id);
  assert.equal(new Set(keys).size, keys.length, module.id + '/' + chapter.id + ': repeated lesson media');
  const html = context.MD.render(chapter.content).html;
  assert.equal((html.match(/class="(?:demo|diagram)-mount"/g)||[]).length, refs.length);
  const profile = module.id === 'reverse' && context.HUB_REVERSE_LABS.profiles[chapter.id];
  const inline = profile && refs.some(r => r.type === 'demo' && r.id === profile[0]);
  audit.push({chapter:module.id+'/'+chapter.id,refs,chapterLab:profile ? {kind:profile[0],source:inline?'existing lesson demo':'lazy concept lab'}:null});
}
const labs = context.HUB_REVERSE_LABS;
for (const id of ['r06','r07','r08','r15']) {
  const chapter = context.CONTENT.reverse.chapters.find(ch => ch.id === id);
  const inline = {id:'',tagName:'DIV',dataset:{demo:labs.profiles[id][0]}};
  const other = {id:'',dataset:{demo:'different-demo'}};
  const rootStub = {
    querySelector(selector) { assert.equal(selector, '#reverse-browser-lab'); return inline.id === 'reverse-browser-lab' ? inline : null; },
    querySelectorAll(selector) { assert.equal(selector, '.demo-mount[data-demo]'); return [other, inline]; }
  };
  labs.attach(rootStub, chapter); // An attempted fresh lab mount would require a DOM and fail here.
  labs.attach(rootStub, chapter);
  labs.open(rootStub);
  assert.equal(inline.id, 'reverse-browser-lab');
  assert.equal(inline.dataset.reverseLabKind, labs.profiles[id][0]);
  assert.equal(other.id, '', 'Unrelated demos must not be reused');
  assert.equal(Object.hasOwn(inline, 'open'), false, 'Only details are expanded');
}
const lazy = {tagName:'DETAILS',open:false};
labs.open({querySelector(){return lazy;}});
assert.equal(lazy.open,true);
if (process.argv[2]) fs.writeFileSync(path.resolve(process.argv[2]), JSON.stringify({chapters:audit.length,lessons:audit},null,2)+'\n');
console.log('PASS: '+audit.length+' chapters have unique media references; 4 existing demos reused, repeat attachment and lazy opening preserved.');
