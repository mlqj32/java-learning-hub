/* ═══════════════════════════════════════════════════
   SVG 图解库 · 第二批(MySQL / MQ / Linux / 设计模式 / Redis / 逆向)
   ═══════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.DIAGRAMS = window.DIAGRAMS || {};
  var D = window.DG.D;

  /* ═══════════ MySQL ═══════════ */

  /* 1. MySQL 三层架构 */
  DIAGRAMS['d-mysqlarch'] = {
    title: 'MySQL 三层楼 —— 从点单到出菜',
    caption: '迎宾(连接层)验证身份;前厅(服务层)解析和优化"这单怎么做";后厨(存储引擎)真正存取数据;账本(日志)记录每一笔。',
    svg: (function () {
      var g = D(840, 460);
      g.box(20, 30, 800, 56, { c: '#94a3b8', t: '客户端(JDBC/命令行)', sub: '连接池:Druid/HikariCP 提前备好"迎宾员"', e: '🧑‍💼' });
      g.box(20, 110, 800, 90, { c: '#22d3ee', t: '连接层 Connection Layer', sub: 'TCP 握手 / 账号密码认证 / 权限校验 / 连接管理', e: '🚪' });
      g.rect(20, 224, 800, 120, '#818cf8', { rx: 14, fill: 'rgba(129,140,248,.05)' });
      g.text(420, 250, '服务层 Server Layer(MySQL 的大脑 🧠)', 'dg-title');
      g.box(45, 262, 150, 44, { c: '#818cf8', t: '查询缓存', sub: '8.0 已删除,别再答' });
      g.box(210, 262, 150, 44, { c: '#818cf8', t: '解析器 Parser', sub: '词法/语法 → 语法树' });
      g.box(375, 262, 150, 44, { c: '#818cf8', t: '优化器 Optimizer', sub: '选索引/决定 join 顺序' });
      g.box(540, 262, 150, 44, { c: '#818cf8', t: '执行器 Executor', sub: '按计划调用引擎' });
      g.text(420, 332, '一条 SQL 的"翻译+决策"都在这层完成', 'dg-sub');
      g.box(20, 370, 520, 70, { c: '#34d399', t: '存储引擎层(后厨 🍳)', sub: 'InnoDB(默认,事务/行锁/MVCC) · MyISAM(无事务)' });
      g.box(580, 370, 240, 70, { c: '#fbbf24', t: '文件系统 & 日志', sub: 'ibd 文件 / redo / undo / binlog' });
      g.arrow(420, 86, 420, 106);
      g.arrow(420, 200, 420, 220);
      g.arrow(420, 344, 420, 366);
      g.arrow(560, 405, 578, 405);
      return g.done();
    })()
  };

  /* 2. B+ 树结构 */
  DIAGRAMS['d-bptree'] = {
    title: 'B+ 树 —— 一本自带"下一页"链接的字典',
    caption: '目录层只放路由(不存数据),叶子层才放行数据,叶子之间手拉手双向链表 —— 范围查询顺着链走,不用回到树顶。',
    svg: (function () {
      var g = D(820, 360);
      g.box(280, 30, 260, 50, { c: '#22d3ee', t: '根节点(常驻内存)', sub: '只存索引,不存数据 🧭' });
      g.box(80, 130, 180, 54, { c: '#818cf8', t: '内部节点', sub: '继续导航 1~50' });
      g.box(320, 130, 180, 54, { c: '#818cf8', t: '内部节点', sub: '导航 51~100' });
      g.box(560, 130, 180, 54, { c: '#818cf8', t: '内部节点', sub: '导航 101~150' });
      g.arrow(330, 80, 200, 126, { sw: 1.2 });
      g.arrow(400, 80, 400, 126, { sw: 1.2 });
      g.arrow(470, 80, 600, 126, { sw: 1.2 });
      var xs = [50, 240, 430, 620];
      var vals = [['1', '18', '32'], ['35', '47', '50'], ['52', '77', '98'], ['102', '130', '149']];
      for (var i = 0; i < 4; i++) {
        var x = xs[i];
        g.rect(x, 230, 160, 50, '#34d399', { rx: 6, fill: 'rgba(52,211,153,.08)' });
        for (var k = 0; k < 3; k++) {
          g.text(x + 32 + k * 48, 260, vals[i][k], 'dg-label', { fill: '#a7f3d0', weight: 700 });
          if (k < 2) g.line2(x + 64 + k * 48, 242, x + 64 + k * 48, 268, '#34d399');
        }
        g.text(x + 80, 296, '叶子页(page)', 'dg-sub');
      }
      g.arrow(130, 184, 130, 226, { sw: 1.2 });
      g.arrow(320, 184, 320, 226, { sw: 1.2 });
      g.arrow(510, 184, 510, 226, { sw: 1.2 });
      g.arrow(700, 184, 700, 226, { sw: 1.2 });
      /* 叶子链表 */
      g.arrow(210, 255, 240, 255, { c: '#34d399', sw: 1.2 });
      g.arrow(400, 255, 430, 255, { c: '#34d399', sw: 1.2 });
      g.arrow(590, 255, 620, 255, { c: '#34d399', sw: 1.2 });
      g.arrow(240, 270, 210, 270, { c: '#fbbf24', sw: 1.2, dash: true });
      g.arrow(430, 270, 400, 270, { c: '#fbbf24', sw: 1.2, dash: true });
      g.arrow(620, 270, 590, 270, { c: '#fbbf24', sw: 1.2, dash: true });
      g.text(420, 330, '叶子之间双向链表 ⇄ —— 范围查询 / order by 顺藤摸瓜', 'dg-sub');
      g.chip(40, 40, '3 层 ≈ 2000 万行', '#34d399');
      g.chip(628, 60, '一次查询 3 次磁盘 IO 💽', '#22d3ee');
      return g.done();
    })()
  };

  /* ═══════════ MQ ═══════════ */

  /* 3. RabbitMQ 四种 Exchange 路由 */
  DIAGRAMS['d-rabbit-route'] = {
    title: 'RabbitMQ 的四种分拨中心',
    caption: 'Direct 按精确门牌投递;Topic 按通配符小区投(Fanout 是全区广播);Headers 看包裹面单标签。',
    svg: (function () {
      var g = D(860, 380);
      var cols = [
        ['Direct 🎯', '#22d3ee', 'routingKey 完全相等', 'order.pay', 'q.pay ✅', 'q.sms ❌'],
        ['Topic 🌐', '#c084fc', '通配符 * 一词 / # 多词', 'order.*.cn', 'q.order ✅', 'q.pay ❌'],
        ['Fanout 📢', '#fbbf24', '无视 key,全家广播', '(无)', 'q.A ✅', 'q.B ✅'],
        ['Headers 🏷️', '#34d399', '看 header 键值对', 'type=pay', 'q.x ✅', 'q.y ❌']
      ];
      for (var i = 0; i < 4; i++) {
        var x = 20 + i * 210;
        g.rect(x, 30, 195, 250, cols[i][1], { rx: 12, fill: 'rgba(13,20,40,.92)' });
        g.text(x + 97, 56, cols[i][0], 'dg-title', { fill: cols[i][1] });
        g.text(x + 97, 80, cols[i][2], 'dg-sub');
        g.box(x + 25, 100, 145, 40, { c: cols[i][1], t: 'Exchange', sub: '分拨中心' });
        g.arrow(x + 97, 140, x + 97, 168, { c: cols[i][1], sw: 1.3, t: cols[i][3] });
        g.box(x + 25, 172, 145, 34, { c: cols[i][1], t: 'Queue' });
        g.text(x + 97, 232, cols[i][4], 'dg-label', { fill: '#a7f3d0', weight: 700 });
        g.text(x + 97, 252, cols[i][5], 'dg-label', { fill: '#fda4af' });
      }
      g.text(430, 320, 'Producer 只认 Exchange,Queue 的绑定规则决定"谁能收到" 🎁', 'dg-sub');
      return g.done();
    })()
  };

  /* 4. Kafka 架构 */
  DIAGRAMS['d-kafka-arch'] = {
    title: 'Kafka 世界观 —— 中央仓库的分区货架',
    caption: '一个 Topic 拆成多个分区，每个分区有 leader 与 follower。传统消费者组中，同一分区分配给组内一个消费者，一个消费者可分配多个分区；不同组分别维护进度。',
    svg: (function () {
      var g = D(860, 360);
      g.box(20, 130, 130, 80, { c: '#22d3ee', t: 'Producer', sub: '生产者 📤', e: '🏭' });
      g.rect(240, 30, 400, 260, '#818cf8');
      g.text(440, 62, 'Topic: order-topic（3 分区）', 'dg-title');
      var px = [265, 390, 515];
      for (var i = 0; i < 3; i++) {
        g.box(px[i], 90, 110, 80, { c: '#a3e635', t: 'P' + i + ' Leader', sub: '接单 ✍️' });
        g.box(px[i], 185, 110, 80, { c: '#64748b', t: 'Follower', sub: '同步备份' });
        g.arrow(px[i] + 55, 170, px[i] + 55, 185, { sw: 1.1, dash: true });
      }
      g.arrow(150, 170, 262, 130, { t: '按 key 分区' });
      g.box(680, 90, 160, 80, { c: '#fbbf24', t: 'Consumer Group A', sub: 'C1→P0 C2→P1 C3→P2', e: '👥' });
      g.box(680, 200, 160, 80, { c: '#c084fc', t: 'Consumer Group B', sub: '自己的 offset 互不影响' });
      g.arrow(655, 120, 678, 120, { c: '#fbbf24', sw: 1.3 });
      g.arrow(655, 210, 678, 225, { c: '#c084fc', sw: 1.3 });
      g.text(430, 316, '分区内按序读取；业务并行处理与重试仍需维护顺序', 'dg-sub');
      g.chip(30, 40, '顺序写 + 零拷贝 = 快 🚀', '#22d3ee');
      return g.done();
    })()
  };

  /* ═══════════ Linux ═══════════ */

  /* 5. 管道流水线 */
  DIAGRAMS['d-pipeline'] = {
    title: 'Shell 管道 —— 一条日志的流水线之旅',
    caption: 'grep 是筛选员,awk 是车床,sort/uniq 是分拣员,竖线是传送带 —— 每个工人只干一件事,组合起来就是数据分析。',
    svg: (function () {
      var g = D(880, 250);
      g.box(20, 90, 120, 70, { c: '#94a3b8', t: 'cat 日志', sub: 'access.log' });
      g.arrow(140, 125, 175, 125, { t: '|' });
      g.box(175, 90, 130, 70, { c: '#22d3ee', t: 'grep "ERROR"', sub: '筛出错误行 🔎' });
      g.arrow(305, 125, 340, 125, { t: '|' });
      g.box(340, 90, 140, 70, { c: '#fbbf24', t: 'awk {print $1}', sub: '只留第 1 列 IP ✂️' });
      g.arrow(480, 125, 515, 125, { t: '|' });
      g.box(515, 90, 130, 70, { c: '#c084fc', t: 'sort | uniq -c', sub: '分组计数 📊' });
      g.arrow(645, 125, 680, 125, { t: '|' });
      g.box(680, 90, 160, 70, { c: '#34d399', t: 'sort -rn | head', sub: 'Top 10 榜单 🏆' });
      g.text(430, 200, '每个进程的输出塞进下一个进程的输入 —— 传送带永不落地(管道缓冲区 64KB)', 'dg-sub');
      return g.done();
    })()
  };

  /* ═══════════ 设计模式 UML ═══════════ */

  /* 6. 三种工厂 UML */
  DIAGRAMS['d-factory-uml'] = {
    title: '简单工厂 vs 工厂方法 vs 抽象工厂',
    caption: '包子铺(简单工厂)一个窗口全做,加新品种要改窗口;品牌加盟(工厂方法)每家店一个专用窗口;中央厨房(抽象工厂)一整套菜系打包。',
    svg: (function () {
      var g = D(880, 400);
      /* 简单工厂 */
      g.text(150, 30, '简单工厂(包子铺 🥟)', 'dg-title', { fill: '#22d3ee' });
      g.uml(30, 50, 190, 'SimpleFactory', ['+ create(type)'], ['if/switch 判断'], '#22d3ee');
      g.uml(30, 180, 190, 'Product', [], ['+ use()'], '#22d3ee', { stereo: '«interface»' });
      g.arrow(125, 132, 125, 176, { hollow: true, dash: true });
      g.chip(30, 270, '新增产品 → 改工厂源码 ❌', '#fb7185');
      /* 工厂方法 */
      g.text(430, 30, '工厂方法(品牌加盟 🏪)', 'dg-title', { fill: '#34d399' });
      g.uml(320, 50, 200, 'Factory', [], ['+ create()'], '#34d399', { stereo: '«abstract»' });
      g.uml(300, 160, 110, 'PayFactory', [], ['create()'], '#34d399');
      g.uml(430, 160, 110, 'SmsFactory', [], ['create()'], '#34d399');
      g.arrow(355, 160, 390, 140, { hollow: true });
      g.arrow(485, 160, 450, 140, { hollow: true });
      g.chip(300, 252, '新增产品 → 新增工厂类,不改旧码 ✅', '#34d399');
      /* 抽象工厂 */
      g.text(720, 30, '抽象工厂(中央厨房 👨‍🍳)', 'dg-title', { fill: '#c084fc' });
      g.uml(620, 50, 200, 'AbstractFactory', [], ['createA()', 'createB()'], '#c084fc', { stereo: '一整套产品族' });
      g.uml(590, 180, 110, 'WinFactory', [], ['WinBtn', 'WinBox'], '#c084fc');
      g.uml(720, 180, 110, 'MacFactory', [], ['MacBtn', 'MacBox'], '#c084fc');
      g.arrow(645, 180, 680, 145, { hollow: true });
      g.arrow(775, 180, 740, 145, { hollow: true });
      g.chip(600, 272, '产品族扩展容易,新产品线难 ❗', '#fbbf24');
      return g.done();
    })()
  };

  /* 7. 装饰器 UML */
  DIAGRAMS['d-decorator-uml'] = {
    title: '装饰器 UML —— 一杯奶茶的无限加料',
    caption: 'Decorator 持有同类型的 Component(怀里抱着一杯茶),调用时先加料再委托给怀里的那杯 —— 套几层都不会爆。',
    svg: (function () {
      var g = D(820, 380);
      g.uml(300, 30, 210, 'Component(茶 ☕)', [], ['+ cost()', '+ desc()'], '#22d3ee', { stereo: '«interface»' });
      g.uml(60, 150, 200, 'MilkTea(基础茶)', ['- price = 12'], ['cost() → 12'], '#22d3ee');
      g.uml(520, 150, 230, 'Decorator(料盒)', ['- component: Component', '  怀里的那杯茶 🧋'], ['cost() 委托'], '#c084fc', { stereo: '«abstract»' });
      g.arrow(160, 150, 300, 120, { hollow: true, dash: true });
      g.arrow(635, 150, 510, 120, { hollow: true, dash: true });
      g.arrow(560, 250, 200, 200, { hollow: true, dash: true, t: '持有(聚合)◇' });
      g.uml(500, 270, 130, 'Pearl(珍珠)', ['+3 元'], ['cost()+3'], '#fbbf24');
      g.uml(650, 270, 130, 'Cream(奶盖)', ['+5 元'], ['cost()+5'], '#fbbf24');
      g.arrow(555, 270, 570, 250, { hollow: true });
      g.arrow(715, 270, 690, 250, { hollow: true });
      g.chip(40, 300, 'new Cream(new Pearl(new MilkTea())).cost() = 20', '#34d399');
      return g.done();
    })()
  };

  /* 8. 观察者 UML */
  DIAGRAMS['d-observer-uml'] = {
    title: '观察者 UML —— 公众号与它的粉丝',
    caption: 'Subject 维护粉丝名单,状态一变挨个 notify;粉丝只实现 update,随时可以关注/取关 —— 发布者和接收者互不拖累。',
    svg: (function () {
      var g = D(820, 340);
      g.uml(280, 30, 240, 'Subject(公众号)', ['- observers: List 📇'], ['+ attach()', '+ detach()', '+ notify()'], '#c084fc', { stereo: '«abstract» 被观察者' });
      g.uml(560, 30, 200, 'Observer(粉丝)', [], ['+ update(msg)'], '#22d3ee', { stereo: '«interface»' });
      g.uml(260, 180, 280, 'WeChatAccount 公众号', ['- fans'], ['publish() → notify 全部'], '#c084fc');
      g.arrow(400, 180, 380, 150, { hollow: true, dash: true, t: '继承' });
      g.uml(540, 170, 120, 'FanA 粉丝甲', [], ['update() 📱'], '#a3e635');
      g.uml(675, 170, 120, 'FanB 粉丝乙', [], ['update() 📱'], '#a3e635');
      g.arrow(600, 170, 620, 135, { hollow: true, dash: true });
      g.arrow(735, 170, 700, 135, { hollow: true, dash: true });
      g.arrow(540, 240, 500, 240, { c: '#c084fc', t: 'notify 📢' });
      g.chip(60, 210, '注册即订阅,取关即 detach', '#fbbf24');
      g.chip(60, 250, 'Spring 事件机制就是它', '#34d399');
      g.text(430, 300, '一对多的变化通知:发布者不需要认识具体粉丝是谁', 'dg-sub');
      return g.done();
    })()
  };

  /* ═══════════ Redis ═══════════ */

  /* 9. Redis 五大数据类型 */
  DIAGRAMS['d-redis5'] = {
    title: 'Redis 的数据结构武器库',
    caption: '五大基本类型各配一种底层结构,四个特化类型专治场景题:签到用 Bitmap、UV 用 HyperLogLog、附近的人用 GEO、可靠队列用 Stream。',
    svg: (function () {
      var g = D(860, 330);
      var items = [
        ['String 🧊', 'SDS 动态字符串', '#22d3ee', '缓存/计数/锁'],
        ['List 🚃', 'quicklist 车厢', '#818cf8', '消息队列/时间线'],
        ['Hash 📋', 'listpack/字典', '#c084fc', '对象/购物车'],
        ['Set 🎲', 'intset/哈希', '#34d399', '去重/共同好友'],
        ['ZSet 🏆', '跳表+字典', '#fbbf24', '排行榜/延迟队列']
      ];
      for (var i = 0; i < 5; i++) {
        var x = 20 + i * 167;
        g.rect(x, 30, 152, 130, items[i][2], { rx: 12, fill: 'rgba(13,20,40,.92)' });
        g.text(x + 76, 62, items[i][0], 'dg-title');
        g.text(x + 76, 88, items[i][1], 'dg-sub');
        g.chip(x + 16, 112, items[i][3], items[i][2]);
      }
      g.text(430, 190, '— 进阶特化 · 场景题专用 —', 'dg-sub');
      var adv = [
        ['Bitmap ⚡', '签到/活跃 bitmap 位图', '#22d3ee'],
        ['HyperLogLog 📊', '亿级 UV 12KB', '#c084fc'],
        ['GEO 📍', '附近的人', '#34d399'],
        ['Stream 🌊', '消费者组队列', '#fbbf24']
      ];
      for (var j = 0; j < 4; j++) {
        var x2 = 40 + j * 205;
        g.box(x2, 220, 185, 70, { c: adv[j][2], t: adv[j][0], sub: adv[j][1] });
      }
      return g.done();
    })()
  };

  /* 10. Redis 事件循环 */
  DIAGRAMS['d-eventloop'] = {
    title: 'Redis 单线程 Reactor —— 一个服务员管全场',
    caption: '所有连接都注册到 epoll 收发室;谁有菜好了(就绪)只报谁;一个线程挨个处理,命令执行全程无锁。',
    svg: (function () {
      var g = D(820, 320);
      g.box(20, 30, 190, 46, { c: '#94a3b8', t: '客户端连接 ×10000', e: '👥' });
      g.arrow(115, 76, 115, 110, { sw: 1.3 });
      g.box(20, 114, 190, 90, { c: '#22d3ee', t: 'epoll 收发室', sub: '注册 fd + 就绪链表' });
      g.arrow(210, 160, 250, 160, { t: '只报就绪的 📣' });
      g.box(250, 90, 260, 150, { c: '#818cf8' });
      g.text(380, 118, '🔄 单线程事件循环', 'dg-title');
      g.text(380, 146, 'while(true) {', 'dg-sub');
      g.text(380, 172, 'epoll_wait → 执行命令 → 回写', 'dg-sub');
      g.text(380, 198, '命令串行执行 = 无锁 + 原子', 'dg-label', { fill: '#34d399' });
      g.text(380, 222, '}', 'dg-sub');
      g.arrow(510, 130, 545, 130, { t: '执行' });
      g.box(545, 95, 130, 70, { c: '#fbbf24', t: '数据', sub: '内存 😴 快' });
      g.arrow(510, 205, 545, 205, { t: '6.0 IO线程', dash: true });
      g.box(545, 185, 130, 70, { c: '#34d399', t: 'IO 多线程', sub: '读包/回写并行' });
      g.chip(545, 280, '慢命令会卡住全场:KEYS / 大 key ❌', '#fb7185');
      return g.done();
    })()
  };

  /* 11. 哨兵拓扑 */
  DIAGRAMS['d-sentinel'] = {
    title: '哨兵集群 —— 主库倒下了,谁来接班?',
    caption: '多个哨兵同时监控;多数认为主库挂了才"客观下线";哨兵内部选一个队长执行切换:按优先级/offset 选出新主,通知客户端。',
    svg: (function () {
      var g = D(820, 350);
      g.box(310, 22, 200, 60, { c: '#fb7185', t: 'Master 主库', sub: '写请求都给它 ✍️', e: '👑' });
      g.box(80, 150, 150, 60, { c: '#38bdf8', t: 'Slave 1', sub: '读 + 备份' });
      g.box(310, 150, 150, 60, { c: '#38bdf8', t: 'Slave 2', sub: '读 + 备份' });
      g.box(540, 150, 150, 60, { c: '#38bdf8', t: 'Slave 3', sub: '读 + 备份' });
      g.arrow(410, 82, 370, 146, { dash: true, sw: 1.2 });
      g.arrow(410, 82, 250, 146, { dash: true, sw: 1.2 });
      g.arrow(410, 82, 540, 146, { dash: true, sw: 1.2 });
      g.box(30, 260, 120, 46, { c: '#c084fc', t: 'Sentinel 🛡️', e: '👀' });
      g.box(180, 260, 120, 46, { c: '#c084fc', t: 'Sentinel 🛡️' });
      g.box(330, 260, 120, 46, { c: '#c084fc', t: 'Sentinel 🛡️' });
      g.arrow(90, 260, 330, 86, { c: '#c084fc', dash: true, sw: 1, t: 'PING 每秒' });
      g.arrow(450, 290, 620, 214, { c: '#34d399', sw: 1.4, t: '故障转移:晋升新主 🎉' });
      g.chip(560, 270, 'quorum=2:两个哨兵说挂了才算数', '#c084fc');
      g.chip(560, 305, '客户端订阅 +switch-master', '#22d3ee');
      return g.done();
    })()
  };

  /* ═══════════ 逆向工程 ═══════════ */

  /* 12. 逆向全景 */
  DIAGRAMS['d-reverse-overview'] = {
    title: '逆向工程全景 —— 三种看穿黑盒的方法',
    caption: '黑盒程序(游戏/App)内部不可见。静态分析像"读图纸"(反编译不运行);动态分析像"盯监控"(调试器边跑边看);内存修改像"改账本"(直接改运行时数值)。',
    svg: (function () {
      var g = D(860, 360);
      g.box(340, 20, 180, 70, { c: '#94a3b8', t: '黑盒程序 📦', sub: 'PVZ.exe / app.apk', e: '❓' });
      g.arrow(370, 90, 220, 150, { t: '静态分析' });
      g.arrow(430, 90, 430, 150, { t: '动态分析' });
      g.arrow(490, 90, 640, 150, { t: '内存修改' });
      g.box(60, 155, 240, 120, { c: '#22d3ee', t: '静态分析(读图纸 📜)', sub: '反编译 .class/.dex/ELF', e: '🔍' });
      g.text(180, 250, 'JADX / javap / IDA / Ghidra', 'dg-label', { fill: '#7dd3fc' });
      g.box(310, 155, 240, 120, { c: '#c084fc', t: '动态分析(盯监控 📹)', sub: '断点/单步/看内存与寄存器', e: '🔬' });
      g.text(430, 250, 'x64dbg / Frida / Xposed', 'dg-label', { fill: '#d8b4fe' });
      g.box(560, 155, 240, 120, { c: '#fbbf24', t: '内存修改(改账本 ✏️)', sub: '扫描数值 → 定位地址 → 改写', e: '🎯' });
      g.text(680, 250, 'Cheat Engine / GameGuardian', 'dg-label', { fill: '#fde68a' });
      g.rect(120, 300, 620, 44, '#fb7185', { rx: 10, fill: 'rgba(251,113,133,.07)', dash: true });
      g.text(430, 327, '⚠️ 法律红线:仅限自己的程序 / CTF / 授权测试;不碰线上游戏与他人软件', 'dg-label', { fill: '#fda4af', weight: 700 });
      return g.done();
    })()
  };

  /* 13. PVZ 内存扫描 */
  DIAGRAMS['d-pvz-memory'] = {
    title: 'PVZ 金币修改 —— 在内存里"找那一格"',
    caption: '金币在内存里就是一个 4 字节整数。反复"花点钱 → 搜索新值"缩小范围,直到只剩几个地址,改成 9999 就行 —— 这就是扫描器的全部原理。',
    svg: (function () {
      var g = D(860, 360);
      g.text(430, 26, '进程内存(简化示意,每格 4 字节)', 'dg-title');
      var cells = [
        ['0x18A0', '925'], ['0x18A4', '0'], ['0x18A8', '77'], ['0x18AC', '925'],
        ['0x18B0', '13'], ['0x18B4', '925'], ['0x18B8', '0'], ['0x18BC', '4']
      ];
      for (var i = 0; i < 8; i++) {
        var x = 40 + i * 100;
        var hot = i === 1 || i === 5;
        g.rect(x, 50, 88, 56, hot ? '#fb7185' : '#334155', { rx: 8, fill: hot ? 'rgba(251,113,133,.12)' : 'rgba(51,65,85,.25)' });
        g.text(x + 44, 72, cells[i][0], 'dg-sub');
        g.text(x + 44, 94, cells[i][1], 'dg-label', { fill: hot ? '#fda4af' : '#9fb0c8', weight: 700 });
      }
      g.arrow(150, 106, 190, 130, { sw: 1.2 });
      g.arrow(580, 106, 600, 130, { sw: 1.2 });
      g.box(120, 134, 280, 64, { c: '#22d3ee', t: '第 1 次扫描:精确值 "925"', sub: '命中 3 个地址(金币只是其中之一)' });
      g.box(440, 134, 300, 64, { c: '#fbbf24', t: '第 2 次:花掉 25 → 扫 "900"', sub: '只剩 1 个地址 ✅' });
      g.arrow(300, 198, 430, 220, { dash: true });
      g.box(440, 220, 300, 60, { c: '#34d399', t: '锁定并改写 = 9999', sub: '金币瞬间暴涨 💰' });
      g.chip(60, 240, '关键:数值变化前后各扫一次', '#22d3ee');
      g.chip(60, 274, '多级指针:重启后地址变 → 找基址', '#c084fc');
      g.chip(60, 308, '单机学习专用,线上游戏 = 违规 ⚠️', '#fb7185');
      return g.done();
    })()
  };

  /* 14. 透视外挂原理 */
  DIAGRAMS['d-esp-pipeline'] = {
    title: '透视外挂原理 —— 从内存坐标到屏幕方框',
    caption: '外挂进程读取游戏内存里敌人坐标 → 用世界坐标转屏幕坐标公式算位置 → 在游戏窗口上盖一层透明窗口画框。理解它,才知道反作弊在防什么。',
    svg: (function () {
      var g = D(900, 430);
      /* 上排:四步流水线 */
      g.box(20, 36, 165, 88, { c: '#22d3ee', t: '游戏进程', sub: '敌人结构体:坐标 XYZ', e: '🎮' });
      g.arrow(185, 80, 222, 80, {});
      g.box(222, 36, 195, 88, { c: '#fbbf24', t: '读内存', sub: 'ReadProcessMemory 拿坐标' });
      g.arrow(417, 80, 454, 80, {});
      g.box(454, 36, 205, 88, { c: '#c084fc', t: '世界 → 屏幕 W2S', sub: '投影矩阵 × 世界坐标 📐' });
      g.arrow(659, 80, 696, 80, {});
      g.box(696, 36, 184, 88, { c: '#34d399', t: '透明覆盖层', sub: 'Overlay 窗口 🖥️' });
      /* 屏幕示意(独立居中,不与标签同列) */
      g.rect(260, 160, 380, 150, '#64748b', { rx: 10, fill: 'rgba(13,20,40,.92)' });
      g.text(450, 184, '你的屏幕(游戏画面)', 'dg-sub');
      g.rect(310, 204, 90, 82, '#fb7185', { rx: 4, dash: true, fill: 'rgba(251,113,133,.05)' });
      g.text(355, 200, '敌人方框 🎯', 'dg-label', { fill: '#fda4af' });
      g.rect(480, 218, 80, 60, '#fb7185', { rx: 4, dash: true, fill: 'rgba(251,113,133,.05)' });
      g.text(520, 214, '墙后敌人', 'dg-label', { fill: '#fda4af' });
      g.arrow(790, 124, 646, 168, { dash: true, t: '叠加绘制', dx: 34, dy: 0 });
      /* 说明标签:底部整行,避开示意框 */
      g.chip(24, 340, '为什么叫 ESP:Extra Sensory Perception', '#c084fc');
      g.chip(330, 340, '反作弊:句柄检测 / 内存加密 / 完整性校验', '#22d3ee');
      g.chip(24, 382, '学习防御逻辑 ✅ | 线上游戏使用 ❌ 封号 + 违法', '#fb7185');
      return g.done();
    })()
  };

  /* 15. APK 结构 */
  DIAGRAMS['d-apk-structure'] = {
    title: 'APK 解剖图 —— 一个 ZIP 包的内心世界',
    caption: 'APK 本质是 ZIP:classes.dex 是字节码(dex 格式,smali 是它的汇编),resources.arsc 是资源索引表,AndroidManifest 是身份证;改完必须重新签名才能装。',
    svg: (function () {
      var g = D(880, 400);
      g.box(30, 40, 160, 90, { c: '#22d3ee', t: 'app.apk 📦', sub: '本质 = ZIP 压缩包', e: '🎁' });
      var x = 250;
      var rows = [
        ['classes.dex', 'Dalvik 字节码(JVM 的亲戚)⚙️', '#c084fc'],
        ['resources.arsc', '资源索引表:字符串/尺寸/颜色 🗂️', '#fbbf24'],
        ['res/', '图片 / 布局 XML / values 🖼️', '#34d399'],
        ['AndroidManifest.xml', '包名·权限·组件声明 🪪', '#22d3ee'],
        ['lib/arm64-v8a/*.so', 'C/C++ 原生库(游戏的肉在这)🧬', '#fb7185'],
        ['META-INF/', '签名文件(改包后必须重签)✍️', '#94a3b8']
      ];
      for (var i = 0; i < rows.length; i++) {
        var y = 30 + i * 54;
        g.arrow(x - 10, 85, x + 6, y + 22, { sw: 1, dash: true });
        g.rect(x + 10, y, 330, 42, rows[i][2], { rx: 8 });
        g.text(x + 30, y + 26, rows[i][0], 'dg-label', { anchor: 'start', fill: rows[i][2], weight: 700 });
        g.text(x + 175, y + 26, rows[i][1], 'dg-sub', { anchor: 'start' });
      }
      g.box(650, 40, 200, 80, { c: '#34d399', t: 'apktool d', sub: '→ smali + 可读资源' });
      g.box(650, 140, 200, 80, { c: '#818cf8', t: 'JADX', sub: '→ 近似 Java 源码' });
      g.box(650, 240, 200, 80, { c: '#fbbf24', t: 'apktool b + apksigner', sub: '→ 重打包 + 签名' });
      g.arrow(600, 70, 648, 75);
      g.arrow(600, 140, 648, 170);
      g.arrow(600, 260, 648, 280);
      g.chip(640, 345, '学习/安全审计用,别碰别人 App 🛡️', '#fb7185');
      return g.done();
    })()
  };
})();
