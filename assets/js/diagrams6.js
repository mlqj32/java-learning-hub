/* ═══════════════════════════════════════════════════
   SVG 图解 · 量子编程(比特与 qubit / Bell 电路 / Grover)
   ═══════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.DIAGRAMS = window.DIAGRAMS || {};
  var D = window.DG.D;

  /* 1. 经典比特与量子比特 */
  DIAGRAMS['d-qubit-vs-bit'] = {
    title: '经典比特与量子比特:一个值,还是一个复向量',
    caption: '经典比特只有 0 或 1;量子比特是二维复向量,测量时按 |α|²、|β|² 得到 0 或 1。Bloch 球把单 qubit 纯态画成球面上的点。',
    svg: (function () {
      var g = D(900, 420);
      g.text(450, 34, '同一个"比特",两种状态空间', 'dg-title');
      g.rect(40, 70, 370, 300, '#94a3b8', { rx: 14 });
      g.text(225, 106, '经典比特', 'dg-title', { fill: '#e2e8f0' });
      g.text(225, 132, '状态只能是 0 或 1', 'dg-sub');
      g.raw('<circle cx="225" cy="235" r="78" fill="rgba(148,163,184,.08)" stroke="#64748b" stroke-width="2"/>');
      g.text(225, 252, '0 / 1', 'dg-title', { fill: '#cbd5e1' });
      g.text(225, 330, '测量不改变值;可以任意复制', 'dg-sub');
      g.rect(490, 70, 370, 300, '#22d3ee', { rx: 14 });
      g.text(675, 106, '量子比特', 'dg-title', { fill: '#e2e8f0' });
      g.text(675, 132, 'α|0⟩ + β|1⟩,|α|²+|β|²=1', 'dg-sub');
      g.raw('<circle cx="675" cy="235" r="86" fill="rgba(34,211,238,.06)" stroke="#22d3ee" stroke-width="2"/>');
      g.raw('<ellipse cx="675" cy="235" rx="86" ry="30" fill="none" stroke="#475569" stroke-dasharray="5,4"/>');
      g.raw('<line x1="675" y1="142" x2="675" y2="328" stroke="#475569"/>');
      g.raw('<line x1="582" y1="235" x2="768" y2="235" stroke="#475569"/>');
      g.raw('<line x1="675" y1="235" x2="735" y2="178" stroke="#c084fc" stroke-width="3"/>');
      g.raw('<circle cx="735" cy="178" r="7" fill="#c084fc"/>');
      g.text(675, 136, '|0⟩', 'dg-label', { fill: '#22d3ee' });
      g.text(675, 348, '|1⟩', 'dg-label', { fill: '#22d3ee' });
      g.text(675, 390, '测量得到 0/1;未知态不可克隆', 'dg-sub');
      return g.done();
    })()
  };

  /* 2. Bell 电路 */
  DIAGRAMS['d-quantum-circuit'] = {
    title: 'H + CNOT:两条线制备 Bell 态',
    caption: '先对 q0 作用 H,得到 (|0⟩+|1⟩)|0⟩/√2;再以 q0 控制 q1 翻转,得到 (|00⟩+|11⟩)/√2。测量只会出现 00 或 11。',
    svg: (function () {
      var g = D(900, 360);
      g.text(450, 34, '量子电路:叠加 → 纠缠 → 测量', 'dg-title');
      var x0 = 150, x1 = 760, y0 = 130, y1 = 250;
      g.line2(x0, y0, x1, y0, '#94a3b8');
      g.line2(x0, y1, x1, y1, '#94a3b8');
      g.text(110, y0 + 5, 'q0 |0⟩', 'dg-label', { anchor: 'end', fill: '#22d3ee' });
      g.text(110, y1 + 5, 'q1 |0⟩', 'dg-label', { anchor: 'end', fill: '#c084fc' });
      g.rect(230, y0 - 28, 62, 56, '#22d3ee', { rx: 10 });
      g.text(261, y0 + 7, 'H', 'dg-title');
      g.raw('<circle cx="410" cy="' + y0 + '" r="7" fill="#c084fc"/>');
      g.raw('<line x1="410" y1="' + y0 + '" x2="410" y2="' + y1 + '" stroke="#c084fc" stroke-width="2"/>');
      g.raw('<circle cx="410" cy="' + y1 + '" r="22" fill="rgba(13,20,40,.95)" stroke="#c084fc" stroke-width="2"/>');
      g.raw('<line x1="410" y1="' + (y1 - 22) + '" x2="410" y2="' + (y1 + 22) + '" stroke="#c084fc" stroke-width="2"/>');
      g.raw('<line x1="' + (410 - 22) + '" y1="' + y1 + '" x2="' + (410 + 22) + '" y2="' + y1 + '" stroke="#c084fc" stroke-width="2"/>');
      g.text(410, y0 - 16, '控制', 'dg-sub', { fill: '#c084fc' });
      g.text(410, y1 + 48, 'CNOT', 'dg-sub', { fill: '#c084fc' });
      g.rect(560, y0 - 28, 86, 56, '#94a3b8', { rx: 10 });
      g.text(603, y0 + 7, '测量', 'dg-label');
      g.rect(560, y1 - 28, 86, 56, '#94a3b8', { rx: 10 });
      g.text(603, y1 + 7, '测量', 'dg-label');
      g.text(450, 322, '理想 counts:00 与 11 各约 50%,01/10 接近 0', 'dg-sub');
      return g.done();
    })()
  };

  /* 3. Grover 概率曲线 */
  DIAGRAMS['d-grover-steps'] = {
    title: 'Grover:N=16 时目标概率随迭代次数起伏',
    caption: '每次迭代把状态旋转 2θ,目标概率为 sin²((2k+1)θ)。最佳迭代约 (π/4)√N,继续迭代会"过冲"而下降。',
    svg: (function () {
      var g = D(900, 380);
      g.text(450, 34, 'Grover 迭代:目标概率不是单调上升', 'dg-title');
      var N = 16, theta = Math.asin(1 / Math.sqrt(N));
      var x0 = 90, x1 = 830, y0 = 300, h = 220;
      g.line2(x0, y0, x1, y0, '#475569');
      g.line2(x0, y0, x0, 60, '#475569');
      for (var k = 0; k <= 6; k++) {
        var p = Math.pow(Math.sin((2 * k + 1) * theta), 2);
        var bh = p * h;
        var bx = x0 + 30 + k * 115;
        var col = k === 3 ? '#34d399' : '#818cf8';
        g.rect(bx - 32, y0 - bh, 64, Math.max(2, bh), col, { rx: 6, fill: col });
        g.text(bx, y0 + 24, 'k=' + k, 'dg-sub');
        g.text(bx, y0 - bh - 10, (p * 100).toFixed(1) + '%', 'dg-label', { fill: col, weight: 700 });
      }
      g.text(x0 + 30 + 3 * 115, 55, '最佳迭代附近', 'dg-label', { fill: '#34d399', weight: 700 });
      g.text(450, 350, 'N=16:θ≈14.5°,最佳 k≈3,目标概率约 96.1%;k 再增加会下降。', 'dg-sub');
      return g.done();
    })()
  };
})();
