/* ═══════════════════════════════════════════════════
   交互演示 · 第二批:MySQL(3) + Redis(2) + MQ(1) + Spring(2) + 设计模式(1)
   ═══════════════════════════════════════════════════ */
(function () {
  'use strict';
  var D = window.DEMOS = window.DEMOS || {};
  var U = window.DUTIL;
  var el = U.el, btn = U.btn, logArea = U.logArea, counters = U.counters, tabs = U.tabs;
  function dlog(box, msg, cls) { U.log(box, msg, cls); }

  /* ═══════════ 10. B+树 vs 二叉树查找 ═══════════ */
  D['bptree'] = {
    title: '为什么 MySQL 选 B+ 树?',
    subtitle: '插入 1~7 对比 BST 退化 vs B+树 · 再比查找速度',
    icon: 'database',
    mount: function (body) {
      var setTimeout = window.HUB_DEMO_SYSTEM.scheduler(body);
      var bstEl = el('div', 'dm-tree'), bptEl = el('div', 'dm-tree');
      var bstVisits = 0, bptVisits = 0;
      var counter = U.counters([{ key: 'bst', label: 'BST 访问节点', cls: 'danger' }, { key: 'bpt', label: 'B+树 访问节点', cls: 'ok' }, { key: 'io', label: 'B+树 磁盘IO' }]);
      var log = U.logArea();

      function renderBST(visited) {
        bstEl.innerHTML = '';
        var lv3 = el('div', 'dm-tlevel'), lv2 = el('div', 'dm-tlevel'), lv1 = el('div', 'dm-tlevel');
        lv3.appendChild(tnode(1, visited, 1));
        lv2.appendChild(el('span', '', '&nbsp;&nbsp;&nbsp;↘')); lv2.appendChild(tnode(2, visited, 2));
        lv1.appendChild(el('span', '', '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↘↘↘'));
        for (var k = 3; k <= 7; k++) lv1.appendChild(tnode(k, visited, k));
        bstEl.appendChild(lv3); bstEl.appendChild(lv2); bstEl.appendChild(lv1);
        bstEl.appendChild(el('div', 'dm-panel-title', 'BST:顺序插入退化成链表,树高 = 7'));
      }
      function tnode(v, visited, order) {
        var t = el('div', 'dm-tnode', v);
        if (visited && visited.indexOf(v) >= 0) t.classList.add('visit');
        if (visited && order === visited.length) t.classList.add('visit');
        return t;
      }
      function renderBPT(visitedLeaf) {
        bptEl.innerHTML = '';
        var root = el('div', 'dm-tlevel');
        var rootBox = el('div', 'dm-tnode', '[ 1 · 2 · 4 · 6 · 7 的稀疏索引 ]');
        if (visitedLeaf !== undefined) rootBox.classList.add('visit');
        root.appendChild(rootBox);
        bptEl.appendChild(root);
        var arrow = el('div', 'dm-tlevel'); arrow.appendChild(el('span', '', visitedLeaf !== undefined ? '↓ 找到叶子指针 ↓' : '(非叶子节点只存索引,不存数据)'));
        bptEl.appendChild(arrow);
        var leaves = el('div', 'dm-tlevel');
        var l1 = el('div', 'dm-tnode leaf', '[1][2][3]'), l2 = el('div', 'dm-tnode leaf', '[4][5][6][7]');
        if (visitedLeaf === 1) l1.classList.add('visit');
        if (visitedLeaf === 2) l2.classList.add('visit');
        leaves.appendChild(l1); leaves.appendChild(el('div', 'dm-arrow', '⇄')); leaves.appendChild(l2);
        bptEl.appendChild(leaves);
        bptEl.appendChild(el('div', 'dm-panel-title', 'B+树:3 层矮胖结构 · 叶子双向链表(范围查询利器)'));
      }
      var bar = el('div', 'dm-toolbar');
      bar.appendChild(U.btn('1️⃣ 顺序插入 1~7(看两边形态)', function () {
        renderBST(null); renderBPT(undefined);
        log.innerHTML = '';
        dlog(log, '按 1,2,3…顺序插入:BST 全部右偏,<b>退化成链表,查询 O(n)</b> —— 红黑树/AVL 也只是缓解,树深仍随数据线性增长', 'l-err');
        dlog(log, 'B+树节点分裂自动平衡:<b>千万级数据树高也只有 3~4 层</b>,每层对应一次磁盘 IO', 'l-ok');
      }));
      bar.appendChild(U.btn('2️⃣ 查找 id=6(对比路径)', function () {
        renderBST([1, 2, 3, 4, 5, 6]);
        renderBPT(2);
        counter.set('bst', 6); counter.set('bpt', 2); counter.set('io', 3);
        dlog(log, 'BST:1→2→3→4→5→6 访问 <b>6 个节点</b> × 每个节点都是一次磁盘读', 'l-err');
        dlog(log, 'B+树:根节点二分 → 直接跳到叶子页,访问 <b>2 个节点 ≈ 3 次磁盘 IO</b>(2000万行数据也只要 3 次!)', 'l-ok');
        dlog(log, '算账:B+树 3 层 ≈ 2000万行。16KB 页 × 1170 扇出 × 1170 ≈ 2000万 —— <b>这就是单表建议不超过 2000 万行的出处</b>', 'l-hl');
      }));
      bar.appendChild(U.btn('3️⃣ 范围查询 id 4~6', function () {
        renderBPT(2);
        dlog(log, 'B+树叶子节点是<b>双向链表</b>:定位到 4 之后沿链表右走即可 → <b>范围查询极快</b>', 'l-ok');
        dlog(log, '红黑树做范围查询要中序遍历,跨节点跳转,磁盘局部性差 —— <span class="l-err">这是"为什么不用红黑树"的第二层答案</span>', 'l-hl');
      }));
      var row = el('div', 'dm-row');
      var p1 = el('div', 'dm-panel'); p1.style.flex = '1'; p1.appendChild(bstEl);
      var p2 = el('div', 'dm-panel'); p2.style.flex = '1'; p2.appendChild(bptEl);
      row.appendChild(p1); row.appendChild(p2);
      body.appendChild(bar);
      body.appendChild(row);
      body.appendChild(counter);
      body.appendChild(log);
      renderBST(null); renderBPT(undefined);
    }
  };

  /* ═══════════ 11. 事务隔离级别问题演示 ═══════════ */
  D['tx-isolation'] = {
    title: '脏读 / 不可重复读 / 幻读现场还原',
    subtitle: '同一套操作,在不同隔离级别下的不同结局',
    icon: 'lock',
    mount: function (body) {
      var setTimeout = window.HUB_DEMO_SYSTEM.scheduler(body);
      var level = 'REPEATABLE READ';
      var step = 0;
      var A = { snap: 500 }, B = { uncommitted: null }, inserted = 0, committed = 0;
      var aPanel = el('div', 'dm-panel'), bPanel = el('div', 'dm-panel');
      var log = U.logArea();
      var counter = U.counters([{ key: 'a1', label: 'A 第一次读' }, { key: 'a2', label: 'A 第二次读' }, { key: 'verdict', label: '问题判定' }]);

      aPanel.appendChild(el('div', 'dm-panel-title', '事务 A(读者)'));
      aPanel.appendChild(el('div', 'dm-chip c-cyan', 'balance 当前读到的值:<b id="txAVal">—</b>'));
      bPanel.appendChild(el('div', 'dm-panel-title', '事务 B(写者)'));
      bPanel.appendChild(el('div', 'dm-chip c-purple', 'B 的未提交修改:<b id="txBVal">无</b>'));

      var radio = U.tabs(['READ UNCOMMITTED', 'READ COMMITTED', 'REPEATABLE READ'], level, function (o) {
        level = o; reset();
        dlog(log, '隔离级别切换为 <b>' + o + '</b>,重新跑剧本', 'l-info');
      });
      function setA(v, verdict, cls) {
        var val = aPanel.querySelector('#txAVal'); if (val) val.textContent = v;
        var j = aPanel.querySelector('.dm-chip'); j.className = 'dm-chip ' + (cls || 'c-cyan');
        counter.set('verdict', verdict || '正常');
      }
      function reset() {
        step = 0; A.snap = 500; B.uncommitted = null; inserted = 0; committed = 0;
        var val = aPanel.querySelector('#txAVal'); if (val) val.textContent = '—';
        var bv = bPanel.querySelector('#txBVal'); if (bv) bv.textContent = '无';
        log.innerHTML = '';
        counter.set('a1', '—'); counter.set('a2', '—'); counter.set('verdict', '—');
      }
      var SCRIPT = [
        function () { dlog(log, '① A:BEGIN;SELECT balance → <b>500</b>(初始数据)' + (level === 'REPEATABLE READ' ? ' · RR:生成 ReadView 快照' : ''), 'l-info'); counter.set('a1', 500); },
        function () { B.uncommitted = 400; var bv = bPanel.querySelector('#txBVal'); if (bv) bv.textContent = '400(未提交)'; dlog(log, '② B:BEGIN;UPDATE balance = 400 —— <b>尚未 COMMIT</b>(undo log 记录旧值 500)', 'l-hl'); },
        function () {
          if (level === 'READ UNCOMMITTED') {
            setA(400, '💥 脏读!', 'c-red');
            dlog(log, '③ A:SELECT → 读到 <b>400</b>(未提交的脏数据!)→ <span class="l-err">脏读:读到了别人没提交、随时可能回滚的数据</span>', 'l-err');
          } else {
            setA(500, '正常', 'c-green');
            dlog(log, '③ A:SELECT → 读到 <b>500</b> ✓ —— ' + (level === 'REPEATABLE READ' ? 'RR 快照读走版本链,uncommitted 版本不可见' : 'RC 只读已提交数据'));
          }
          counter.set('a1', level === 'READ UNCOMMITTED' ? 400 : 500);
        },
        function () { B.uncommitted = null; var bv = bPanel.querySelector('#txBVal'); if (bv) bv.textContent = '已回滚'; dlog(log, '④ B:ROLLBACK —— 400 这笔修改作废', 'l-hl'); },
        function () {
          setA(500, '正常', 'c-green');
          dlog(log, '⑤ A:SELECT → 500 ✓(刚才是脏读的话,现在发现钱"变回来"了 —— 这就是脏读的危害:逻辑错乱)', 'l-info');
        },
        function () { B.uncommitted = 400; committed = 400; var bv = bPanel.querySelector('#txBVal'); if (bv) bv.textContent = '400'; dlog(log, '⑥ B:UPDATE balance = 400,<b>COMMIT 提交</b>', 'l-hl'); },
        function () {
          if (level === 'REPEATABLE READ') {
            setA(500, '✓ RR 可重复读', 'c-green');
            dlog(log, '⑦ A:SELECT → <b>500</b> ✓ —— RR 复用第一次的 ReadView,B 提交也看不见,<b>同事务内多次读一致</b>', 'l-ok');
          } else {
            setA(400, '⚠ 不可重复读', 'c-amber');
            dlog(log, '⑦ A:SELECT → <b>400</b> —— 同一事务两次读结果不一样 → <span class="l-err">不可重复读</span>(RC 允许此现象)', 'l-err');
          }
          counter.set('a2', level === 'REPEATABLE READ' ? 500 : 400);
        },
        function () { inserted = 1; dlog(log, '⑧ B:INSERT 一条新订单(amount=99),COMMIT', 'l-hl'); },
        function () {
          if (level === 'REPEATABLE READ') {
            dlog(log, '⑨ A:SELECT COUNT(*) → 10 ✓(快照读看不到新行)—— <b>RR 的快照读基本解决幻读</b>', 'l-ok');
            dlog(log, '但 A 若执行 <b>UPDATE/SELECT FOR UPDATE(当前读)</b> → 读到最新数据 11 条,幻读会现身 → 靠<b>间隙锁(Next-Key Lock)</b>阻止新行插入', 'l-hl');
          } else {
            dlog(log, '⑨ A:SELECT COUNT(*) → 11 —— 多出了一行 → <span class="l-err">幻读:结果集行数变了</span>', 'l-err');
          }
          dlog(log, '总结:<b>脏读 RU 独有 / 不可重复读 RC 有 / 幻读 RR 快照读已防,当前读靠间隙锁</b>', 'l-hl');
        }
      ];
      var bar = el('div', 'dm-toolbar');
      bar.appendChild(radio);
      bar.appendChild(U.btn('▶ 播放下一步', function () {
        if (step >= SCRIPT.length) { dlog(log, '剧本播完 —— 切换隔离级别对比不同结局', 'l-info'); return; }
        SCRIPT[step++]();
      }));
      bar.appendChild(U.btn('⏭ 自动播放', function () {
        (function tick() {
          if (step >= SCRIPT.length) return;
          SCRIPT[step++]();
          setTimeout(tick, 1300);
        })();
      }, true));
      bar.appendChild(U.btn('↺ 重置', reset, true));
      body.appendChild(bar);
      var row = el('div', 'dm-row');
      row.appendChild(aPanel); row.appendChild(bPanel);
      body.appendChild(row);
      body.appendChild(counter);
      body.appendChild(log);
      dlog(log, '选一个隔离级别,然后逐步播放 —— 数据库初始 balance=500,共 10 条订单', 'l-info');
    }
  };

  /* ═══════════ 12. MVCC 版本链演示 ═══════════ */
  D['mvcc'] = {
    title: 'MVCC 版本链与 ReadView',
    subtitle: 'RR 为什么读不到已提交的数据?',
    icon: 'rotate',
    mount: function (body) {
      var setTimeout = window.HUB_DEMO_SYSTEM.scheduler(body);
      var versions = [
        { val: 400, trx: 20, note: '事务B未提交的修改', active: true },
        { val: 500, trx: 10, note: '事务A开始前已提交' }
      ];
      var chain = el('div', 'dm-version');
      var rvPanel = el('div', 'dm-panel');
      var log = U.logArea();
      var readView = { m_ids: '[20]', min: 20, max: 41, creator: 40 };

      function renderChain(seenVal) {
        chain.innerHTML = '';
        chain.appendChild(el('div', 'dm-chip c-purple', 'HEAD(最新版)'));
        versions.forEach(function (v) {
          var b = el('div', 'dm-ver-box' + (seenVal === v.val ? ' seen' : ''),
            '值=<b>' + v.val + '</b> trx_id=' + v.trx + (v.active ? ' ⏳未提交' : ' ✓已提交') + '<small>' + v.note + '</small>');
          chain.appendChild(b);
          chain.appendChild(el('div', 'dm-arrow', '→ roll_pointer →'));
        });
      }
      function renderRV() {
        rvPanel.innerHTML = '<div class="dm-panel-title">事务 A(trx_id=40)的 ReadView</div>' +
          '<div class="dm-mem dm-readview">' +
          '<div class="dm-mem-cell">m_ids(活跃事务)= ' + readView.m_ids + '</div>' +
          '<div class="dm-mem-cell">min_trx_id = ' + readView.min + '</div>' +
          '<div class="dm-mem-cell">max_trx_id = ' + readView.max + '</div>' +
          '<div class="dm-mem-cell">creator_trx_id = ' + readView.creator + '</div></div>';
      }
      function judge(trxId) {
        var rules = [];
        if (trxId < readView.min) rules.push('trx_id < min → 生成快照前已提交,<span class="l-ok">可见 ✓</span>');
        else if (trxId >= readView.max) rules.push('trx_id ≥ max → ReadView 之后才开启,<span class="l-err">不可见 ✗</span>');
        else if (readView.m_ids.indexOf(String(trxId)) >= 0) rules.push('trx_id ∈ m_ids → 还在活跃未提交,<span class="l-err">不可见 ✗</span>');
        else rules.push('min ≤ trx_id < max 且不在 m_ids → ReadView 期间已提交,<span class="l-ok">可见 ✓</span>');
        return rules[0];
      }
      var bar = el('div', 'dm-toolbar');
      bar.appendChild(U.btn('▶ 事务A SELECT(生成 ReadView)', function () {
        renderRV();
        log.innerHTML = '';
        dlog(log, '① 事务A(trx=40)RR 隔离级别下第一次快照读 → 生成 ReadView:此刻只有事务B(trx=20)活跃', 'l-info');
        var seen = null;
        versions.forEach(function (v) {
          dlog(log, '检查版本 值=' + v.val + ' trx_id=' + v.trx + ':' + judge(v.trx), v.trx === 20 ? 'l-err' : 'l-ok');
          if (seen === null && v.trx !== 20) seen = v.val;
        });
        dlog(log, '沿 roll_pointer 逐版本回溯 → 最终读到 <b>' + seen + '</b>(第一个可见版本)', 'l-hl');
        renderChain(seen);
      }));
      bar.appendChild(U.btn('✅ 事务B COMMIT 提交', function () {
        versions[0].active = false;
        versions[0].note = '事务B已提交(但A的ReadView还认它是活跃)';
        renderChain(null);
        dlog(log, '② 事务B提交了 400 —— 注意:<b>ReadView 不会更新</b>,m_ids 仍是 [20]', 'l-hl');
      }));
      bar.appendChild(U.btn('🔁 事务A 再次 SELECT(RR)', function () {
        dlog(log, '③ RR:复用第一次的 ReadView(m_ids=[20])→ trx20 不可见 → 沿链回溯读到 <b>500</b>', 'l-ok');
        dlog(log, '同事务内无论读多少次、B 是否提交,A 永远看到 500 —— <b>这就是"可重复读"的实现本质</b>', 'l-hl');
        renderChain(500);
      }));
      bar.appendChild(U.btn('🔁 若是 READ COMMITTED', function () {
        readView = { m_ids: '[](重新生成,此刻无活跃)', min: 41, max: 41, creator: 40 };
        renderRV();
        dlog(log, '④ RC:每次 SELECT 都<b>重新生成 ReadView</b>:m_ids=[]、min=41', 'l-info');
        dlog(log, '检查版本 值=400 trx_id=20:20 < min 41 → 已提交,<span class="l-ok">可见 ✓</span> → 读到 <b>400</b>', 'l-ok');
        dlog(log, '同一事务两次读结果不同(500→400)= 不可重复读 —— <b>RC 与 RR 唯一区别:ReadView 的生成时机</b>', 'l-hl');
        renderChain(400);
      }));
      bar.appendChild(U.btn('↺ 重置', function () {
        versions[0].active = true; versions[0].note = '事务B未提交的修改';
        readView = { m_ids: '[20]', min: 20, max: 41, creator: 40 };
        renderChain(null); rvPanel.innerHTML = '<div class="dm-panel-title">尚未生成 ReadView</div>';
        log.innerHTML = '';
      }, true));
      body.appendChild(bar);
      var row = el('div', 'dm-row');
      var left = el('div', 'dm-panel');
      left.appendChild(el('div', 'dm-panel-title', 'undo log 版本链(从 HEAD 向旧版本回溯)'));
      left.appendChild(chain);
      var right = el('div', 'dm-col');
      right.appendChild(rvPanel);
      row.appendChild(left); row.appendChild(right);
      body.appendChild(row);
      body.appendChild(log);
      renderChain(null);
      rvPanel.innerHTML = '<div class="dm-panel-title">尚未生成 ReadView</div>';
      dlog(log, '行记录隐藏字段:trx_id(最后修改的事务)+ roll_pointer(指向上一个版本)—— 版本链存于 undo log', 'l-info');
    }
  };

  /* ═══════════ 13. 缓存穿透/击穿/雪崩 ═══════════ */
  D['cache-3'] = {
    title: '缓存三大事故现场',
    subtitle: '穿透 / 击穿 / 雪崩 · 亲眼看到 DB 是怎么被打挂的',
    icon: 'zap',
    mount: function (body) {
      var setTimeout = window.HUB_DEMO_SYSTEM.scheduler(body);
      var scenario = '穿透', fixed = false, running = false, dbHits = 0, served = 0;
      var pipe = el('div', 'dm-pipe');
      var srcStation = el('div', 'station', '客户端<br>洪水请求');
      var filterStation = el('div', 'station', '布隆/锁/策略<br>⚠ 未启用');
      var cacheStation = el('div', 'station', 'Redis 缓存<br>●');
      var dbStation = el('div', 'station', 'MySQL 数据库<br>承压:0');
      srcStation.style.left = '2%'; filterStation.style.left = '31%'; cacheStation.style.left = '56%'; dbStation.style.right = '2%';
      [srcStation, filterStation, cacheStation, dbStation].forEach(function (s) { pipe.appendChild(s); });
      var counter = U.counters([{ key: 'db', label: 'DB 收到请求', cls: 'danger' }, { key: 'ok', label: '缓存兜住', cls: 'ok' }, { key: 'status', label: 'DB 状态' }]);
      var log = U.logArea();

      function stationStates() {
        filterStation.innerHTML = scenario === '穿透' ? '布隆过滤器<br>' + (fixed ? '🛡 已启用' : '⚠ 未启用')
          : scenario === '击穿' ? '互斥锁<br>' + (fixed ? '🔒 已启用' : '⚠ 未启用')
          : 'TTL 打散<br>' + (fixed ? '🎲 已启用' : '⚠ 全部同时过期');
        cacheStation.className = 'station';
        cacheStation.innerHTML = scenario === '击穿' ? '热点 key<br>' + (fixed ? '异步重建中…' : '⏰ 刚好过期!') : 'Redis 缓存<br>●';
        dbStation.className = 'station' + (dbHits > 60 ? ' crisis' : '');
        dbStation.innerHTML = 'MySQL 数据库<br>承压:' + dbHits;
        counter.set('db', dbHits);
        counter.set('ok', served);
        counter.set('status', dbHits > 60 ? '💥 被打挂' : dbHits > 25 ? '⚠ 高危' : '正常');
      }
      function spawnDot(miss, blocked) {
        var d = el('div', 'dm-dot' + (miss ? ' miss' : ''));
        d.style.left = '10%';
        pipe.appendChild(d);
        setTimeout(function () { d.style.left = '44%'; }, 60);
        setTimeout(function () {
          if (blocked) {
            d.classList.add('blocked');
            d.style.top = '28%';
            served++;
            setTimeout(function () { d.remove(); }, 900);
            return;
          }
          var hit = scenario !== '穿透' && scenario !== '雪崩' && !miss;
          if (scenario === '雪崩' && fixed) hit = Math.random() < 0.85;
          if (scenario === '击穿' && fixed) hit = Math.random() < 0.92;
          if (scenario === '穿透') hit = false;
          if (hit) {
            served++;
            setTimeout(function () { d.style.left = '60%'; }, 100);
            setTimeout(function () { d.remove(); }, 1000);
          } else {
            d.classList.add('miss');
            setTimeout(function () { d.style.left = '85%'; }, 200);
            setTimeout(function () { d.remove(); }, 1100);
          }
          stationStates();
        }, 850);
      }
      function flood() {
        if (running) return;
        running = true;
        var n = 0;
        (function tick() {
          if (n >= 60 || !running) { running = false; stationStates(); if (dbHits > 60) dlog(log, '<span class="l-err">💥 MySQL 连接池耗尽,数据库被打挂!大量请求超时 —— 事故现场还原完毕</span>', 'l-err'); return; }
          n++;
          var blocked = false, miss = false;
          if (scenario === '穿透') blocked = fixed;
          if (scenario === '击穿') { blocked = fixed && Math.random() < 0.9; miss = !fixed; }
          if (scenario === '雪崩') { miss = !fixed; }
          if (!blocked && (miss || !fixed)) dbHits += (scenario === '穿透' && !fixed) ? 1 : (miss ? 1 : (Math.random() < 0.15 ? 1 : 0));
          spawnDot(miss, blocked);
          stationStates();
          setTimeout(tick, 55);
        })();
      }
      var bar = el('div', 'dm-toolbar');
      bar.appendChild(U.tabs(['穿透', '击穿', '雪崩'], scenario, function (o) {
        scenario = o; fixed = false; dbHits = 0; served = 0; running = false;
        pipe.querySelectorAll('.dm-dot').forEach(function (d) { d.remove(); });
        log.innerHTML = '';
        var tips = {
          '穿透': '场景:攻击者拿一堆<b>不存在的 id</b> 查询 —— 缓存永远 miss,全部打到 DB。修复:启用布隆过滤器拦截。',
          '击穿': '场景:某个<b>热点 key 刚好过期</b>,瞬间高并发全部 miss 去查 DB 重建。修复:互斥锁,只放一个请求进 DB,其余等待。',
          '雪崩': '场景:<b>大量 key 同一时刻集中过期</b>(批量导入时设了相同 TTL)。修复:过期时间加随机值打散。'
        };
        dlog(log, tips[o], 'l-info');
        stationStates();
      }));
      var sw = el('span', 'dm-switch', '<span class="track"><span class="knob"></span></span><span>启用修复方案</span>');
      sw.addEventListener('click', function () {
        fixed = !fixed;
        sw.classList.toggle('on', fixed);
        dlog(log, fixed ? '<span class="l-ok">🛡 修复方案已启用 —— 再发一次洪水,看对比效果</span>' : '修复方案已关闭', 'l-info');
        stationStates();
      });
      bar.appendChild(sw);
      bar.appendChild(U.btn('🌊 发送 60 个洪水请求', flood));
      bar.appendChild(U.btn('↺ 重置', function () {
        running = false; dbHits = 0; served = 0;
        pipe.querySelectorAll('.dm-dot').forEach(function (d) { d.remove(); });
        stationStates();
      }, true));
      body.appendChild(bar);
      body.appendChild(pipe);
      body.appendChild(counter);
      body.appendChild(log);
      stationStates();
      dlog(log, '选择事故类型 → 点"发送洪水请求" → 观察 DB 承压曲线 → 打开修复开关再来一次', 'l-info');
    }
  };

  /* ═══════════ 14. 分布式锁竞争 ═══════════ */
  D['redis-lock'] = {
    title: '分布式锁竞争全记录',
    subtitle: '锁过期 → B 抢到 → A 试图误删 → Lua 身份校验拦截',
    icon: 'lock',
    mount: function (body) {
      var setTimeout = window.HUB_DEMO_SYSTEM.scheduler(body);
      var safeMode = true;
      var lockbox = el('div', 'dm-lockbox', '🔒 LOCK 空闲');
      var aChip = el('div', 'dm-thread', '🧵 客户端 A <small>idle</small>');
      var bChip = el('div', 'dm-thread', '🧵 客户端 B <small>idle</small>');
      var log = U.logArea();
      function setChip(chip, s, cls) { chip.querySelector('small').textContent = s; chip.className = 'dm-thread ' + (cls || ''); }
      function setLock(html, cls) { lockbox.innerHTML = html; lockbox.className = 'dm-lockbox ' + (cls || ''); }
      var bar = el('div', 'dm-toolbar');
      var sw = el('span', 'dm-switch on', '<span class="track"><span class="knob"></span></span><span>Lua 身份校验解锁(推荐)</span>');
      sw.addEventListener('click', function () {
        safeMode = !safeMode;
        sw.classList.toggle('on', safeMode);
        sw.querySelector('span:last-child').textContent = safeMode ? 'Lua 身份校验解锁(推荐)' : '直接 DEL(错误示范)';
      });
      bar.appendChild(sw);
      bar.appendChild(U.btn('▶ 播放事故全过程', async function () {
        log.innerHTML = '';
        setChip(aChip, 'idle'); setChip(bChip, 'idle'); setLock('🔒 LOCK 空闲');
        if (!await U.sleepFor(body, 400)) return;
        setChip(aChip, 'RUNNABLE', 'working');
        setLock('🔒 lock:order:1001 = <b>uuid-A</b><br>TTL 30s → 29 → 28 …', 'held');
        dlog(log, '① A:<b>SET lock uuid-A NX PX 30000</b> → OK,拿到锁开始执行业务(耗时偏长…)', 'l-ok');
        if (!await U.sleepFor(body, 1600)) return;
        dlog(log, '② A 的业务还没跑完(比如 GC 停顿/FULL GC),<span class="l-err">锁 TTL 到期自动释放!</span>', 'l-err');
        setLock('⏰ 锁过期!LOCK 空闲(TTL 到期自动删除)', 'expired');
        if (!await U.sleepFor(body, 1000)) return;
        setChip(bChip, 'RUNNABLE', 'working');
        setLock('🔒 lock:order:1001 = <b>uuid-B</b><br>TTL 30s', 'held');
        dlog(log, '③ B:SET NX 成功 → <span class="l-hl">B 拿到锁开始干活</span>(此时 A 还在跑!)', 'l-ok');
        if (!await U.sleepFor(body, 1400)) return;
        setChip(aChip, 'RUNNABLE', 'working');
        if (safeMode) {
          dlog(log, '④ A 跑完了,执行解锁 Lua:GET lock == uuid-A ? 不等于(uuid-B)→ <span class="l-ok">拒绝删除 ✓ 误删被拦截!</span>', 'l-ok');
          dlog(log, '⑤ 教训:A 拿不到锁保护了 B 的执行 —— 业务层面要靠<b>幂等设计</b>容忍这种重叠', 'l-hl');
        } else {
          setLock('💥 A 直接 DEL 成功!B 的锁被删了', 'expired');
          dlog(log, '④ A 跑完直接 DEL → <span class="l-err">把 B 的锁删掉了!</span>', 'l-err');
          if (!await U.sleepFor(body, 900)) return;
          setChip(aChip, 'RUNNABLE', 'working');
          setLock('🔒 lock = uuid-A(A 又重新加了一把)', 'held');
          dlog(log, '⑤ A 补刀:再 SET NX 成功 → <span class="l-err">现在 A、B 同时持锁,互斥彻底失效,超卖/脏数据上线!</span>', 'l-err');
          dlog(log, '结论:解锁必须 <b>Lua 脚本:先 GET 比对 uuid,是自己的才 DEL</b> —— 原子操作,无解可乘', 'l-hl');
        }
      }));
      bar.appendChild(U.btn('↺ 重置', function () {
        setChip(aChip, 'idle'); setChip(bChip, 'idle'); setLock('🔒 LOCK 空闲'); log.innerHTML = '';
      }, true));
      body.appendChild(bar);
      var row = el('div', 'dm-row');
      row.appendChild(aChip); row.appendChild(bChip);
      body.appendChild(row);
      body.appendChild(lockbox);
      body.appendChild(log);
      dlog(log, '这个演示还原了分布式锁最经典的面试故事:锁过期误删。切换右上的开关,对比错误写法与正确写法', 'l-info');
    }
  };

  /* ═══════════ 15. MQ 削峰填谷 ═══════════ */
  D['mq-peak'] = {
    title: '秒杀流量削峰填谷',
    subtitle: '直连数据库 vs 走消息队列 · DB 承压曲线对比',
    icon: 'layers',
    mount: function (body) {
      var setTimeout = window.HUB_DEMO_SYSTEM.scheduler(body);
      var mode = '直连数据库';
      var cvs = el('canvas', 'dm-chart');
      cvs.width = 640; cvs.height = 150;
      var queueSlots = el('div', 'dm-slots');
      var counter = U.counters([{ key: 'peak', label: 'DB 峰值 QPS', cls: 'danger' }, { key: 'drop', label: '被压垮丢失', cls: 'danger' }, { key: 'done', label: '已处理订单', cls: 'ok' }]);
      var log = U.logArea();
      var peak = 0, drop = 0, done = 0, t = 0, series = [], running = false;
      var ctx = cvs.getContext('2d');

      function draw() {
        ctx.clearRect(0, 0, 640, 150);
        ctx.strokeStyle = 'rgba(148,163,184,.15)';
        for (var y = 0; y < 150; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(640, y); ctx.stroke(); }
        ctx.strokeStyle = 'rgba(251,113,133,.4)';
        ctx.beginPath(); ctx.moveTo(0, 150 - 120); ctx.lineTo(640, 150 - 120); ctx.stroke();
        ctx.fillStyle = 'rgba(251,113,133,.6)'; ctx.font = '10px monospace';
        ctx.fillText('DB 极限 600 QPS', 6, 150 - 125);
        ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2; ctx.beginPath();
        series.forEach(function (v, i) {
          var x = i * 8, y = 150 - Math.min(148, v / 7);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }
      function paintQueue() {
        queueSlots.innerHTML = '';
        var q = Math.min(12, Math.round(bBuffer / 80));
        for (var i = 0; i < 12; i++) queueSlots.appendChild(U.el('div', 'dm-slot' + (i < q ? ' filled' : ''), i < q ? 'msg' : ''));
      }
      var bBuffer = 0;
      function tick() {
        if (!running) return;
        t++;
        var incoming = (t > 10 && t < 40) ? 800 : 80;    // 秒杀洪峰
        if (mode === '直连数据库') {
          var load = incoming;
          if (load > 600) { drop += (load - 600) / 10; load = 600; }
          peak = Math.max(peak, load);
          done += load / 10 * 0.95;
          series.push(load);
        } else {
          bBuffer += incoming / 10;
          var drain = Math.min(bBuffer, 55);              // 消费者匀速 550 QPS
          bBuffer -= drain;
          peak = Math.max(peak, drain);
          done += drain;
          series.push(drain);
        }
        if (series.length > 80) series.shift();
        draw();
        paintQueue();
        counter.set('peak', Math.round(peak));
        counter.set('drop', Math.round(drop));
        counter.set('done', Math.round(done));
        if (t > 10 && t === 25) dlog(log, mode === '直连数据库' ? '🔥 洪峰直冲 DB:800 QPS > 极限 600 → 连接池耗尽,请求开始报错丢弃!' : '📨 洪峰进入 MQ:生产端瞬间写入,消费端按自己的节奏匀速消费', 'l-hl');
        if (mode !== '直连数据库' && t === 55) dlog(log, '⏱ 洪峰已过,MQ 还在慢慢消化积压 —— <b>这就是"填谷"</b>:DB 全程负载平稳', 'l-ok');
        setTimeout(tick, 100);
      }
      var bar = el('div', 'dm-toolbar');
      bar.appendChild(U.tabs(['直连数据库', '走消息队列'], mode, function (o) {
        mode = o; reset();
        dlog(log, o === '直连数据库' ? '模式:秒杀请求直接打到 DB' : '模式:请求先进 MQ,3 个消费者匀速 550 QPS 落库', 'l-info');
      }));
      bar.appendChild(U.btn('🚀 开启秒杀(模拟 15 秒)', function () {
        reset(); running = true; tick();
        dlog(log, '00:00 秒杀开始,流量洪峰即将到来…', 'l-hl');
      }));
      bar.appendChild(U.btn('↺ 重置', function () { reset(); }, true));
      function reset() {
        running = false; peak = 0; drop = 0; done = 0; t = 0; series = []; bBuffer = 0;
        draw(); paintQueue();
        counter.set('peak', 0); counter.set('drop', 0); counter.set('done', 0);
      }
      body.appendChild(bar);
      body.appendChild(cvs);
      body.appendChild(el('div', 'dm-panel-title', 'MQ 缓冲区(仅队列模式)'));
      body.appendChild(queueSlots);
      body.appendChild(counter);
      body.appendChild(log);
      draw();
      dlog(log, '切模式 → 开启秒杀,对比蓝线的形状:直连是尖刺(会断),走 MQ 是平线(稳)', 'l-info');
    }
  };

  /* ═══════════ 16. AOP 代理链 ═══════════ */
  D['aop-proxy'] = {
    title: 'AOP 代理调用与失效现场',
    subtitle: 'JDK / CGLIB · 正常调用 vs 自调用绕过代理',
    icon: 'leaf',
    mount: function (body) {
      var setTimeout = window.HUB_DEMO_SYSTEM.scheduler(body);
      var proxyType = 'JDK 动态代理';
      var flow = el('div', 'dm-flow');
      var log = U.logArea();
      function renderFlow() {
        flow.innerHTML = '';
        flow.appendChild(U.el('div', 'dm-node', '调用方 userService.login()'));
        flow.appendChild(U.el('div', 'dm-arrow', '→'));
        var px = U.el('div', 'dm-node', proxyType === 'JDK 动态代理' ? '代理($Proxy0 实现同一接口)' : '代理(UserService$$EnhancerByCGLIB 子类)');
        px.setAttribute('data-px', '1');
        flow.appendChild(px);
        flow.appendChild(U.el('div', 'dm-arrow', '→'));
        flow.appendChild(U.el('div', 'dm-node', '目标方法 save()'));
      }
      var bar = el('div', 'dm-toolbar');
      bar.appendChild(U.tabs(['JDK 动态代理', 'CGLIB 子类代理'], proxyType, function (o) {
        proxyType = o; renderFlow();
        dlog(log, o === 'JDK 动态代理'
          ? 'JDK 代理:<b>基于接口</b>反射生成 $Proxy0,所以目标必须有接口(否则报错)'
          : 'CGLIB:<b>继承目标类</b>生成子类覆写方法 —— final 类/方法无法代理', 'l-info');
      }));
      bar.appendChild(U.btn('▶ 正常调用(走代理)', function () {
        log.innerHTML = '';
        flow.querySelectorAll('.dm-node').forEach(function (n) { n.className = 'dm-node'; });
        var nodes = flow.querySelectorAll('.dm-node');
        nodes[0].classList.add('active');
        dlog(log, '① 调用方拿到的是 <b>代理对象</b>(Spring 容器注入的就是它,不是原始 Bean)');
        setTimeout(function () {
          nodes[1].classList.add('active');
          dlog(log, '② 代理前置通知 @Before:记录日志/开启事务/权限校验 …', 'l-ok');
          setTimeout(function () {
            nodes[2].classList.add('done');
            dlog(log, '③ 目标方法 save() 执行完毕');
            setTimeout(function () {
              dlog(log, '④ 代理后置通知 @AfterReturning:提交事务/释放资源 —— <b>切面逻辑全部生效 ✓</b>', 'l-hl');
              nodes[1].classList.add('done');
            }, 700);
          }, 700);
        }, 500);
      }));
      bar.appendChild(U.btn('💥 自调用(事务失效经典)', function () {
        log.innerHTML = '';
        flow.querySelectorAll('.dm-node').forEach(function (n) { n.className = 'dm-node'; });
        var nodes = flow.querySelectorAll('.dm-node');
        nodes[0].classList.add('active');
        dlog(log, '① login() 内部写 this.save() —— this 是<b>原始对象不是代理</b>!');
        setTimeout(function () {
          nodes[2].classList.add('err');
          dlog(log, '② 直接进入目标方法 —— <span class="l-err">@Before/@Transactional 全部被绕过,切面失效!</span>', 'l-err');
          setTimeout(function () {
            dlog(log, '修复:① 注入自身代理(AopContext.currentProxy())② 拆到另一个 Bean ③ 用 AopContext + exposeProxy', 'l-hl');
          }, 800);
        }, 700);
      }));
      body.appendChild(bar);
      body.appendChild(flow);
      body.appendChild(log);
      renderFlow();
      dlog(log, '一句话:AOP 的本质是<b>代理对象包了一层</b>,所有"失效"问题的本质都是<b>没走代理</b>', 'l-info');
    }
  };

  /* ═══════════ 17. 单例模式双检锁竞态 ═══════════ */
  D['singleton'] = {
    title: '双检锁单例:volatile 的必要性',
    subtitle: 'new 的三步指令重排 · 亲眼看到半初始化对象',
    icon: 'gem',
    mount: function (body) {
      var setTimeout = window.HUB_DEMO_SYSTEM.scheduler(body);
      var useVolatile = true;
      var codeLines = [
        'public class Singleton {',
        '  private static /*volatile*/ Singleton instance;',
        '  public static Singleton getInstance() {',
        '    if (instance == null) {            // ① 第一次检查',
        '      synchronized (Singleton.class) {',
        '        if (instance == null) {        // ② 第二次检查',
        '          instance = new Singleton();  // ③ 分配→初始化→赋值',
        '        }',
        '      }',
        '    }',
        '    return instance;',
        '  }',
        '}'
      ];
      var codeBox = el('div', 'demo-log');
      codeBox.style.whiteSpace = 'pre';
      codeBox.style.maxHeight = 'none';
      codeBox.innerHTML = codeLines.map(function (l, i) { return '<div data-ln="' + i + '">' + (i + 1) + '  ' + l.replace(/</g, '&lt;') + '</div>'; }).join('');
      function hl(line) {
        codeBox.querySelectorAll('div').forEach(function (d, i) { d.style.color = i === line ? '#fbbf24' : ''; });
      }
      var aChip = U.el('div', 'dm-thread', '🧵 线程 A <small>idle</small>');
      var bChip = U.el('div', 'dm-thread', '🧵 线程 B <small>idle</small>');
      var instBox = U.el('div', 'dm-lockbox', 'instance = null');
      var log = U.logArea();
      function setChip(chip, s, cls) { chip.querySelector('small').textContent = s; chip.className = 'dm-thread ' + (cls || ''); }
      var bar = el('div', 'dm-toolbar');
      var sw = el('span', 'dm-switch on', '<span class="track"><span class="knob"></span></span><span>volatile 已加</span>');
      sw.addEventListener('click', function () {
        useVolatile = !useVolatile;
        sw.classList.toggle('on', useVolatile);
        sw.querySelector('span:last-child').textContent = useVolatile ? 'volatile 已加' : 'volatile 已去掉';
        codeBox.querySelector('[data-ln="1"]').textContent = '2  ' + (useVolatile
          ? '  private static volatile Singleton instance;'
          : '  private static /*volatile*/ Singleton instance;');
      });
      bar.appendChild(sw);
      bar.appendChild(U.btn('▶ 线程 A 初始化', async function () {
        log.innerHTML = '';
        hl(-1);
        setChip(aChip, '进入同步块', 'working');
        if (!await U.sleepFor(body, 300)) return;
        hl(3); dlog(log, '① A 第一次检查:instance == null ✓', 'l-info');
        if (!await U.sleepFor(body, 400)) return;
        hl(6); dlog(log, '③ A 执行 new:1分配内存 2初始化字段 3把引用赋给 instance', 'l-info');
        if (!await U.sleepFor(body, 500)) return;
        if (!useVolatile) {
          dlog(log, '⚠ 指令重排:实际执行顺序变成 1→<b>3→2</b>(赋值先于初始化)!A 此刻刚好卡在这 —— <span class="l-err">instance 已非 null 但字段还是默认值</span>', 'l-err');
          instBox.innerHTML = 'instance ≠ null,但字段未初始化 💥';
          instBox.className = 'dm-lockbox expired';
        } else {
          instBox.innerHTML = 'instance = 完整对象 ✓(volatile 禁止重排)';
          instBox.className = 'dm-lockbox held';
          dlog(log, 'volatile 保证:new 的三步<b>不会重排</b>,赋值时对象一定已初始化完成', 'l-ok');
        }
        setChip(aChip, '执行中(卡在③)', 'working');
        hl(-1);
      }));
      bar.appendChild(U.btn('🧵 线程 B 抢先进入', async function () {
        setChip(bChip, '尝试获取实例', 'working');
        if (!await U.sleepFor(body, 300)) return;
        hl(3);
        if (!useVolatile) {
          dlog(log, '④ B 第一次检查:instance != null → 直接 return —— <span class="l-err">拿到半成品对象,字段全是默认值,业务炸裂!</span>', 'l-err');
          setChip(bChip, '拿到半初始化对象 💥', 'working');
        } else {
          dlog(log, '④ B 第一次检查:instance != null → return 完整对象 ✓(或如果 A 还没赋值,B 在 synchronized 外排队等 A 完成)', 'l-ok');
          setChip(bChip, '拿到完整对象 ✓', 'working');
        }
        hl(-1);
      }));
      bar.appendChild(U.btn('↺ 重置', function () {
        setChip(aChip, 'idle'); setChip(bChip, 'idle');
        instBox.innerHTML = 'instance = null'; instBox.className = 'dm-lockbox';
        log.innerHTML = ''; hl(-1);
      }, true));
      body.appendChild(bar);
      var row = el('div', 'dm-row');
      row.appendChild(aChip); row.appendChild(bChip);
      body.appendChild(row);
      body.appendChild(instBox);
      body.appendChild(codeBox);
      body.appendChild(log);
      dlog(log, '先"去掉 volatile"再按顺序点两个线程,复现半初始化事故 —— 这就是双检锁必须配 volatile 的原因', 'l-info');
    }
  };

  /* ═══════════ 18. 事务传播行为演示 ═══════════ */
  D['tx-rollback'] = {
    title: '事务传播行为与回滚范围',
    subtitle: 'REQUIRED / REQUIRES_NEW / NESTED · B 抛异常后谁回滚?',
    icon: 'leaf',
    mount: function (body) {
      var setTimeout = window.HUB_DEMO_SYSTEM.scheduler(body);
      var prop = 'REQUIRED';
      var laneA = el('div', 'dm-col'), laneB = el('div', 'dm-col');
      var log = U.logArea();
      var counter = U.counters([{ key: 'a', label: '事务 A 最终', cls: 'ok' }, { key: 'b', label: '事务 B 最终', cls: 'ok' }, { key: 'err', label: '抛出异常', cls: 'danger' }]);

      function lanePanel(title, lane) {
        var p = el('div', 'dm-panel');
        p.appendChild(el('div', 'dm-panel-title', title));
        p.appendChild(lane);
        return p;
      }
      function resetLanes() {
        laneA.innerHTML = ''; laneB.innerHTML = '';
        counter.set('a', '—'); counter.set('b', '—'); counter.set('err', '—');
      }
      function op(lane, text, state) {
        var chip = el('div', 'dm-chip ' + (state === 'rb' ? 'c-red' : state === 'ok' ? 'c-green' : 'c-cyan'),
          (state === 'rb' ? '↩ 已回滚 ' : state === 'ok' ? '✓ 已提交 ' : '● ') + text);
        lane.appendChild(chip);
        return chip;
      }
      var bar = el('div', 'dm-toolbar');
      bar.appendChild(U.tabs(['REQUIRED', 'REQUIRES_NEW', 'NESTED', 'MANDATORY'], prop, function (o) {
        prop = o; resetLanes(); log.innerHTML = '';
        dlog(log, 'ServiceB.methodB() 的传播行为设为 <b>' + o + '</b>,点"播放"看 A 调 B、B 抛异常后的回滚范围', 'l-info');
      }));
      bar.appendChild(U.btn('▶ 播放:A 调用 B,B 抛异常', async function () {
        resetLanes(); log.innerHTML = '';
        dlog(log, '① 请求进入 ServiceA.methodA() 的代理 → <b>开启事务 A</b>', 'l-info');
        if (!await U.sleepFor(body, 500)) return;
        op(laneA, 'A: INSERT order(主流程写入)');
        dlog(log, '② A 执行 SQL:INSERT order');
        if (!await U.sleepFor(body, 600)) return;
        dlog(log, '③ A 内部调用 serviceB.methodB() —— <b>穿过 B 的代理</b>,触发传播规则', 'l-hl');
        if (!await U.sleepFor(body, 400)) return;
        if (prop === 'REQUIRED') {
          op(laneB, 'B: UPDATE stock(加入事务 A)');
          dlog(log, '④ REQUIRED:B 发现已有事务 A → <b>加入同一个事务</b>(两个方法共用一条事务边界)', 'l-hl');
          if (!await U.sleepFor(body, 500)) return;
          op(laneB, 'B: 抛出 RuntimeException', 'rb');
          counter.set('err', 'RuntimeException');
          dlog(log, '⑤ B 抛异常 → 代理把事务 A 标记为 <b>rollback-only</b>,异常继续向 A 上抛', 'l-err');
          if (!await U.sleepFor(body, 600)) return;
          op(laneA, 'A: INSERT order', 'rb');
          op(laneB, 'B: UPDATE stock', 'rb');
          counter.set('a', '回滚'); counter.set('b', '回滚(同生共死)');
          dlog(log, '⑥ 结果:A 和 B 的 SQL <b>全部回滚</b> —— REQUIRED 是"绑在一起"的语义', 'l-err');
          dlog(log, '面试深挖:即使 A 里 try-catch 吞掉异常,提交时仍抛 <b>UnexpectedRollbackException</b>(rollback-only 已标记)', 'l-hl');
        } else if (prop === 'REQUIRES_NEW') {
          dlog(log, '④ REQUIRES_NEW:<b>挂起事务 A</b>,为 B 新开一个独立事务(占用两条数据库连接)', 'l-hl');
          if (!await U.sleepFor(body, 400)) return;
          op(laneB, 'B: UPDATE stock(独立事务)');
          if (!await U.sleepFor(body, 500)) return;
          op(laneB, 'B: 抛出 RuntimeException', 'rb');
          counter.set('err', 'RuntimeException');
          dlog(log, '⑤ B 异常 → <b>只回滚 B 自己的事务</b>,A 的连接随后恢复并正常提交', 'l-err');
          if (!await U.sleepFor(body, 600)) return;
          op(laneA, 'A: INSERT order(A 未再抛异常 → 正常提交)');
          counter.set('a', '提交 ✓'); counter.set('b', '回滚(各自独立)');
          dlog(log, '⑥ 结果:B 回滚、A 提交 —— 典型场景:<b>操作日志必须记录成功,哪怕业务失败</b>', 'l-ok');
          dlog(log, '注意:REQUIRES_NEW 占第二条连接,连接池小的时候要警惕连接耗尽互相等待', 'l-hl');
        } else if (prop === 'NESTED') {
          op(laneB, 'B: SAVEPOINT sp1 + UPDATE stock');
          dlog(log, '④ NESTED:在事务 A 内设置<b>保存点 savepoint</b>,B 逻辑上是 A 的子事务(同一条连接)', 'l-hl');
          if (!await U.sleepFor(body, 500)) return;
          op(laneB, 'B: 抛出 RuntimeException', 'rb');
          counter.set('err', 'RuntimeException');
          dlog(log, '⑤ B 异常 → 回滚到保存点,A 主体不受影响', 'l-err');
          if (!await U.sleepFor(body, 600)) return;
          op(laneB, 'B: UPDATE stock', 'rb');
          op(laneA, 'A: INSERT order(继续提交)');
          counter.set('a', '提交 ✓'); counter.set('b', '回滚到保存点');
          dlog(log, '⑥ 结果:B 局部回滚,A 最终提交 —— <b>JDBC Savepoint 实现,并非独立事务</b>', 'l-ok');
        } else {
          counter.set('err', 'IllegalTransactionStateException');
          dlog(log, '④ MANDATORY:B 要求<b>必须已存在事务</b>,这里没有 → 直接抛 IllegalTransactionStateException', 'l-err');
          dlog(log, '用它保护"绝不允许脱离事务执行"的方法,是七种传播行为里的防御型选手', 'l-hl');
          counter.set('a', '回滚(异常中断)'); counter.set('b', '未执行');
        }
      }));
      bar.appendChild(U.btn('↺ 重置', function () { resetLanes(); log.innerHTML = ''; }, true));
      body.appendChild(bar);
      var row = el('div', 'dm-row');
      row.appendChild(lanePanel('事务 A · ServiceA.methodA()', laneA));
      row.appendChild(lanePanel('事务 B · ServiceB.methodB()', laneB));
      body.appendChild(row);
      body.appendChild(counter);
      body.appendChild(log);
      dlog(log, '速记:<b>REQUIRED 同生共死 / REQUIRES_NEW 各过各的 / NESTED 留个后悔药</b>', 'l-info');
    }
  };
})();
