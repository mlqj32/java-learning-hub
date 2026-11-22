/* ═══════════════════════════════════════════════════
   交互演示 · 第四批:计算机网络 / 操作系统 / 数据结构
   ═══════════════════════════════════════════════════ */
(function () {
  'use strict';
  var D = window.DEMOS = window.DEMOS || {};
  var U = window.DUTIL;
  var el = U.el, btn = U.btn, logArea = U.logArea, counters = U.counters, tabs = U.tabs;
  function dlog(box, msg, cls) { U.log(box, msg, cls); }

  /* ═══════════ 1. 一次 HTTP 请求的旅程 ═══════════ */
  D['http-flow'] = {
    title: '一次网页访问的时间都花在哪了',
    subtitle: 'DNS → TCP → TLS → HTTP → 渲染 · 逐段时间轴',
    icon: 'map',
    mount: function (body) {
      var setTimeout = window.HUB_DEMO_SYSTEM.scheduler(body);
      var STEPS = [
        { name: 'DNS 解析', detail: '浏览器 → 本地 DNS → 根/顶级/权威服务器,拿到 IP', ms: 12, c: '#22d3ee', icon: '📖' },
        { name: 'TCP 握手', detail: 'SYN → SYN+ACK → ACK,建立可靠连接(1 个 RTT)', ms: 38, c: '#34d399', icon: '🤝' },
        { name: 'TLS 握手', detail: 'HTTPS 才有:证书校验 + 密钥协商(TLS1.3 可 1-RTT)', ms: 84, c: '#c084fc', icon: '🔒' },
        { name: '发送请求', detail: 'GET /index.html HTTP/1.1 + 请求头', ms: 42, c: '#fbbf24', icon: '📤' },
        { name: '服务端处理', detail: 'Tomcat 收到请求 → SpringMVC → 业务 → 查库', ms: 120, c: '#fb7185', icon: '🖥️' },
        { name: '响应下载', detail: 'HTML/CSS/JS 按字节流回来,受带宽限制', ms: 60, c: '#60a5fa', icon: '📥' },
        { name: '浏览器渲染', detail: '解析 HTML → DOM → CSSOM → 布局 → 绘制', ms: 90, c: '#a3e635', icon: '🎨' }
      ];
      var idx = 0, playing = false, total = 0;
      var track = el('div', '');
      track.style.cssText = 'display:flex;height:44px;border-radius:9px;overflow:hidden;border:1px solid rgba(148,163,184,.18)';
      var log = logArea();
      var counter = counters([{ key: 't', label: '累计耗时' }, { key: 'stage', label: '当前阶段' }]);
      function buildTrack() {
        track.innerHTML = '';
        STEPS.forEach(function (s) {
          var seg = el('div', '', '');
          seg.style.cssText = 'flex:' + s.ms + ';background:rgba(148,163,184,.1);border-right:1px solid rgba(4,6,14,.6);display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;color:var(--text-3);transition:all .3s';
          seg.textContent = s.ms + 'ms';
          track.appendChild(seg);
        });
      }
      function reset() {
        idx = 0; playing = false; total = 0;
        buildTrack();
        counter.set('t', '0ms'); counter.set('stage', '待开始');
        log.innerHTML = '';
        dlog(log, '点击“开始访问”,看浏览器在 446ms 里都忙了些什么。', 'l-info');
      }
      function step() {
        if (idx >= STEPS.length) { dlog(log, '<span class="l-ok">教学时间轴完成，总计 ' + total + 'ms。本例服务端处理 120ms，DNS+TLS 为 96ms；真实瓶颈要以实际请求测量判断。</span>', 'l-ok'); return false; }
        var s = STEPS[idx];
        var seg = track.children[idx];
        seg.style.background = s.c + '33';
        seg.style.boxShadow = 'inset 0 -3px 0 ' + s.c;
        seg.style.color = s.c;
        seg.textContent = s.icon + ' ' + s.ms + 'ms';
        total += s.ms;
        counter.set('t', total + 'ms');
        counter.set('stage', s.name);
        dlog(log, '<span class="l-hl">' + s.icon + ' ' + s.name + '</span> (+' + s.ms + 'ms):' + s.detail, 'l-info');
        idx++;
        return true;
      }
      var bar = el('div', 'dm-toolbar');
      bar.appendChild(btn('▶ 开始访问', function () {
        if (playing) return;
        playing = true;
        (function loop() {
          if (!playing) return;
          if (step()) setTimeout(loop, 900);
          else playing = false;
        })();
      }));
      bar.appendChild(btn('⏭ 单步', function () { playing = false; step(); }, true));
      bar.appendChild(btn('↺ 重置', reset, true));
      body.appendChild(bar);
      body.appendChild(el('div', 'dm-panel-title', '时间轴(按设定样例耗时比例)'));
      body.appendChild(track);
      body.appendChild(counter);
      var legend = el('div', 'dm-legend', STEPS.map(function (s) { return '<span class="lg"><i style="background:' + s.c + '"></i>' + s.name + '</span>'; }).join(''));
      body.appendChild(legend);
      body.appendChild(log);
      reset();
    }
  };

  /* ═══════════ 2. CPU 调度模拟 ═══════════ */
  D['process-schedule'] = {
    title: 'CPU 调度模拟:时间片轮转 vs 先来先服务',
    subtitle: '同样的任务,不同调度算法的等待时间',
    icon: 'rotate',
    mount: function (body) {
      var setTimeout = window.HUB_DEMO_SYSTEM.scheduler(body);
      var PROCS = [
        { pid: 'P1', arrive: 0, burst: 5, c: '#22d3ee' },
        { pid: 'P2', arrive: 1, burst: 4, c: '#c084fc' },
        { pid: 'P3', arrive: 2, burst: 2, c: '#fbbf24' }
      ];
      var algo = '时间片轮转(quantum=2)';
      var timeline = [], pos = 0, playing = false;
      var track = el('div', '');
      track.style.cssText = 'display:flex;height:46px;border-radius:9px;overflow:hidden;border:1px solid rgba(148,163,184,.18)';
      var waitingBox = el('div', 'dm-panel');
      var log = logArea();
      var counter = counters([{ key: 'avgw', label: '平均等待' }, { key: 'avgt', label: '平均周转' }, { key: 'time', label: '当前时刻' }]);

      function simulateRR(q) {
        var remain = PROCS.map(function (p) { return p.burst; });
        var t = 0, doneCount = 0, queue = [], segs = [], busy = [];
        while (doneCount < PROCS.length && t < 60) {
          PROCS.forEach(function (p, i) { if (p.arrive === t && remain[i] > 0 && queue.indexOf(i) < 0) queue.push(i); });
          var cur = queue.shift();
          if (cur === undefined) { segs.push({ pid: '空闲', start: t, end: t + 1, c: '#334155' }); busy.push(null); t++; continue; }
          var run = Math.min(q, remain[cur]);
          segs.push({ pid: PROCS[cur].pid, start: t, end: t + run, c: PROCS[cur].c });
          busy.push(cur);
          remain[cur] -= run;
          t += run;
          PROCS.forEach(function (p, i) { if (p.arrive > segs[segs.length - 1].start && p.arrive <= t && i !== cur && queue.indexOf(i) < 0 && remain[i] > 0) queue.push(i); });
          if (remain[cur] > 0) queue.push(cur); else doneCount++;
        }
        return { segs: segs, end: t };
      }
      function simulateFCFS() {
        var t = 0, segs = [], done = 0, finished = [];
        var sorted = PROCS.map(function (p, i) { return i; }).sort(function (a, b) { return PROCS[a].arrive - PROCS[b].arrive; });
        sorted.forEach(function (i) {
          var p = PROCS[i];
          if (t < p.arrive) { segs.push({ pid: '空闲', start: t, end: p.arrive, c: '#334155' }); t = p.arrive; }
          segs.push({ pid: p.pid, start: t, end: t + p.burst, c: p.c });
          t += p.burst;
        });
        return { segs: segs, end: t };
      }
      function analyze(segs) {
        var first = {}, last = {};
        segs.forEach(function (s) {
          if (s.pid === '空闲') return;
          if (first[s.pid] === undefined) first[s.pid] = s.start;
          last[s.pid] = s.end;
        });
        var rows = PROCS.map(function (p) {
          var fin = last[p.pid] || 0;
          var turnaround = fin - p.arrive;
          var wait = turnaround - p.burst;
          return { pid: p.pid, arrive: p.arrive, burst: p.burst, fin: fin, turnaround: turnaround, wait: wait, c: p.c };
        });
        var avgW = rows.reduce(function (s, r) { return s + r.wait; }, 0) / rows.length;
        var avgT = rows.reduce(function (s, r) { return s + r.turnaround; }, 0) / rows.length;
        return { rows: rows, avgW: avgW.toFixed(2), avgT: avgT.toFixed(2) };
      }
      function render(segs, anim) {
        track.innerHTML = '';
        segs.forEach(function (s, i) {
          var seg = el('div', '', s.pid === '空闲' ? '' : s.pid);
          var w = (s.end - s.start) * 34;
          seg.style.cssText = 'width:' + w + 'px;min-width:10px;background:' + (s.pid === '空闲' ? 'rgba(51,65,85,.35)' : s.c + '33') + ';border-right:1px solid rgba(4,6,14,.7);display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:10px;color:' + (s.pid === '空闲' ? '#64748b' : s.c) + ';transition:all .25s';
          seg.title = s.pid + ' ' + s.start + '~' + s.end + 'ms';
          if (anim >= 0 && anim === i) { seg.style.background = (s.c === '#334155' ? '#334155' : s.c); seg.style.color = '#04120b'; seg.style.fontWeight = '700'; }
          track.appendChild(seg);
        });
      }
      function showTable(res) {
        waitingBox.innerHTML = '<div class="dm-panel-title">各进程表现</div>' +
          '<table style="width:100%;border-collapse:collapse;font-size:12px;font-family:var(--font-mono)">' +
          '<tr style="color:#64748b"><th style="text-align:left;padding:6px">进程</th><th>到达</th><th>运行</th><th>完成</th><th>周转</th><th>等待</th></tr>' +
          res.rows.map(function (r) {
            return '<tr style="border-top:1px solid rgba(148,163,184,.12)"><td style="padding:6px;color:' + r.c + ';font-weight:700">' + r.pid + '</td><td style="text-align:center">' + r.arrive + '</td><td style="text-align:center">' + r.burst + '</td><td style="text-align:center">' + r.fin + '</td><td style="text-align:center">' + r.turnaround + '</td><td style="text-align:center;color:#fbbf24">' + r.wait + '</td></tr>';
          }).join('') + '</table>';
      }
      function run(reset) {
        var res = algo.indexOf('轮转') >= 0 ? simulateRR(2) : simulateFCFS();
        timeline = res.segs;
        var an = analyze(timeline);
        counter.set('avgw', an.avgW + 'ms');
        counter.set('avgt', an.avgT + 'ms');
        showTable(an);
        if (reset) { render(timeline, -1); counter.set('time', '0ms'); log.innerHTML = ''; dlog(log, '算法:<b>' + algo + '</b> · 3 个进程 P1(0,5) P2(1,4) P3(2,2),时间单位 ms', 'l-info'); }
        return res;
      }
      var bar = el('div', 'dm-toolbar');
      bar.appendChild(tabs(['时间片轮转(quantum=2)', '先来先服务'], algo, function (o) {
        algo = o; playing = false;
        run(true);
      }));
      bar.appendChild(btn('▶ 播放', function () {
        if (playing) return;
        playing = true;
        var res = run(true);
        var i = 0;
        (function loop() {
          if (!playing) return;
          if (i >= timeline.length) {
            playing = false;
            dlog(log, '<span class="l-ok">调度结束 —— 对比两种算法的平均等待时间,体会"为什么时间片轮转更公平、FCFS 会护航队"。</span>', 'l-ok');
            return;
          }
          var seg = timeline[i];
          render(timeline, i);
          counter.set('time', seg.end + 'ms');
          dlog(log, '[' + seg.start + '→' + seg.end + 'ms] ' + (seg.pid === '空闲' ? 'CPU 空闲' : seg.pid + ' 运行'), seg.pid === '空闲' ? 'l-t' : 'l-hl');
          i++;
          setTimeout(loop, 700);
        })();
      }));
      bar.appendChild(btn('↺ 重置', function () { playing = false; run(true); }, true));
      body.appendChild(bar);
      body.appendChild(el('div', 'dm-panel-title', 'CPU 时间轴(宽度 ∝ 运行时长)'));
      body.appendChild(track);
      body.appendChild(counter);
      body.appendChild(waitingBox);
      body.appendChild(log);
      run(true);
    }
  };

  /* ═══════════ 3. 二叉搜索树可视化 ═══════════ */
  D['bst-visual'] = {
    title: '二叉搜索树:插入与查找全过程',
    subtitle: '左小右大 · 观察查找路径与有序输入退化',
    icon: 'spark',
    mount: function (body) {
      var setTimeout = window.HUB_DEMO_SYSTEM.scheduler(body);
      var root = null, count = 0;
      var svgWrap = el('div', 'dm-stage');
      svgWrap.style.padding = '10px';
      svgWrap.style.overflowX = 'auto';
      var input = el('input', '');
      input.type = 'number';
      input.placeholder = '数字 1-99';
      input.style.cssText = 'width:110px;padding:8px 12px;border-radius:9px;border:1px solid rgba(148,163,184,.3);background:rgba(4,8,16,.7);color:#e2e8f0;font-family:var(--font-mono);font-size:13px;outline:none';
      var log = logArea();
      var counter = counters([{ key: 'n', label: '节点数' }, { key: 'h', label: '树高' }, { key: 'last', label: '上次操作' }]);
      function insert(v, silent) {
        if (root === null) { root = { v: v, l: null, r: null }; count = 1; if (!silent) dlog(log, '插入 ' + v + ' → 成为根节点', 'l-ok'); return; }
        var cur = root, path = [];
        while (true) {
          path.push(cur.v);
          if (v === cur.v) { if (!silent) dlog(log, v + ' 已存在,忽略(树中不放重复值)', 'l-err'); return; }
          if (v < cur.v) { if (!cur.l) { cur.l = { v: v, l: null, r: null }; count++; break; } cur = cur.l; }
          else { if (!cur.r) { cur.r = { v: v, l: null, r: null }; count++; break; } cur = cur.r; }
        }
        if (!silent) dlog(log, '插入 ' + v + ':沿 ' + path.join(' → ') + ' 比较,挂到空位', 'l-info');
      }
      function search(v) {
        var cur = root, path = [];
        while (cur) {
          path.push(cur.v);
          if (v === cur.v) { render(path, cur.v); dlog(log, '查找 ' + v + ':路径 ' + path.join(' → ') + ' → <span class="l-ok">命中!比较 ' + path.length + ' 次</span>', 'l-ok'); counter.set('last', '命中'); return; }
          cur = v < cur.v ? cur.l : cur.r;
        }
        render(path, null);
        dlog(log, '查找 ' + v + ':路径 ' + path.join(' → ') + ' → <span class="l-err">不存在</span>', 'l-err');
        counter.set('last', '未命中');
      }
      function walk(n, arr) { if (!n) return; walk(n.l, arr); arr.push(n.v); walk(n.r, arr); }
      function depth(n) { return n ? 1 + Math.max(depth(n.l), depth(n.r)) : 0; }
      function render(hl, found) {
        if (!root) { svgWrap.innerHTML = '<div style="padding:40px;text-align:center;color:#64748b;font-family:var(--font-mono);font-size:12px">空树 —— 先插入几个数字</div>'; counter.set('n', 0); counter.set('h', 0); return; }
        var positions = {}, idx = 0;
        (function assign(n) { if (!n) return; assign(n.l); positions[n.v] = idx++; assign(n.r); })(root);
        var maxD = depth(root);
        var W = Math.max(420, 80 + count * 38), H = 60 + maxD * 62;
        var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" style="width:' + W + 'px;max-width:100%;height:auto">';
        function draw(n, d) {
          if (!n) return;
          var x = 50 + positions[n.v] * 38, y = 40 + d * 62;
          if (n.l) { var cx = 50 + positions[n.l.v] * 38, cy = 40 + (d + 1) * 62; s += '<line x1="' + x + '" y1="' + y + '" x2="' + cx + '" y2="' + cy + '" stroke="#334155" stroke-width="1.4"/>'; }
          if (n.r) { var cx2 = 50 + positions[n.r.v] * 38, cy2 = 40 + (d + 1) * 62; s += '<line x1="' + x + '" y1="' + y + '" x2="' + cx2 + '" y2="' + cy2 + '" stroke="#334155" stroke-width="1.4"/>'; }
          var isHl = hl && hl.indexOf(n.v) >= 0;
          var isFound = found === n.v;
          var fill = isFound ? '#34d399' : (isHl ? '#fbbf24' : '#818cf8');
          s += '<circle cx="' + x + '" cy="' + y + '" r="17" fill="rgba(13,20,40,.96)" stroke="' + fill + '" stroke-width="' + (isHl ? 2.6 : 1.6) + '"/>';
          s += '<text x="' + x + '" y="' + (y + 4) + '" text-anchor="middle" fill="' + fill + '" font-family="var(--font-mono)" font-size="12" font-weight="700">' + n.v + '</text>';
          draw(n.l, d + 1); draw(n.r, d + 1);
        }
        draw(root, 0);
        s += '</svg>';
        svgWrap.innerHTML = s;
        counter.set('n', count); counter.set('h', maxD);
      }
      var arr = [];
      var bar = el('div', 'dm-toolbar');
      bar.appendChild(input);
      bar.appendChild(btn('➕ 插入', function () {
        var v = parseInt(input.value, 10);
        if (!v || v < 1 || v > 99) { dlog(log, '请输入 1~99 的整数', 'l-err'); return; }
        if (count >= 18) { dlog(log, '节点太多了,先清空重来', 'l-err'); return; }
        insert(v); input.value = ''; render(); counter.set('last', '插入 ' + v);
      }));
      bar.appendChild(btn('🔍 查找', function () {
        var v = parseInt(input.value, 10);
        if (!v) { dlog(log, '先在输入框填要查找的数字', 'l-err'); return; }
        search(v);
      }));
      bar.appendChild(btn('🎲 随机 6 个', function () {
        for (var k = 0; k < 6; k++) insert(Math.floor(Math.random() * 89) + 5, true);
        render(); dlog(log, '随机插入 6 个节点,当前树高 ' + depth(root) + ' —— 对比一下"有序插入会退化成链表"', 'l-info');
      }));
      bar.appendChild(btn('↺ 清空', function () { root = null; count = 0; render(); log.innerHTML = ''; counter.set('last', '清空'); }, true));
      body.appendChild(bar);
      body.appendChild(svgWrap);
      body.appendChild(counter);
      body.appendChild(log);
      [50, 30, 70, 20, 40, 60, 80].forEach(function (v) { insert(v, true); });
      render();
      var inorder = []; walk(root, inorder);
      dlog(log, '初始化一棵树:50/30/70/20/40/60/80。试试查找 40 或插入 45。', 'l-info');
      dlog(log, '中序遍历 = ' + inorder.join(' → ') + '(BST 的中序一定是升序)', 'l-hl');
    }
  };
})();
