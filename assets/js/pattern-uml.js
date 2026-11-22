/* Design-pattern UML atlas. Local SVG, semantic UML edges, no external renderer. */
(function () {
  'use strict';
  var atlas = {}, seq = 0;
  var colors = { contract: '#8bb9ff', concrete: '#62dbbf', context: '#c5a5ff', value: '#f5cd85' };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
  function n(id, name, role, attrs, methods, col, row, tone) {
    return { id: id, name: name, role: role, attrs: attrs, methods: methods, x: 40 + col * 390, y: 52 + row * 350, w: 280, tone: tone || 'concrete' };
  }
  function e(from, to, type, label, fromSide, toSide, options) {
    var edge = { from: from, to: to, type: type, label: label || '', fromSide: fromSide || 'top', toSide: toSide || 'bottom' };
    Object.keys(options || {}).forEach(function (k) { edge[k] = options[k]; }); return edge;
  }
  function place(node, x, w) { node.x = x; node.w = w; return node; }
  function text(x, y, value, cls, anchor, max) {
    return '<text x="' + x + '" y="' + y + '" class="' + cls + '" text-anchor="' + (anchor || 'start') + '" data-max-width="' + (max || 250) + '">' + esc(value) + '</text>';
  }
  function height(node) { return 68 + (Math.max(1, node.attrs.length) + Math.max(1, node.methods.length)) * 23 + 24; }
  function port(node, side, fraction) {
    var f = fraction === undefined ? 0.5 : fraction;
    if (side === 'top') return [node.x + node.w * f, node.y];
    if (side === 'bottom') return [node.x + node.w * f, node.y + node.h];
    if (side === 'left') return [node.x, node.y + node.h * f];
    return [node.x + node.w, node.y + node.h * f];
  }
  var legends = { inherit: '实线空心三角：继承', realize: '虚线空心三角：实现接口', depend: '虚线开放箭头：临时依赖', associate: '实线开放箭头：持有引用', aggregate: '空心菱形在整体端：聚合', compose: '实心菱形在整体端：组合' };
  function render(spec) {
    var prefix = 'pu' + (++seq), byId = {}, body = [], paths = [], labels = [], bottom = 0;
    spec.nodes.forEach(function (node) { node.h = height(node); byId[node.id] = node; bottom = Math.max(bottom, node.y + node.h); });
    spec.edges.forEach(function (edge) {
      var fraction = edge.toFraction;
      if (fraction === undefined && (edge.type === 'inherit' || edge.type === 'realize')) {
        var fan = spec.edges.filter(function (other) { return other.to === edge.to && other.toSide === edge.toSide && (other.type === 'inherit' || other.type === 'realize'); }).sort(function (a, b) { return byId[a.from].x - byId[b.from].x; });
        if (fan.length > 1) fraction = (fan.indexOf(edge) + 1) / (fan.length + 1);
      }
      var a = port(byId[edge.from], edge.fromSide, edge.fromFraction), b = port(byId[edge.to], edge.toSide, fraction);
      var points = [a].concat(edge.via || []).concat([b]);
      points.forEach(function (p) { bottom = Math.max(bottom, p[1] + 16); });
      var dashed = edge.type === 'realize' || edge.type === 'depend';
      var end = edge.type === 'inherit' || edge.type === 'realize' ? 'triangle' : 'arrow';
      var diamond = edge.type === 'aggregate' || edge.type === 'compose';
      paths.push('<path class="pu-edge" data-from="' + edge.from + '" data-to="' + edge.to + '" data-relation="' + edge.type + '" d="M' + points.map(function (p) { return p.join(','); }).join(' L') + '" fill="none" stroke="#a4b8d5" stroke-width="1.7"' + (dashed ? ' stroke-dasharray="7 5"' : '') + (diamond ? ' marker-start="url(#' + prefix + '-' + edge.type + ')"' : '') + (diamond ? '' : ' marker-end="url(#' + prefix + '-' + end + ')"') + '/>');
      if (edge.label) {
        var lx = edge.labelAt ? edge.labelAt[0] : (a[0] + b[0]) / 2;
        var ly = edge.labelAt ? edge.labelAt[1] : (a[1] + b[1]) / 2 - 13;
        var width = Array.from(edge.label).reduce(function (w, c) { return w + (c.charCodeAt(0) > 255 ? 14 : 8); }, 20);
        labels.push('<g class="pu-edge-label"><rect x="' + (lx - width / 2) + '" y="' + (ly - 16) + '" width="' + width + '" height="25" rx="7" fill="#101c2f" stroke="#2a3c57"/>' + text(lx, ly + 1, edge.label, 'pu-relation', 'middle', width - 12) + '</g>');
      }
    });
    spec.nodes.forEach(function (node) {
      var c = colors[node.tone], ah = Math.max(1, node.attrs.length) * 23 + 12, x = node.x, y = node.y;
      body.push('<g class="pu-node" data-node="' + node.id + '"><rect class="pu-node-box" x="' + x + '" y="' + y + '" width="' + node.w + '" height="' + node.h + '" rx="12" fill="#101b2d" stroke="' + c + '" stroke-opacity=".65"/>' +
        '<path d="M' + (x + 12) + ',' + y + ' H' + (x + node.w - 12) + ' Q' + (x + node.w) + ',' + y + ' ' + (x + node.w) + ',' + (y + 12) + ' V' + (y + 64) + ' H' + x + ' V' + (y + 12) + ' Q' + x + ',' + y + ' ' + (x + 12) + ',' + y + '" fill="' + c + '" fill-opacity=".10"/>' +
        text(x + 16, y + 23, node.role, 'pu-role', 'start', node.w - 32) + text(x + 16, y + 49, node.name, 'pu-name', 'start', node.w - 32) +
        '<path d="M' + x + ',' + (y + 64) + ' h' + node.w + ' M' + x + ',' + (y + 68 + ah) + ' h' + node.w + '" stroke="' + c + '" stroke-opacity=".24"/>');
      (node.attrs.length ? node.attrs : ['—']).forEach(function (s, i) { body.push(text(x + 16, y + 91 + i * 23, s, 'pu-member', 'start', node.w - 32)); });
      (node.methods.length ? node.methods : ['—']).forEach(function (s, i) { body.push(text(x + 16, y + 68 + ah + 23 + i * 23, s, 'pu-member', 'start', node.w - 32)); });
      body.push('</g>');
    });
    return '<svg class="pattern-uml" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1140 ' + (bottom + 44) + '" role="img" aria-labelledby="' + prefix + '-title ' + prefix + '-desc"><title id="' + prefix + '-title">' + esc(spec.title) + '</title><desc id="' + prefix + '-desc">' + esc(spec.read) + '</desc><defs>' +
      '<marker id="' + prefix + '-triangle" viewBox="0 0 14 14" refX="13" refY="7" markerWidth="14" markerHeight="14" orient="auto" markerUnits="userSpaceOnUse"><path d="M1,1 L13,7 L1,13 Z" fill="#101b2d" stroke="#a4b8d5" stroke-width="1.5"/></marker>' +
      '<marker id="' + prefix + '-arrow" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="12" markerHeight="12" orient="auto" markerUnits="userSpaceOnUse"><path d="M1,1 L11,6 L1,11" fill="none" stroke="#a4b8d5" stroke-width="1.6"/></marker>' +
      ['aggregate', 'compose'].map(function (kind) { return '<marker id="' + prefix + '-' + kind + '" viewBox="0 0 20 12" refX="1" refY="6" markerWidth="20" markerHeight="12" orient="auto" markerUnits="userSpaceOnUse"><path d="M1,6 L10,1 L19,6 L10,11 Z" fill="' + (kind === 'compose' ? '#a4b8d5' : '#101b2d') + '" stroke="#a4b8d5" stroke-width="1.5"/></marker>'; }).join('') + '</defs>' + paths.join('') + body.join('') + labels.join('') + '</svg>';
  }
  function add(id, title, read, nodes, edges) {
    var spec = { id: id, title: title, read: read, nodes: nodes, edges: edges };
    atlas[id] = spec;
    window.DIAGRAMS['u-' + id] = { title: title, kind: 'uml', svg: function () { return render(spec); }, caption: '<strong>读图顺序：</strong>' + esc(read) + '<span class="pu-legend">' + Array.from(new Set(edges.map(function (edge) { return legends[edge.type]; }))).map(esc).join(' · ') + '。+ 公有 / − 私有 / # 保护 / ~ 包内可见；{static} 静态成员。省略与模式无关的成员。</span>' };
  }

  add('singleton', '单例 · 一个类，一个共享入口', '先看私有构造器，再看静态实例和获取入口。两个调用方都通过同一入口取 Printer，不各自创建对象。', [
    n('a','FrontDesk','调用方 · 前台',[],['+ submit(job)'],0,0,'context'),
    n('s','Printer','单例 · 全局共享',['− INSTANCE: Printer {static}'],['− Printer()','+ getInstance() {static}','+ print(job)'],1,0),
    n('b','Finance','调用方 · 财务',[],['+ submit(job)'],2,0,'context')
  ], [e('a','s','depend','获取单例','right','left'), e('b','s','depend','获取单例','left','right')]);

  add('simple-factory', '简单工厂 · 把创建分支集中到一处', 'MilkTeaFactory 按 type 创建具体产品，返回 MilkTea 抽象类型。新增口味仍需修改工厂中的分支；简单工厂是常用写法，不属于 GoF 23 种模式。', [
    n('f','MilkTeaFactory','简单工厂',[],['~ create(type) {static}'],0,0,'context'), n('p','MilkTea','«abstract» 抽象产品',[],['~ make()'],1,0,'contract'),
    n('a','PearlMilkTea','具体产品 · 珍珠奶茶',[],['~ make()'],0,1), n('b','FruitTea','具体产品 · 水果茶',[],['~ make()'],2,1)
  ], [e('f','p','depend','返回产品','right','left'),e('a','p','inherit','继承'),e('b','p','inherit','继承'),e('f','a','depend','创建','bottom','top')]);

  add('factory-method', '工厂方法 · 工厂和产品各自扩展', '上层是工厂契约与产品契约；下层分别扩展工厂、产品。PearlMilkTeaFactory 创建 PearlMilkTea，调用方持有工厂接口即可。FruitTea 的工厂与产品遵循相同结构。', [
    n('f','MilkTeaFactory','«interface» 工厂契约',[],['+ create(): MilkTea'],0,0,'contract'), n('p','MilkTea','«abstract» 产品契约',[],['~ make()'],2,0,'contract'),
    n('a','PearlMilkTeaFactory','具体工厂',[],['+ create(): MilkTea'],0,1), n('b','PearlMilkTea','具体产品',[],['~ make()'],2,1)
  ], [e('a','f','realize','实现'), e('b','p','inherit','继承'),e('f','p','depend','返回类型','right','left'),e('a','b','depend','创建','right','left')]);

  add('abstract-factory', '抽象工厂 · 一次创建一族配套产品', 'ShopFactory 同时定义饮品、小食的创建入口。TaiwanShopFactory 创建同属台式家族的珍珠奶茶与盐酥鸡；港式工厂同理。图中展开一个家族，避免把多个产品等级误看成同一类。', [
    n('f','ShopFactory','«interface» 抽象工厂',[],['+ createDrink(): Drink','+ createSnack(): Snack'],0,0,'contract'),
    n('d','Drink','«interface» 饮品等级',[],['+ make()'],1,0,'contract'), n('s','Snack','«interface» 小食等级',[],['+ make()'],2,0,'contract'),
    n('t','TaiwanShopFactory','具体工厂 · 台式家族',[],['+ createDrink(): Drink','+ createSnack(): Snack'],0,1),
    n('a','PearlMilkTea','台式饮品',[],['+ make()'],1,1), n('b','SaltChicken','台式小食',[],['+ make()'],2,1)
  ], [e('t','f','realize','实现'),e('a','d','realize','实现'),e('b','s','realize','实现'),e('t','a','depend','创建饮品','right','left'),e('t','b','depend','创建小食','bottom','bottom',{via:[[180,670],[960,670]],labelAt:[570,668]})]);

  add('builder', '建造者 · 分步配置，最后生成产品', '调用方逐步配置 Computer.Builder，build() 创建 Computer。ComputerDirector 是可选的套餐组装者，用于复用一套步骤；它不是每个建造者实现都必须具备的角色。', [
    n('d','ComputerDirector','可选 · 固定组装步骤',[],['~ office(b) {static}'],0,0,'context'), n('b','Computer.Builder','建造者',['− cpu: String','− ram: int'],['~ cpu(value): Builder','~ ram(value): Builder','~ build(): Computer'],1,0),
    n('p','Computer','最终产品',['− cpu: String','− ram: int'],['− Computer(builder)'],2,0,'value')
  ], [e('d','b','depend','组装配置','right','left'),e('b','p','depend','创建','right','left')]);

  add('prototype', '原型 · 从现有对象复制', 'Resume 实现 Cloneable，再通过 clone() 复制对象。调用方依赖现有原型，不重复执行昂贵的初始化；可变字段是否深拷贝，需要看 clone() 内的具体实现。', [
    n('c','PrototypeDemo','调用方',[],['+ main(args)'],0,0,'context'), n('p','Cloneable','«interface» 标记接口',[],[],1,0,'contract'),
    n('r','Resume','具体原型',['− name: String','− skills: List'],['+ clone(): Resume'],1,1)
  ], [e('r','p','realize','实现标记接口'),e('c','r','depend','调用 clone()','bottom','left',{via:[[180,470]],labelAt:[290,452]})]);

  add('proxy', '代理 · 通过同一接口控制访问', '调用方只认 Star。Agent 与 RealStar 都实现该接口，Agent 先做前后置处理，再把 sing() 委托给持有的 RealStar。', [
    n('s','Star','«interface» 共同契约',[],['+ sing()'],1,0,'contract'), n('a','Agent','代理 · 经纪人',['− star: Star'],['+ sing()'],0,1,'context'),n('r','RealStar','真实对象 · 明星',[],['+ sing()'],2,1)
  ], [e('a','s','realize','实现'),e('r','s','realize','实现'),e('a','r','associate','star / 委托调用','right','left')]);

  add('decorator', '装饰器 · 同一接口，逐层包装', 'BaseMilkTea 和 Topping 都实现 MilkTea。Topping 还持有一个 MilkTea 引用，Pearl、Coconut 继承 Topping；一层先调用内部对象，再增加自己的价格与描述。', [
    n('m','MilkTea','«interface» 组件',[],['+ cost(): int','+ desc(): String'],1,0,'contract'),n('b','BaseMilkTea','基础组件',[],['+ cost(): int','+ desc(): String'],0,1),n('t','Topping','«abstract» 装饰基类',['# inner: MilkTea'],['+ cost(): int','+ desc(): String'],2,1,'context'),
    n('p','Pearl','具体装饰 · 珍珠',[],['+ cost(): int','+ desc(): String'],1,2),n('c','Coconut','具体装饰 · 椰果',[],['+ cost(): int','+ desc(): String'],2,2)
  ], [e('b','m','realize','实现'),e('t','m','realize','实现'),e('t','m','associate','inner / 包装对象','right','right',{via:[[1120,480],[1120,140]],labelAt:[1000,310]}),e('p','t','inherit','继承'),e('c','t','inherit','继承')]);

  add('adapter', '适配器 · 把旧接口翻译成新接口', '业务端使用 PaymentProcessor.process(yuan)。LegacyPayAdapter 实现这个新接口，持有 LegacyPay，并在内部换算参数、调用旧方法 payByCent(cents)。', [
    n('p','PaymentProcessor','«interface» 业务需要的接口',[],['+ process(yuan)'],0,0,'contract'), n('l','LegacyPay','已有系统 · 旧接口',[],['+ payByCent(cents)'],2,1,'value'),
    n('a','LegacyPayAdapter','对象适配器',['− legacy: LegacyPay'],['+ process(yuan)'],0,1,'context')
  ], [e('a','p','realize','实现新接口'),e('a','l','associate','legacy / 转换后调用','right','left')]);

  add('facade', '外观 · 用一个入口编排多个子系统', '客户端只调用 HomeTheaterFacade.watchMovie()。外观持有投影仪、幕布、音响和灯光，按顺序委托；子系统仍可独立使用，不因增加外观而消失。', [
    n('f','HomeTheaterFacade','统一入口',['− projector / screen','− amplifier / light'],['~ watchMovie()','~ endMovie()'],1,0,'context'),
    place(n('p','Projector','投影子系统',[],['~ on()','~ off()'],0,1),40,220),place(n('s','Screen','幕布子系统',[],['~ down()','~ up()'],1,1),320,220),place(n('a','Amplifier','音响子系统',[],['~ on() / off()','~ hdmi()'],2,1),600,220),place(n('l','Light','灯光子系统',[],['~ on()','~ off()'],2,1),880,220)
  ], [e('f','p','associate','','bottom','top',{fromFraction:.1}),e('f','s','associate','','bottom','top',{fromFraction:.35}),e('f','a','associate','','bottom','top',{fromFraction:.65}),e('f','l','associate','','bottom','top',{fromFraction:.9})]);

  add('bridge', '桥接 · 两个变化维度，各自扩展', '左边扩展遥控器功能，右边扩展电视品牌。RemoteControl 持有 Device 接口，因此 BasicRemote 与 AdvancedRemote 都能搭配任意电视实现，不需要为每个组合再建一个类。', [
    place(n('r','RemoteControl','«abstract» 功能维度',['# device: Device'],['~ on()'],0,0,'context'),180,280),place(n('d','Device','«interface» 品牌维度',[],['+ on()'],2,0,'contract'),740,280),
    place(n('b','BasicRemote','基础遥控器',[],['~ on()'],0,1),40,220),place(n('a','AdvancedRemote','高级遥控器',[],['~ on()'],1,1),320,220),place(n('x','XiaomiTV','小米电视',[],['+ on()'],2,1),600,220),place(n('s','SonyTV','索尼电视',[],['+ on()'],2,1),880,220)
  ], [e('r','d','associate','device / 桥接引用','right','left'),e('b','r','inherit','继承'),e('a','r','inherit','继承'),e('x','d','realize','实现'),e('s','d','realize','实现')]);

  add('composite', '组合 · 叶子与容器使用同一接口', 'FileNode 和 FolderNode 都实现 Node。FolderNode 聚合 0..* 个 Node，孩子既能是文件也能是文件夹；size() 递归汇总。此示例允许外部传入节点，不强行假设独占生命周期。', [
    n('n','Node','«interface» 树节点',[],['+ size(): int'],1,0,'contract'),n('f','FileNode','叶子节点',['− kb: int'],['+ size(): int'],0,1),n('d','FolderNode','容器节点',['− children: List<Node>'],['~ add(node)','+ size(): int'],2,1,'context')
  ], [e('f','n','realize','实现'),e('d','n','realize','实现'),e('d','n','aggregate','children 0..*','right','right',{via:[[1120,480],[1120,140]],labelAt:[990,305]})]);

  add('flyweight', '享元 · 共享内部状态，外传位置状态', 'PieceFactory 按颜色缓存 ChessPiece，同色请求拿到同一对象。颜色是共享的内部状态，落点 x、y 每次作为参数传入，不存入共享对象。', [
    n('c','FlyweightDemo','调用方',[],['+ main(args)'],0,0,'context'), n('f','PieceFactory','享元工厂',['− POOL: Map {static}'],['~ get(color) {static}'],1,0),n('p','ChessPiece','共享享元',['− color: String'],['~ place(x, y)'],2,0,'value')
  ], [e('c','f','depend','按颜色获取','right','left'),e('f','p','associate','缓存共享对象','right','left')]);

  add('strategy', '策略 · 上下文持有接口，算法自由替换', '从 PriceCalculator 的 strategy 字段读起：quote() 委托给 DiscountStrategy.discount(amount)。下方三个类实现同一接口，分别计算原价、满减与会员价；替换策略即可改变算法。', [
    n('c','PriceCalculator','上下文 · 使用算法',['− strategy: DiscountStrategy'],['~ quote(amount): int'],0,0,'context'),n('s','DiscountStrategy','«interface» 策略契约',[],['+ discount(amount): int'],1,0,'contract'),
    n('a','NormalPrice','具体策略 · 原价',[],['+ discount(amount): int'],0,1),n('b','FullReduce','具体策略 · 满减',[],['+ discount(amount): int'],1,1),n('v','VipPrice','具体策略 · 会员折扣',[],['+ discount(amount): int'],2,1)
  ], [e('c','s','associate','strategy','right','left'),e('a','s','realize','实现'),e('b','s','realize','实现'),e('v','s','realize','实现')]);

  add('observer', '观察者 · 维护订阅列表，逐个通知', 'EventBus 持有多个 OrderListener。发布订单支付事件时逐个回调 onPaid()，邮件、短信、积分监听器各自处理；此处是同步通知，异常隔离由事件总线示例显式实现。', [
    n('b','EventBus','发布者 · 事件总线',['− listeners: List'],['~ subscribe(listener)','~ publish(orderNo)'],0,0,'context'),n('i','OrderListener','«interface» 订阅契约',[],['+ onPaid(orderNo)'],1,0,'contract'),
    n('m','MailListener','邮件订阅者',[],['+ onPaid(orderNo)'],0,1),n('s','SmsListener','短信订阅者',[],['+ onPaid(orderNo)'],1,1),n('p','PointListener','积分订阅者',[],['+ onPaid(orderNo)'],2,1)
  ], [e('b','i','aggregate','0..*','right','left'),e('m','i','realize','实现'),e('s','i','realize','实现'),e('p','i','realize','实现')]);

  add('chain', '责任链 · 能处理就接下，否则传给 next', 'Approver 持有下一个 Approver，形成可调整的链。组长、经理、总监继承同一抽象类并实现 tryApprove()；父类 handle() 控制转交，请求从组长进入，当前权限不足时沿 next 继续传递，而不是让每一级都处理。', [
    n('a','Approver','«abstract» 审批处理者',['# next: Approver'],['~ setNext(next): Approver','~ handle(days) {final}','# tryApprove(days): String'],1,0,'contract'),n('l','TeamLead','组长 · 小额权限',[],['# tryApprove(days): String'],0,1),n('m','Manager','经理 · 中级权限',[],['# tryApprove(days): String'],1,1),n('d','Director','总监 · 高级权限',[],['# tryApprove(days): String'],2,1)
  ], [e('l','a','inherit','继承'),e('m','a','inherit','继承'),e('d','a','inherit','继承'),e('a','a','associate','next 0..1','right','top',{via:[[790,142],[790,20],[570,20]],labelAt:[770,39]})]);

  add('template-method', '模板方法 · 父类定步骤，子类填细节', 'CaffeineBeverage.prepare() 固定烧水、冲泡、倒杯和可选配料的顺序。Tea 与 Coffee 只覆盖变化的步骤；Coffee 可通过钩子跳过配料，完整流程仍由父类控制。', [
    n('b','CaffeineBeverage','«abstract» 流程骨架',[],['~ prepare() {final}','# brew() / addCondiments()','# customerWantsCondiments()'],1,0,'contract'),n('t','Tea','茶 · 填充步骤',[],['# brew()','# addCondiments()'],0,1),n('c','Coffee','咖啡 · 填充步骤与钩子',[],['# brew()','# addCondiments()','# customerWantsCondiments()'],2,1)
  ], [e('t','b','inherit','继承'),e('c','b','inherit','继承')]);

  add('state', '状态 · 当前状态决定行为，也推动迁移', 'OrderContext 把 pay()、ship() 委托给当前 OrderState。待支付、已支付、已发货分别实现状态接口；状态处理成功后调用上下文切换状态，因此同一操作会随当前状态产生不同结果。', [
    n('c','OrderContext','上下文 · 订单',['− state: OrderState'],['~ pay() / ship()','~ setState(state)'],0,0,'context'),n('s','OrderState','«interface» 状态契约',[],['+ pay(ctx)','+ ship(ctx)'],1,0,'contract'),
    n('a','WaitPay','待支付状态',[],['+ pay(ctx)','+ ship(ctx)'],0,1),n('b','Paid','已支付状态',[],['+ pay(ctx)','+ ship(ctx)'],1,1),n('d','Shipped','已发货状态',[],['+ pay(ctx)','+ ship(ctx)'],2,1)
  ], [e('c','s','associate','当前 state','right','left'),e('a','s','realize','实现'),e('b','s','realize','实现'),e('d','s','realize','实现')]);

  add('command', '命令 · 把执行与撤销封装成对象', 'RemoteControl 保存命令历史，通过 Command 执行和撤销（undoLast()）。LightOnCommand、LightOffCommand 持有 Light；遥控器无需知道灯怎么开关，只需调用 execute() 与 undo()。', [
    n('r','RemoteControl','调用者 · 管理历史',['− history: Deque<Command>'],['~ press(command)','~ undoLast()'],0,0,'context'),n('c','Command','«interface» 命令契约',[],['+ execute()','+ undo()'],1,0,'contract'),n('l','Light','接收者 · 真正干活',[],['~ on()','~ off()'],2,1,'value'),
    n('on','LightOnCommand','开灯命令',['− light: Light'],['+ execute()','+ undo()'],0,1),n('off','LightOffCommand','关灯命令',['− light: Light'],['+ execute()','+ undo()'],1,1)
  ], [e('r','c','aggregate','0..*','right','left'),e('on','c','realize','实现'),e('off','c','realize','实现'),e('off','l','associate','light','right','left'),e('on','l','associate','light','bottom','bottom',{via:[[180,680],[960,680]],labelAt:[570,678]})]);

  add('iterator', '迭代器 · 集合存数据，迭代器管遍历', 'List 的 iterator() 返回 Iterator，调用方只用 hasNext() 和 next() 遍历。ArrayList.Itr 是 ArrayList 的一种具体迭代器，内部保存游标并访问所属集合；底层存储不暴露给调用方。', [
    n('l','List<E>','«interface» 集合',[],['+ iterator(): Iterator<E>'],0,0,'contract'),n('i','Iterator<E>','«interface» 遍历协议',[],['+ hasNext(): boolean','+ next(): E'],2,0,'contract'),n('a','ArrayList<E>','具体集合',['− elementData: Object[]'],['+ iterator(): Iterator<E>'],0,1),n('t','ArrayList.Itr','具体迭代器',['− cursor: int'],['+ hasNext(): boolean','+ next(): E'],2,1)
  ], [e('a','l','realize','实现'),e('t','i','realize','实现'),e('l','i','depend','返回迭代器','right','left'),e('a','t','depend','创建','right','left')]);

  add('mediator', '中介者 · 同事只认识协调中心', '每个 User 持有 ChatRoom 引用，发言统一交给 send()。用户之间没有直接关联；当前代码演示消息汇集，完整聊天室还会由中介者维护成员列表并分发消息。', [
    place(n('u','User','同事类 · 可创建多个用户',['− name: String','− room: ChatRoom'],['~ say(msg)'],0,0),180,280),place(n('r','ChatRoom','中介者 · 协调中心',[],['~ send(from, msg)'],1,0,'context'),740,280)
  ], [e('u','r','associate','room / 同一个协调入口','right','left')]);

  add('memento', '备忘录 · 保存状态，恢复到过去', 'Editor.save() 创建不可变的 Snapshot，restore(snapshot) 恢复文本。Caretaker 是概念上的历史保管者，只存取快照，不修改其内部状态；当前代码以调用方变量承担保管职责。', [
    n('e','Editor','原发器',['− text: String'],['~ save(): Snapshot','~ restore(snapshot)'],0,0,'context'),n('s','Editor.Snapshot','备忘录 · 不可变值',['− value: String {readOnly}'],['+ value(): String'],1,0,'value'),n('c','Caretaker','概念角色 · 调用方/历史栈',['− history: Snapshot[]'],['~ saveHistory(snapshot)'],2,0)
  ], [e('e','s','depend','创建 / 恢复','right','left'),e('c','s','associate','保管快照','left','right')]);

  add('visitor', '访问者 · 元素稳定，操作向外扩展', '先从 Shape.accept(visitor) 进入具体元素，再由元素调用 visitor.visit(this)。Visitor 为每种元素声明重载，AreaVisitor 实现面积操作；新增操作增加访问者，新增元素则要修改访问者契约。', [
    n('s','Shape','«interface» 元素契约',[],['+ accept(v: Visitor)'],0,0,'contract'),n('v','Visitor','«interface» 操作契约',[],['+ visit(c: Circle)','+ visit(s: Square)'],2,0,'contract'),n('c','Circle','具体元素 · 圆',['− r: double'],['+ accept(v: Visitor)'],0,1),n('q','Square','具体元素 · 正方形',['− s: double'],['+ accept(v: Visitor)'],1,1),n('a','AreaVisitor','具体访问者 · 面积计算',[],['+ visit(c: Circle)','+ visit(s: Square)'],2,1)
  ], [e('c','s','realize','实现'),e('q','s','realize','实现'),e('a','v','realize','实现'),e('s','v','depend','accept(v)','right','left')]);

  add('interpreter', '解释器 · 语法树递归求值', 'Gt、Lt 是判断金额的终结表达式，And 持有左右 Expr 并递归调用 test()。Ctx 提供金额上下文；同一棵表达式树可以反复对不同上下文求值。', [
    n('c','Ctx','上下文 · 待判断的数据',['− amount: int'],['+ amount(): int'],0,0,'value'),n('e','Expr','«interface» 表达式',[],['+ test(c: Ctx): boolean'],1,0,'contract'),n('g','Gt','终结符 · 大于',['− limit: int'],['+ test(c): boolean'],0,1),n('l','Lt','终结符 · 小于',['− limit: int'],['+ test(c): boolean'],1,1),n('a','And','非终结符 · 逻辑与',['− l: Expr','− r: Expr'],['+ test(c): boolean'],2,1,'context')
  ], [e('e','c','depend','读取金额','left','right'),e('g','e','realize','实现'),e('l','e','realize','实现'),e('a','e','realize','实现'),e('a','e','associate','l / r 子表达式','right','right',{via:[[1120,490],[1120,140]],labelAt:[995,315]})]);

  add('class-basics', 'UML 类图入门 · 类名、字段、方法与继承', '每个矩形从上到下是角色与类名、字段、方法。Dog 指向 Animal 的实线空心三角表示继承；Dog 指向 Runnable 的虚线空心三角表示实现接口。箭头指向更抽象的契约。', [
    n('a','Animal','父类',['− name: String'],['+ eat(): void'],0,0,'contract'),n('r','Runnable','«interface» 接口',[],['+ run(): void'],2,0,'contract'),n('d','Dog','子类 · 同时实现接口',[],['+ eat(): void','+ run(): void'],1,1)
  ], [e('d','a','inherit','extends'),e('d','r','realize','implements')]);

  // One small, concrete pair per relation keeps arrow endpoints unambiguous.
  var relationNodes = [], relationEdges = [];
  [
    ['depend','ReportService','Exporter','临时使用','依赖 · 方法参数',['+ export(e: Exporter)']],
    ['associate','Student','Teacher','teacher','关联 · 长期引用',['− teacher: Teacher']],
    ['aggregate','Department','Employee','members 0..*','聚合 · 可独立存在',['− members: List<Employee>']],
    ['compose','OrderDocument','OrderLine','lines 1..*','组合 · 独占且绑定生命周期',['− lines: List<OrderLine>']],
    ['inherit','Dog','Animal','extends','泛化 · 子类到父类',['+ eat()']],
    ['realize','Task','Runnable','implements','实现 · 实现类到接口',['+ run()']]
  ].forEach(function (row, i) {
    var a = n('a'+i,row[1],row[4],i > 0 && i < 4 ? row[5] : [],i === 0 || i >= 4 ? row[5] : [],0,i,'context');
    var b = n('b'+i,row[2],i===5?'«interface» 被依赖的契约':'关系的另一端',[],[],2,i,'contract');
    // Use tighter rows for this six-pair reference sheet.
    a.y = b.y = 32 + i * 230;
    relationNodes.push(a,b); relationEdges.push(e(a.id,b.id,row[0],row[3],'right','left'));
  });
  add('relations', 'UML 六种关系 · 线型、箭头与菱形', '从左往右逐行看：依赖、关联、聚合、组合、泛化、实现。三角指向父类或接口；菱形位于整体端。聚合、组合需要结合所有权和生命周期判断，仅凭构造器注入或 new 不能自动确定。', relationNodes, relationEdges);
  window.PATTERN_UML = atlas;
})();
