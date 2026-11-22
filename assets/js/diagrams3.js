/* ═══════════════════════════════════════════════════
   SVG 图解库 · 第三批(数据结构 / 计算机网络 / 操作系统)
   ═══════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.DIAGRAMS = window.DIAGRAMS || {};
  var D = window.DG.D;

  /* 1. OSI 七层 vs TCP/IP 四层 + 封装 */
  DIAGRAMS['d-osi'] = {
    title: 'OSI 七层 vs TCP/IP 四层 —— 寄快递的分工',
    caption: '发件时每层套一个信封(封装),收件时每层拆一个(解封装);TCP/IP 把 OSI 的上三层合并成应用层。',
    svg: (function () {
      var g = D(860, 470);
      var osi = [
        ['7 应用层', '#22d3ee'], ['6 表示层', '#22d3ee'], ['5 会话层', '#22d3ee'],
        ['4 传输层', '#34d399'], ['3 网络层', '#fbbf24'], ['2 数据链路层', '#818cf8'], ['1 物理层', '#94a3b8']
      ];
      var lx = 60, lw = 200, lh = 42, top = 40;
      g.text(160, 24, 'OSI 七层(教学模型)', 'dg-title');
      for (var i = 0; i < osi.length; i++) {
        var y = top + i * 52;
        g.rect(lx, y, lw, lh, osi[i][1], { rx: 8, fill: 'rgba(13,20,40,.92)' });
        g.text(lx + lw / 2, y + 27, osi[i][0], 'dg-label', { fill: osi[i][1], weight: 700 });
      }
      /* TCP/IP 四层 */
      var tip = [
        ['应用层 HTTP/DNS/TLS', '#22d3ee', top, 3 * 52 - 10],
        ['传输层 TCP/UDP', '#34d399', top + 3 * 52, 52],
        ['网络层 IP/ICMP', '#fbbf24', top + 4 * 52, 52],
        ['网络接口层 以太网/WiFi', '#94a3b8', top + 5 * 52, 2 * 52 - 10]
      ];
      g.text(660, 24, 'TCP/IP 四层(工程模型)', 'dg-title');
      for (var j = 0; j < tip.length; j++) {
        g.rect(560, tip[j][2], 260, tip[j][3], tip[j][1], { rx: 8, fill: 'rgba(13,20,40,.92)' });
        g.text(690, tip[j][2] + tip[j][3] / 2 + 4, tip[j][0], 'dg-label', { fill: tip[j][1], weight: 700 });
      }
      g.arrow(262, 61, 556, 61, { dash: true, sw: 1.2 });
      g.arrow(262, 165, 556, 165, { dash: true, sw: 1.2 });
      g.arrow(262, 217, 556, 217, { dash: true, sw: 1.2 });
      g.arrow(262, 373, 556, 373, { dash: true, sw: 1.2 });
      g.chip(60, 420, '封装:应用数据 → 加 TCP 头 → 加 IP 头 → 加帧头尾', '#22d3ee');
      g.chip(560, 420, '解封装:收端每层拆自己的信封 📦', '#34d399');
      return g.done();
    })()
  };

  /* 2. 输入 URL 的旅程 */
  DIAGRAMS['d-http-flow'] = {
    title: '一次网页访问的完整旅程',
    caption: 'DNS 找地址 → TCP 建连接 → TLS 加密 → HTTP 收发 → 浏览器渲染。任何一步慢了,页面都会转圈。',
    svg: (function () {
      var g = D(880, 330);
      var steps = [
        ['① 解析 URL', '浏览器', '#94a3b8'],
        ['② DNS 解析', '域名 → IP 📖', '#22d3ee'],
        ['③ TCP 握手', '三次握手 🤝', '#34d399'],
        ['④ TLS 握手', 'HTTPS 加密 🔒', '#c084fc'],
        ['⑤ HTTP 请求', 'GET /index.html', '#fbbf24'],
        ['⑥ 服务端处理', 'Tomcat → 业务', '#fb7185'],
        ['⑦ 响应渲染', 'HTML → 页面 🖥️', '#a3e635']
      ];
      var w = 108, gap = 12, x0 = 22;
      for (var i = 0; i < steps.length; i++) {
        var x = x0 + i * (w + gap);
        g.rect(x, 70, w, 96, steps[i][2], { rx: 10, fill: 'rgba(13,20,40,.92)' });
        g.text(x + w / 2, 98, steps[i][0], 'dg-label', { fill: steps[i][2], weight: 700 });
        g.text(x + w / 2, 124, steps[i][1], 'dg-sub');
        if (i < steps.length - 1) g.arrow(x + w + 1, 118, x + w + gap - 1, 118, { sw: 1.2 });
      }
      g.text(440, 40, '从敲下回车到看见页面,中间发生了 7 件事', 'dg-title');
      g.rect(22, 196, 836, 44, '#fb7185', { rx: 10, fill: 'rgba(251,113,133,.06)' });
      g.text(440, 223, '任何一步失败:DNS 超时 / 连接被拒 / 证书错误 / 502 —— 排查时按顺序逐段定位', 'dg-label', { fill: '#fda4af' });
      g.chip(22, 262, '浏览器缓存命中则跳过 ②~⑤', '#22d3ee');
      g.chip(320, 262, 'CDN 让 ⑤⑥ 在离你最近的机房完成', '#34d399');
      g.chip(640, 262, 'HTTP/2 多路复用:一个连接并发多请求', '#c084fc');
      return g.done();
    })()
  };

  /* 3. TCP 三次握手 / 四次挥手 */
  DIAGRAMS['d-tcp-handshake'] = {
    title: 'TCP 三次握手与四次挥手(时序图)',
    caption: '握手三次是为了双向确认"我发得出、你收得到";挥手四次是因为 TCP 全双工,两个方向要分别关。TIME_WAIT 等 2MSL 是为了让最后的 ACK 有机会重发。',
    svg: (function () {
      var g = D(860, 520);
      g.box(120, 24, 150, 46, { c: '#22d3ee', t: '客户端 Client', e: '💻' });
      g.box(590, 24, 150, 46, { c: '#c084fc', t: '服务端 Server', e: '🗄️' });
      g.line2(195, 70, 195, 500, '#334155');
      g.line2(665, 70, 665, 500, '#334155');
      /* 三次握手 */
      g.text(430, 96, '— 三次握手 —', 'dg-sub');
      g.arrow(198, 116, 660, 116, { c: '#34d399', t: 'SYN seq=x', dx: -20 });
      g.text(205, 108, '状态:SYN_SENT', 'dg-label', { anchor: 'start', fill: '#34d399' });
      g.arrow(662, 164, 200, 164, { c: '#34d399', t: 'SYN+ACK seq=y ack=x+1', dx: 10 });
      g.text(575, 156, 'SYN_RCVD', 'dg-label', { anchor: 'start', fill: '#34d399' });
      g.arrow(198, 212, 660, 212, { c: '#34d399', t: 'ACK ack=y+1 → ESTABLISHED', dx: -40 });
      g.text(258, 240, '③ 双方都确认:我能发、你能收双向 OK ✅', 'dg-label', { fill: '#a7f3d0' });
      /* 四次挥手 */
      g.text(430, 278, '— 四次挥手 —', 'dg-sub');
      g.arrow(198, 300, 660, 300, { c: '#fb7185', t: 'FIN seq=u', dx: -20 });
      g.text(205, 292, 'FIN_WAIT_1', 'dg-label', { anchor: 'start', fill: '#fb7185' });
      g.arrow(662, 344, 200, 344, { c: '#fb7185', t: 'ACK(服务端可能还有数据要发)', dx: 40 });
      g.text(500, 336, 'CLOSE_WAIT', 'dg-label', { anchor: 'start', fill: '#fb7185' });
      g.arrow(662, 388, 200, 388, { c: '#fb7185', t: 'FIN seq=w', dx: 10 });
      g.text(205, 380, 'FIN_WAIT_2', 'dg-label', { anchor: 'start', fill: '#fb7185' });
      g.arrow(198, 432, 660, 432, { c: '#fb7185', t: 'ACK ack=w+1', dx: -20 });
      g.text(205, 466, 'TIME_WAIT 等 2MSL', 'dg-label', { anchor: 'start', fill: '#fbbf24' });
      g.text(664, 466, 'CLOSED', 'dg-label', { anchor: 'start', fill: '#fbbf24' });
      g.chip(30, 480, '面试点:为什么 TIME_WAIT 需要 2MSL?→ 保证最后一个 ACK 能重发 + 让旧连接报文消散', '#fbbf24');
      return g.done();
    })()
  };

  /* 4. 进程状态机 */
  DIAGRAMS['d-process-state'] = {
    title: '进程五状态机 —— 一个进程的一生',
    caption: '新建 → 就绪 → 运行 → 阻塞 → 就绪 → … → 终止。时间片用完回就绪,等 IO 进阻塞,IO 完成回就绪;只有拿到 CPU 才能运行。',
    svg: (function () {
      var g = D(800, 380);
      g.box(40, 150, 130, 56, { c: '#94a3b8', t: '新建 New', sub: 'fork 后' });
      g.box(250, 150, 130, 56, { c: '#22d3ee', t: '就绪 Ready', sub: '排队等 CPU' });
      g.box(470, 150, 130, 56, { c: '#34d399', t: '运行 Running', sub: '拿到 CPU' });
      g.box(640, 150, 120, 56, { c: '#64748b', t: '终止', sub: 'exit' });
      g.box(250, 290, 130, 56, { c: '#fb7185', t: '阻塞 Blocked', sub: '等 IO/锁/事件' });
      g.arrow(172, 178, 246, 178, { t: '就绪队列', sw: 1.4 });
      g.arrow(382, 170, 466, 170, { t: '调度器选中', sw: 1.4 });
      g.arrow(468, 206, 384, 206, { c: '#fbbf24', t: '时间片用完', sw: 1.4, dash: true });
      g.arrow(468, 196, 380, 300, { c: '#fb7185', t: '等待 IO', sw: 1.3 });
      g.arrow(250, 300, 316, 210, { c: '#34d399', t: 'IO 完成', sw: 1.3, dash: true });
      g.arrow(602, 178, 636, 178, { c: '#94a3b8', t: 'exit', sw: 1.3 });
      g.arrow(470, 182, 640, 300, { c: 'transparent', sw: 0 });
      g.chip(40, 70, '用户态 🧑‍💻:应用代码', '#22d3ee');
      g.chip(300, 70, '内核态 🛡️:系统调用/中断处理', '#c084fc');
      g.chip(40, 260, '阻塞 ≠ 就绪:阻塞是被动等事件,就绪是主动等 CPU', '#fbbf24');
      g.text(400, 356, '状态迁移是操作系统调度的核心:每次中断/时间片/IO 都可能触发迁移', 'dg-sub');
      return g.done();
    })()
  };

  /* 5. 虚拟内存地址翻译 */
  DIAGRAMS['d-vm-page'] = {
    title: '虚拟内存:一次地址翻译的三跳',
    caption: 'CPU 发出虚拟地址 → TLB 查缓存 → 页表查映射 → 物理内存取数据。TLB 未命中才走页表,页表项不在内存就触发缺页中断。',
    svg: (function () {
      var g = D(860, 360);
      g.box(20, 120, 150, 90, { c: '#22d3ee', t: 'CPU 虚拟地址', sub: '页号 | 页内偏移', e: '🧠' });
      g.box(230, 40, 170, 80, { c: '#c084fc', t: 'TLB', sub: '页号→帧号的缓存' });
      g.box(230, 180, 170, 90, { c: '#818cf8', t: '页表 Page Table', sub: '虚拟页 → 物理帧映射', e: '📖' });
      g.box(470, 120, 160, 90, { c: '#fbbf24', t: '物理内存', sub: '页框 Frame 📦' });
      g.box(690, 120, 150, 90, { c: '#34d399', t: '取到数据', sub: '返回 CPU ✅' });
      g.arrow(170, 150, 226, 100, { t: '① 查 TLB', sw: 1.4 });
      g.arrow(170, 180, 226, 210, { t: '② 未命中查页表', sw: 1.4, dash: true });
      g.arrow(400, 220, 466, 180, { t: '③ 得到帧号', sw: 1.4 });
      g.arrow(400, 80, 466, 130, { t: 'TLB 命中直达', sw: 1.2, dash: true, c: '#34d399' });
      g.arrow(630, 165, 686, 165, { sw: 1.4 });
      g.chip(20, 250, '缺页中断:页表项无效 → 内核从磁盘换入 → 再重试指令', '#fb7185');
      g.chip(20, 288, '局部性原理:TLB 命中率通常 > 99%,所以虚拟内存不慢', '#22d3ee');
      g.chip(560, 288, '页面置换:LRU/Clock 淘汰不常用页', '#fbbf24');
      return g.done();
    })()
  };

  /* 6. BST 与堆 */
  DIAGRAMS['d-tree-heap'] = {
    title: '二叉搜索树 vs 堆 —— 两种"有序"的方式',
    caption: 'BST 左小右大,中序遍历即有序,查找 O(log n)(平衡时);堆只保证父大于(小于)子,适合取极值,数组存储不用指针。',
    svg: (function () {
      var g = D(840, 360);
      g.text(210, 30, '二叉搜索树 BST 🌳', 'dg-title');
      /* BST: 50 30 70 20 40 60 80 */
      var nodes = [
        [210, 60, 50], [120, 120, 30], [300, 120, 70],
        [70, 185, 20], [165, 185, 40], [255, 185, 60], [345, 185, 80]
      ];
      var edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
      edges.forEach(function (e) {
        var a = nodes[e[0]], b = nodes[e[1]];
        g.line2(a[0], a[1], b[0], b[1], '#334155');
      });
      nodes.forEach(function (n, i) {
        g.rect(n[0] - 20, n[1] - 16, 40, 32, i === 0 ? '#22d3ee' : '#818cf8', { rx: 16, fill: 'rgba(13,20,40,.95)' });
        g.text(n[0], n[1] + 5, String(n[2]), 'dg-label', { fill: i === 0 ? '#22d3ee' : '#c7d2fe', weight: 700 });
      });
      g.text(210, 245, '查找 60:50→70→60(3 步)', 'dg-sub');
      g.text(210, 268, '中序遍历 = 20 30 40 50 60 70 80', 'dg-label', { fill: '#a7f3d0' });
      g.chip(110, 300, '退化链表 → O(n),所以需要 AVL/红黑树', '#fb7185');
      /* 堆 */
      g.text(630, 30, '大顶堆 + 数组存储 ⛰️', 'dg-title');
      g.line2(630, 60, 540, 130, '#334155');
      g.line2(630, 60, 720, 130, '#334155');
      g.line2(540, 130, 490, 200, '#334155');
      g.line2(540, 130, 590, 200, '#334155');
      g.line2(720, 130, 670, 200, '#334155');
      g.line2(720, 130, 770, 200, '#334155');
      [[630, 60, 90], [540, 130, 70], [720, 130, 60], [490, 200, 40], [590, 200, 50], [670, 200, 30], [770, 200, 20]].forEach(function (n, i) {
        g.rect(n[0] - 18, n[1] - 15, 36, 30, i === 0 ? '#fbbf24' : '#94a3b8', { rx: 15, fill: 'rgba(13,20,40,.95)' });
        g.text(n[0], n[1] + 5, String(n[2]), 'dg-label', { fill: i === 0 ? '#fde68a' : '#cbd5e1', weight: 700 });
      });
      g.chip(470, 245, '数组:[90,70,60,40,50,30,20]', '#fbbf24');
      g.text(630, 285, '父 i → 子 2i+1 / 2i+2,取最大值 O(1)', 'dg-sub');
      g.chip(470, 300, 'PriorityQueue / TopK / 堆排序', '#34d399');
      return g.done();
    })()
  };

  /* 7. 复杂度增长曲线 */
  DIAGRAMS['d-complexity'] = {
    title: '复杂度增长曲线 —— 数据量一大,差距吓人',
    caption: 'n=1000 时:O(log n)≈10 步,O(n)=1000 步,O(n log n)≈1 万步,O(n²) 100 万步。这就是为什么面试官盯着复杂度问。',
    svg: (function () {
      var g = D(820, 380);
      /* 坐标系 */
      g.line2(70, 320, 760, 320, '#64748b');
      g.line2(70, 320, 70, 40, '#64748b');
      g.text(80, 34, '耗时', 'dg-label', { anchor: 'start' });
      g.text(742, 344, '数据量 n →', 'dg-label', { anchor: 'end' });
      /* 曲线 */
      var curves = [
        ['O(1)', '#34d399', 'M70,300 L750,300'],
        ['O(log n)', '#22d3ee', 'M70,300 C300,240 520,200 750,180'],
        ['O(n)', '#fbbf24', 'M70,300 L750,140'],
        ['O(n log n)', '#fb7185', 'M70,300 C330,230 560,140 750,60'],
        ['O(n²)', '#c084fc', 'M70,300 C300,290 500,240 750,44']
      ];
      curves.forEach(function (c) {
        g.raw('<path d="' + c[2] + '" fill="none" stroke="' + c[1] + '" stroke-width="2.2"/>');
      });
      var legend = [['O(1) 常量', '#34d399'], ['O(log n) 二分', '#22d3ee'], ['O(n) 遍历', '#fbbf24'], ['O(n log n) 排序', '#fb7185'], ['O(n²) 双重循环', '#c084fc']];
      legend.forEach(function (l, i) {
        var y = 60 + i * 26;
        g.rect(560, y - 9, 10, 10, l[1], { rx: 2 });
        g.text(578, y, l[0], 'dg-label', { anchor: 'start', fill: l[1] });
      });
      g.chip(90, 344, '面试口诀:先问数据量,再谈复杂度', '#22d3ee');
      return g.done();
    })()
  };
})();
