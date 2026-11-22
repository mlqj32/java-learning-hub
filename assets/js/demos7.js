/* ═══════════════════════════════════════════════════
   交互演示 · 宇宙航行(尺度漫游 / 航行时间计算器)
   ═══════════════════════════════════════════════════ */
(function () {
  'use strict';
  var D = window.DEMOS = window.DEMOS || {};
  var U = window.DUTIL;
  var el = U.el, btn = U.btn, logArea = U.logArea, counters = U.counters, tabs = U.tabs;
  function dlog(box, msg, cls) { U.log(box, msg, cls); }
  var C = 299792.458; // km/s

  /* ═══════════ 1. 宇宙尺度漫游 ═══════════ */
  D['cosmic-scale'] = {
    title: '宇宙尺度漫游:同一把尺子,量到视界',
    subtitle: '拖动滑块,看距离每增加一个数量级发生什么',
    icon: 'target',
    mount: function (body) {
      var STOPS = [
        { name: '地球', emoji: '🌍', km: 12742, desc: '直径约 1.27 万公里。人类所有历史都发生在这颗岩石球表面。', tag: '10^4 km' },
        { name: '地月距离', emoji: '🌕', km: 384400, desc: '光走一趟只要 1.28 秒;阿波罗飞船飞了约 3 天。', tag: '10^5.6 km' },
        { name: '日地距离', emoji: '☀️', km: 149597870, desc: '1 天文单位(AU)。阳光到地球约 8 分 19 秒,这是"太阳迟到"的 8 分钟。', tag: '10^8 km' },
        { name: '海王星轨道', emoji: '🪐', km: 4498252900, desc: '约 30 AU。旅行者 2 号飞了 12 年才到,阳光也要 4 小时。', tag: '10^9.7 km' },
        { name: '奥尔特云边缘', emoji: '☁️', km: 9.46e12, desc: '约 1 光年。太阳引力的"院墙",长周期彗星的老家。旅行者 1 号还要 300 年才到内缘。', tag: '10^13 km' },
        { name: '比邻星', emoji: '✨', km: 4.01e13, desc: '4.24 光年,除太阳外最近的恒星。以旅行者速度要 7.5 万年。', tag: '10^13.6 km' },
        { name: '银河系直径', emoji: '🌌', km: 9.46e17, desc: '约 10 万光年,包含上千亿颗恒星。太阳距银心约 2.6 万光年。', tag: '10^18 km' },
        { name: '可观测宇宙', emoji: '🌌', km: 8.8e23, desc: '直径约 930 亿光年。这不是宇宙的全部,只是光来得及到达我们的范围。', tag: '10^24 km' }
      ];
      var idx = 0, timer = null;
      var card = el('div', 'dm-panel');
      card.style.cssText = 'min-height:150px';
      var slider = el('input', '');
      slider.type = 'range';
      slider.min = '0'; slider.max = String(STOPS.length - 1); slider.value = '0';
      slider.style.cssText = 'width:100%;accent-color:#818cf8;cursor:pointer;margin:6px 0 4px';
      var ticks = el('div', 'dm-legend', STOPS.map(function (s) { return '<span class="lg">' + s.emoji + ' ' + s.name + '</span>'; }).join(''));
      var log = logArea();
      function lightTime(km) {
        var s = km / C;
        if (s < 60) return s.toFixed(2) + ' 秒';
        if (s < 3600) return (s / 60).toFixed(1) + ' 分钟';
        if (s < 86400) return (s / 3600).toFixed(1) + ' 小时';
        if (s < 31557600) return (s / 86400).toFixed(1) + ' 天';
        var y = s / 31557600;
        return y >= 10000 ? (y / 10000).toFixed(1) + ' 万年' : Math.round(y).toLocaleString() + ' 年';
      }
      function render() {
        var s = STOPS[idx];
        card.innerHTML = '<div class="dm-panel-title">当前尺度 · ' + s.tag + '</div>' +
          '<div style="display:flex;gap:16px;align-items:flex-start">' +
          '<div style="font-size:38px;line-height:1">' + s.emoji + '</div>' +
          '<div style="flex:1"><div style="font-size:17px;font-weight:800;color:#e8eef7">' + s.name + '</div>' +
          '<div style="font-size:12px;color:#7dd3fc;font-family:var(--font-mono);margin:4px 0 8px">距离 ' + fmtKm(s.km) + ' · 光行时 ' + lightTime(s.km) + '</div>' +
          '<p style="font-size:13px;line-height:1.85;color:#9fb0c8;margin:0">' + s.desc + '</p></div></div>';
        slider.value = String(idx);
        dlog(log, '跳到 <b>' + s.name + '</b>(光行时 ' + lightTime(s.km) + ')', 'l-info');
      }
      function fmtKm(km) {
        if (km < 1e4) return km + ' km';
        if (km < 1e8) return (km / 1e4).toFixed(1) + ' 万 km';
        if (km < 1e12) return (km / 1.496e8).toFixed(1) + ' AU';
        return (km / 9.46e12).toFixed(2) + ' 光年';
      }
      slider.addEventListener('input', function () { idx = +slider.value; render(); });
      var bar = el('div', 'dm-toolbar');
      bar.appendChild(btn('← 上一站', function () { idx = Math.max(0, idx - 1); render(); }, true));
      bar.appendChild(btn('下一站 →', function () { idx = Math.min(STOPS.length - 1, idx + 1); render(); }));
      bar.appendChild(btn('▶ 自动漫游', function () {
        if (timer) return;
        timer = setInterval(function () {
          idx = (idx + 1) % STOPS.length;
          render();
          if (idx === STOPS.length - 1) { clearInterval(timer); timer = null; }
        }, 1600);
      }));
      bar.appendChild(btn('↺ 回到地球', function () { idx = 0; render(); }, true));
      body.appendChild(bar);
      body.appendChild(card);
      body.appendChild(slider);
      body.appendChild(ticks);
      body.appendChild(log);
      render();
      dlog(log, '提示:对数尺度下每 2 格 = 100 倍;你熟悉的"公里"很快就不够用了。', 'l-hl');
    }
  };

  /* ═══════════ 2. 航行时间计算器 ═══════════ */
  D['voyage-calc'] = {
    title: '航行时间计算器:目的地 × 速度 = ?',
    subtitle: '从月球到比邻星,看看不同速度要飞多久',
    icon: 'play',
    mount: function (body) {
      var DESTS = [
        { name: '月球', km: 384400, note: '3 天(阿波罗)' },
        { name: '火星(最近)', km: 5.46e7, note: '6~9 个月' },
        { name: '木卫二', km: 6.28e8, note: '约 6 年(无人)' },
        { name: '比邻星 b', km: 4.01e13, note: '4.24 光年' },
        { name: 'TRAPPIST-1', km: 3.85e14, note: '40.7 光年' },
        { name: '银河系中心', km: 2.46e17, note: '2.6 万光年' }
      ];
      var SPEEDS = [
        { name: '旅行者 17 km/s', v: 17 },
        { name: '帕克峰值 192 km/s', v: 192 },
        { name: '0.01c 核聚变设想', v: 2998 },
        { name: '0.1c', v: 29979 },
        { name: '0.2c 光帆(无人)', v: 59959 }
      ];
      var C = 299792.458;
      var dest = DESTS[3], speed = SPEEDS[0];
      var log = logArea();
      function human(sec) {
        var d = sec / 86400;
        if (d < 1) return (sec / 3600).toFixed(1) + ' 小时';
        if (d < 365) return d.toFixed(1) + ' 天';
        var y = d / 365.25;
        if (y < 1e4) return Math.round(y).toLocaleString() + ' 年';
        return (y / 1e4).toFixed(1) + ' 万年';
      }
      function makeSelect(options, currentName, onChange) {
        var sel = document.createElement('select');
        sel.className = 'voyage-select';
        options.forEach(function (o) {
          var op = document.createElement('option');
          op.value = o.name; op.textContent = o.name;
          sel.appendChild(op);
        });
        sel.value = currentName;
        sel.addEventListener('change', function () {
          onChange(options.filter(function (o) { return o.name === sel.value; })[0]);
        });
        return sel;
      }
      var controls = el('div', 'voyage-controls');
      var dField = el('label', 'voyage-field');
      dField.appendChild(el('span', 'voyage-label', '目的地'));
      dField.appendChild(makeSelect(DESTS, dest.name, function (o) { dest = o; render(); }));
      var sField = el('label', 'voyage-field');
      sField.appendChild(el('span', 'voyage-label', '速度(相对太阳/地球)'));
      sField.appendChild(makeSelect(SPEEDS, speed.name, function (o) { speed = o; render(); }));
      controls.appendChild(dField);
      controls.appendChild(sField);
      var result = el('div', 'voyage-result');
      function render() {
        var sec = dest.km / speed.v;
        var years = sec / 31557600;
        var verdict = years < 5 ? '在人类耐心范围内 ✅' : years < 80 ? '接近一生,载人极难 ⚠️' : years < 10000 ? '远超寿命 ❌' : '以文明尺度计 💀';
        result.innerHTML = '<div class="voyage-result-label">预计航行时间</div>' +
          '<div class="voyage-big">' + human(sec) + '</div>' +
          '<div class="voyage-verdict">' + verdict + '</div>' +
          '<div class="voyage-meta">' + dest.note + ' · 光走这段只要 ' + human(dest.km / C) + '</div>';
        dlog(log, dest.name + ' @ ' + speed.name + ' → <b>' + human(sec) + '</b>', 'l-hl');
      }
      body.appendChild(controls);
      body.appendChild(result);
      body.appendChild(log);
      render();
      dlog(log, '把目的地和速度各换一次,观察时间如何跨过"天—年—万年"三个量级。', 'l-info');
    }
  };
})();
