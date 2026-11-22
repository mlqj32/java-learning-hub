(function () {
  'use strict';
  function el(tag, cls, text) { var node = document.createElement(tag); if (cls) node.className = cls; if (text !== undefined) node.textContent = text; return node; }
  function button(text, fn) { var b = el('button', 'lab-button', text); b.type = 'button'; b.onclick = fn; return b; }
  function field(parent, label, value, multiline) { var wrap = el('label', 'lab-field', label), input = el(multiline ? 'textarea' : 'input'); input.value = value; if (multiline) input.rows = 4; input.setAttribute('aria-label', label); input.spellcheck = false; wrap.appendChild(input); parent.appendChild(wrap); return input; }
  function stepper(host, model) {
    var index = 0, timer = null;
    var controls = el('div', 'lab-controls'), status = el('div', 'lab-status'), note = el('p', 'lab-explanation'), panes = el('div', 'lab-panes'), code = el('ol', 'lab-code'), state = el('dl', 'lab-state');
    status.setAttribute('role', 'status'); note.setAttribute('aria-live', 'polite');
    model.code.forEach(function (line) { code.appendChild(el('li', '', line)); });
    panes.appendChild(code); panes.appendChild(state);
    var play = button('▶ 自动播放', function () { if (timer) { pause(); return; } if (index === model.frames.length - 1) { index = 0; draw(); } timer = setInterval(function () { var chapter = host.closest('.chapter-lab'); if (!host.isConnected || chapter && !chapter.open) { pause(); return; } if (index < model.frames.length - 1) { index++; draw(); } else pause(); }, Number(speed.value)); play.textContent = '⏸ 暂停'; });
    function pause() { if (timer) clearInterval(timer); timer = null; play.textContent = '▶ 自动播放'; }
    controls.appendChild(button('↶ 上一步', function () { pause(); index = Math.max(0, index - 1); draw(); })); controls.appendChild(button('下一步 ↷', function () { pause(); index = Math.min(model.frames.length - 1, index + 1); draw(); })); controls.appendChild(play); controls.appendChild(button('回到开始', function () { pause(); index = 0; draw(); }));
    var speedLabel = el('label', 'lab-speed', '每步间隔 '), speed = el('select'); [[1000, '1 秒'], [500, '0.5 秒'], [1800, '1.8 秒']].forEach(function (item) { var option = el('option', '', item[1]); option.value = item[0]; speed.appendChild(option); }); speed.onchange = pause; speedLabel.appendChild(speed); controls.appendChild(speedLabel);
    var scrubLabel = el('label', 'lab-scrubber', '拖动查看任意步骤'), scrub = el('input'); scrub.type = 'range'; scrub.min = '0'; scrub.max = String(model.frames.length - 1); scrub.value = '0'; scrub.setAttribute('aria-label', '执行步骤'); scrub.oninput = function () { pause(); index = Number(scrub.value); draw(); }; scrubLabel.appendChild(scrub);
    var machine = el('div', 'lab-machine');
    host.appendChild(controls); host.appendChild(status); host.appendChild(scrubLabel); host.appendChild(machine); host.appendChild(panes); host.appendChild(note);
    var bytes;
    if (model.bytes) { bytes = el('div', 'lab-byte-grid'); model.bytes.slice(0, 256).forEach(function (b, i) { var cell = el('span', '', b.toString(16).padStart(2, '0')); cell.title = '偏移 ' + i; bytes.appendChild(cell); }); host.appendChild(bytes); if (model.bytes.length > 256) host.appendChild(el('p', 'lab-note', '字节格只显示前 256 字节；字段仍按完整输入检查。')); }
    function draw() {
      var frame = model.frames[index]; status.textContent = '步骤 ' + index + ' / ' + (model.frames.length - 1) + (index === model.frames.length - 1 ? ' · 本次推演结束' : ''); scrub.value = String(index); note.textContent = frame.note;
      Array.from(code.children).forEach(function (line, i) { line.classList.toggle('is-current', i === frame.line); }); state.replaceChildren(); Object.keys(frame.state).forEach(function (key) { state.appendChild(el('dt', '', key)); state.appendChild(el('dd', '', String(frame.state[key]))); });
      machine.replaceChildren();
      if (frame.state['操作数栈'] !== undefined) {
        var local = el('div', 'lab-slot'), stack = el('div', 'lab-stack'), result = el('div', 'lab-slot');
        local.appendChild(el('span', 'lab-slot-label', '局部变量槽 0')); local.appendChild(el('strong', '', String(frame.state['局部变量 0'])));
        stack.appendChild(el('span', 'lab-slot-label', '操作数栈 · 栈顶在右')); var values = JSON.parse(frame.state['操作数栈']);
        if (!values.length) stack.appendChild(el('span', 'lab-stack-empty', '空栈')); values.forEach(function (value) { stack.appendChild(el('strong', 'lab-stack-value', String(value))); });
        result.appendChild(el('span', 'lab-slot-label', '返回值')); result.appendChild(el('strong', '', String(frame.state['返回值'] === undefined ? '等待' : frame.state['返回值'])));
        machine.appendChild(local); machine.appendChild(stack); machine.appendChild(result);
      }
      if (bytes) Array.from(bytes.children).forEach(function (cell, i) { cell.classList.toggle('is-current', !!frame.range && i >= frame.range[0] && i < frame.range[1]); });
      if (index === model.frames.length - 1) pause();
    }
    draw(); return pause;
  }
  function configurable(host, description, setup, build) {
    host.appendChild(el('p', 'lab-note', description));
    var settings = el('div', 'lab-settings'), inputs = setup(settings), actions = el('div', 'lab-controls'), error = el('p', 'lab-error'), stage = el('div', 'lab-stage'), cleanup = null;
    error.setAttribute('role', 'alert'); host.appendChild(settings); host.appendChild(actions); host.appendChild(error); host.appendChild(stage);
    function run() { if (cleanup) cleanup(); cleanup = null; stage.replaceChildren(); error.textContent = ''; try { cleanup = stepper(stage, build(inputs)); } catch (err) { error.textContent = err.message; } }
    actions.appendChild(button('根据输入重新推演', run)); run();
    return function () { if (cleanup) cleanup(); };
  }
  window.HUB_LAB_UI = { el: el, button: button, field: field, stepper: stepper, configurable: configurable };
})();
