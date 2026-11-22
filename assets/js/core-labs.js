(function () {
  'use strict';
  var U = window.HUB_LAB_UI, M = window.HUB_MODELS;
  window.DEMOS['concat-bench'] = {
    title: '拼接工作量：逐次复制与可增长缓冲', subtitle: '可计算的工作量模型 · 不伪造 JDK 跑分', icon: 'zap',
    mount: function (host) {
      return U.configurable(host, '假设每次追加 1 个字符，String 物化新结果需要复制全部前缀；缓冲方案按容量翻倍扩容。模型计数不是毫秒，也不保证 JVM 采用此扩容策略。JDK 9+ 通常用 invokedynamic 实现 +；循环反复生成新字符串仍需关注复制成本。', function (settings) { return U.field(settings, '追加次数（1～200）', '12'); }, function (input) {
        var n = Number(input.value); if (!Number.isInteger(n) || n < 1 || n > 200) throw Error('请输入 1～200 的整数。');
        var copies = 0, bufferWork = 0, capacity = 1, frames = [{ line: -1, note: '两种方案都从空串开始。缓冲初始容量设为 1。', state: { '长度': 0, 'String 累计复制': 0, '缓冲累计写入/复制': 0, '缓冲容量': 1 } }];
        for (var i = 1; i <= n; i++) { var grew = false; copies += i; if (i > capacity) { bufferWork += i - 1; capacity *= 2; grew = true; } bufferWork++; frames.push({ line: grew ? 2 : 1, note: '追加第 ' + i + ' 个字符；String 复制 ' + i + ' 个字符。缓冲' + (grew ? '扩容并复制旧前缀，再写入。' : '直接写入空余位置。'), state: { '当前长度': i, 'String 累计复制': copies, '缓冲累计写入/复制': bufferWork, '缓冲容量': capacity, 'String 公式': i + ' × (' + i + '+1) / 2 = ' + copies } }); }
        frames.push({ line: 3, note: 'String 总复制量为 n(n+1)/2，增长为 O(n²)；此翻倍缓冲模型累计工作量为 O(n)。缓冲最终转为字符串还需 O(n) 复制。', state: { '总长度': n, 'String 复制': copies, '缓冲累计工作': bufferWork, '最终物化额外复制': n } });
        return { code: ['String 从空串开始；缓冲容量设为 1', 'String 复制当前完整前缀；缓冲追加 1 个字符', '容量不足：翻倍、复制旧内容、再追加', '比较总工作量；缓冲最后还需物化字符串'], frames: frames };
      });
    }
  };
  window.DEMOS['bytecode'] = {
    title: '字节码执行：看见操作数栈', subtitle: '输入 → iload / imul / iadd → 返回 → 分支', icon: 'code',
    mount: function (host) { return U.configurable(host, '固定样本 score(n)=n*3+1，decision 根据 score >= 10 返回 ok/retry。逐条执行真实 int 运算规则；不是任意 class 文件解释器。试试 2、3、-1、2147483647。', function (settings) { return U.field(settings, '参数 n', '2'); }, function (input) { return M.bytecode(input.value); }); }
  };
})();
