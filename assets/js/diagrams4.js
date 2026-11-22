/* ═══════════════════════════════════════════════════
   SVG 图解库 · 第四批(逆向工程:栈帧 / PE / Android / 反诈)
   ═══════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.DIAGRAMS = window.DIAGRAMS || {};
  var D = window.DG.D;

  /* 1. 栈帧结构 */
  DIAGRAMS['d-stack-frame'] = {
    title: '函数调用栈帧 —— call 的时候内存里发生了什么',
    caption: 'x86-64 System V ABI 且保留帧指针的示意：前六个整型/指针参数通常走寄存器，多余参数走栈；call 压入返回地址。编译器可以省略 rbp 栈帧，Windows x64 的寄存器与 shadow space 规则也不同。',
    svg: (function () {
      var g = D(820, 545);
      g.text(410, 26, '栈内存(向下生长 ↓)', 'dg-title');
      /* 高地址 */
      g.line2(80, 60, 740, 60, '#334155');
      g.text(80, 52, '高地址', 'dg-sub', { anchor: 'start' });
      var rows = [
        ['调用者栈帧(上一函数)', '局部变量 / 保存的寄存器', '#334155', 44],
        ['参数(arguments)', '第 7 个起的参数 / 溢出参数', '#22d3ee', 56],
        ['返回地址 return address', 'call 指令压入:函数执行完回哪', '#fb7185', 56],
        ['保存的 rbp', 'push rbp:调用者的栈底', '#c084fc', 56],
        ['局部变量', '新函数自己的变量空间', '#34d399', 56],
        ['rsp → 栈顶(当前)', 'sub rsp, N 之后的栈顶', '#fbbf24', 48]
      ];
      var y = 68;
      rows.forEach(function (r, i) {
        g.rect(110, y, 560, r[3], r[2], { rx: 6, fill: 'rgba(13,20,40,.92)' });
        g.text(390, y + 22, r[0], 'dg-label', { fill: r[2], weight: 700 });
        g.text(390, y + 40, r[1], 'dg-sub');
        y += r[3] + 8;
      });
      g.line2(80, y + 8, 740, y + 8, '#334155');
      g.text(80, y + 28, '低地址', 'dg-sub', { anchor: 'start' });
      g.arrow(720, 120, 720, y, { c: '#fbbf24', dash: true });
      g.text(756, 200, 'rsp 移动', 'dg-label', { fill: '#fbbf24' });
      g.chip(40, 500, '函数返回 = 弹栈:ret 取出返回地址,跳回去继续执行', '#fb7185');
      return g.done();
    })()
  };

  /* 2. PE 文件结构 */
  DIAGRAMS['d-pe-structure'] = {
    title: 'PE 文件解剖 —— 一个 exe 的内部抽屉',
    caption: 'MS-DOS 头(MZ)只是门面,真正的目录在 NT 头;节表告诉你每个"抽屉"从哪开始、多大;导入表记录它要调用哪些 DLL 函数。',
    svg: (function () {
      var g = D(900, 540);
      g.text(300, 26, 'PE 文件布局(从文件头到尾部)', 'dg-title');
      var parts = [
        ['MS-DOS 头(DOS Header)', '魔数 MZ(0x4D5A),指向 PE 头的偏移', '#94a3b8', 52],
        ['DOS Stub', '"This program cannot be run in DOS mode"', '#64748b', 40],
        ['NT 头(PE Header)', 'PE\\0\\0 签名 + FileHeader + OptionalHeader(入口 RVA)', '#22d3ee', 62],
        ['节表 Section Table', '每个节的名称/大小/文件偏移/内存偏移', '#818cf8', 54],
        ['.text 代码节', '汇编指令(最常被逆向的部分)', '#34d399', 54],
        ['.rdata 只读数据', '字符串/常量/导入表(指向 DLL 函数)', '#fbbf24', 54],
        ['.data 数据节', '全局变量/静态变量', '#c084fc', 48],
        ['.rsrc 资源节', '图标/对话框/版本信息', '#fb7185', 48]
      ];
      var y = 44;
      parts.forEach(function (p) {
        g.rect(120, y, 520, p[3], p[2], { rx: 6, fill: 'rgba(13,20,40,.92)' });
        g.text(150, y + 21, p[0], 'dg-label', { anchor: 'start', fill: p[2], weight: 700 });
        g.text(150, y + 39, p[1], 'dg-sub', { anchor: 'start' });
        y += p[3] + 6;
      });
      g.chip(660, 108, '查壳:先看节名', '#22d3ee');
      g.chip(660, 148, '.upx0/.upx1 → UPX 壳', '#fb7185');
      g.chip(660, 188, '导入表 = 行为线索', '#fbbf24');
      g.chip(660, 228, '敏感 API = 行为线索', '#c084fc');
      g.chip(40, 508, 'RVA(相对虚拟地址)≠ 文件偏移:需要按节表换算', '#94a3b8');
      return g.done();
    })()
  };

  /* 3. Android 分层与 JNI 边界 */
  DIAGRAMS['d-android-stack'] = {
    title: 'Android 分层与 JNI 边界 —— Java 在哪、so 在哪',
    caption: 'Java/Kotlin 代码跑在 ART 上,通过 JNI 调用 native 层的 so;加固与核心算法常藏在 so 里,所以逆向要跨过这条边界。',
    svg: (function () {
      var g = D(930, 450);
      var layers = [
        ['应用层 App', 'Java/Kotlin · Activity/Service · dex', '#22d3ee', 62],
        ['Java 框架层 Framework', 'system_server · Binder · AMS/WMS', '#818cf8', 58],
        ['JNI 边界 ⇅', 'Java ↔ native:JNI_OnLoad / RegisterNatives', '#fbbf24', 48],
        ['Native 层(so)', 'C/C++ 库 · ARM64 汇编 · 加密/风控/游戏引擎', '#fb7185', 66],
        ['HAL 硬件抽象层', '相机/传感器/蓝牙驱动接口', '#c084fc', 48],
        ['Linux 内核', '进程/内存/文件系统/驱动', '#94a3b8', 52]
      ];
      var y = 44;
      layers.forEach(function (l, i) {
        g.rect(120, y, 560, l[3], l[2], { rx: 8, fill: 'rgba(13,20,40,.92)' });
        g.text(400, y + 22, l[0], 'dg-label', { fill: l[2], weight: 700 });
        g.text(400, y + 40, l[1], 'dg-sub');
        if (i < layers.length - 1) g.arrow(400, y + l[3] + 1, 400, y + l[3] + 7, { sw: 1 });
        y += l[3] + 9;
      });
      g.chip(712, 60, '逆向路径:dex → JNI → so', '#22d3ee');
      g.chip(712, 104, '加固藏核心逻辑到 so', '#fb7185');
      return g.done();
    })()
  };

  /* 4. 杀猪盘链路 */
  DIAGRAMS['d-scam-chain'] = {
    title: '杀猪盘流水线 + 资金链路',
    caption: '常见套路示意：建立信任 → 小额返利 → 诱导大额转账与追加费用，时长和资金路径并不固定。怀疑被骗应立即停止转账、联系银行并拨打 110 报警，保留交易与聊天证据；能否追回取决于具体情况。',
    svg: (function () {
      var g = D(880, 470);
      /* 三段流水线 */
      var steps = [
        ['① 建立信任', '人设包装 · 婚恋/游戏/兴趣群\n高频关心 + 可能伪造的视频', '#fb7185'],
        ['② 小额返利', '用小额提现制造可信感\n群内可能安排托儿晒收益', '#fbbf24'],
        ['③ 诱导大额投入', '大额投入后限制提现\n再索取解冻费/税费/流水费', '#c084fc']
      ];
      steps.forEach(function (s, i) {
        var x = 30 + i * 290;
        g.rect(x, 40, 250, 96, s[2], { rx: 12, fill: 'rgba(13,20,40,.92)' });
        g.text(x + 125, 66, s[0], 'dg-label', { fill: s[2], weight: 700 });
        s[1].split('\n').forEach(function (line, k) {
          g.text(x + 125, 90 + k * 18, line, 'dg-sub');
        });
        if (i < 2) g.arrow(x + 250, 88, x + 286, 88, { sw: 1.4 });
      });
      /* 资金链路 */
      g.text(440, 176, '一种可能的资金转移路径（实际情况不同）', 'dg-title');
      var flow = [
        ['你的账户', '#22d3ee'],
        ['一级卡(跑分客)', '#fbbf24'],
        ['二级卡/对公户', '#fb7185'],
        ['虚拟币 USDT', '#c084fc'],
        ['境外钱包', '#94a3b8']
      ];
      flow.forEach(function (f, i) {
        var x = 22 + i * 172;
        g.rect(x, 200, 140, 52, f[1], { rx: 10, fill: 'rgba(13,20,40,.92)' });
        g.text(x + 70, 231, f[0], 'dg-label', { fill: f[1], weight: 700 });
        if (i < flow.length - 1) g.arrow(x + 140, 226, x + 168, 226, { sw: 1.3 });
      });
      /* 人性开关 */
      g.text(440, 300, '为什么越陷越深(人性开关)', 'dg-title');
      var psy = [
        ['沉没成本', '已投 20 万,再交 2 万就能提现?'],
        ['损失厌恶', '对损失的敏感可能促使继续投入'],
        ['权威服从', '"老师"说不交税就前功尽弃'],
        ['信息茧房', '群里只有你想听的话']
      ];
      psy.forEach(function (p, i) {
        var y = 322 + Math.floor(i / 2) * 44;
        var x = 40 + (i % 2) * 420;
        g.chip(x, y, p[0] + ':' + p[1], i < 2 ? '#fb7185' : '#c084fc');
      });
      g.chip(40, 420, '立即停止转账 → 联系银行 → 拨打 110 报警 → 保存证据；96110 用于反诈咨询', '#34d399');
      return g.done();
    })()
  };
})();
