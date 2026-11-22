/* ═══════════════════════════════════════════════════════════
   JAVA 后端修炼场 · 主应用(路由/渲染/搜索/进度/特效)
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ═══════════ 图标库 ═══════════ */
  var ICONS = {
    coffee: '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/><path d="M6 2v3M10 2v3M14 2v3"/>',
    chip: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
    bolt: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
    layers: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
    terminal: '<path d="M4 17l6-6-6-6"/><path d="M12 19h8"/>',
    gem: '<path d="M6 3h12l4 6-10 13L2 9l4-6z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>',
    planet: '<circle cx="12" cy="12" r="6"/><ellipse cx="12" cy="12" rx="10" ry="3.6" transform="rotate(-18 12 12)"/><circle cx="18.5" cy="6.5" r="1.2"/>',
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    map: '<circle cx="12" cy="12" r="10"/><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"/><path d="M2 12h20"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    play: '<path d="M5 3l14 9-14 9V3z"/>',
    spark: '<path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z"/>',
    code: '<path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    zap: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
    rotate: '<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"/><path d="M21 3v5h-5"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3 2.5.5 5 2.24 5 5a4 4 0 0 1-8 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 .5 2.5z"/><path d="M12 2c3 3 6 5.5 6 10a6 6 0 0 1-12 0c0-2.5 1-4.5 2.5-6C10 4.5 11 3.5 12 2z"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'
  };
  function icon(name, size) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"' + (size ? ' style="width:' + size + 'px;height:' + size + 'px"' : '') + '>' + (ICONS[name] || ICONS.code) + '</svg>';
  }
  window.SITE_ICON = icon;

  /* ═══════════ 工具 ═══════════ */
  var $ = function (s) { return document.querySelector(s); };
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  var MOD_ORDER = ['javase', 'engineering', 'javahistory', 'datastructure', 'network', 'os', 'mysql', 'javaweb', 'jvm', 'spring', 'redis', 'mq', 'linux', 'cloud', 'patterns', 'frontier', 'reverse', 'world', 'cosmos'];
  function mod(id) { return window.CONTENT && window.CONTENT[id]; }
  function allMods() { return MOD_ORDER.map(mod).filter(Boolean); }

  /* 进度存储 */
  var store = {
    get: function () {
      try { return JSON.parse(localStorage.getItem('jlf-progress') || '{}'); } catch (e) { return {}; }
    },
    set: function (k, v) {
      var d = this.get(); d[k] = v;
      localStorage.setItem('jlf-progress', JSON.stringify(d));
    },
    has: function (k) { return !!this.get()[k]; },
    count: function () { var d = this.get(), n = 0; for (var k in d) if (d[k]) n++; return n; }
  };
  function chapterKey(m, c) { return m + '/' + c; }

  function totalChapters() {
    var n = 0;
    allMods().forEach(function (m) { n += m.chapters.length; });
    return n;
  }

  /* ═══════════ 顶部导航 ═══════════ */
  function buildTopnav(active) {
    var el = $('#topnav');
    var SHORT = { javase: 'JavaSE', javahistory: 'Java史', datastructure: '数据结构', network: '网络', os: 'OS', javaweb: '原生Web', jvm: 'JVM', spring: 'Spring', cloud: '微服务', mysql: 'MySQL', redis: 'Redis', mq: 'MQ', linux: 'Linux', patterns: '设计模式', frontier: '前沿', engineering: '工程实践', reverse: '逆向', world: '真实世界', cosmos: '宇宙航行' };
    var links = [
      { href: '#/home', label: '首页', key: 'home', ic: 'home' },
      { href: '#/roadmap', label: '学习路线', key: 'roadmap', ic: 'map' }
    ];
    var html = links.map(function (l) {
      return '<a href="' + l.href + '" data-nav class="' + (active === l.key ? 'active' : '') + '">' + l.label + '</a>';
    }).join('');
    allMods().forEach(function (m) {
      html += '<a href="#/m/' + m.id + '" data-nav class="nav-mod' + (active === m.id ? ' active' : '') + '">' + (SHORT[m.id] || m.title) + '</a>';
    });
    var ddItems = '<a href="#/simulations" class="dd-item">模拟实验总览 · 免环境体验</a><a href="#/playground" class="dd-item">运行实验室 · 修改与观察</a><a href="#/atlas" class="dd-item">图解总览 · 放大阅读</a>' + allMods().map(function (m) {
      return '<a href="#/m/' + m.id + '" data-nav class="dd-item" style="--mc:' + m.color + '"><i></i><span>' + m.title + '</span></a>';
    }).join('');
    html += '<div class="nav-dd" id="nav-dd">' +
      '<button class="nav-dd-btn" id="nav-dd-btn" type="button" aria-expanded="false" aria-controls="nav-dd-menu" aria-label="课程模块">' +
      '<svg class="nav-dd-grid" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>' +
      '<span class="nav-dd-label-full">课程模块</span><span class="nav-dd-label-short">模块</span>' +
      '<svg class="nav-dd-chevron" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 9l6 6 6-6"/></svg></button>' +
      '<div class="nav-dd-menu" id="nav-dd-menu">' + ddItems + '</div></div>';
    html += '<a href="#/interview" data-nav class="' + (active === 'interview' ? 'active' : '') + '">面试题库</a>';
    el.innerHTML = html;
  }

  /* ═══════════ 侧边栏 ═══════════ */
  function buildSidebar(m, activeCh) {
    var layout = $('#layout');
    if (!m) {
      layout.classList.add('no-sidebar');
      return;
    }
    layout.classList.remove('no-sidebar');
    document.documentElement.style.setProperty('--mod', m.color);
    $('#sidebar-head').innerHTML =
      '<div class="sb-mod-color">' + m.en + '</div>' +
      '<div class="sb-title">' + m.title + '</div>' +
      '<div class="sb-tagline">' + (m.tagline || '') + '</div>' +
      '<div class="sb-progress"><div class="bar"><div class="fill" id="sb-fill"></div></div><div class="txt" id="sb-txt"></div></div>';
    var done = 0;
    var html = '';
    m.chapters.forEach(function (c, i) {
      var key = chapterKey(m.id, c.id);
      var isDone = store.has(key);
      if (isDone) done++;
      html += '<a class="sb-item' + (c.id === activeCh ? ' active' : '') + (isDone ? ' done' : '') + '" href="#/m/' + m.id + '/' + c.id + '" data-nav>' +
        '<span class="sb-idx">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span>' + c.title + '</span>' +
        '<span class="sb-check">' + icon('check', 15) + '</span></a>';
    });
    $('#sidebar-nav').innerHTML = html;
    var pct = m.chapters.length ? Math.round(done / m.chapters.length * 100) : 0;
    var fill = $('#sb-fill'); if (fill) fill.style.width = pct + '%';
    var txt = $('#sb-txt'); if (txt) txt.textContent = '已完成 ' + done + ' / ' + m.chapters.length + ' 章 · ' + pct + '%';
    $('#sidebar-foot').innerHTML = '<span class="kbd-hint">进度自动保存到本地 · 点击右侧 <kbd>✓</kbd> 标记完成</span>';
  }

  /* ═══════════ 路由 ═══════════ */
  var view = $('#view');
  function route() {
    if (window.HUB_RUNNER) window.HUB_RUNNER.dispose();
    if (window.HUB_REVERSE_LABS) window.HUB_REVERSE_LABS.dispose();
    if (window.HUB_DEMO_SYSTEM) window.HUB_DEMO_SYSTEM.dispose();
    if (window.HUB_WALK) window.HUB_WALK.dispose();
    if (catalogCleanup) { catalogCleanup(); catalogCleanup = null; }
    var hash = location.hash || '#/home';
    var parts = hash.replace(/^#\//, '').split('/');
    window.scrollTo({ top: 0 });
    closeSearch();
    $('#sidebar').classList.remove('open');
    if (parts[0] === 'home' || parts[0] === '') return pageHome();
    if (parts[0] === 'roadmap') return pageRoadmap();
    if (parts[0] === 'atlas') return pageAtlas();
    if (parts[0] === 'playground') return pagePlayground();
    if (parts[0] === 'simulations') return pageSimulations();
    if (parts[0] === 'interview') return pageInterview();
    if (parts[0] === 'm' && mod(parts[1])) {
      var m = mod(parts[1]);
      if (parts[2]) return pageChapter(m, parts[2]);
      return pageModule(m);
    }
    return pageHome();
  }

  /* ═══════════ 首页 ═══════════ */
  var HERO_LINES = [
    'HashMap bucket === null  →  直接放入新节点',
    'REPEATABLE READ  →  MVCC 快照读,不会看到别的事务提交',
    'redis.setnx(lockKey, uuid + \":1\", \"NX\", \"PX\", 30000)',
    'InnoDB: B+ 树叶子节点 = 双向链表,范围查询直线扫描',
    'jstat -gcutil $PID 1000   →  每 1s 输出 GC 统计'
  ];
  var typingIdx = 0, typingChar = 0, typingDir = 1;

  function pageHome() {
    buildTopnav('home');
    buildSidebar(null);
    view.className = 'view';
    var total = totalChapters();
    var demoCount = Object.keys(window.DEMOS || {}).length;
    var iqCount = 0;
    allMods().forEach(function (m) { iqCount += (m.interview || []).length; });

    var heroCode = HERO_LINES[0];
    var html =
      '<section class="hero">' +
      '<div class="hero-grid">' +
      '<div class="hero-left">' +
      '<div class="hero-badge"><span class="pulse-dot"></span>为星薇Star定制的 Java 后端系统学习平台 · 已加载 ' + total + ' 章</div>' +
      '<h1 class="hero-title">把后端八股,<span class="grad-text">炼成真功夫</span></h1>' +
      '<p class="hero-sub">从 <strong>Java 入门与工程工具</strong>出发，走过计算机基础、Web、JVM、Spring、数据库与中间件，再探索设计模式、逆向工程、医疗航天与宇宙航行。<strong>十九大模块，每章都有动手检验</strong>；用代码、图解与交互实验，把概念变成能解释的结果。</p>' +
      '<div class="hero-typing" id="hero-typing"><span class="typing-text"></span><span class="cursor"></span></div>' +
      '<div class="hero-cta">' +
      '<a class="btn-primary" href="#/roadmap" data-nav>' + icon('map') + ' 开始修炼之旅</a>' +
      '<a class="btn-ghost" href="#/interview" data-nav>' + icon('chat') + ' 直接刷面试题</a>' +
      '<button class="btn-ghost" id="btn-continue">' + icon('play') + ' 继续上次学习</button>' +
      '</div>' +
      '</div>' +
      '<div class="hero-code"><div class="code-head"><div class="code-dots"><i></i><i></i><i></i></div><span class="code-lang">Live</span><span class="code-file">backend-core.java</span></div>' +
      '<div class="hero-code-body" id="hero-code-body"></div></div>' +
      '</div>' +
      '<div class="hero-stats">' +
      '<div class="stat-card"><div class="stat-num">' + total + '</div><div class="stat-label">系统章节 CHAPTERS</div></div>' +
      '<div class="stat-card"><div class="stat-num">' + demoCount + '+</div><div class="stat-label">交互演示 DEMOS</div></div>' +
      '<div class="stat-card"><div class="stat-num">' + iqCount + '</div><div class="stat-label">面试真题 QUESTIONS</div></div>' +
      '<div class="stat-card"><div class="stat-num">' + store.count() + '</div><div class="stat-label">我的进度 DONE</div></div>' +
      '</div>' +
      '</section>';

    html += '<section class="sec-head reveal"><div class="sec-kicker">TRAINING MODULES · 修炼模块</div><h2>十九大模块，一步步学会</h2><p>入门 → 工具与计算机基础 → SQL → Web 与框架 → 中间件与工程交付。工程项目按阶段推进；历史、前沿、逆向、真实世界与宇宙航行可按兴趣选修。</p></section>';
    html += '<div class="mod-grid">';
    allMods().forEach(function (m, i) {
      var done = m.chapters.filter(function (c) { return store.has(chapterKey(m.id, c.id)); }).length;
      var pct = Math.round(done / m.chapters.length * 100);
      html += '<a class="mod-card reveal" href="#/m/' + m.id + '" data-nav style="--mc:' + m.color + ';animation-delay:' + (i * 60) + 'ms">' +
        '<div class="mod-top">' +
        '<div class="mod-icon">' + icon(m.icon) + '</div>' +
        '<div><div class="mod-name">' + m.title + '</div><div class="mod-en">' + m.en + '</div></div>' +
        '<svg class="ring mod-ring" viewBox="0 0 52 52"><circle class="ring-bg" cx="26" cy="26" r="22" stroke-width="4"/><circle class="ring-val" cx="26" cy="26" r="22" stroke-width="4" stroke-dasharray="' + (2 * Math.PI * 22).toFixed(1) + '" stroke-dashoffset="' + (2 * Math.PI * 22 * (1 - pct / 100)).toFixed(1) + '"/><text class="ring-txt" x="26" y="30" text-anchor="middle">' + pct + '%</text></svg>' +
        '</div>' +
        '<div class="mod-desc">' + m.description + '</div>' +
        '<div class="mod-foot"><span class="tag">' + m.chapters.length + ' 章</span><span>' + (m.minutes || '') + '</span><span class="go">进入修炼 ' + icon('arrow', 13) + '</span></div>' +
        '</a>';
    });
    html += '</div>';

    html += '<section class="sec-head reveal"><div class="sec-kicker">WHY THIS WORKS · 为什么有效</div><h2>不干讲,只练真功夫</h2></section>';
    html += '<div class="feat-grid">';
    [
      { ic: 'code', t: '预测、运行、再验证', d: '代码示例区分完整实验、源码摘录和示意片段。先预测输出，再在网页虚拟环境运行与调试，把结论变成自己的证据。' },
      { ic: 'zap', t: '交互动画演示', d: 'HashMap 扩容、分代 GC、B+ 树查找、分布式锁竞争…… 亲手点一遍,胜过背十遍。' },
      { ic: 'chat', t: '面试官视角拆解', d: '每个模块配高频面试真题 + 参考答案,按"是什么→为什么→怎么答"组织。' },
      { ic: 'target', t: '为面试定制', d: '结合你的简历(定制系统 / 白板协作 / Framework 开发)标注项目可迁移的加分点。' }
    ].forEach(function (f, i) {
      html += '<div class="feat-card reveal" style="animation-delay:' + (i * 60) + 'ms"><div class="feat-icon">' + icon(f.ic) + '</div><h3>' + f.t + '</h3><p>' + f.d + '</p></div>';
    });
    html += '</div>';

    view.innerHTML = html;
    startHeroTyping();

    var btnC = $('#btn-continue');
    if (btnC) btnC.addEventListener('click', function () {
      var last = localStorage.getItem('jlf-last');
      location.hash = last || '#/roadmap';
    });
  }

  function startHeroTyping() {
    var codeBody = $('#hero-code-body');
    var typEl = $('#hero-typing .typing-text');
    if (!typEl) return;
    var lines = [
      'JVM> java -XX:+PrintGCDetails ForgeApp',
      'MySQL> EXPLAIN SELECT * FROM t WHERE idx_col = 1;',
      'Redis> SET lock:order:1001 "uuid:1" NX PX 30000',
      'Spring> @Transactional(rollbackFor = Exception.class)'
    ];
    var li = 0, ci = 0;
    codeBody.innerHTML = '';
    var spans = lines.map(function (l) {
      var s = document.createElement('span');
      s.className = 'cl';
      codeBody.appendChild(s);
      return s;
    });
    var hl = window.HL;
    function tick() {
      if (!document.contains(codeBody)) return;
      var line = lines[li];
      ci++;
      var partial = lines.map(function (l, k) { return k < li ? l : (k === li ? l.slice(0, ci) : ''); });
      spans.forEach(function (s, k) {
        s.style.opacity = k < li ? 1 : '';
        s.innerHTML = hl(partial[k], 'console') + (k === li ? '<span style="color:#22d3ee">▌</span>' : '');
      });
      if (ci >= line.length) {
        li++; ci = 0;
        if (li >= lines.length) { li = 0; setTimeout(function () { codeBody.innerHTML = ''; spans.forEach(function (s) { s.innerHTML = ''; s.style.opacity = 0; }); }, 1400); }
      }
      typEl.textContent = HERO_LINES[typingIdx].slice(0, typingChar);
      setTimeout(tick, ci === 0 ? 500 : 34);
    }
    tick();
    (function typeLine() {
      if (!document.contains(typEl)) return;
      var cur = HERO_LINES[typingIdx];
      typingChar += typingDir;
      if (typingChar >= cur.length) { typingDir = -1; typingChar = cur.length; setTimeout(typeLine, 2400); return; }
      if (typingChar <= 0) { typingDir = 1; typingIdx = (typingIdx + 1) % HERO_LINES.length; }
      typEl.textContent = HERO_LINES[typingIdx].slice(0, typingChar);
      setTimeout(typeLine, typingDir > 0 ? 42 : 16);
    })();
  }

  /* ═══════════ 模块总览页 ═══════════ */
  function pageModule(m) {
    buildTopnav(m.id);
    buildSidebar(m, null);
    view.className = 'view';
    var html =
      '<section class="mod-hero">' +
      '<div class="mod-hero-inner">' +
      '<div class="mod-icon" style="--mc:' + m.color + ';color:#fff">' + icon(m.icon) + '</div>' +
      '<div><h1>' + m.title + '</h1><div class="en-tag">' + m.en + '</div><div class="desc">' + m.description + '</div></div>' +
      '<div class="ch-count"><div class="n">' + m.chapters.length + '</div><div class="t">CHAPTERS</div></div>' +
      '</div></section>';
    html += '<div class="ch-list">';
    m.chapters.forEach(function (c, i) {
      var key = chapterKey(m.id, c.id);
      var pts = (c.points || []).map(function (p) { return '<span>' + p + '</span>'; }).join('');
      html += '<a class="ch-card reveal' + (store.has(key) ? ' done' : '') + '" href="#/m/' + m.id + '/' + c.id + '" data-nav style="--mc:' + m.color + ';animation-delay:' + (i * 45) + 'ms">' +
        '<div class="ch-idx">' + String(i + 1).padStart(2, '0') + '</div>' +
        '<div class="ch-info"><div class="ch-name">' + c.title + '</div><div class="ch-points">' + pts + '</div></div>' +
        '<div class="ch-side"><span class="ch-min">≈ ' + (c.minutes || 20) + ' min</span><span class="ch-done">' + icon('check', 12) + '</span></div>' +
        '</a>';
    });
    html += '</div>';
    view.innerHTML = html;
  }

  /* ═══════════ 章节页 ═══════════ */
  function pageChapter(m, chId) {
    var idx = -1;
    m.chapters.forEach(function (c, i) { if (c.id === chId) idx = i; });
    if (idx < 0) { location.hash = '#/m/' + m.id; return; }
    var ch = m.chapters[idx];
    buildTopnav(m.id);
    buildSidebar(m, chId);
    view.className = 'view chapter-view';
    localStorage.setItem('jlf-last', '#/m/' + m.id + '/' + chId);

    var r = window.MD.render(ch.content);
    var prev = m.chapters[idx - 1];
    var next = m.chapters[idx + 1];
    var isDone = store.has(chapterKey(m.id, chId));

    var html =
      '<article class="doc">' +
      '<header class="doc-header">' +
      '<div class="crumb"><a href="#/home">首页</a><span class="sep">/</span><a href="#/m/' + m.id + '">' + m.title + '</a><span class="sep">/</span><span>' + ch.title + '</span></div>' +
      '<div class="doc-kicker">' + String(idx + 1).padStart(2, '0') + ' / ' + String(m.chapters.length).padStart(2, '0') + ' · ' + m.en + '</div>' +
      '<h1 class="doc-title">' + ch.title + '</h1>' +
      '<div class="doc-meta">' +
      '<span class="meta-chip">' + icon('clock', 13) + ' 约 ' + (ch.minutes || 20) + ' 分钟</span>' +
      '<span class="meta-chip">' + icon('code', 13) + ' 含代码实践</span>' +
      ((ch.content.match(/demo:/g) || []).length ? '<span class="meta-chip">' + icon('zap', 13) + ' 含交互动画</span>' : '') +
      '<button class="meta-chip" id="btn-done" style="cursor:pointer;' + (isDone ? 'background:rgba(52,211,153,.14);border-color:rgba(52,211,153,.5);color:#34d399' : '') + '">' + icon('check', 13) + ' <span id="btn-done-txt">' + (isDone ? '已完成' : '标记完成') + '</span></button>' +
      '</div></header>' +
      r.html;

    html += '<nav class="ch-pager">';
    if (prev) html += '<a class="prev" href="#/m/' + m.id + '/' + prev.id + '" data-nav><span class="pg-label">← 上一章</span><span class="pg-title">' + prev.title + '</span></a>';
    else html += '<span class="pg-spacer"></span>';
    if (next) html += '<a class="next" href="#/m/' + m.id + '/' + next.id + '" data-nav><span class="pg-label">下一章 →</span><span class="pg-title">' + next.title + '</span></a>';
    else html += '<span class="pg-spacer"></span>';
    html += '</nav></article>';
    view.innerHTML = html;

    mountDemos(view);
    bindCopy(view);
    if (window.HUB_READING) window.HUB_READING.mount(view, r.toc, m, ch);
    if (m.id === 'reverse' && window.HUB_REVERSE_LABS) window.HUB_REVERSE_LABS.attach(view, ch);
    if (window.HUB_RUNNER) window.HUB_RUNNER.mount(view);
    if (window.HUB_WALK) window.HUB_WALK.mount(view, m, ch);

    var btn = $('#btn-done');
    if (btn) btn.addEventListener('click', function () {
      var key = chapterKey(m.id, chId);
      var now = !store.has(key);
      store.set(key, now);
      var t = $('#btn-done-txt');
      if (t) t.textContent = now ? '已完成' : '标记完成';
      btn.style.background = now ? 'rgba(52,211,153,.14)' : '';
      btn.style.borderColor = now ? 'rgba(52,211,153,.5)' : '';
      btn.style.color = now ? '#34d399' : '';
      buildSidebar(m, chId);
    });
  }

  function pagePlayground() {
    buildTopnav('playground');
    buildSidebar(null);
    view.className = 'view';
    if (window.HUB_RUNNER) window.HUB_RUNNER.page(view);
  }

  var catalogCleanup = null;
  function pageSimulations() {
    buildTopnav('simulations'); buildSidebar(null); view.className = 'view';
    view.innerHTML = '<article class="doc"><header class="doc-header"><div class="doc-kicker">BROWSER LABS · 模拟实验总览</div><h1 class="doc-title">点一下，让过程发生。</h1><p>28 个知识演示与逆向 18 章实验入口。排序、字节码、文件头、协议和 XOR 根据输入计算；工具流程是注明边界的教学模型。全部免装目标软件。</p></header><div class="lab-browser"><label class="lab-field">选择一个实验<select aria-label="选择一个实验"></select></label><div class="catalog-stage"></div></div></article>';
    var select = view.querySelector('select'), stage = view.querySelector('.catalog-stage');
    Object.keys(window.DEMOS).forEach(function (name) { var option = document.createElement('option'); option.value = 'demo/' + name; option.textContent = window.DEMOS[name].title; select.appendChild(option); });
    Object.keys(window.HUB_REVERSE_LABS.profiles).forEach(function (id) { var p = window.HUB_REVERSE_LABS.profiles[id], option = document.createElement('option'); option.value = 'reverse/' + id; option.textContent = '逆向 ' + id.slice(1) + ' · ' + p[1]; select.appendChild(option); });
    function load() { if (catalogCleanup) catalogCleanup(); stage.replaceChildren(); var parts = select.value.split('/'); if (parts[0] === 'demo') catalogCleanup = window.HUB_DEMO_SYSTEM.mount(stage, parts[1]); else { var p = window.HUB_REVERSE_LABS.profiles[parts[1]], link = document.createElement('a'); link.href = '#/m/reverse/' + parts[1]; link.textContent = '阅读对应章节 →'; stage.appendChild(link); catalogCleanup = window.HUB_REVERSE_LABS.mountKind(stage, p[0]); } }
    select.onchange = load; select.value = 'demo/sort-visual'; load();
  }

  function pageAtlas() {
    buildTopnav('atlas');
    buildSidebar(null);
    view.className = 'view';
    var names = Object.keys(window.DIAGRAMS || {});
    view.innerHTML = '<article class="doc"><header class="doc-header"><div class="doc-kicker">VISUAL ATLAS · 图解总览</div><h1 class="doc-title">让结构，看得更清楚</h1><p>' + names.length + ' 张课程图解。横向滚动保留细节，点击放大可独立缩放；悬停省略标签查看完整文字。</p></header>' + names.map(function (name) { return '<div class="diagram-mount" data-diagram="' + esc(name) + '"></div>'; }).join('') + '</article>';
    mountDemos(view);
    if (window.HUB_READING) window.HUB_READING.mount(view, [], { id: 'atlas' }, {});
  }

  /* ═══════════ 学习路线 ═══════════ */
  function pageRoadmap() {
    buildTopnav('roadmap');
    buildSidebar(null);
    view.className = 'view';
    var stages = [
      { sc: '#38bdf8', title: '兴趣入口 · 编程与真实世界', tag: '零基础可读', desc: '从心脏起搏器、千年虫与航天事故，走向外星生命探索和文明记忆。15 个网页虚拟实验，把代码与生活连起来。', mod: 'world' },
      { sc: '#818cf8', title: '选修 · 宇宙航行', tag: '科普 · 8 章', desc: '宇宙有多大?旅行者号飞到哪了?第二个宜居星球在哪?载人要走多久?编程能否带我们飞出宇宙?用真实数据与计算代码回答。', mod: 'cosmos' },
      { sc: '#f97316', title: '阶段 01 · 语言根基', tag: '里程碑 01', desc: 'JavaSE 是一切的地基:语法、面向对象、集合源码、并发编程。面试 60% 的问题从这来。', mod: 'javase' },
      { sc: '#eab308', title: '阶段 02 · Java 生态全景', tag: '里程碑 02', desc: 'Java 三十年简史、ME/SE/EE 三兄弟、Java ME 的兴衰、功能机游戏与现代 Java 游戏、Swing/JavaFX 初体验。', mod: 'javahistory' },
      { sc: '#22d3ee', title: '阶段 03 · 数据结构与算法', tag: '里程碑 03', desc: '复杂度分析、线性结构、哈希与树、图、排序与动态规划 —— 手撕代码题的底层语言。', mod: 'datastructure' },
      { sc: '#60a5fa', title: '阶段 04 · 计算机网络', tag: '里程碑 04', desc: '分层模型、HTTP/HTTPS、TCP 握手挥手与拥塞控制、IP 路由、网络排障。后端面试第二高频。', mod: 'network' },
      { sc: '#e879f9', title: '阶段 05 · 操作系统', tag: '里程碑 05', desc: '进程线程、CPU 调度与死锁、虚拟内存与页面置换、文件系统与 IO 模型。', mod: 'os' },
      { sc: '#38bdf8', title: '阶段 06 · 存储之道', tag: '里程碑 06', desc: 'MySQL 索引、事务、MVCC、锁、日志;Redis 数据结构、持久化、缓存三大问题、分布式锁。', mod: 'mysql', mod2: 'redis' },
      { sc: '#8b5cf6', title: '阶段 07 · 原生 JavaWeb', tag: '里程碑 07', desc: 'Servlet 生命周期、请求响应、Cookie/Session、Filter/Listener、JSP 演进、JDBC 与连接池 —— SpringMVC 的前世。', mod: 'javaweb' },
      { sc: '#a78bfa', title: '阶段 08 · 内功心法', tag: '里程碑 08', desc: 'JVM 内存模型、类加载、垃圾回收。理解代码是怎么"跑"起来的,调优与排查的底气都在这。', mod: 'jvm' },
      { sc: '#34d399', title: '阶段 09 · 框架修为', tag: '里程碑 09', desc: 'Spring 全家桶 + SpringBoot 自动配置、启动流程、Starter、部署监控与 3.x 工程化。', mod: 'spring' },
      { sc: '#c026d3', title: '阶段 10 · 微服务与云原生', tag: '里程碑 10', desc: 'Nginx 反向代理与负载均衡、Nacos、OpenFeign、Gateway、Sentinel、分布式事务。', mod: 'cloud' },
      { sc: '#fbbf24', title: '阶段 11 · 中间件', tag: '里程碑 11', desc: '消息队列解耦/削峰/异步,RabbitMQ 与 Kafka 实战,消息不丢不重的架构设计。', mod: 'mq' },
      { sc: '#2dd4bf', title: '阶段 12 · 工程实战', tag: '里程碑 12', desc: 'Linux 常用命令、性能排查、Shell 脚本与部署 —— 服务器是你的主战场。', mod: 'linux' },
      { sc: '#7dd3fc', title: '工程实践 · 从代码到交付', tag: '贯穿主线', desc: 'Git、Maven、调试、测试与订单项目。先学工具,随后随 JavaSE、数据库和 Spring 分阶段完成项目验收。', mod: 'engineering' },
      { sc: '#f472b6', title: '阶段 13 · 内功收束', tag: '里程碑 13', desc: '设计模式六大原则 + 23 种模式,结合 Spring/JDK 源码场景理解,最后冲刺面试题库。', mod: 'patterns', mod2: '_interview' },
      { sc: '#f59e0b', title: '第十四阶段 · 前沿技术', tag: '选修', desc: '区块链原理与 Web3j、AI 编程工具、如何选模型、AI 时代还要不要手搓代码。', mod: 'frontier' },
      { sc: '#a3e635', title: '番外篇 · 逆向工程全解', tag: '选修 · 15 章', desc: '汇编与文件格式、IDA/Ghidra、动态调试、Android 脱壳、Hook、抓包、CTF、恶意分析、社会工程学与反诈。', mod: 'reverse' }
    ];
    var html = '<section class="mod-hero"><div class="mod-hero-inner">' +
      '<div class="mod-icon" style="background:var(--grad);color:#fff">' + icon('map') + '</div>' +
      '<div><h1>学习路线图</h1><div class="en-tag">ROADMAP · 按掌握程度推进</div>' +
      '<div class="desc">从 JavaSE 到设计模式的完整修炼路径。建议顺序学习,每章先理解问题 → 预测结果 → 运行并修改代码 → 完成动手检验。当前进度:<strong style="color:#22d3ee">' + store.count() + ' / ' + totalChapters() + ' 章</strong></div></div>' +
      '</div></section>';
    html += '<div class="roadmap">';
    stages.forEach(function (s, i) {
      var mods = [mod(s.mod), s.mod2 && s.mod2 !== '_interview' ? mod(s.mod2) : null].filter(Boolean);
      html += '<div class="rm-stage reveal" style="--sc:' + s.sc + ';animation-delay:' + (i * 70) + 'ms">' +
        '<div class="rm-node">' + (i + 1) + '</div>' +
        '<div class="rm-stage-head"><span class="rm-stage-title">' + s.title + '</span><span class="rm-stage-tag">' + s.tag + '</span></div>' +
        '<div class="rm-stage-desc">' + s.desc + '</div><div class="rm-items">';
      mods.forEach(function (m) {
        if (!m) return;
        m.chapters.forEach(function (c, k) {
          if (k > 5) return; // 每模块展示前6章入口
          html += '<a class="rm-item" href="#/m/' + m.id + '/' + c.id + '">' + '<span class="dot"></span>' + c.title + '</a>';
        });
        html += '<a class="rm-item" href="#/m/' + m.id + '" style="border-style:dashed"><span class="dot"></span>全部 ' + m.chapters.length + ' 章 →</a>';
      });
      if (s.mod2 === '_interview') {
        html += '<a class="rm-item" href="#/interview" style="border-style:dashed"><span class="dot"></span>面试题库总复习 →</a>';
      }
      html += '</div></div>';
    });
    html += '</div>';
    view.innerHTML = html;
  }

  /* ═══════════ 面试题库 ═══════════ */
  function pageInterview(filterMod) {
    buildTopnav('interview');
    buildSidebar(null);
    view.className = 'view';
    document.documentElement.style.setProperty('--mod', '#c084fc');
    var items = [];
    allMods().forEach(function (m) {
      (m.interview || []).forEach(function (qa, i) {
        items.push({ mod: m, q: qa.q, a: qa.a, key: 'iq/' + m.id + '/' + i });
      });
    });
    var html = '<section class="mod-hero"><div class="mod-hero-inner">' +
      '<div class="mod-icon" style="background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff">' + icon('chat') + '</div>' +
      '<div><h1>面试题库</h1><div class="en-tag">INTERVIEW BANK · ' + items.length + ' 题</div>' +
      '<div class="desc">按模块组织的高频面试真题。先自己答,再展开参考答案对照 —— 答不上的章节,回到对应模块回炉。</div></div>' +
      '</div></section>';
    html += '<div class="iq-filter">';
    html += '<button data-f="all" class="' + (!filterMod ? 'on' : '') + '">全部</button>';
    allMods().forEach(function (m) {
      html += '<button data-f="' + m.id + '" class="' + (filterMod === m.id ? 'on' : '') + '">' + m.title.replace(' 核心', '').replace(' 详解', '') + '</button>';
    });
    html += '</div><div class="iq-list">';
    items.forEach(function (it, i) {
      if (filterMod && it.mod.id !== filterMod) return;
      var mColor = it.mod.color;
      html += '<div class="iq-item" data-mod="' + it.mod.id + '" style="--mc:' + mColor + ';animation-delay:' + Math.min(i * 30, 600) + 'ms">' +
        '<div class="iq-q"><span class="iq-badge">Q' + String(i + 1).padStart(2, '0') + ' · ' + it.mod.en.split(' ')[0] + '</span>' +
        '<div class="iq-qtext">' + it.q + '</div><span class="iq-arrow">' + icon('arrow', 14) + '</span></div>' +
        '<div class="iq-a"><div class="iq-a-inner"><span class="a-label">✦ 参考答案</span>' + window.MD.render(it.a).html + '</div></div>' +
        '</div>';
    });
    html += '</div>';
    view.innerHTML = html;

    view.querySelectorAll('.iq-q').forEach(function (q) {
      q.addEventListener('click', function () {
        var item = q.parentElement;
        var a = item.querySelector('.iq-a');
        var open = item.classList.toggle('open');
        a.style.maxHeight = open ? (a.scrollHeight + 60) + 'px' : '0px';
      });
    });
    view.querySelectorAll('.iq-filter button').forEach(function (b) {
      b.addEventListener('click', function () { pageInterview(b.getAttribute('data-f') === 'all' ? null : b.getAttribute('data-f')); });
    });
  }

  /* ═══════════ 演示挂载 / 复制 / 显现 ═══════════ */
  function mountDemos(root) {
    root.querySelectorAll('.demo-mount').forEach(function (el) {
      var name = el.getAttribute('data-demo');
      var d = window.DEMOS && window.DEMOS[name];
      if (!d) { el.innerHTML = '<div class="callout warn"><div class="callout-icon">' + icon('zap') + '</div><div class="callout-body"><div class="callout-title">演示加载失败</div><p>未找到演示: ' + esc(name) + '</p></div></div>'; return; }
      try {
        el.innerHTML = '<div class="demo-frame"><div class="demo-head"><div class="demo-icon">' + icon(d.icon || 'zap') + '</div><div><div class="demo-title">' + d.title + '</div><div class="demo-sub">' + (d.subtitle || 'INTERACTIVE DEMO') + '</div></div></div><div class="demo-body"></div></div>';
        window.HUB_DEMO_SYSTEM.mount(el.querySelector('.demo-body'), name);
      } catch (e) {
        el.innerHTML = '<p style="color:#fb7185">演示出错: ' + e.message + '</p>';
      }
    });
    root.querySelectorAll('.diagram-mount').forEach(function (el) {
      var name = el.getAttribute('data-diagram');
      var d = window.DIAGRAMS && window.DIAGRAMS[name];
      if (!d) { el.innerHTML = '<div class="callout warn"><div class="callout-icon">' + icon('spark') + '</div><div class="callout-body"><div class="callout-title">图解加载失败</div><p>未找到图解: ' + esc(name) + '</p></div></div>'; return; }
      try {
        var svg = typeof d.svg === 'function' ? d.svg() : d.svg;
        el.innerHTML = '<figure class="figure-frame"><div class="figure-head"><span class="figure-badge">' + icon('spark', 13) + (d.kind === 'uml' ? ' UML · 类图' : ' 图解 · DIAGRAM') + '</span><span class="figure-title">' + esc(d.title) + '</span><button type="button" class="figure-open">放大查看 ↗</button></div><div class="figure-body" tabindex="0" role="region" aria-label="可横向滚动的图解">' + svg + '</div>' + (d.caption ? '<figcaption class="figure-caption">' + d.caption + '</figcaption>' : '') + '</figure>';
      } catch (e) {
        el.innerHTML = '<p style="color:#fb7185">图解出错: ' + e.message + '</p>';
      }
    });
  }

  function bindCopy(root) {
    root.querySelectorAll('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var wrap = btn.closest('.code-wrap');
        var cells = wrap.querySelectorAll('td.cl');
        var text = Array.from(cells).map(function (td) { return td.textContent; }).join('\n');
        // 去掉末尾光标符号(如有)
        text = text.replace(/▌\s*$/, '');
        (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () {
          btn.classList.add('copied'); btn.innerHTML = '✓ 已复制';
          setTimeout(function () { btn.classList.remove('copied'); btn.innerHTML = '复制'; }, 1600);
        }).catch(function () {
          var ta = document.createElement('textarea');
          ta.value = text; document.body.appendChild(ta); ta.select();
          document.execCommand('copy'); ta.remove();
          btn.classList.add('copied'); btn.innerHTML = '✓ 已复制';
          setTimeout(function () { btn.classList.remove('copied'); btn.innerHTML = '复制'; }, 1600);
        });
      });
    });
  }

  function bindReveal() {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  }

  /* ═══════════ 搜索 ═══════════ */
  var searchIndex = [];
  function buildSearchIndex() {
    searchIndex = [];
    allMods().forEach(function (m) {
      m.chapters.forEach(function (c) {
        var text = (c.content || '').replace(/```[^\n]*\n/g, ' ').replace(/```/g, ' ').replace(/[#>*|`\n]/g, ' ');
        if (c.practice) text += ' ' + c.practice.task + ' ' + c.practice.answer;
        searchIndex.push({ mod: m, title: m.title + ' · ' + c.title, href: '#/m/' + m.id + '/' + c.id, text: text });
      });
      (m.interview || []).forEach(function (qa, i) {
        searchIndex.push({ mod: m, title: m.title + ' · 面试题: ' + qa.q, href: '#/interview', text: (qa.a || '').replace(/[#>*`\-\n]/g, ' '), iq: true });
      });
    });
  }
  function openSearch() {
    $('#search-overlay').classList.add('show');
    var inp = $('#search-input');
    inp.value = ''; inp.focus();
    renderSearch('');
  }
  function closeSearch() { $('#search-overlay').classList.remove('show'); }
  function renderSearch(q) {
    var box = $('#search-results');
    q = q.trim().toLowerCase();
    if (!q) {
      var recent = [];
      var last = localStorage.getItem('jlf-last');
      if (last) recent = [{ label: '最近学习', href: last }];
      box.innerHTML = '<div class="sr-group">提示</div><div class="sr-empty">输入关键词检索全部章节 · 支持 Ctrl+K 唤起</div>' +
        (recent.length ? '<div class="sr-group">最近学习</div><div class="sr-item" data-href="' + recent[0].href + '"><span class="sr-title">' + recent[0].href.replace('#/m/', '').replace(/\//, ' · ') + '</span></div>' : '');
      bindSearchItems();
      return;
    }
    var hits = [];
    searchIndex.forEach(function (it) {
      var t = (it.mod.title + ' ' + it.title + ' ' + it.text).toLowerCase();
      var score = 0;
      if (it.title.toLowerCase().indexOf(q) >= 0) score += 10;
      var pos = t.indexOf(q);
      if (pos >= 0) score += 3;
      var words = q.split(/\s+/);
      words.forEach(function (w) { if (w && t.indexOf(w) >= 0) score += 2; });
      if (score > 0) hits.push({ it: it, score: score, pos: pos });
    });
    hits.sort(function (a, b) { return b.score - a.score; });
    if (!hits.length) { box.innerHTML = '<div class="sr-empty">没有找到「' + esc(q) + '」相关内容,换个关键词试试</div>'; return; }
    var html = '<div class="sr-group">找到 ' + hits.length + ' 个结果</div>';
    hits.slice(0, 12).forEach(function (h) {
      var m = h.it.mod;
      var textPos = h.it.text.toLowerCase().indexOf(q);
      var snip = textPos >= 0 ? h.it.text.slice(Math.max(0, textPos - 14), textPos + q.length + 40).replace(/\s+/g, ' ') : h.it.text.slice(0, 60);
      html += '<div class="sr-item" data-href="' + h.it.href + '"><span class="sr-mod" style="--mc:' + m.color + '">' + m.title.replace(' 核心', '').replace(' 详解', '') + '</span><span class="sr-title">' + esc(h.it.title.split(' · ')[1] || h.it.title) + '</span><span class="sr-snippet">' + esc(snip) + '</span></div>';
    });
    box.innerHTML = html;
    bindSearchItems();
  }
  function bindSearchItems() {
    document.querySelectorAll('.sr-item').forEach(function (el) {
      el.addEventListener('click', function () { location.hash = el.getAttribute('data-href'); closeSearch(); });
    });
  }

  /* ═══════════ 粒子背景 ═══════════ */
  function startParticles() {
    var cv = $('#particle-canvas');
    if (!cv) return;
    var ctx = cv.getContext('2d');
    var W, H, pts = [];
    function resize() {
      W = cv.width = window.innerWidth;
      H = cv.height = window.innerHeight;
      var n = Math.min(90, Math.floor(W * H / 22000));
      pts = [];
      for (var i = 0; i < n; i++) {
        pts.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 1.6 + 0.4
        });
      }
    }
    window.addEventListener('resize', resize);
    resize();
    var mouse = { x: -1e4, y: -1e4 };
    window.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });
    (function frame() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        // 鼠标引力
        var dx = mouse.x - p.x, dy = mouse.y - p.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < 22500) { p.x += dx * 0.003; p.y += dy * 0.003; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 7);
        ctx.fillStyle = 'rgba(129,140,248,.65)';
        ctx.fill();
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j];
          var ddx = p.x - q.x, ddy = p.y - q.y;
          var dd = ddx * ddx + ddy * ddy;
          if (dd < 13000) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = 'rgba(99,102,241,' + (0.14 * (1 - dd / 13000)).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(frame);
    })();
  }

  /* ═══════════ 全局绑定 ═══════════ */
  function bindGlobal() {
    window.addEventListener('hashchange', route);
    $('#search-trigger').addEventListener('click', openSearch);
    document.addEventListener('click', function (e) {
      var dd = document.getElementById('nav-dd');
      if (!dd) return;
      if (e.target.closest('#nav-dd-btn')) { $('#nav-dd-btn').setAttribute('aria-expanded', String(dd.classList.toggle('open'))); return; }
      dd.classList.remove('open');
      $('#nav-dd-btn').setAttribute('aria-expanded', 'false');
    });
    $('#search-overlay').addEventListener('click', function (e) { if (e.target === this) closeSearch(); });
    $('#search-input').addEventListener('input', function () { renderSearch(this.value); });
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); }
      if (e.key === 'Escape') {
        closeSearch();
        var dd = $('#nav-dd');
        if (dd && dd.classList.contains('open')) { dd.classList.remove('open'); $('#nav-dd-btn').setAttribute('aria-expanded', 'false'); $('#nav-dd-btn').focus({ preventScroll: true }); }
      }
    });
    $('#menu-toggle').addEventListener('click', function () { $('#sidebar').classList.toggle('open'); });
    window.addEventListener('scroll', function () {
      var st = window.scrollY;
      $('#topbar').classList.toggle('scrolled', st > 10);
      $('#backtop').classList.toggle('show', st > 500);
      var h = document.documentElement.scrollHeight - window.innerHeight;
      $('#read-progress').style.width = (h > 0 ? Math.min(100, st / h * 100) : 0) + '%';
    }, { passive: true });
    $('#backtop').addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  /* ═══════════ 启动 ═══════════ */
  function boot() {
    if (!window.CONTENT) window.CONTENT = {};
    buildSearchIndex();
    bindGlobal();
    startParticles();
    route();
    bindReveal();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.addEventListener('hashchange', function () { setTimeout(bindReveal, 60); });
})();
