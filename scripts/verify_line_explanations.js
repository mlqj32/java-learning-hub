/* Semantic regressions: explain the actual expression, not a keyword found in a string. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const context = {console, setTimeout, clearTimeout, setInterval, clearInterval, TextEncoder, TextDecoder};
context.window = context; vm.createContext(context);
for (const match of fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^"?]+)/g)) {
  if (!match[1].endsWith('/app.js')) vm.runInContext(fs.readFileSync(path.join(root,match[1]),'utf8'), context);
}
const explain = (line, lang = 'python') => context.HUB_LINES.describe(line,lang,0);
const raw = explain('raw = "&".join(k + "=" + str(v) for k, v in items) + "&salt=" + SALT');
assert.equal(raw.title, '拼接参数与盐值');
for (const term of ['分隔符 「&」','键 k','值 v','字面量 「"&salt="」','SALT','raw']) assert.ok(raw.text.includes(term),term);
assert.doesNotMatch(raw.text, /第 0|循环：|找出初始值/);
assert.match(explain('items = sorted((k, v) for k, v in params.items() if k != "sign" and v != "")').text, /排除键为 sign 或值为空字符串/);
assert.match(explain('return hashlib.md5(raw.encode("utf-8")).hexdigest()').text,/UTF-8|utf-8/);
assert.match(explain('return hashlib.md5(raw.encode("utf-8")).hexdigest()').text,/MD5.*32 位十六进制/);
assert.equal(explain('print("for if return")').title,'输出');
assert.equal(explain('message = "for if while"').title,'赋值给 message');
assert.equal(explain('SALT = "a#b"').title,'设置常量 SALT');
assert.match(explain('SALT = "a#b"').text,/a#b/);
assert.equal(explain('public static void main(String[] args) {','java').title,'程序入口 · 模板代码');
const blankFinal = explain('private final byte[] value;', 'java');
assert.match(blankFinal.text, /构造器或实例初始化块/);
assert.match(blankFinal.text, /不能依靠类型默认值/);
assert.match(blankFinal.text, /不会禁止修改数组元素/);
assert.match(explain('static final int LIMIT;', 'java').text, /静态初始化块/);
assert.match(explain('private int hash;', 'java').text, /非 final 字段使用类型默认值/);
assert.match(explain('public static void main(String[] args) { System.out.println(2 + 3); }','java').text,/本行还包含实现.*相加.*控制台/);
assert.match(explain('int total = a + b;','java').text,/相加.*a.*b.*total/);
assert.match(explain('return score(n) >= 10 ? "ok" : "retry";','java').text,/判断.*score\(n\) >= 10.*成立.*ok.*否则.*retry/);
assert.match(explain('if (n < 0) return -1;','java').text,/n < 0.*-1.*结束本次/);
assert.match(explain('for (int i=0; i<3; i++) total += i;','java').text,/i=0.*i<3.*i\+\+.*total/);
assert.match(explain('} finally {','java').text,/收尾/);
assert.match(explain('@Transactional','java').text,/事务边界.*代理/);
assert.match(explain('thread.start();','java').text,/启动这个线程/);
assert.match(explain('SELECT name FROM students WHERE score >= 80 ORDER BY score DESC;','sql').text,/students.*score >= 80.*score DESC.*降序/);
assert.equal(explain('-- SELECT is a comment','sql').title,'注释');
assert.equal(explain('public @interface Route {','java').title,'定义注解');
assert.equal(context.HUB_WALK.classify('text','not code'),'文本展示');
const commentSource = ['String s = "/*";', 'int n = 1;'];
assert.equal(context.HUB_LINES.describe(commentSource,'java',1).title,'赋值给 n');
let explained = 0, mappedChapters = 0;
for (const module of Object.values(context.CONTENT)) for (const chapter of module.chapters) {
  if (module.id === 'reverse') {
    const placement = context.HUB_REVERSE_LABS.placements[chapter.id];
    assert.ok(chapter.content.split('\n').some(line => /^#{2,3} /.test(line) && line.includes(placement[0])), chapter.id + ': related section must exist');
    mappedChapters++;
  }
  for (const block of chapter.content.matchAll(/```(\w+)[^\n]*\n([\s\S]*?)```/g)) {
    if (['text','output','console'].includes(block[1])) continue;
    const lines = block[2].split('\n');
    for (let i=0;i<lines.length;i++) {
      const note = context.HUB_LINES.describe(lines,block[1],i);
      assert.ok(note.title && note.text, module.id+'/'+chapter.id+':'+(i+1)); explained++;
    }
  }
}
assert.equal(mappedChapters,18);
console.log('PASS: signature construction, keyword/string distinction, Java controls/templates, SQL, comments; '+explained+' source lines and '+mappedChapters+' explicit chapter placements.');
