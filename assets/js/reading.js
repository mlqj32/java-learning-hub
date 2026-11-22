(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function get(key, fallback) { try { return localStorage.getItem(key) || fallback; } catch (_) { return fallback; } }
  function set(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }
  function fitDiagram(svg) {
    // Keep the authored node geometry. Fit text inside its node; retain full labels in titles.
    svg.querySelectorAll('text').forEach(function (text) {
      if (!text.textContent.trim()) return;
      var original = text.getAttribute('data-full-text') || text.textContent;
      text.setAttribute('data-full-text', original);
      var max = Number(text.getAttribute('data-max-width'));
      if (!max) {
        var tx = Number(text.getAttribute('x')), ty = Number(text.getAttribute('y'));
        var boxes = Array.from(svg.querySelectorAll('rect')).filter(function (r) {
          if (r.closest('defs')) return false;
          var x = Number(r.getAttribute('x')), y = Number(r.getAttribute('y'));
          return tx >= x && tx <= x + Number(r.getAttribute('width')) && ty > y + 3 && ty < y + Number(r.getAttribute('height'));
        }).sort(function (a, b) { return Number(a.getAttribute('width')) - Number(b.getAttribute('width')); });
        if (boxes.length) {
          var box = boxes[0], x = Number(box.getAttribute('x')), w = Number(box.getAttribute('width'));
          max = text.getAttribute('text-anchor') === 'start' ? x + w - tx - 7 : Math.min(tx - x, x + w - tx) * 2 - 12;
        }
      }
      if (max > 12 && text.getComputedTextLength() > max) {
        var font = parseFloat(getComputedStyle(text).fontSize);
        text.style.fontSize = Math.max(9.5, font * max / text.getComputedTextLength()) + 'px';
        var short = original;
        while (text.getComputedTextLength() > max && short.length > 1) {
          short = short.slice(0, -1);
          text.textContent = short + '…';
        }
        var title = document.createElementNS(NS, 'title');
        title.textContent = original;
        text.appendChild(title);
      }
    });
    // Include labels/arrowheads that extend beyond the original viewBox instead of clipping them.
    var vb = svg.viewBox.baseVal;
    var b = svg.getBBox();
    var left = Math.min(vb.x, b.x - 12), top = Math.min(vb.y, b.y - 12);
    var right = Math.max(vb.x + vb.width, b.x + b.width + 12);
    var bottom = Math.max(vb.y + vb.height, b.y + b.height + 12);
    svg.setAttribute('viewBox', [left, top, right - left, bottom - top].join(' '));
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', svg.closest('figure') ? svg.closest('figure').querySelector('.figure-title').textContent : '课程图解');
  }
  function openDiagram(figure, trigger) {
    var dialog = document.createElement('dialog');
    dialog.className = 'diagram-dialog';
    dialog.setAttribute('aria-label', figure.querySelector('.figure-title').textContent);
    dialog.innerHTML = '<div class="diagram-dialog-head"><strong>' + esc(figure.querySelector('.figure-title').textContent) + '</strong><div class="diagram-zoom-controls" role="group" aria-label="图解缩放"><button type="button" class="figure-open" data-zoom="-1" aria-label="缩小图解">−</button><output class="diagram-zoom-level" aria-label="图解缩放比例" aria-live="polite"></output><button type="button" class="figure-open" data-zoom="1" aria-label="放大图解">＋</button><button type="button" class="figure-open" data-readable>清晰阅读</button><button type="button" class="figure-open" data-fit>适应窗口</button></div><button type="button" class="figure-open diagram-dialog-close" data-close autofocus>关闭 ×</button></div><div class="diagram-dialog-body" tabindex="0" role="region" aria-label="可滚动的放大图解"></div><div class="diagram-dialog-help">默认放大文字；滚动或触屏滑动浏览各处。“适应窗口”查看全图，“清晰阅读”恢复字号。按 Esc 返回正文。</div>';
    var original = figure.querySelector('.figure-body svg'), clone = original.cloneNode(true);
    var sourceWidth = original.getBoundingClientRect().width;
    var viewBox = clone.viewBox.baseVal, baseWidth = viewBox.width, baseHeight = viewBox.height;
    var textSizes = Array.from(original.querySelectorAll('text')).filter(function (text) { return text.textContent.trim(); }).map(function (text) { return parseFloat(getComputedStyle(text).fontSize); }).filter(function (size) { return size > 0; });
    var minimumText = textSizes.length ? Math.min.apply(null, textSizes) : 12;
    // Marker ids must be unique when the same SVG is present twice.
    var prefix = 'viewer-' + Date.now() + '-';
    clone.querySelectorAll('[id]').forEach(function (n) {
      var old = n.id;
      clone.querySelectorAll('[marker-end],[marker-start]').forEach(function (line) {
        ['marker-end', 'marker-start'].forEach(function (attr) { if (line.getAttribute(attr) === 'url(#' + old + ')') line.setAttribute(attr, 'url(#' + prefix + old + ')'); });
      });
      n.id = prefix + old;
    });
    var viewport = dialog.querySelector('.diagram-dialog-body');
    viewport.appendChild(clone);
    document.body.appendChild(dialog);
    var size = 0, mode = 'readable', previousOverflow = document.body.style.overflow;
    function available() {
      var style = getComputedStyle(viewport);
      return { width: Math.max(1, viewport.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)), height: Math.max(1, viewport.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)) };
    }
    function readableSize() {
      // Preserve the inline scale, then enlarge it; never reset to SVG authoring pixels.
      return Math.max(sourceWidth * 1.1, original.getBoundingClientRect().width * 1.1, available().width, baseWidth * 16 / minimumText);
    }
    function fitSize() { var space = available(); return Math.min(space.width, space.height * baseWidth / baseHeight); }
    function resize(next, preserveCenter) {
      var before = clone.getBoundingClientRect(), frame = viewport.getBoundingClientRect();
      var centerX = frame.left + viewport.clientLeft + viewport.clientWidth / 2, centerY = frame.top + viewport.clientTop + viewport.clientHeight / 2;
      var x = before.width ? (centerX - before.left) / before.width : 0, y = before.height ? (centerY - before.top) / before.height : 0;
      size = next;
      clone.style.width = size + 'px';
      clone.style.height = (size * baseHeight / baseWidth) + 'px';
      dialog.querySelector('.diagram-zoom-level').textContent = Math.round(size / baseWidth * 100) + '%';
      dialog.querySelector('[data-readable]').setAttribute('aria-pressed', String(mode === 'readable'));
      dialog.querySelector('[data-fit]').setAttribute('aria-pressed', String(mode === 'fit'));
      if (preserveCenter) {
        var after = clone.getBoundingClientRect();
        viewport.scrollLeft += after.left + x * after.width - centerX;
        viewport.scrollTop += after.top + y * after.height - centerY;
      } else { viewport.scrollLeft = 0; viewport.scrollTop = 0; }
    }
    dialog.querySelectorAll('[data-zoom]').forEach(function (button) {
      button.onclick = function () { mode = 'manual'; resize(Math.max(Math.min(baseWidth / 4, fitSize()), Math.min(Math.max(baseWidth * 6, readableSize() * 3), size * (Number(button.dataset.zoom) > 0 ? 1.25 : 0.8))), true); };
    });
    dialog.querySelector('[data-readable]').onclick = function () { mode = 'readable'; resize(readableSize(), false); };
    dialog.querySelector('[data-fit]').onclick = function () { mode = 'fit'; resize(fitSize(), false); };
    function onViewportResize() { if (mode !== 'manual') resize(mode === 'fit' ? fitSize() : readableSize(), false); }
    window.addEventListener('resize', onViewportResize);
    dialog.querySelector('[data-close]').onclick = function () { dialog.close(); };
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', function () { window.removeEventListener('resize', onViewportResize); dialog.remove(); document.body.style.overflow = previousOverflow; if (trigger.isConnected) trigger.focus({ preventScroll: true }); }, { once: true });
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    resize(readableSize(), false);
  }
  function mount(root, toc, module, chapter) {
    var header = root.querySelector('.doc-header');
    if (!header) return;
    var tools = document.createElement('div');
    tools.className = 'reading-tools';
    tools.innerHTML = '<button type="button" data-size="16" aria-label="较小字号">A−</button><button type="button" data-size="17">标准字号</button><button type="button" data-size="19" aria-label="较大字号">A＋</button><button type="button" data-focus aria-pressed="false">专注阅读</button>' +
      '<details><summary>本章目录 · ' + toc.filter(function (t) { return t.level === 2; }).length + ' 个主题</summary><ol class="chapter-toc">' + toc.filter(function (t) { return t.level === 2; }).map(function (t) { return '<li><a href="#' + esc(t.id) + '" data-section="' + esc(t.id) + '">' + esc(t.text) + '</a></li>'; }).join('') + '</ol></details>';
    header.appendChild(tools);
    if (!toc.length) tools.querySelector('details').remove();
    var sections = toc.filter(function (t) { return t.level === 2; });
    if (root.classList.contains('chapter-view') && sections.length) {
      var outline = document.createElement('nav');
      outline.className = 'chapter-outline';
      outline.setAttribute('aria-label', '本章导航');
      outline.innerHTML = '<div class="chapter-outline-title">本章导航</div><ol>' + sections.map(function (t) {
        return '<li><a href="#' + esc(t.id) + '" data-section="' + esc(t.id) + '">' + esc(t.text) + '</a></li>';
      }).join('') + '</ol>';
      root.appendChild(outline);
    }
    function applySize(value) {
      document.documentElement.style.setProperty('--reading-size', value + 'px');
      tools.querySelectorAll('[data-size]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.size === value)); });
    }
    applySize(get('jlf-font-size', window.innerWidth <= 600 ? '16' : '17'));
    tools.querySelectorAll('[data-size]').forEach(function (b) { b.onclick = function () { set('jlf-font-size', b.dataset.size); applySize(b.dataset.size); }; });
    var focus = tools.querySelector('[data-focus]');
    focus.setAttribute('aria-pressed', String(document.body.classList.contains('focus-reading')));
    focus.onclick = function () { focus.setAttribute('aria-pressed', String(document.body.classList.toggle('focus-reading'))); };
    root.querySelectorAll('[data-section]').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); var target = document.getElementById(a.dataset.section); if (target) target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }; });
    if (chapter.practice) {
      var p = chapter.practice, card = document.createElement('section');
      card.className = 'practice-card';
      card.innerHTML = '<div class="practice-eyebrow">LEARN BY DOING · 动手检验</div><h3>合上讲解，自己做一次</h3><p>' + esc(p.task) + '</p><div class="practice-checks">' + p.checks.map(function (text, i) { var key = 'jlf-lab/' + module.id + '/' + chapter.id + '/' + i; return '<label><input type="checkbox" data-lab-key="' + key + '"' + (get(key, '') === '1' ? ' checked' : '') + '><span>' + esc(text) + '</span></label>'; }).join('') + '</div><div class="practice-progress" aria-live="polite"></div><details class="practice-answer"><summary>完成后展开：检查思路与常见误区</summary><p>' + esc(p.answer) + '</p></details>';
      root.querySelector('.ch-pager').before(card);
      function update() { card.querySelector('.practice-progress').textContent = '已自检 ' + card.querySelectorAll('input:checked').length + ' / ' + p.checks.length + ' 项 · 进度保存在此浏览器'; }
      card.querySelectorAll('input').forEach(function (input) { input.onchange = function () { set(input.dataset.labKey, input.checked ? '1' : '0'); update(); }; });
      update();
    }
    var ready = document.fonts ? document.fonts.ready : Promise.resolve();
    ready.then(function () {
      if (!root.isConnected) return;
      root.querySelectorAll('.figure-body svg').forEach(fitDiagram);
    });
    root.querySelectorAll('.figure-open').forEach(function (b) { b.onclick = function () { openDiagram(b.closest('figure'), b); }; });
    root.querySelectorAll('.code-body,.tbl-wrap').forEach(function (el) {
      el.tabIndex = 0;
      el.setAttribute('role', 'region');
      el.setAttribute('aria-label', el.classList.contains('tbl-wrap') ? '可横向滚动的数据表格' : '可横向滚动的代码示例');
    });
  }
  window.HUB_READING = { mount: mount, fitDiagram: fitDiagram };
})();
