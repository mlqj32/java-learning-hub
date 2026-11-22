/* ═══════════════════════════════════════════════════
   交互演示 · 量子编程(Bloch 球 / Grover 振幅放大)
   ═══════════════════════════════════════════════════ */
(function () {
  'use strict';
  var D = window.DEMOS = window.DEMOS || {};
  var U = window.DUTIL;
  var el = U.el, btn = U.btn, logArea = U.logArea;
  function dlog(box, msg, cls) { U.log(box, msg, cls); }

  /* ═══════════ 1. Bloch 球状态探索 ═══════════ */
  D['qubit-bloch'] = {
    title: 'Bloch 球:拖动 θ 和 φ,看概率幅怎么变',
    subtitle: '改变极角 θ 与相对相位 φ,观察 |0⟩/|1⟩ 的幅、测量概率和 Bloch 坐标',
    icon: 'target',
    mount: function (body) {
      var theta = 60, phi = 0;
      var card = el('div', 'dm-panel');
      card.style.cssText = 'min-height:150px';
      var controls = el('div', '');
      controls.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:12px 0';
      var tWrap = el('label', '');
      tWrap.innerHTML = '<div style="font-size:12px;color:#7dd3fc;font-weight:700">极角 θ <span id="qb-tv">60°</span></div>';
      var t = el('input', '');
      t.type = 'range'; t.min = '0'; t.max = '180'; t.step = '1'; t.value = '60';
      t.style.cssText = 'width:100%;accent-color:#22d3ee';
      tWrap.appendChild(t);
      var pWrap = el('label', '');
      pWrap.innerHTML = '<div style="font-size:12px;color:#c084fc;font-weight:700">相位 φ <span id="qb-pv">0°</span></div>';
      var p = el('input', '');
      p.type = 'range'; p.min = '0'; p.max = '360'; p.step = '5'; p.value = '0';
      p.style.cssText = 'width:100%;accent-color:#c084fc';
      pWrap.appendChild(p);
      controls.appendChild(tWrap); controls.appendChild(pWrap);
      var view = el('div', '');
      var log = logArea();
      function render() {
        var th = theta * Math.PI / 180, ph = phi * Math.PI / 180;
        var a = Math.cos(th / 2), b = Math.sin(th / 2);
        var bx = b * Math.cos(ph), by = b * Math.sin(ph), bz = a;
        var p0 = a * a, p1 = b * b;
        document.getElementById('qb-tv').textContent = theta + '°';
        document.getElementById('qb-pv').textContent = phi + '°';
        var cx = 110, cy = 110, r = 78;
        var sx = cx + r * (bx * 0.92 + by * 0.22);
        var sy = cy - r * (bz - by * 0.22);
        view.innerHTML = '<div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">' +
          '<svg viewBox="0 0 220 220" width="220" height="220" style="flex:0 0 220px">' +
          '<circle cx="110" cy="110" r="78" fill="rgba(34,211,238,.04)" stroke="#334155"/>' +
          '<ellipse cx="110" cy="110" rx="78" ry="30" fill="none" stroke="#334155" stroke-dasharray="4,4"/>' +
          '<line x1="110" y1="22" x2="110" y2="198" stroke="#475569"/>' +
          '<line x1="32" y1="110" x2="188" y2="110" stroke="#475569"/>' +
          '<line x1="110" y1="110" x2="' + sx.toFixed(1) + '" y2="' + sy.toFixed(1) + '" stroke="#22d3ee" stroke-width="2"/>' +
          '<circle cx="' + sx.toFixed(1) + '" cy="' + sy.toFixed(1) + '" r="6" fill="#22d3ee"/>' +
          '<text x="110" y="16" text-anchor="middle" fill="#e2e8f0" font-size="12">|0⟩</text>' +
          '<text x="110" y="212" text-anchor="middle" fill="#e2e8f0" font-size="12">|1⟩</text>' +
          '</svg>' +
          '<div style="flex:1;min-width:260px;font-size:13px;line-height:2;color:#9fb0c8">' +
          '<div><b style="color:#e2e8f0">|ψ⟩</b> = ' + a.toFixed(3) + '|0⟩ + (' + b.toFixed(3) + '·e^(i·' + phi + '°))|1⟩</div>' +
          '<div>P(0) = <b style="color:#22d3ee">' + (p0 * 100).toFixed(1) + '%</b> · P(1) = <b style="color:#c084fc">' + (p1 * 100).toFixed(1) + '%</b></div>' +
          '<div>Bloch 坐标:(x,y,z) = (' + bx.toFixed(2) + ', ' + by.toFixed(2) + ', ' + bz.toFixed(2) + ')</div>' +
          '<div style="color:#64748b">θ 控制 0/1 概率;φ 不改变计算基测量概率,但会改变后续干涉。</div>' +
          '</div></div>';
      }
      t.addEventListener('input', function () { theta = +t.value; render(); });
      p.addEventListener('input', function () { phi = +p.value; render(); });
      var bar = el('div', 'dm-toolbar');
      bar.appendChild(btn('|0⟩', function () { theta = 0; phi = 0; t.value = 0; p.value = 0; render(); }, true));
      bar.appendChild(btn('|1⟩', function () { theta = 180; phi = 0; t.value = 180; p.value = 0; render(); }, true));
      bar.appendChild(btn('|+⟩', function () { theta = 90; phi = 0; t.value = 90; p.value = 0; render(); }, true));
      bar.appendChild(btn('|−⟩', function () { theta = 90; phi = 180; t.value = 90; p.value = 180; render(); }, true));
      bar.appendChild(btn('随机态', function () { theta = Math.floor(Math.random() * 181); phi = Math.floor(Math.random() * 72) * 5; t.value = theta; p.value = phi; render(); }));
      body.appendChild(bar); body.appendChild(card); card.appendChild(controls); card.appendChild(view);
      body.appendChild(log); render();
      dlog(log, '把 θ 拖到 90° 得到等概率叠加;再把 φ 改成 180° 得到 |−⟩。', 'l-info');
    }
  };

  /* ═══════════ 2. Grover 振幅放大 ═══════════ */
  D['grover-amp'] = {
    title: 'Grover 搜索:每次迭代把目标概率再抬高一点',
    subtitle: '选择 N 与迭代次数,观察目标概率与最佳迭代次数的关系',
    icon: 'target',
    mount: function (body) {
      var N = 8, k = 0;
      var card = el('div', 'dm-panel');
      card.style.cssText = 'min-height:170px';
      var controls = el('div', '');
      controls.style.cssText = 'display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin:10px 0';
      var nSel = el('select', '');
      nSel.style.cssText = 'background:#111d2a;color:#e2e8f0;border:1px solid #334155;border-radius:8px;padding:7px 10px';
      [4, 8, 16, 32, 64].forEach(function (n) { var o = document.createElement('option'); o.value = n; o.textContent = 'N = ' + n; nSel.appendChild(o); });
      nSel.value = '8';
      var kInput = el('input', '');
      kInput.type = 'range'; kInput.min = '0'; kInput.max = '6'; kInput.value = '0';
      kInput.style.cssText = 'flex:1;min-width:180px;accent-color:#c084fc';
      var kLabel = el('span', '');
      kLabel.style.cssText = 'font-size:12px;color:#c084fc;font-weight:700;min-width:86px';
      controls.appendChild(nSel); controls.appendChild(kInput); controls.appendChild(kLabel);
      var view = el('div', '');
      var log = logArea();
      function theta() { return Math.asin(1 / Math.sqrt(N)); }
      function maxK() { return Math.max(2, Math.ceil(Math.PI / (4 * theta())) + 2); }
      function render() {
        var th = theta();
        var prob = Math.pow(Math.sin((2 * k + 1) * th), 2);
        var best = Math.max(1, Math.round(Math.PI / (4 * th) - 0.5));
        kInput.max = String(maxK());
        kLabel.textContent = '迭代 k = ' + k + ' / 最佳 ' + best;
        var target = prob * 100, rest = (1 - prob) * 100;
        view.innerHTML = '<div style="font-size:13px;color:#9fb0c8;line-height:1.9;margin-bottom:8px">' +
          'θ = arcsin(1/√N) = ' + (th * 180 / Math.PI).toFixed(1) + '° · 目标概率 = sin²((2k+1)θ) = <b style="color:#c084fc">' + target.toFixed(1) + '%</b>' +
          '</div><div style="display:flex;align-items:flex-end;gap:14px;height:120px;padding:8px 12px;background:rgba(13,20,40,.6);border:1px solid #263749;border-radius:10px">' +
          '<div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%">' +
          '<div style="height:' + Math.max(2, target) + '%;background:linear-gradient(180deg,#c084fc,#7c3aed);border-radius:6px 6px 0 0"></div>' +
          '<div style="text-align:center;font-size:12px;color:#c084fc;margin-top:6px">目标 |w⟩</div></div>' +
          '<div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%">' +
          '<div style="height:' + Math.max(2, rest) + '%;background:linear-gradient(180deg,#334155,#1e293b);border-radius:6px 6px 0 0"></div>' +
          '<div style="text-align:center;font-size:12px;color:#94a3b8;margin-top:6px">其他 N−1 项</div></div>' +
          '</div>';
      }
      nSel.addEventListener('change', function () { N = +nSel.value; k = 0; kInput.value = '0'; kInput.max = String(maxK()); render(); dlog(log, '切换到 N=' + N + ',最佳迭代约 ' + Math.max(1, Math.round(Math.PI / (4 * theta()) - 0.5)), 'l-info'); });
      kInput.addEventListener('input', function () { k = +kInput.value; render(); });
      var bar = el('div', 'dm-toolbar');
      bar.appendChild(btn('← 上一步', function () { k = Math.max(0, k - 1); kInput.value = String(k); render(); }, true));
      bar.appendChild(btn('下一步 →', function () { k = Math.min(maxK(), k + 1); kInput.value = String(k); render(); }));
      bar.appendChild(btn('跳到最佳', function () { k = Math.max(1, Math.round(Math.PI / (4 * theta()) - 0.5)); kInput.value = String(k); render(); }));
      bar.appendChild(btn('重置', function () { k = 0; kInput.value = '0'; render(); }, true));
      body.appendChild(bar); body.appendChild(card); card.appendChild(controls); card.appendChild(view); body.appendChild(log);
      render();
      dlog(log, 'Grover 是 O(√N) 查询,不是指数加速;迭代过头概率会下降。', 'l-info');
    }
  };
})();
