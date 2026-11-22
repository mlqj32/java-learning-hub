(function () {
  'use strict';
  var U = window.HUB_LAB_UI, live = new Set();
  var guides = {
    'concat-bench': ['修改拼接次数，再比较累计复制量。', '观察 n 翻倍后两种方法的工作量如何增长；这里不测量 JVM 耗时。'],
    'sort-visual': ['输入重复值，分别选择四种算法，点击下一步。', '黄色比较、粉色写入；对照 key、pivot 和原始编号，回退核对每次变化。'],
    'hashmap-put': ['先插入几个 key，再自动演示扩容。', '观察桶索引、链和容量；小容量与简化 hash 便于理解，不是完整 HashMap 实现。'],
    'thread-life': ['按操作按钮触发状态迁移。', '观察箭头与日志，区分 BLOCKED、WAITING 和 TIMED_WAITING；没有启动真实线程。'],
    'prodcons': ['启动生产与消费，再改变速度或暂停一方。', '观察缓冲区满/空时的等待；动画调度不代表真实线程时序。'],
    'threadpool': ['逐个提交，再压满线程池。', '按核心线程→队列→额外线程→拒绝观察任务去向；任务耗时为模型设定。'],
    'classload': ['按加载步骤推进，再观察双亲委派。', '先看父加载器，失败才由子加载器尝试；不是真实类加载日志。'],
    'jvm-memory': ['分配对象并观察方法调用，再触发回收。', '区分栈帧、堆对象与元数据；内存大小及存活规则经过简化。'],
    'gc-demo': ['分配对象后触发 GC，对比回收前后。', '观察存活对象移动与年龄；不是某个收集器的完整实现。'],
    'bptree': ['输入键并查找，沿高亮节点走到叶子。', '核对每次范围选择；树阶数与页结构用于教学。'],
    'tx-isolation': ['切换隔离级别，推进两个事务的操作。', '记录每次读到的值；固定时序说明特定异常，不代表所有 SQL 情况。'],
    'mvcc': ['依次更新版本，再从不同快照读取。', '沿版本链核对可见性；规则与事务字段是教学简化。'],
    'cache-3': ['切换缓存故障，再观察保护措施前后。', '比较请求去向与数据库压力；动画请求率不是性能测试。'],
    'redis-lock': ['让多个客户端竞争，再开关锁策略。', '观察持锁者与被拒请求；租约、网络与故障需要真实服务另测。'],
    'mq-peak': ['制造流量高峰，观察入队与消费。', '对照队列积压和处理速度；并未连接真实消息中间件。'],
    'aop-proxy': ['分别发起代理调用与内部调用。', '观察通知是否经过代理；这是调用链模型，不启动 Spring。'],
    'singleton': ['切换安全策略，再触发竞争。', '比较实例数与步骤；固定竞争时序用于复现问题。'],
    'tx-rollback': ['选择异常及捕获方式，再提交业务操作。', '观察事务边界与数据变化；没有真实数据库事务。'],
    'memory-scan': ['扫描 925 → 花掉 25 → 扫描 900 → 核对唯一候选。', '后续扫描只过滤上次候选；唯一命中仍需验证，网页只操作虚拟内存。'],
    'esp-principle': ['开关覆盖层，再打开证据提示。', '比较数据与可见画面；截图是否包含覆盖层取决于捕获方式，证据不自动等于处罚。'],
    'apk-unpack': ['逐步推进解包与重建，再检查签名。', '这是工具流程说明；本章顶部实验可注入跳过签名/签名后修改的故障。'],
    'bytecode': ['修改参数，再逐条执行操作数栈指令。', '对照局部变量、栈和返回值；只执行页面注明的固定样本。'],
    'http-flow': ['单步查看一次访问，再自动播放。', '时间均为设定样例，不能据此判断真实请求瓶颈。'],
    'process-schedule': ['切换 RR 与 FCFS，观察同一组任务。', '核对到达、完成、周转与等待时间；时间片切换开销设为零。'],
    'bst-visual': ['插入不同键，再查找存在/不存在的键。', '沿左右分支核对比较次数；普通 BST 在有序输入下可能退化为链。'],
    'scam-quiz': ['先选自己的判断，再查看解释。', '依据授权、资金流与证据判断；答题不是运行恶意样本。'],
    'pe-explorer': ['依次选择文件头、节与目录。', '图中是固定布局说明；本章免环境实验能实际读取十六进制字段。'],
    'model-picker': ['调整任务约束并比较建议。', '观察约束如何改变选择；建议不是模型能力或成本的实测排名。'],
    'qubit-bloch': ['拖动 θ 与 φ,或点 |0⟩、|1⟩、|+⟩、|−⟩ 预设。', '观察概率幅、测量概率和 Bloch 坐标;φ 不改变计算基测量概率,但会改变干涉。'],
    'grover-amp': ['切换 N,拖动迭代次数,或点“跳到最佳”。', '目标概率按 sin²((2k+1)θ) 起伏;最佳迭代约 (π/4)√N,过头会下降。']
  };
  function scheduler(host) {
    var scope = host._demoScope;
    return function (fn, ms) {
      if (!scope || scope.dead) return 0;
      var id = window.setTimeout(function () { scope.timers.delete(id); if (!scope.dead && host.isConnected) fn(); }, ms);
      scope.timers.add(id); return id;
    };
  }
  function sleepFor(host, ms) {
    return new Promise(function (resolve) {
      var scope = host._demoScope;
      if (!scope || scope.dead) { resolve(false); return; }
      var cancel = function () { resolve(false); };
      scope.cancelers.add(cancel);
      scheduler(host)(function () { scope.cancelers.delete(cancel); resolve(true); }, ms);
    });
  }
  function mount(host, name) {
    var demo = window.DEMOS[name]; if (!demo) throw Error('未注册演示 ' + name);
    var stopCurrent = null, dead = false;
    var guide = U.el('details', 'demo-guide'), summary = U.el('summary', '', '怎么操作 · 观察什么'); guide.appendChild(summary);
    (guides[name] || ['逐步操作并核对状态。', '教学模型；不代表任意外部环境。']).forEach(function (s) { guide.appendChild(U.el('p', '', s)); }); guide.open = true; host.appendChild(guide);
    var reset = U.button('↺ 重新开始此演示', load); reset.classList.add('demo-reset'); host.appendChild(reset);
    var body = U.el('div', 'demo-instance'); host.appendChild(body);
    body.addEventListener('click', function (event) {
      var target = event.target.closest('button');
      if (target && /^\s*↺/.test(target.textContent) && !/清空/.test(target.textContent)) { event.preventDefault(); event.stopImmediatePropagation(); load(); }
    }, true);
    function load() {
      if (dead) return; if (stopCurrent) stopCurrent(); body.replaceChildren();
      var scope = { dead: false, timers: new Set(), cancelers: new Set() }; body._demoScope = scope;
      var cleanup = demo.mount(body, {});
      body.querySelectorAll('.dm-switch').forEach(function (node) { node.tabIndex = 0; node.setAttribute('role', 'switch'); function sync() { node.setAttribute('aria-checked', String(node.classList.contains('on'))); } sync(); node.addEventListener('click', sync); node.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); node.click(); } }); });
      stopCurrent = function () { scope.dead = true; scope.timers.forEach(window.clearTimeout); scope.timers.clear(); scope.cancelers.forEach(function (fn) { fn(); }); scope.cancelers.clear(); if (typeof cleanup === 'function') cleanup(); };
    }
    load();
    function stop() { if (dead) return; dead = true; if (stopCurrent) stopCurrent(); live.delete(stop); }
    live.add(stop); return stop;
  }
  function dispose() { Array.from(live).forEach(function (stop) { stop(); }); }
  window.HUB_DEMO_SYSTEM = { mount: mount, dispose: dispose, scheduler: scheduler, sleepFor: sleepFor, guides: guides };
  window.DUTIL.sleepFor = sleepFor;
})();
