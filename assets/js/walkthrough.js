(function () {
  'use strict';
  var U = window.HUB_LAB_UI, active = new Set();
  function classify(lang, source) {
    if (!lang || lang.toLowerCase() === 'text') return '文本展示';
    lang = window.HUB_RUNNER.language(lang);
    if (lang === 'java' && window.HUB_SIM.detect(source)) return '图形窗口模型';
    if (lang === 'java' && /javax\.swing|javafx\.|java\.awt\.|javax\.microedition/.test(source)) return '图形源码阅读';
    if (window.HUB_RUNNER.boundaryType(lang, source) === 'source') return 'JDK 源码阅读';
    if (window.HUB_RUNNER.boundaryType(lang, source) === 'framework') return '框架集成阅读';
    if (['javascript', 'html', 'svg'].indexOf(lang) >= 0) return '浏览器执行';
    if (['java', 'python', 'sql'].indexOf(lang) >= 0) return '网站虚拟运行';
    return '结构阅读';
  }
  function explain(line, lang, source, index) {
    return window.HUB_LINES.describe(source || line, lang, index || 0).text;
  }
  function mount(root, module, chapter) {
    root.querySelectorAll('.code-wrap[data-language]').forEach(function (wrap, blockIndex) {
      if (!wrap.dataset.language || wrap.dataset.language.toLowerCase() === 'text') return;
      if (wrap.dataset.walkMounted) return; wrap.dataset.walkMounted = '1'; wrap.id = wrap.id || 'example-' + (blockIndex + 1);
      var rows = Array.from(wrap.querySelectorAll('tr')), source = rows.map(function (r) { return r.querySelector('.cl').textContent; }).join('\n'), lang = wrap.dataset.language;
      var category = classify(lang, source), panel = null;
      wrap.dataset.observation = category;
      var badge = U.el('span', 'code-mode', category); badge.title = '可用观察方式；片段依赖与运行边界见实验区'; wrap.querySelector('.code-head').appendChild(badge);
      function closeReader(restoreFocus) {
        if (!panel) return;
        wrap.classList.remove('is-reading');
        rows.forEach(function (r) { r.classList.remove('walk-current'); r.removeAttribute('role'); r.removeAttribute('tabindex'); r.removeAttribute('aria-label'); r.removeAttribute('aria-pressed'); r.onclick = null; r.onkeydown = null; });
        wrap.removeEventListener('keydown', onReaderKeydown);
        panel.remove(); panel = null; active.delete(closeReader);
        trigger.textContent = '逐行阅读'; trigger.setAttribute('aria-expanded', 'false');
        if (restoreFocus === true && trigger.isConnected) trigger.focus({ preventScroll: true });
      }
      function onReaderKeydown(event) {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeReader(true); }
      }
      var trigger = U.button('逐行阅读', function () {
        if (panel) { closeReader(false); return; }
        panel = U.el('section', 'walkthrough-panel'); panel.id = wrap.id + '-walkthrough'; panel.setAttribute('aria-label', '源码逐行释义'); wrap.appendChild(panel); wrap.classList.add('is-reading'); trigger.textContent = '收起逐行阅读'; trigger.setAttribute('aria-expanded', 'true');
        var heading = U.el('div', 'walk-header'), close = U.button('关闭阅读 ×', function () { closeReader(true); });
        close.classList.add('walk-close'); heading.appendChild(U.el('strong', 'walk-title', '逐行阅读')); heading.appendChild(close); panel.appendChild(heading);
        panel.appendChild(U.el('p', 'walk-help', '点击源码中的任意一行，或使用下方按钮查看解释；按 Esc 或“关闭阅读”收起。'));
        var controls = U.el('div', 'lab-controls'), position = U.el('span', 'lab-status'), meaning = U.el('section', 'walk-meaning'), title = U.el('strong', 'walk-meaning-title'), selectedSource = U.el('code', 'walk-meaning-source'), note = U.el('p', 'walk-line-meaning'), index = 0, scrub = U.el('input');
        meaning.setAttribute('aria-live', 'polite'); meaning.appendChild(title); meaning.appendChild(selectedSource); meaning.appendChild(note);
        scrub.type = 'range'; scrub.min = '0'; scrub.max = String(rows.length - 1); scrub.value = '0'; scrub.setAttribute('aria-label', '源码阅读行'); scrub.oninput = function () { index = Number(scrub.value); draw(); };
        function draw() {
          rows.forEach(function (r, i) { r.classList.toggle('walk-current', i === index); r.setAttribute('aria-pressed', String(i === index)); });
          scrub.value = String(index); position.textContent = '第 ' + (index + 1) + ' / ' + rows.length + ' 行';
          var description = window.HUB_LINES.describe(source, lang, index);
          title.textContent = '第 ' + (index + 1) + ' 行 · ' + description.title;
          selectedSource.textContent = rows[index].querySelector('.cl').textContent;
          note.textContent = description.text; previous.disabled = index === 0; next.disabled = index === rows.length - 1;
          var body = wrap.querySelector('.code-body'), offset = rows[index].getBoundingClientRect().top - body.getBoundingClientRect().top;
          if (offset < 0 || offset + rows[index].offsetHeight > body.clientHeight) body.scrollTop += offset - body.clientHeight / 2;
        }
        var previous = U.button('上一行', function () { index = Math.max(0, index - 1); draw(); }), next = U.button('下一行', function () { index = Math.min(rows.length - 1, index + 1); draw(); });
        controls.appendChild(previous); controls.appendChild(next); controls.appendChild(U.button('从头阅读', function () { index = 0; draw(); })); controls.appendChild(position);
        panel.appendChild(controls); panel.appendChild(scrub); panel.appendChild(meaning);
        panel.appendChild(U.el('p', 'walk-help', window.HUB_RUNNER.boundary(lang, source) ? '这里解释片段的源码含义；请运行同节的完整示例验证行为。' : '这里解释源码含义；执行输出、循环过程和变量值请使用本段代码的运行入口。'));
        rows.forEach(function (row, i) {
          row.tabIndex = 0; row.setAttribute('role', 'button'); row.setAttribute('aria-label', '解释第 ' + (i + 1) + ' 行');
          row.onclick = function () { index = i; draw(); };
          row.onkeydown = function (event) { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); index = i; draw(); } };
        });
        wrap.addEventListener('keydown', onReaderKeydown); active.add(closeReader); draw();
      });
      trigger.classList.add('code-walk'); trigger.setAttribute('aria-expanded', 'false'); trigger.setAttribute('aria-controls', wrap.id + '-walkthrough'); wrap.querySelector('.code-head').insertBefore(trigger, wrap.querySelector('[data-copy]'));
    });
  }
  function dispose() { active.forEach(function (stop) { stop(); }); active.clear(); }
  window.HUB_WALK = { mount: mount, dispose: dispose, classify: classify, explain: explain };
})();
