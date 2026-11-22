/* ═══════════════════════════════════════════════════
   SVG 图解 · 宇宙航行(尺度阶梯 / 旅行者旅程 / 航行时间)
   ═══════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.DIAGRAMS = window.DIAGRAMS || {};
  var D = window.DG.D;

  /* 1. 宇宙尺度阶梯(对数坐标) */
  DIAGRAMS['d-cosmic-scale'] = {
    title: '宇宙的尺子:从地球到 930 亿光年',
    caption: '横轴是对数尺度(公里)。每往右一格,数字就大一个数量级——从 1 万公里到 10^23 公里,人类习惯的直觉在这里全部失效。',
    svg: (function () {
      var g = D(900, 430);
      var stops = [
        ['地球', '直径 1.27 万 km', 4.1, '#22d3ee'],
        ['地月距离', '38.4 万 km', 5.58, '#34d399'],
        ['日地距离', '1 AU = 1.5 亿 km', 8.18, '#fbbf24'],
        ['海王星轨道', '30 AU', 9.65, '#818cf8'],
        ['奥尔特云边缘', '约 1 光年', 13.0, '#c084fc'],
        ['比邻星', '4.24 光年', 13.6, '#fb7185'],
        ['银河系直径', '约 10 万光年', 18.0, '#f472b6'],
        ['可观测宇宙', '930 亿光年', 23.95, '#e2e8f0']
      ];
      var x0 = 50, x1 = 850, y0 = 150;
      g.text(450, 34, '宇宙尺度阶梯(横轴为对数:每 2 格 = 100 倍)', 'dg-title');
      g.line2(x0, y0, x1, y0, '#475569');
      for (var e = 4; e <= 24; e += 2) {
        var tx = x0 + (e - 4) / 20 * (x1 - x0);
        g.line2(tx, y0 - 6, tx, y0 + 6, '#334155');
        g.text(tx, y0 + 26, '10^' + e, 'dg-sub');
      }
      var NUM = ['1', '2', '3', '4', '5', '6', '7', '8'];
      stops.forEach(function (s, i) {
        var x = x0 + (s[2] - 4) / 20 * (x1 - x0);
        g.raw('<circle cx="' + x + '" cy="' + y0 + '" r="9" fill="rgba(13,20,40,.95)" stroke="' + s[3] + '" stroke-width="2"/>');
        g.text(x, y0 + 4, NUM[i], 'dg-label', { fill: s[3], weight: 700 });
      });
      /* 图例卡:2 行 × 4 列 */
      stops.forEach(function (s, i) {
        var col = i % 4, row = Math.floor(i / 4);
        var cx = 40 + col * 215, cy = 215 + row * 84;
        g.rect(cx, cy, 200, 66, s[3], { rx: 10, fill: 'rgba(13,20,40,.92)' });
        g.text(cx + 14, cy + 26, NUM[i], 'dg-label', { anchor: 'start', fill: s[3], weight: 700 });
        g.text(cx + 30, cy + 26, s[0], 'dg-label', { anchor: 'start', fill: '#e8eef7', weight: 700 });
        g.text(cx + 14, cy + 48, s[1], 'dg-sub', { anchor: 'start' });
      });
      g.text(450, 410, '编号对应轴上位置;数字读法:10^8 公里 = 1 亿公里', 'dg-sub');
      return g.done();
    })()
  };

  /* 2. 旅行者 1 号走到哪了 */
  DIAGRAMS['d-voyager-journey'] = {
    title: '旅行者 1 号:飞了 48 年,还在太阳系的"院子"里',
    caption: '日球层顶约 120 AU,旅行者 1 号 2012 年穿出;但它仍被奥尔特云包裹,距比邻星还有 4.24 光年——按现在的速度要 7.5 万年。',
    svg: (function () {
      var g = D(900, 440);
      var rows = [
        ['太阳', 0, '0 AU', '#fbbf24'],
        ['地球', 1, '1 AU', '#22d3ee'],
        ['海王星轨道', 30, '30 AU', '#60a5fa'],
        ['日球层顶', 120, '120 AU', '#34d399'],
        ['旅行者 1 号(2025)', 165, '165 AU', '#fb7185'],
        ['奥尔特云内缘', 2000, '~2,000 AU', '#c084fc'],
        ['奥尔特云外缘', 100000, '~10 万 AU', '#a78bfa'],
        ['比邻星', 268000, '4.24 光年', '#f472b6']
      ];
      g.text(450, 30, '离太阳的距离(对数条长度,不是线性距离)', 'dg-title');
      var x0 = 250, x1 = 810, y = 56, lh = 42;
      function pos(au) { return Math.log10(au + 1) / Math.log10(268001) * (x1 - x0); }
      rows.forEach(function (r, i) {
        var centerY = y + i * lh;
        // 行背景
        g.rect(30, centerY - 15, 840, 30, 'rgba(148,163,184,.18)', { rx: 6, fill: 'rgba(148,163,184,.045)' });
        // 标签
        g.text(220, centerY + 5, r[0], 'dg-label', { anchor: 'end', fill: '#cbd5e1', weight: 700 });
        // 条形(太阳在 0 AU,用起点圆点表示)
        var len = Math.max(3, pos(r[1]));
        if (r[1] === 0) {
          g.raw('<circle cx="' + (x0 + 4) + '" cy="' + centerY + '" r="4.5" fill="' + r[3] + '"/>');
          g.text(x0 + 18, centerY + 5, r[2], 'dg-label', { anchor: 'start', fill: r[3], weight: 700 });
        } else {
          g.rect(x0, centerY - 9, len, 18, r[3], { rx: 4, fill: 'rgba(13,20,40,.9)' });
          g.text(x0 + len + 10, centerY + 5, r[2], 'dg-label', { anchor: 'start', fill: r[3], weight: 700 });
        }
      });
      g.chip(30, 396, '1 光年 ≈ 63,241 AU;旅行者 1 号 165 AU ≈ 0.0026 光年', '#22d3ee');
      g.chip(560, 396, '结论:连奥尔特云都没出去', '#fb7185');
      return g.done();
    })()
  };

  /* 3. 到比邻星要多久 */
  DIAGRAMS['d-voyage-time'] = {
    title: '4.24 光年,不同速度要飞多久',
    caption: '横轴是时间(对数,年)。化学火箭要 7.5 万年;光帆 0.2c 约 21 年(无人克级探测器);只有接近光速,才有"人的一生"量级的可能。',
    svg: (function () {
      var g = D(900, 360);
      var rows = [
        ['旅行者 1 号 17 km/s', 75000, '#fb7185'],
        ['帕克峰值 ~0.00064c', 6600, '#f472b6'],
        ['核聚变设想 0.01c', 424, '#fbbf24'],
        ['光帆 Starshot 0.2c', 21, '#34d399'],
        ['理论 0.5c', 8.5, '#22d3ee'],
        ['光速 1c(不可能载人)', 4.24, '#e2e8f0']
      ];
      var x0 = 200, x1 = 780, y0 = 60;
      function pos(t) { return x0 + Math.log10(t) / Math.log10(80000) * (x1 - x0); }
      rows.forEach(function (r, i) {
        var y = y0 + i * 48;
        g.text(190, y + 4, r[0], 'dg-label', { anchor: 'end' });
        var x = pos(r[1]);
        g.rect(x0, y - 12, Math.max(2, x - x0), 24, r[2], { rx: 4, fill: 'rgba(13,20,40,.9)' });
        g.text(x + 10, y + 4, r[1] >= 100 ? Math.round(r[1]).toLocaleString() + ' 年' : r[1] + ' 年', 'dg-label', { fill: r[2], weight: 700, anchor: 'start' });
      });
      g.text(440, 340, '时间对数刻度:每格约 16 倍。0.2c 光帆仅适用于克级无人探测器,不能载人。', 'dg-sub');
      return g.done();
    })()
  };
})();
