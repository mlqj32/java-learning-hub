/* ═══════════════════════════════════════════════════
   交互演示 · 第一批:JavaSE(6) + JVM(3)
   ═══════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.DEMOS = window.DEMOS || {};

  /* ───── 工具函数 ───── */
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function btn(text, fn, ghost) {
    var b = el('button', 'demo-btn' + (ghost ? ' ghost' : ''), text);
    b.addEventListener('click', function (event) {
      var result = fn.call(this, event);
      if (result && typeof result.then === 'function') { b.disabled = true; result.finally(function () { b.disabled = false; }); }
    });
    return b;
  }
  function logArea() { return el('div', 'demo-log'); }
  function log(box, msg, cls) {
    if (!box) return;
    var t = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    var line = el('div', cls ? cls : '', '<span class="l-t">[' + t + ']</span> ' + msg);
    box.appendChild(line);
    box.scrollTop = box.scrollHeight;
  }
  function dlog(box, msg, cls) { log(box, msg, cls); }
  function counters(defs) {
    var wrap = el('div', 'dm-counters');
    var map = {};
    defs.forEach(function (d) {
      var c = el('div', 'dm-counter' + (d.cls ? ' ' + d.cls : ''), '<div class="n">0</div><div class="l">' + d.label + '</div>');
      wrap.appendChild(c);
      map[d.key] = c.querySelector('.n');
    });
    wrap.set = function (key, v) { if (map[key]) map[key].textContent = v; };
    return wrap;
  }
  function tabs(opts, cur, onChange) {
    var w = el('div', 'dm-tabs');
    opts.forEach(function (o) {
      var b = el('button', o === cur ? 'on' : '', o);
      b.addEventListener('click', function () {
        w.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        onChange(o);
      });
      w.appendChild(b);
    });
    return w;
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  window.DUTIL = { el: el, btn: btn, logArea: logArea, log: log, counters: counters, tabs: tabs, sleep: sleep };

  /* ═══════════ HashMap put ═══════════ */
  DEMOS['hashmap-put'] = {
    title: 'HashMap put 全流程模拟',
    subtitle: 'hash 定位 → 链表冲突 → 树化提示 → 扩容 rehash',
    icon: 'layers',
    mount: function (body) {
      var setTimeout = window.HUB_DEMO_SYSTEM.scheduler(body);
      var BUCKETS = 8, THRESHOLD = 6;
      var buckets = [], size = 0, capEl, auto = false, timer = null;
      var grid = el('div'), log = logArea(), counter = counters([{ key: 'size', label: 'size' }, { key: 'resize', label: '扩容次数' }, { key: 'coll', label: '冲突次数' }]);

      function hashOf(key, cap) { return key % cap; }
      function render() {
        grid.innerHTML = '';
        var row = el('div', 'dm-row');
        buckets.forEach(function (chain, bi) {
          var col = el('div', 'dm-col');
          col.style.alignItems = 'center';
          var head = el('div', 'dm-slot', bi);
          if (chain.length) head.classList.add('filled');
          col.appendChild(head);
          chain.forEach(function (n, ni) {
            col.appendChild(el('div', 'dm-arrow', '↓'));
            var node = el('div', 'dm-chip c-cyan', 'K' + n.k + ':' + n.v);
            if (ni === chain.length - 1 && n._new) { node.style.boxShadow = '0 0 16px rgba(34,211,238,.8)'; }
            col.appendChild(node);
          });
          row.appendChild(col);
        });
        grid.appendChild(row);
        counter.set('size', size);
      }
      function put(key, value) {
        var idx = hashOf(key, buckets.length);
        dlog(log, 'put(K' + key + '): hash(' + key + ') & (' + buckets.length + '-1) = <b>' + idx + '</b> → 定位桶 ' + idx, 'l-info');
        var chain = buckets[idx];
        if (!chain.length) {
          chain.push({ k: key, v: value, _new: 1 });
          dlog(log, '桶 ' + idx + ' 为空 → <span class="l-ok">直接放入新节点</span>');
        } else {
          var dup = chain.find(function (n) { return n.k === key; });
          if (dup) { dup.v = value; dup._new = 1; dlog(log, 'hash 相同且 <b>equals 为 true</b>(key 重复)→ 覆盖 value', 'l-hl'); }
          else {
            chain.push({ k: key, v: value, _new: 1 });
            counter._coll = (counter._coll || 0) + 1;
            counter.set('coll', counter._coll);
            dlog(log, 'hash 冲突 → 沿链表 <b>equals 逐一比较</b> → 尾插法追加(1.8 改为尾插,防 1.7 头插死循环)', 'l-hl');
            if (chain.length >= 8) dlog(log, '⚠ 链表长度达到 8 且 table 容量 ≥ 64 才会<b>树化为红黑树</b>,查询 O(n)→O(log n)', 'l-err');
          }
        }
        size++;
        buckets.forEach(function (c) { c.forEach(function (n) { n._new = 0; }); });
        render();
        if (size > THRESHOLD && buckets.length <= 8) resize();
      }
      function resize() {
        dlog(log, 'size(' + size + ') > 阈值(容量×负载因子 = ' + buckets.length + '×0.75)→ <b>resize:容量翻倍至 ' + buckets.length * 2 + '</b>', 'l-err');
        var old = buckets;
        buckets = [];
        for (var i = 0; i < old.length * 2; i++) buckets.push([]);
        old.forEach(function (chain, oi) {
          chain.forEach(function (n) {
            var ni = hashOf(n.k, buckets.length);
            buckets[ni].push(n);
            dlog(log, 'rehash:K' + n.k + ' 从桶 ' + oi + ' → 桶 ' + ni + (ni === oi ? '(低位,留在原位)' : '(高位,移动到 原位置+旧容量)'));
          });
        });
        counter._resizeN = (counter._resizeN || 0) + 1;
        counter.set('resize', counter._resizeN);
        render();
      }
      function reset() {
        buckets = []; size = 0; counter._coll = 0; counter._resizeN = 0;
        for (var i = 0; i < BUCKETS; i++) buckets.push([]);
        counter.set('coll', 0); counter.set('resize', 0);
        log.innerHTML = '';
        dlog(log, '初始化:new HashMap() —— table 懒加载,首次 put 才分配容量 ' + BUCKETS + '(源码里默认 16,这里缩小便于演示)', 'l-info');
        render();
      }
      var bar = el('div', 'dm-toolbar');
      bar.appendChild(btn('➕ 插入随机 key', function () { put(Math.floor(Math.random() * 24), 'v'); }));
      bar.appendChild(btn('🔥 插入冲突 key(同桶)', function () { put(hashOf(Math.floor(Math.random() * 24), buckets.length) + buckets.length * Math.floor(Math.random() * 2), 'v'); }));
      bar.appendChild(btn('▶ 自动演示', function () {
        if (auto) return; auto = true;
        (function next() {
          if (!auto || size > 15) { auto = false; return; }
          put(Math.floor(Math.random() * 24), 'v');
          timer = setTimeout(next, 900);
        })();
      }, true));
      bar.appendChild(btn('↺ 重置', reset, true));
      body.appendChild(bar);
      body.appendChild(counter);
      body.appendChild(grid);
      body.appendChild(log);
      reset();
    }
  };

  /* ═══════════ 4. 线程生命周期状态机 ═══════════ */
  DEMOS['thread-life'] = {
    title: '线程生命周期状态机',
    subtitle: '点击操作,看线程在 6 种状态间流转',
    icon: 'users',
    mount: function (body) {
      var setTimeout = window.HUB_DEMO_SYSTEM.scheduler(body);
      var STATES = {
        NEW: '新建,未调用 start()',
        RUNNABLE: '就绪/运行中(含等 CPU)',
        BLOCKED: '等待监视器锁(synchronized 排队)',
        WAITING: '无限期等待 wait()/join()',
        'TIMED_WAITING': '限时等待 sleep(n)/wait(n)',
        TERMINATED: 'run() 执行完毕'
      };
      var cur = 'NEW';
      var panel = el('div', 'dm-states');
      Object.keys(STATES).forEach(function (s) {
        panel.appendChild(el('div', 'dm-state', s + '<small>' + STATES[s] + '</small>'));
      });
      function paint() {
        panel.querySelectorAll('.dm-state').forEach(function (d, i) {
          d.classList.toggle('here', Object.keys(STATES)[i] === cur);
        });
      }
      var log = logArea();
      var ops = [
        ['start()', 'NEW', 'RUNNABLE', '启动线程,进入可运行状态,等待 CPU 调度'],
        ['抢锁成功', 'RUNNABLE', 'RUNNABLE', '获得 synchronized 锁,继续执行(未抢到会进 BLOCKED)'],
        ['锁被占用', 'RUNNABLE', 'BLOCKED', '拿不到锁 → 进入 BLOCKED,锁释放后重新竞争'],
        ['wait()', 'RUNNABLE', 'WAITING', '释放锁并无限等待,必须由别人 notify() 唤醒'],
        ['notify()', 'WAITING', 'BLOCKED', '被唤醒 → 但要先重新抢锁,抢不到仍是 BLOCKED!'],
        ['sleep(1000)', 'RUNNABLE', 'TIMED_WAITING', '限时休眠,<b>不释放锁</b>,时间到自动回 RUNNABLE'],
        ['sleep 到期', 'TIMED_WAITING', 'RUNNABLE', '休眠结束,回到可运行状态'],
        ['wait(500) 超时', 'WAITING', 'TIMED_WAITING', 'wait 带超时参数 → 进入限时等待'],
        ['锁释放了', 'BLOCKED', 'RUNNABLE', '监视器锁可用,阻塞解除'],
        ['run() 返回', 'RUNNABLE', 'TERMINATED', '线程结束,不可再次 start()(IllegalThreadStateException)'],
      ];
      var bar = el('div', 'dm-toolbar');
      ops.forEach(function (op) {
        var b = btn(op[0], function () {
          if (op[1] !== cur) {
            dlog(log, '<span class="l-err">✗ 操作非法:当前状态是 ' + cur + ',只有 ' + op[1] + ' 状态才能执行 ' + op[0] + '</span>');
            return;
          }
          cur = op[2];
          paint();
          dlog(log, '<span class="l-ok">' + op[0] + '</span> : ' + op[3] + ' → 现在是 <b>' + cur + '</b>');
        }, true);
        bar.appendChild(b);
      });
      var resetB = btn('↺ new Thread()', function () { cur = 'NEW'; paint(); dlog(log, '创建线程对象 → <b>NEW</b>', 'l-info'); });
      bar.appendChild(resetB);
      body.appendChild(bar);
      body.appendChild(panel);
      body.appendChild(log);
      paint();
      dlog(log, '一个线程的一生:NEW → start() → RUNNABLE ⇄ BLOCKED/WAITING/TIMED_WAITING → TERMINATED', 'l-info');
    }
  };

  /* ═══════════ 5. 生产者消费者 ═══════════ */
  DEMOS['prodcons'] = {
    title: '生产者-消费者模型(wait/notify)',
    subtitle: '容量为 5 的阻塞队列 · 看锁与等待的切换',
    icon: 'rotate',
    mount: function (body) {
      var setTimeout = window.HUB_DEMO_SYSTEM.scheduler(body);
      var CAP = 5, q = [], producing = false, consuming = false, seq = 1;
      var slots = el('div', 'dm-slots');
      var prodChip = el('div', 'dm-thread', '🧵 生产者线程 <small>idle</small>');
      var consChip = el('div', 'dm-thread', '🧵 消费者线程 <small>idle</small>');
      var counter = counters([{ key: 'made', label: '已生产' }, { key: 'eaten', label: '已消费' }, { key: 'waited', label: 'wait 次数' }], );
      var log = logArea();
      function paint() {
        slots.innerHTML = '';
        for (var i = 0; i < CAP; i++) {
          var s = el('div', 'dm-slot' + (q[i] !== undefined ? ' filled' : ''), q[i] !== undefined ? '#' + q[i] : '空');
          slots.appendChild(s);
        }
      }
      function setChip(chip, state, cls) {
        chip.querySelector('small').textContent = state;
        chip.className = 'dm-thread ' + (cls || '');
      }
      function produce() {
        if (q.length >= CAP) {
          setChip(prodChip, 'WAITING(队列满,wait 释放锁)', 'waiting');
          dlog(log, '生产者:队列已满 → <b>wait()</b> 释放锁并等待 …', 'l-err');
          counter._w = (counter._w || 0) + 1; counter.set('waited', counter._w);
          return false;
        }
        var id = seq++;
        q.push(id);
        setChip(prodChip, 'RUNNABLE', 'working');
        dlog(log, '生产者:put(#' + id + ') → <b>notify()</b> 唤醒消费者');
        counter.set('made', seq - 1);
        paint();
        return true;
      }
      function consume() {
        if (!q.length) {
          setChip(consChip, 'WAITING(队列空,wait 释放锁)', 'waiting');
          dlog(log, '消费者:队列已空 → <b>wait()</b> 释放锁并等待 …', 'l-err');
          counter._w = (counter._w || 0) + 1; counter.set('waited', counter._w);
          return false;
        }
        var id = q.shift();
        setChip(consChip, 'RUNNABLE', 'working');
        dlog(log, '消费者:take(#' + id + ') → <b>notify()</b> 唤醒生产者');
        counter.set('eaten', (counter._e = (counter._e || 0) + 1));
        paint();
        return true;
      }
      var bar = el('div', 'dm-toolbar');
      bar.appendChild(btn('🏭 生产 1 个', function () { produce(); }));
      bar.appendChild(btn('🍽 消费 1 个', function () { consume(); }));
      bar.appendChild(btn('▶ 自动运转', function () {
        if (producing) return; producing = true;
        setChip(prodChip, 'RUNNABLE', 'working'); setChip(consChip, 'RUNNABLE', 'working');
        (function tick() {
          if (!producing) return;
          produce();
          setTimeout(function () {
            if (!producing) return;
            consume();
            setTimeout(tick, 700);
          }, 700);
        })();
      }));
      bar.appendChild(btn('⏸ 暂停', function () {
        producing = false;
        setChip(prodChip, 'idle'); setChip(consChip, 'idle');
      }, true));
      bar.appendChild(btn('↺ 重置', function () {
        producing = false; q = []; seq = 1;
        counter._w = 0; counter._e = 0;
        counter.set('made', 0); counter.set('eaten', 0); counter.set('waited', 0);
        setChip(prodChip, 'idle'); setChip(consChip, 'idle');
        log.innerHTML = '';
        dlog(log, 'while(队列满) wait();  生产…  notifyAll();  —— 必须用 while 不是 if,防止虚假唤醒', 'l-info');
        paint();
      }, true));
      body.appendChild(bar);
      var row = el('div', 'dm-row');
      row.appendChild(prodChip); row.appendChild(consChip);
      body.appendChild(row);
      body.appendChild(slots);
      body.appendChild(counter);
      body.appendChild(log);
      paint();
      dlog(log, '核心逻辑:队列满 → 生产者 wait() 放锁;消费者取走后 notify() 唤醒 —— 点"自动运转"观察等待与唤醒', 'l-info');
    }
  };

  /* ═══════════ 6. 线程池执行流程 ═══════════ */
  DEMOS['threadpool'] = {
    title: '线程池 execute() 执行流程',
    subtitle: 'core=3 / queue=5 / max=6 / AbortPolicy',
    icon: 'bolt',
    mount: function (body) {
      var setTimeout = window.HUB_DEMO_SYSTEM.scheduler(body);
      var CORE = 3, QUEUE = 5, MAX = 6;
      var cores = [null, null, null], extras = [null, null, null], queue = [];
      var tid = 1, done = 0, rejected = 0;
      var coreRow = el('div', 'dm-slots'), queueRow = el('div', 'dm-slots'), extraRow = el('div', 'dm-slots');
      var counter = counters([
        { key: 'done', label: '已完成', cls: 'ok' },
        { key: 'queue', label: '排队中' },
        { key: 'reject', label: '已拒绝', cls: 'danger' }
      ]);
      var log = logArea();
      function paint() {
        coreRow.innerHTML = ''; extraRow.innerHTML = ''; queueRow.innerHTML = '';
        cores.forEach(function (t, i) {
          coreRow.appendChild(el('div', 'dm-slot' + (t ? ' filled' : ''), t ? 'T' + t + ' 执行中' : '核心线程 ' + (i + 1)));
        });
        extras.forEach(function (t, i) {
          extraRow.appendChild(el('div', 'dm-slot' + (t ? ' filled' : ''), t ? 'T' + (CORE + i + 1) + ' 执行中' : '临时线程 ' + (CORE + i + 1)));
        });
        for (var i = 0; i < QUEUE; i++) {
          queueRow.appendChild(el('div', 'dm-slot' + (queue[i] ? ' filled' : ''), queue[i] ? '#' + queue[i] : '空'));
        }
        counter.set('queue', queue.length);
        counter.set('done', done);
        counter.set('reject', rejected);
      }
      function submit() {
        var id = tid++;
        for (var i = 0; i < CORE; i++) {
          if (!cores[i]) {
            cores[i] = id;
            dlog(log, '#' + id + ' → <span class="l-ok">核心线程 T' + (i + 1) + ' 执行</span>(cores 未满,不排队)');
            run(i);
            paint();
            return;
          }
        }
        if (queue.length < QUEUE) {
          queue.push(id);
          dlog(log, '#' + id + ' → 核心已满 → <span class="l-hl">入阻塞队列等待</span>(位置 ' + queue.length + '/' + QUEUE + ')');
          paint();
          setTimeout(drain, 600);
          return;
        }
        for (var j = 0; j < extras.length; j++) {
          if (!extras[j]) {
            extras[j] = id;
            dlog(log, '#' + id + ' → 队列也满了 → <span class="l-err">创建临时线程 T' + (CORE + j + 1) + '</span>(注意:是先排队,队列满才扩线程!)');
            runExtra(j);
            paint();
            return;
          }
        }
        rejected++;
        dlog(log, '#' + id + ' → 线程数达 max 且队列满 → <b>AbortPolicy:抛出 RejectedExecutionException!</b>', 'l-err');
        paint();
      }
      function finish(where, i, id) {
        if (where === 'core') cores[i] = null; else extras[i] = null;
        done++;
        dlog(log, '#' + id + ' 执行完毕,T' + (where === 'core' ? i + 1 : CORE + i + 1) + (where === 'extra' ? '(临时线程空闲超过 keepAliveTime 后销毁)' : ' 回去等下一个任务'));
        paint();
        setTimeout(drain, 300);
      }
      function run(i) { var id = cores[i]; setTimeout(function () { finish('core', i, id); }, 1800); }
      function runExtra(i) { var id = extras[i]; setTimeout(function () { finish('extra', i, id); }, 1800); }
      function drain() {
        if (!queue.length) return;
        for (var i = 0; i < CORE; i++) if (!cores[i]) {
          var id = queue.shift();
          cores[i] = id;
          dlog(log, '核心线程 T' + (i + 1) + ' 空闲 → 从队列取出 #' + id + ' 执行');
          run(i); paint();
          return;
        }
        for (var j = 0; j < extras.length; j++) if (!extras[j]) {
          var id2 = queue.shift();
          extras[j] = id2;
          dlog(log, '临时线程 T' + (CORE + j + 1) + ' 空闲 → 取出 #' + id2 + ' 执行');
          runExtra(j); paint();
          return;
        }
      }
      var bar = el('div', 'dm-toolbar');
      bar.appendChild(btn('提交 1 个任务', submit));
      bar.appendChild(btn('提交 5 个任务', function () { for (var i = 0; i < 5; i++) submit(); }));
      bar.appendChild(btn('🎯 压满触发拒绝', function () { for (var i = 0; i < 15; i++) setTimeout(submit, i * 60); }));
      bar.appendChild(btn('↺ 重置', function () {
        cores = [null, null, null]; extras = [null, null, null]; queue = [];
        tid = 1; done = 0; rejected = 0; log.innerHTML = '';
        dlog(log, 'new ThreadPoolExecutor(3, 6, 60s, ArrayBlockingQueue(5), AbortPolicy)', 'l-info');
        paint();
      }, true));
      body.appendChild(bar);
      body.appendChild(el('div', 'dm-panel-title', '核心线程池 CORE = 3'));
      body.appendChild(coreRow);
      body.appendChild(el('div', 'dm-panel-title', '阻塞队列 BLOCKING_QUEUE = 5'));
      body.appendChild(queueRow);
      body.appendChild(el('div', 'dm-panel-title', '临时线程(扩容位)MAX = 6'));
      body.appendChild(extraRow);
      body.appendChild(counter);
      body.appendChild(log);
      dlog(log, '执行顺序口诀:<b>核心线程 → 队列 → 临时线程 → 拒绝策略</b>(队列插在中间,和很多人以为的相反!)', 'l-hl');
      paint();
    }
  };

  /* ═══════════ 7. 类加载过程 ═══════════ */
  DEMOS['classload'] = {
    title: '类加载全过程 + 双亲委派',
    subtitle: '加载 → 验证 → 准备 → 解析 → 初始化',
    icon: 'book',
    mount: function (body) {
      var setTimeout = window.HUB_DEMO_SYSTEM.scheduler(body);
      var NODES = ['加载 Loading', '验证 Verify', '准备 Prepare', '解析 Resolve', '初始化 Init', '<clinit> 执行'];
      var flow = el('div', 'dm-flow');
      NODES.forEach(function (n, i) {
        flow.appendChild(el('div', 'dm-node', n));
        if (i < NODES.length - 1) flow.appendChild(el('div', 'dm-arrow', '→'));
      });
      var memPanel = el('div', 'dm-panel');
      memPanel.appendChild(el('div', 'dm-panel-title', '方法区/元空间 · static 字段快照'));
      var mem = el('div', 'dm-mem');
      mem.style.gridTemplateColumns = 'repeat(2,1fr)';
      var aCell = el('div', 'dm-mem-cell', 'public static int a = ?');
      var sCell = el('div', 'dm-mem-cell', 'static { ... } 执行?');
      mem.appendChild(aCell); mem.appendChild(sCell);
      memPanel.appendChild(mem);
      var log = logArea();
      var deleg = el('div', 'dm-flow');
      ['Bootstrap rt.jar', 'Extension ext/*.jar', 'Application classpath', 'Custom 自定义'].forEach(function (n, i) {
        deleg.appendChild(el('div', 'dm-node', n));
        if (i < 3) deleg.appendChild(el('div', 'dm-arrow', '⇄'));
      });
      var bar = el('div', 'dm-toolbar');
      bar.appendChild(btn('▶ 加载 User.class', async function () {
        var nodes = flow.querySelectorAll('.dm-node');
        nodes.forEach(function (n) { n.className = 'dm-node'; });
        var script = [
          [0, '加载:读取 User.class 字节流 → 方法区生成 Class 对象', 'public static int a = <b>?</b> (还没分配)'],
          [1, '验证:文件格式/元数据/字节码/符号引用校验,防恶意字节码', ''],
          [2, '准备:为 static 变量分配内存并赋 <b>零值</b>(不是代码里的值!)', 'public static int a = <b class="o-err">0</b>'],
          [3, '解析:符号引用 → 直接引用(常量池中的 User 替换为内存地址)', ''],
          [4, '初始化:执行类构造器 <clinit>()(静态赋值+static块按顺序合并)', 'public static int a = <b class="l-ok">42</b>'],
          [5, '<clinit> 按"代码书写顺序"执行:先 a=42 再 static 块打印,保证线程安全(JVM 加锁)', 'static块输出:User 类初始化完成']
        ];
        for (var i = 0; i < script.length; i++) {
          (function (idx, msg, mem2) {
            setTimeout(function () {
              nodes.forEach(function (n, k) { n.classList.toggle('done', k < idx); });
              nodes[idx].className = 'dm-node active';
              dlog(log, msg, 'l-info');
              if (mem2) { aCell.innerHTML = mem2; aCell.classList.add('hot'); setTimeout(function () { aCell.classList.remove('hot'); }, 600); }
            }, i * 1100);
          })(script[i][0], script[i][1], script[i][2]);
        }
        setTimeout(function () {
          dlog(log, '懒加载:第一次 new User() / 访问静态成员才触发初始化;子类初始化前父类必须已完成', 'l-hl');
        }, script.length * 1100);
      }));
      bar.appendChild(btn('⏭ 快进', async function () {
        var nodes = flow.querySelectorAll('.dm-node');
        nodes.forEach(function (n, i) { n.className = 'dm-node ' + (i === 5 ? 'active' : 'done'); });
        aCell.innerHTML = 'public static int a = 42';
        dlog(log, '跳过中间过程:最终 a=42,<clinit> 完成', 'l-ok');
      }, true));
      bar.appendChild(btn('↺ 重置', function () {
        flow.querySelectorAll('.dm-node').forEach(function (n) { n.className = 'dm-node'; });
        aCell.innerHTML = 'public static int a = ?';
        sCell.innerHTML = 'static { ... } 执行?';
        log.innerHTML = '';
      }, true));
      body.appendChild(bar);
      body.appendChild(flow);
      var row = el('div', 'dm-row');
      row.appendChild(memPanel);
      body.appendChild(row);
      body.appendChild(el('div', 'dm-panel-title', '双亲委派:收到加载请求先向上问,父亲能干就不自己干'));
      body.appendChild(deleg);
      body.appendChild(log);
      dlog(log, '经典面试题:准备阶段 a=0 还是 42?—— <b>0</b>(零值);final static 常量在编译期就确定,准备阶段直接赋值', 'l-info');
    }
  };

  /* ═══════════ 8. JVM 内存区域与对象流动 ═══════════ */
  DEMOS['jvm-memory'] = {
    title: '对象在堆里的漂流(分代模型)',
    subtitle: 'Eden → Survivor(年龄+1) → Old(年龄15晋升)',
    icon: 'chip',
    mount: function (body) {
      var setTimeout = window.HUB_DEMO_SYSTEM.scheduler(body);
      var eden = [], s0 = [], s1 = [], old = [], oid = 1;
      var gcMinor = 0, gcFull = 0;
      var edenGrid = el('div', 'dm-mem'), s0Grid = el('div', 'dm-mem'), s1Grid = el('div', 'dm-mem'), oldGrid = el('div', 'dm-mem');
      [edenGrid, s0Grid, s1Grid, oldGrid].forEach(function (g) { g.style.gridTemplateColumns = 'repeat(4,1fr)'; });
      function panelOf(title, grid, hint) {
        var p = el('div', 'dm-panel');
        p.appendChild(el('div', 'dm-panel-title', title));
        p.appendChild(grid);
        if (hint) p.appendChild(el('div', 'dm-legend', hint));
        return p;
      }
      var counter = counters([{ key: 'minor', label: 'Minor GC' }, { key: 'full', label: 'Full GC', cls: 'danger' }, { key: 'obj', label: '存活对象', cls: 'ok' }]);
      function chip(o) {
        var c = el('div', 'dm-mem-cell' + (o.age >= 15 ? '' : ' live'), (o.big ? '🏀 ' : '📦 ') + o.id + ' <small style="opacity:.7">a' + o.age + '</small>');
        return c;
      }
      function render() {
        edenGrid.innerHTML = ''; s0Grid.innerHTML = ''; s1Grid.innerHTML = ''; oldGrid.innerHTML = '';
        eden.forEach(function (o) { edenGrid.appendChild(chip(o)); });
        s0.forEach(function (o) { s0Grid.appendChild(chip(o)); });
        s1.forEach(function (o) { s1Grid.appendChild(chip(o)); });
        old.forEach(function (o) { o.age = Math.max(o.age, 15); oldGrid.appendChild(chip(o)); });
        counter.set('obj', eden.length + s0.length + s1.length + old.length);
        counter.set('minor', gcMinor);
        counter.set('full', gcFull);
      }
      var log = logArea();
      function newObj(big) {
        var o = { id: oid++, age: 0, big: big };
        if (big) {
          old.push(o);
          dlog(log, '📦 ' + o.id + ' 是<b>大对象(> Eden 50%)</b> → 直接进入老年代,避免 Eden/Survivor 来回拷贝', 'l-hl');
        } else {
          eden.push(o);
          dlog(log, '📦 ' + o.id + ' new 出来 → 进入 <b>Eden 区</b>(伊甸园),绝大多数对象朝生夕死');
        }
        render();
      }
      function minorGC() {
        if (!eden.length && !s0.length && !s1.length) { dlog(log, 'Eden 和 Survivor 都空着,GC 是空转', 'l-info'); return; }
        gcMinor++;
        dlog(log, '⚡ Minor GC 触发(Eden 满)—— 复制算法:存活对象流向空的 Survivor,年龄 +1', 'l-hl');
        var fromList = s0.length ? s0 : s1;
        var survivors = [];
        eden.forEach(function (o) { if (Math.random() > 0.35) survivors.push(o); });
        fromList.forEach(function (o) { if (Math.random() > 0.25) survivors.push(o); });
        var deadCount = eden.length + fromList.length - survivors.length;
        survivors.forEach(function (o) { o.age++; });
        var promoted = survivors.filter(function (o) { return o.age >= 15; });
        var remain = survivors.filter(function (o) { return o.age < 15; });
        eden = [];
        if (fromList === s0) { s0 = []; s1 = remain; } else { s1 = []; s0 = remain; }
        promoted.forEach(function (o) { old.push(o); });
        promoted.forEach(function (o) {
          dlog(log, '🎓 对象 ' + o.id + ' 年龄达 15 → <b>晋升老年代</b>(默认阈值,-XX:MaxTenuringThreshold 可调)');
        });
        dlog(log, 'GC 完成:本次回收 <b>' + deadCount + '</b> 个死亡对象,幸存者年龄全部 +1');
        render();
        if (old.length >= 7) fullGC();
      }
      function fullGC() {
        gcFull++;
        dlog(log, '🔥 老年代满 → <b>Full GC(STW 更长)</b>!标记整理后老年代被清空一部分', 'l-err');
        old = old.filter(function () { return Math.random() > 0.3; });
        render();
      }
      var bar = el('div', 'dm-toolbar');
      bar.appendChild(btn('📦 new 普通对象', function () { newObj(false); }));
      bar.appendChild(btn('🏀 new 大对象', function () { newObj(true); }));
      bar.appendChild(btn('⚡ Minor GC', minorGC));
      bar.appendChild(btn('🔥 强制 Full GC', fullGC, true));
      bar.appendChild(btn('▶ 自动模拟', function () {
        var t = 0;
        (function tick() {
          if (t > 14) return;
          t++;
          if (t % 4 === 0) minorGC(); else newObj(Math.random() < 0.15);
          setTimeout(tick, 800);
        })();
      }, true));
      bar.appendChild(btn('↺ 重置', function () { eden = []; s0 = []; s1 = []; old = []; oid = 1; gcMinor = 0; gcFull = 0; log.innerHTML = ''; render(); }, true));
      body.appendChild(bar);
      var grid = el('div', 'dm-row');
      grid.appendChild(panelOf('EDEN 区 · 新生代 8/10', edenGrid));
      grid.appendChild(panelOf('SURVIVOR FROM', s0Grid));
      grid.appendChild(panelOf('SURVIVOR TO(空着待拷贝)', s1Grid));
      grid.appendChild(panelOf('老年代 OLD(容量大,GC 慢)', oldGrid));
      body.appendChild(grid);
      body.appendChild(counter);
      body.appendChild(log);
      render();
      dlog(log, '年龄在对象头 Mark Word 里占 4bit,所以阈值最大 15 —— 面试高频细节!', 'l-info');
    }
  };

  /* ═══════════ 9. GC 算法对比演示 ═══════════ */
  DEMOS['gc-demo'] = {
    title: '三大 GC 算法可视化对比',
    subtitle: '标记清除(碎片) / 标记复制(空间换时间) / 标记整理',
    icon: 'flame',
    mount: function (body) {
      var setTimeout = window.HUB_DEMO_SYSTEM.scheduler(body);
      var algo = '标记-清除';
      var objs = [];
      var grid = el('div', 'dm-mem');
      grid.style.gridTemplateColumns = 'repeat(8,1fr)';
      var fragCounter = counters([{ key: 'frag', label: '内存碎片%', cls: 'danger' }, { key: 'used', label: '利用率%', cls: 'ok' }, { key: 'copied', label: '复制开销' }]);
      var log = logArea();
      function seed() {
        objs = [];
        for (var i = 0; i < 16; i++) objs.push({ id: i + 1, dead: Math.random() < 0.3 });
        render();
      }
      function render(mark) {
        grid.innerHTML = '';
        objs.forEach(function (o, i) {
          var c = el('div', 'dm-mem-cell ' + (o.dead ? (mark ? 'dead' : '') : 'live'), o.dead ? (mark ? '垃圾' : '空洞') : 'obj' + o.id);
          if (mark && o.dead) c.classList.add('dead');
          grid.appendChild(c);
        });
      }
      function stats() {
        var dead = objs.filter(function (o) { return o.dead; }).length;
        var holes = objs.filter(function (o) { return o.dead || o._hole; }).length;
        fragCounter.set('frag', Math.round(holes / objs.length * 100));
        fragCounter.set('used', Math.round((objs.length - holes) / objs.length * 100));
        return dead;
      }
      var bar = el('div', 'dm-toolbar');
      bar.appendChild(tabs(['标记-清除', '标记-复制', '标记-整理'], algo, function (o) {
        algo = o; log.innerHTML = '';
        dlog(log, '切换到 <b>' + o + '</b> —— 先"生成一堆带垃圾的内存",再点执行 GC 对比结果', 'l-info');
        seed();
      }));
      bar.appendChild(btn('🎲 生成带垃圾的内存', function () { seed(); dlog(log, '已生成 16 个对象,其中灰色为垃圾', 'l-info'); }, true));
      bar.appendChild(btn('▶ 1. 标记可达对象', function () {
        render(true);
        dlog(log, '<b>标记阶段:</b>从 GC Roots 出发,不可达的标为垃圾(可达性分析,不是引用计数——解决循环引用)', 'l-hl');
        stats();
      }));
      bar.appendChild(btn('▶ 2. 清除阶段', async function () {
        if (algo === '标记-清除') {
          objs.forEach(function (o) { if (o.dead) o._hole = 1; });
          render();
          dlog(log, '清除完成:直接把垃圾位置置空 → <span class="l-err">产生内存碎片!大对象可能找不到连续空间 → 提前 Full GC</span>');
        } else if (algo === '标记-复制') {
          var live = objs.filter(function (o) { return !o.dead; });
          var from = live.length;
          objs = [];
          for (var i = 0; i < 16; i++) objs.push(i < live.length ? live[i] : { _hole: 1, dead: true, id: '空' });
          render();
          fragCounter.set('copied', from + ' 个对象');
          dlog(log, '复制完成:存活对象从 From 区<b>整齐滑入 To 区</b>(内存连续,无碎片)→ <span class="l-ok">代价是要双倍空间 + 复制耗时</span>');
        } else {
          var live2 = objs.filter(function (o) { return !o.dead; });
          objs = [];
          for (var j = 0; j < 16; j++) objs.push(j < live2.length ? live2[j] : { _hole: 1, dead: true, id: '空' });
          render();
          dlog(log, '整理完成:存活对象<b>向一端移动</b>,填充空洞 → 无碎片且不用双倍空间 → <span class="l-hl">代价是移动对象要更新引用,STW 更长</span>');
        }
        stats();
      }));
      body.appendChild(bar);
      body.appendChild(grid);
      body.appendChild(fragCounter);
      body.appendChild(log);
      seed();
      dlog(log, '点击左侧"标记"再看"清除",切换三种算法对比 —— 新生代用复制(对象死得快),老年代用整理(避免碎片)', 'l-info');
    }
  };
})();
