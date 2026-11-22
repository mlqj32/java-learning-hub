(function () {
  'use strict';
  var U = window.HUB_LAB_UI;
  var PSEUDO = {
    bubble: ['for end = n-1 .. 1', '比较 a[j] 与 a[j+1]', '若左 > 右，交换二者', '本轮最大值到达 end'],
    selection: ['for i = 0 .. n-1; min = i', '比较 a[j] 与 a[min]', '若更小，更新 min', '交换 a[i] 与 a[min]'],
    insertion: ['key = a[i]，暂存当前元素', '比较 a[j] 与 key', '若更大，把 a[j] 移到 j+1', '把 key 放入空位 j+1'],
    quick: ['选择 a[hi] 为 pivot（Lomuto 分区）', '比较 a[j] <= pivot', '将较小项放到边界 i，i++', '把 pivot 放到 i，递归左右区间']
  };
  function trace(input, kind) {
    if (!Array.isArray(input) || input.length < 2 || input.length > 16 || input.some(function (n) { return !Number.isFinite(n) || Math.abs(n) > 9999; })) throw Error('请输入 2～16 个 -9999～9999 的数字，用逗号分隔。');
    if (!PSEUDO[kind]) throw Error('未知排序算法。');
    var a = input.map(function (v, i) { return { value: v, id: i }; }), frames = [], cmp = 0, swaps = 0, writes = 0;
    function emit(line, note, vars, active, type, pivot) {
      frames.push({ line: line, note: note, state: Object.assign({ '数组': '[' + a.map(function (x) { return x.value; }).join(', ') + ']', '比较次数': cmp, '交换次数': swaps, '写入次数': writes }, vars || {}), array: a.map(function (x) { return { value: x.value, id: x.id }; }), active: active || [], type: type || '', pivot: pivot });
    }
    function swap(i, j) { if (i !== j) { var temp = a[i]; a[i] = a[j]; a[j] = temp; swaps++; writes += 2; } }
    emit(-1, '保留这份输入；切换算法时从同一数组重新开始。');
    var i, j;
    if (kind === 'bubble') {
      for (var end = a.length - 1; end > 0; end--) {
        for (j = 0; j < end; j++) {
          cmp++; emit(1, '比较索引 ' + j + ' 与 ' + (j + 1) + '：' + a[j].value + ' > ' + a[j + 1].value + ' 为 ' + (a[j].value > a[j + 1].value), { j: j, end: end }, [j, j + 1], 'compare');
          if (a[j].value > a[j + 1].value) { swap(j, j + 1); emit(2, '发生一次相邻交换，数组实际改变。', { j: j, end: end }, [j, j + 1], 'write'); }
        }
        emit(3, '本轮最大值已到索引 ' + end + '，后续不再比较这个位置。', { end: end }, [end], 'done');
      }
    } else if (kind === 'selection') {
      for (i = 0; i < a.length; i++) {
        var min = i; emit(0, '从未排序区间选最小值。', { i: i, min: min }, [i]);
        for (j = i + 1; j < a.length; j++) { cmp++; emit(1, '只比较，不交换；当前最小值索引为 ' + min + '。', { i: i, j: j, min: min }, [min, j], 'compare'); if (a[j].value < a[min].value) { min = j; emit(2, '发现更小元素，更新 min 指针；数组尚未改变。', { i: i, j: j, min: min }, [min]); } }
        if (min !== i) { swap(i, min); emit(3, '一轮选完后才交换；相同值的原始顺序可能变化。', { i: i, min: min }, [i, min], 'write'); }
      }
    } else if (kind === 'insertion') {
      for (i = 1; i < a.length; i++) {
        var key = a[i]; j = i - 1; emit(0, '把 ' + key.value + ' 暂存到 key，避免被覆盖。', { i: i, j: j, key: key.value, 'key 原编号': key.id }, [i]);
        while (j >= 0) {
          cmp++; emit(1, '比较 a[' + j + ']=' + a[j].value + ' 与 key=' + key.value, { i: i, j: j, key: key.value }, [j], 'compare');
          if (a[j].value <= key.value) break;
          a[j + 1] = a[j]; writes++; emit(2, '向右复制一个元素；这是移动/写入，不是交换。短暂出现重复槽值，key 仍保存在外面。', { i: i, j: j, key: key.value }, [j + 1], 'write'); j--;
        }
        a[j + 1] = key; writes++; emit(3, '把暂存的 key 写回空位。相等元素不越过彼此，所以此实现稳定。', { i: i, '插入位置': j + 1, key: key.value }, [j + 1], 'write');
      }
    } else {
      (function quick(lo, hi, depth) {
        if (lo >= hi) return;
        var pivot = a[hi].value, edge = lo; emit(0, '当前递归区间 [' + lo + ',' + hi + ']；白框标出 pivot。', { lo: lo, hi: hi, i: edge, pivot: pivot, '递归深度': depth }, [hi], '', hi);
        for (var scan = lo; scan < hi; scan++) {
          cmp++; emit(1, '比较 a[' + scan + ']=' + a[scan].value + ' <= pivot=' + pivot, { lo: lo, hi: hi, i: edge, j: scan, pivot: pivot, '递归深度': depth }, [scan, hi], 'compare', hi);
          if (a[scan].value <= pivot) { swap(edge, scan); emit(2, '归入左侧区间；相同索引无需交换。随后 i 前进。', { i: edge, j: scan, pivot: pivot }, [edge, scan], 'write', hi); edge++; }
        }
        swap(edge, hi); emit(3, 'pivot 就位于 ' + edge + '；接下来只递归处理两侧子区间。', { lo: lo, hi: hi, 'pivot 位置': edge, '递归深度': depth }, [edge, hi], 'write', edge);
        quick(lo, edge - 1, depth + 1); quick(edge + 1, hi, depth + 1);
      })(0, a.length - 1, 1);
    }
    emit(-1, '排序完成。数值下方 # 编号保留原始身份，可用重复值观察稳定性。', { '已排序': '是' }, a.map(function (_, k) { return k; }), 'done');
    return { code: PSEUDO[kind], frames: frames, sorted: a.map(function (x) { return x.value; }), metrics: { comparisons: cmp, swaps: swaps, writes: writes } };
  }
  function inversions(a) { var count = 0; for (var i = 0; i < a.length; i++) for (var j = i + 1; j < a.length; j++) if (a[i] > a[j]) count++; return count; }
  function mount(host) {
    host.appendChild(U.el('p', 'lab-note', '先预测哪两个数会变化，再单步验证。黄色=比较，粉色=写入，绿色=本次完成，白框=pivot。插入排序会暂存 key，移动时数组可短暂重复。柱高表示绝对值，正负与大小请看数值标签。'));
    var settings = U.el('div', 'lab-settings'), input = U.field(settings, '输入数组', '5, 2, 4, 2, 8, 1'), algoLabel = U.el('label', 'lab-field', '算法'), select = U.el('select');
    [['bubble', '冒泡排序'], ['selection', '选择排序'], ['insertion', '插入排序'], ['quick', '快速排序']].forEach(function (item) { var option = U.el('option', '', item[1]); option.value = item[0]; select.appendChild(option); }); algoLabel.appendChild(select); settings.appendChild(algoLabel); host.appendChild(settings);
    var controls = U.el('div', 'lab-controls'), error = U.el('p', 'lab-error'), stage = U.el('div', 'lab-stage'), cleanup = null;
    host.appendChild(controls); host.appendChild(error); host.appendChild(stage);
    function load() {
      if (cleanup) cleanup(); stage.replaceChildren(); error.textContent = '';
      try {
        var values = input.value.split(/[,，\s]+/).filter(Boolean).map(Number), model = trace(values, select.value), board = U.el('div', 'sort-board');
        stage.appendChild(U.el('p', 'lab-note', '输入中的逆序对总数：' + inversions(values) + '（统计所有 i < j 且 a[i] > a[j]，不是只统计相邻下降）。'));
        stage.appendChild(board); var steps = U.el('div'); stage.appendChild(steps); cleanup = U.stepper(steps, model);
        var max = Math.max.apply(null, values.map(Math.abs)) || 1;
        function draw() {
          var index = Number(steps.querySelector('input[type=range]').value), frame = model.frames[index]; board.replaceChildren();
          frame.array.forEach(function (item, i) { var cell = U.el('div', 'sort-cell'); if (frame.active.indexOf(i) >= 0) cell.classList.add('is-' + frame.type); if (frame.pivot === i) cell.classList.add('is-pivot'); cell.appendChild(U.el('span', '', String(item.value))); var bar = U.el('div', 'sort-bar'); bar.style.height = (12 + Math.abs(item.value) / max * 125) + 'px'; cell.appendChild(bar); cell.appendChild(U.el('span', '', '[' + i + '] #' + item.id)); board.appendChild(cell); });
        }
        var observer = new MutationObserver(draw); observer.observe(steps.querySelector('.lab-status'), { childList: true, characterData: true, subtree: true }); var stop = cleanup; cleanup = function () { stop(); observer.disconnect(); }; draw();
      } catch (err) { error.textContent = err.message; }
    }
    controls.appendChild(U.button('使用这份输入', load)); controls.appendChild(U.button('逆序样例', function () { input.value = '8,7,6,5,4,3,2,1'; load(); })); controls.appendChild(U.button('重复值样例', function () { input.value = '3,2,3,1,2'; load(); })); select.onchange = load; load();
    return function () { if (cleanup) cleanup(); };
  }
  window.HUB_SORT = { trace: trace, inversions: inversions };
  window.DEMOS['sort-visual'] = { title: '排序算法执行实验室', subtitle: '同一输入 · 代码同步 · 比较 / 写入分开计数 · 可回退', icon: 'code', mount: mount };
})();
