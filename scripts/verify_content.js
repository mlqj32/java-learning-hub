/* Syntax, lesson shape and media references. Run with node scripts/verify_content.js. */
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const context = { console, setTimeout, clearTimeout, setInterval, clearInterval };
context.window = context;
vm.createContext(context);
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
let scripts = 0;
for (const match of html.matchAll(/<script src="([^"?]+)/g)) {
  const file = match[1];
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  new vm.Script(source, { filename: file });
  scripts++;
  if (!file.endsWith('/app.js')) vm.runInContext(source, context, { filename: file });
}
let chapters = 0, chars = 0, exercises = 0, demoRefs = 0, diagramRefs = 0;
const ids = new Set();
for (const module of Object.values(context.CONTENT)) {
  for (const chapter of module.chapters) {
    const key = module.id + '/' + chapter.id;
    if (ids.has(key)) throw Error('Duplicate chapter: ' + key);
    ids.add(key);
    if (!chapter.content || !chapter.title || !chapter.practice) throw Error('Missing lesson fields: ' + key);
    const rendered = context.MD.render(chapter.content);
    if (!rendered.html || !rendered.toc.length) throw Error('Empty render: ' + key);
    for (const ref of chapter.content.matchAll(/```demo:([\w-]+)/g)) {
      if (!context.DEMOS[ref[1]]) throw Error('Missing demo ' + ref[1] + ' in ' + key);
      demoRefs++;
    }
    for (const ref of chapter.content.matchAll(/```diagram:([\w-]+)/g)) {
      if (!context.DIAGRAMS[ref[1]]) throw Error('Missing diagram ' + ref[1] + ' in ' + key);
      diagramRefs++;
    }
    chapters++;
    chars += chapter.content.length;
    exercises += !!chapter.practice;
  }
}
const callout = context.MD.render('> [!tip] Example\n> ```java\n> int x = 1;\n> ```').html;
if (!callout.includes('code-wrap') || callout.includes('&gt;')) throw Error('Callout code did not render');
const pipeTable = context.MD.render('| A | B |\n| --- | --- |\n| `a|b` | a \\| b |').html;
if (!pipeTable.includes('a|b') || !pipeTable.includes('a | b')) throw Error('Table pipe escaped incorrectly');
const stats = { scripts, modules: Object.keys(context.CONTENT).length, chapters, exercises, chars, demoRefs, diagramRefs,
  registeredDemos: Object.keys(context.DEMOS).length, registeredDiagrams: Object.keys(context.DIAGRAMS).length };
console.log(JSON.stringify(stats, null, 2));
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(context.CONTENT, null, 2));
