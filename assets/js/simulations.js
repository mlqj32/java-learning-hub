(function () {
  'use strict';
  function detect(code) {
    if (/class\s+Calculator\s+extends\s+JFrame/.test(code) && /press\(String key\)/.test(code)) return 'calculator';
    if (/class\s+CountdownApp\s+extends\s+Application/.test(code)) return 'countdown';
    if (/class\s+BouncingBall\s+extends\s+JPanel/.test(code)) return 'ball';
    if (/class\s+SnakeCanvas\s+extends\s+Canvas/.test(code)) return 'canvas';
    if (/class\s+HelloMidlet\s+extends\s+MIDlet/.test(code)) return 'midlet';
    if (/class\s+HighScoreStore/.test(code) && /RecordStore/.test(code)) return 'recordstore';
    return null;
  }
  function calculator() {
    return { screen: '0', current: 0, op: '', fresh: true, press: function (key) {
      if (/^[0-9.]$/.test(key)) {
        if (this.fresh) { this.screen = key === '.' ? '0.' : key; this.fresh = false; }
        else if (key !== '.' || this.screen.indexOf('.') < 0) this.screen += key;
      } else if (key === '=') {
        var v = Number(this.screen), result = v;
        if (this.op === '+') result = this.current + v;
        if (this.op === '-') result = this.current - v;
        if (this.op === '*') result = this.current * v;
        if (this.op === '/') result = v === 0 ? NaN : this.current / v;
        var format = function (n) { return Number.isFinite(n) && Number.isInteger(n) ? n.toFixed(1) : String(n); };
        var line = format(this.current) + ' ' + this.op + ' ' + format(v) + ' = ' + format(result);
        this.screen = format(result); this.op = ''; this.fresh = true;
        return line;
      } else { this.current = Number(this.screen); this.op = key; this.fresh = true; }
      return null;
    } };
  }
  function bounce(s, width, height) {
    var next = { x: s.x + s.vx, y: s.y + s.vy, vx: s.vx, vy: s.vy };
    if (next.x <= 0 || next.x + 20 >= width) next.vx = -next.vx;
    if (next.y <= 0 || next.y + 20 >= height) next.vy = -next.vy;
    return next;
  }
  function move(s, dx, dy) {
    if ((dx && s.dx === 0) || (dy && s.dy === 0)) { s.dx = dx; s.dy = dy; }
    return s;
  }
  function tick(s) { return { x: (s.x + s.dx + 20) % 20, y: (s.y + s.dy + 20) % 20, dx: s.dx, dy: s.dy }; }
  function recordBytes(score) { var n = Number(score); if (!Number.isInteger(n) || n < -2147483648 || n > 2147483647) throw Error('请输入 Java int 范围内的整数。'); var bytes = new Uint8Array(4); new DataView(bytes.buffer).setInt32(0, n, false); return bytes; }
  function element(tag, cls, text) {
    var node = document.createElement(tag); if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text; return node;
  }
  function button(text, fn) { var b = element('button', 'sim-button', text); b.type = 'button'; b.onclick = fn; return b; }
  function mount(host, code, kind) {
    var cleanups = [], running = false, interval = null;
    host.classList.add('simulation-panel');
    host.appendChild(element('p', 'runtime-note', '教学窗口模拟 · 按本例的布局与事件逻辑复现，可操作；不执行 Java GUI，也不模拟任意桌面程序。'));
    var win = element('div', 'sim-window');
    var title = { calculator: '计算器', countdown: 'JavaFX 倒计时', ball: '弹跳小球', canvas: '功能机 Canvas · 移动方块', midlet: 'Hello J2ME · 生命周期', recordstore: 'RecordStore · 四字节分数' }[kind];
    win.appendChild(element('div', 'sim-titlebar', '● ● ●   ' + title));
    var body = element('div', 'sim-window-body'); win.appendChild(body); host.appendChild(win);
    var controls = element('div', 'sim-controls'); host.appendChild(controls);
    var trace = element('pre', 'sim-trace'); trace.setAttribute('aria-live', 'polite'); host.appendChild(trace);
    function say(message) { trace.textContent = message; }
    function stop() { if (interval) clearInterval(interval); interval = null; running = false; }
    function start(step, delay) { stop(); running = true; interval = setInterval(function () { if (!host.isConnected) { stop(); return; } step(); }, delay); }
    cleanups.push(stop);
    if (kind === 'midlet') {
      var status = 'PAUSED', initialized = false, form = element('output', 'sim-countdown', '应用未进入前台'); body.appendChild(form);
      controls.appendChild(button('启动 / 回到前台', function () { if (status === 'DESTROYED') { say('应用已销毁，请重置模拟；此实例不能恢复。'); return; } var first = !initialized; initialized = true; status = 'ACTIVE'; form.textContent = 'Hello J2ME'; say('startApp() → ' + (first ? '首次创建 Display / Form → ' : '复用已有 Form → ') + 'display.setCurrent(form)\n状态 ACTIVE\n窗体文字：按挂机键暂停,长按电源键退出'); }));
      controls.appendChild(button('来电 / 切到后台', function () { if (status !== 'ACTIVE') { say('当前不在 ACTIVE，无需重复暂停。'); return; } status = 'PAUSED'; form.textContent = '应用在后台'; say('pauseApp() 回调 → 状态 PAUSED\n原例方法体只有注释，没有真正实现停止定时器/音频。'); }));
      controls.appendChild(button('退出应用', function () { status = 'DESTROYED'; form.textContent = '应用已退出'; say('destroyApp(true) → 状态 DESTROYED\n原例没有实际保存分数/关闭连接代码。'); }));
      controls.appendChild(button('重置', function () { status = 'PAUSED'; initialized = false; form.textContent = '应用未进入前台'; say('新建一次模拟实例；点击启动观察 Form 首次初始化。'); })); say('模拟 AMS 生命周期与本例 Form。启动、暂停、恢复、销毁，观察首次初始化与复用的区别。');
    } else if (kind === 'recordstore') {
      var scoreLabel = element('label', 'sim-setting', '保存分数 '), score = element('input'); score.type = 'number'; score.value = '980'; scoreLabel.appendChild(score); controls.appendChild(scoreLabel);
      var stored = null, record = element('pre', 'runtime-console', 'snake_scores：0 条记录'); body.appendChild(record);
      controls.appendChild(button('save(score)', function () { try { var bytes = recordBytes(score.value), action = stored ? 'setRecord(1, data, 0, 4)' : 'addRecord(data, 0, 4)'; stored = bytes; record.textContent = 'snake_scores / record #1\n' + Array.from(bytes, function (b) { return b.toString(16).padStart(2, '0').toUpperCase(); }).join(' '); say('openRecordStore → writeInt(' + Number(score.value) + ')，大端 4 字节\n' + action + ' → closeRecordStore\n本例会覆盖旧记录，不会自动比较哪次得分更高。'); } catch (err) { say(err.message); } }));
      controls.appendChild(button('读取字节验证', function () { say(stored ? '教学读取操作（原例只有 save）：readInt = ' + new DataView(stored.buffer).getInt32(0, false) : '还没有保存记录。'); }));
      controls.appendChild(button('重置存储', function () { stored = null; record.textContent = 'snake_scores：0 条记录'; say('模拟记录已清空；只保存在此窗口内存中，不模拟真实 RMS 持久化。'); })); say('修改分数再保存：第一次添加记录，之后覆盖 record #1。只模拟这个类的记录写入与字节编码，不需要 WTK。');
    } else if (kind === 'calculator') {
      var model = calculator(), screen = element('output', 'sim-calc-screen', '0');
      screen.setAttribute('aria-label', '计算器显示屏'); body.appendChild(screen);
      var keys = element('div', 'sim-calc-keys'); body.appendChild(keys);
      '7 8 9 / 4 5 6 * 1 2 3 - 0 . = +'.split(' ').forEach(function (key) {
        keys.appendChild(button(key, function () {
          var line = model.press(key); screen.textContent = model.screen;
          say(line ? 'System.out.println → ' + line : 'ActionListener → press("' + key + '")\n' + (model.fresh ? '等待下一次输入；运算符 ' + (model.op || '无') : 'screen.setText("' + model.screen + '")'));
        }));
      });
      controls.appendChild(button('重置计算器', function () { model = calculator(); screen.textContent = '0'; say('初始状态：current = 0，fresh = true'); }));
      say('试试依次点击 1、2、+、7、=，再点击 *、3、=。\n除以 0 与本例源码一致，显示 NaN。');
    } else if (kind === 'countdown') {
      var match = code.match(/remaining\s*=\s*(\d+)/), initial = match ? Number(match[1]) : 10, remaining = initial;
      var label = element('output', 'sim-countdown'); label.setAttribute('aria-label', '倒计时显示'); body.appendChild(label);
      var inputLabel = element('label', 'sim-setting', '起始秒数 '), input = element('input'); input.type = 'number'; input.min = '1'; input.max = '60'; input.value = initial;
      inputLabel.appendChild(input); controls.appendChild(inputLabel);
      function draw() { label.textContent = remaining > 0 ? '倒计时:' + remaining : '时间到'; }
      var toggle = button('开始', function () {
        if (running) { stop(); toggle.textContent = '继续'; say('暂停观察（教学控件）'); return; }
        if (remaining <= 0) remaining = initial;
        input.disabled = true; toggle.textContent = '暂停';
        start(function () { remaining--; draw(); say('KeyFrame → remaining-- → label.setText\nremaining = ' + remaining); if (remaining <= 0) { stop(); toggle.textContent = '重新开始'; input.disabled = false; } }, 1000); draw();
      });
      input.onchange = function () { stop(); initial = Math.max(1, Math.min(60, Number(input.value) || 10)); input.value = initial; remaining = initial; toggle.textContent = '开始'; draw(); say('参数实验：remaining 与 cycleCount 同步设置为 ' + initial); };
      controls.appendChild(toggle);
      controls.appendChild(button('重置', function () { stop(); remaining = initial; input.disabled = false; toggle.textContent = '开始'; draw(); say('已回到初始状态。'); })); draw();
      say('每秒触发一次 KeyFrame；可先改起始秒数，再开始观察。');
    } else {
      var canvas = element('canvas', 'sim-canvas'); canvas.width = kind === 'ball' ? 400 : 240; canvas.height = kind === 'ball' ? 260 : 240;
      canvas.setAttribute('aria-label', kind === 'ball' ? '弹跳小球画布' : '功能机移动方块画布'); canvas.tabIndex = 0; body.appendChild(canvas);
      var ctx = canvas.getContext('2d'), state, steps = 0;
      function initialState() {
        if (kind === 'ball') {
          var values = code.match(/x\s*=\s*(\d+),\s*y\s*=\s*(\d+),\s*vx\s*=\s*(-?\d+),\s*vy\s*=\s*(-?\d+)/);
          return values ? { x: +values[1], y: +values[2], vx: +values[3], vy: +values[4] } : { x: 170, y: 20, vx: 4, vy: 3 };
        }
        return { x: 4, y: 4, dx: 1, dy: 0 };
      }
      function drawCanvas() {
        ctx.fillStyle = '#090f1c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = kind === 'ball' ? '#eab308' : '#00ff00';
        if (kind === 'ball') { ctx.beginPath(); ctx.ellipse(state.x + 10, state.y + 10, 10, 10, 0, 0, Math.PI * 2); ctx.fill(); }
        else { ctx.fillRect(state.x * 12, state.y * 12, 11, 11); }
      }
      function step() {
        state = kind === 'ball' ? bounce(state, 400, 260) : tick(state); steps++; drawCanvas();
        say(kind === 'ball' ? 'Timer → 更新坐标 → 判断边界 → repaint\nx=' + state.x + ' y=' + state.y + ' vx=' + state.vx + ' vy=' + state.vy + '\n已更新 ' + steps + ' 帧' : '按键 → 更新方向 → 坐标取模 → paint\nheadX=' + state.x + ' headY=' + state.y + ' 方向=(' + state.dx + ',' + state.dy + ')');
      }
      state = initialState(); drawCanvas();
      var play = button('开始动画', function () { if (running) { stop(); play.textContent = '继续'; } else { start(step, kind === 'ball' ? 16 : 120); play.textContent = '暂停'; } });
      controls.appendChild(play); controls.appendChild(button('单步一帧', function () { stop(); play.textContent = '继续'; step(); }));
      controls.appendChild(button('重置', function () { stop(); state = initialState(); steps = 0; play.textContent = '开始动画'; drawCanvas(); say('已回到初始坐标；可先单步观察。'); }));
      if (kind === 'canvas') {
        var arrows = element('div', 'sim-arrows');
        [['↑', 0, -1], ['←', -1, 0], ['↓', 0, 1], ['→', 1, 0]].forEach(function (d) { arrows.appendChild(button(d[0], function () { move(state, d[1], d[2]); step(); })); }); controls.appendChild(arrows);
        canvas.onkeydown = function (e) { var dirs = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }; if (dirs[e.key]) { e.preventDefault(); move(state, dirs[e.key][0], dirs[e.key][1]); step(); } };
      }
      say(kind === 'ball' ? '黄色小球从 (170,20) 出发，每帧移动 (4,3)，到边界反弹。' : '本例只画一个移动方块，没有蛇身、食物或计分。触摸方向键或聚焦画布后按方向键；到边缘会穿墙。');
    }
    return function () { cleanups.forEach(function (fn) { fn(); }); };
  }
  window.HUB_SIM = { detect: detect, calculator: calculator, bounce: bounce, move: move, tick: tick, recordBytes: recordBytes, mount: mount };
})();
