/* ═══════════════════════════════════════════════════
   SVG 图解库 · 第一批(JavaSE / JVM / Spring)
   风格:暗色玻璃拟态 + 莫兰迪霓虹 + emoji 趣味拟人
   ═══════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.DIAGRAMS = window.DIAGRAMS || {};

  var SEQ = 0;
  var BS = String.fromCharCode(92);

  /* ── 绘图助手 ── */
  function D(w, h) {
    var u = 'dg' + (++SEQ);
    var p = [];
    var api = {
      w: w, h: h, u: u,
      done: function () {
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '">' +
          '<defs>' +
          '<marker id="' + u + 'a" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto"><path d="M0,0 L9,3.5 L0,7 Z" fill="#818cf8"/></marker>' +
          '<marker id="' + u + 'h" markerWidth="13" markerHeight="11" refX="11" refY="5" orient="auto"><path d="M1,1 L11,5 L1,9 Z" fill="rgba(10,16,31,.9)" stroke="#9fb0c8" stroke-width="1.2"/></marker>' +
          '<marker id="' + u + 'g" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto"><path d="M0,0 L9,3.5 L0,7 Z" fill="#34d399"/></marker>' +
          '<marker id="' + u + 'r" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto"><path d="M0,0 L9,3.5 L0,7 Z" fill="#fb7185"/></marker>' +
          '</defs>' + p.join('') + '</svg>';
      },
      rect: function (x, y, w2, h2, c, o) {
        o = o || {};
        p.push('<rect x="' + x + '" y="' + y + '" width="' + w2 + '" height="' + h2 + '" rx="' + (o.rx !== undefined ? o.rx : 10) + '" fill="' + (o.fill || 'rgba(13,20,40,.92)') + '" stroke="' + c + '" stroke-width="1.4"' + (o.dash ? ' stroke-dasharray="5,4"' : '') + ' opacity="' + (o.op || 1) + '"/>');
        return api;
      },
      raw: function (s) { p.push(s); return api; },
      band: function (x, y, w2, h2, c) {
        p.push('<rect x="' + x + '" y="' + y + '" width="' + w2 + '" height="' + h2 + '" rx="8" fill="' + c + '" fill-opacity="0.2"/>');
        return api;
      },
      line2: function (x1, y1, x2, y2, c) {
        p.push('<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + c + '" stroke-width="1" opacity="0.6"/>');
        return api;
      },
      text: function (x, y, t, cls, o) {
        o = o || {};
        p.push('<text x="' + x + '" y="' + y + '" text-anchor="' + (o.anchor || 'middle') + '" class="' + (cls || 'dg-label') + '"' + (o.fill ? ' fill="' + o.fill + '"' : '') + (o.weight ? ' font-weight="' + o.weight + '"' : '') + (o.maxWidth ? ' data-max-width="' + o.maxWidth + '"' : '') + '>' + esc(t) + '</text>');
        return api;
      },
      emoji: function (x, y, e, size) {
        p.push('<text x="' + x + '" y="' + y + '" text-anchor="middle" font-size="' + (size || 16) + '">' + e + '</text>');
        return api;
      },
      box: function (x, y, w2, h2, o) {
        o = o || {};
        api.rect(x, y, w2, h2, o.c || '#818cf8', { dash: o.dash, fill: o.fill, rx: o.rx });
        var cy = y + h2 / 2;
        if (o.t) api.text(x + w2 / 2, o.sub ? cy - 7 : cy + 4, (o.e ? o.e + ' ' : '') + o.t, 'dg-title', { maxWidth: w2 - 16 });
        if (o.sub) api.text(x + w2 / 2, cy + 13, o.sub, 'dg-sub', { maxWidth: w2 - 16 });
        return api;
      },
      chip: function (x, y, t, c, o) {
        o = o || {};
        var tw = 0;
        for (var ci = 0; ci < t.length; ci++) { tw += t.charCodeAt(ci) > 255 ? 11 : 6.8; }
        var w2 = tw + (o.pad || 20);
        api.rect(x, y, w2, 24, c, { rx: 12, fill: o.fill || 'rgba(13,20,40,.92)' });
        api.text(x + w2 / 2, y + 16, t, 'dg-label', { fill: c, weight: 700 });
        return api;
      },
      arrow: function (x1, y1, x2, y2, o) {
        o = o || {};
        var c = o.c || '#818cf8';
        var mk = o.hollow ? (u + 'h') : (c === '#34d399' ? (u + 'g') : (c === '#fb7185' ? (u + 'r') : (u + 'a')));
        p.push('<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + c + '" stroke-width="' + (o.sw || 1.6) + '"' + (o.dash ? ' stroke-dasharray="6,4"' : '') + ' marker-end="url(#' + mk + ')"/>');
        if (o.t) api.text((x1 + x2) / 2 + (o.dx || 0), (y1 + y2) / 2 - 5, o.t, o.hl ? 'dg-label-hl' : 'dg-label', { fill: o.tc || c });
        return api;
      },
      uml: function (x, y, w2, name, attrs, methods, c, o) {
        o = o || {};
        var lh = 17, headH = 26, pad = 6;
        var ah = Math.max(attrs.length, 1) * lh + 10;
        var mh = methods.length ? Math.max(methods.length, 1) * lh + 10 : 0;
        var h2 = headH + ah + mh;
        api.rect(x, y, w2, h2, c, { rx: 8, fill: o.fill || 'rgba(13,20,40,.92)' });
        api.band(x, y, w2, headH, c);
        api.text(x + w2 / 2, y + 17.5, name, 'dg-uml-name', { maxWidth: w2 - 20 });
        if (o.stereo) api.text(x + w2 / 2, y - 5, o.stereo, 'dg-sub');
        api.line2(x, y + headH, x + w2, y + headH, c);
        var yy = y + headH + 16;
        if (!attrs.length) api.text(x + 10, yy, ' ', 'dg-uml-item');
        attrs.forEach(function (a) { api.text(x + 10, yy, a, o.iattr ? 'dg-uml-item-i' : 'dg-uml-item', { anchor: 'start', maxWidth: w2 - 20 }); yy += lh; });
        if (methods.length) {
          api.line2(x, y + headH + ah, x + w2, y + headH + ah, c);
          yy = y + headH + ah + 16;
          methods.forEach(function (m) { api.text(x + 10, yy, m, 'dg-uml-item', { anchor: 'start', maxWidth: w2 - 20 }); yy += lh; });
        }
        return h2;
      }
    };
    return api;
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  window.DG_HELPERS = { D: D, esc: esc };

  /* ═══════════ JavaSE ═══════════ */

  /* 1. 面向对象三大特性(动物园拟人) */
  DIAGRAMS['d-oop'] = {
    title: '封装 · 继承 · 多态 —— 动物园的一角',
    caption: 'Animal 是图纸不是动物;PRIVATE 的日记本只有自己能翻;同一句 speak(),猫狗回答各不相同。',
    svg: (function () {
      var g = D(800, 310);
      g.emoji(400, 30, '🦁', 20);
      /* 封装 */
      g.rect(30, 60, 220, 190, '#22d3ee', { rx: 12, fill: 'rgba(13,20,40,.92)' });
      g.text(140, 86, '🔒 封装 Encapsulation', 'dg-title');
      g.chip(60, 108, '- name: 私有日记本', '#22d3ee');
      g.chip(60, 142, '+ getName(): 前台登记', '#22d3ee');
      g.text(140, 200, '外人不能翻日记,只能走登记口', 'dg-sub');
      /* 继承 */
      g.uml(330, 60, 170, 'Animal', ['- age', '# name'], ['+ speak()', '+ run()'], '#818cf8');
      g.box(255, 210, 110, 50, { c: '#a3e635', t: 'Dog 🐕' });
      g.box(400, 210, 110, 50, { c: '#a3e635', t: 'Cat 🐈' });
      g.arrow(310, 210, 360, 172, { hollow: true });
      g.arrow(455, 210, 400, 172, { hollow: true });
      g.text(415, 47, '继承 · 共享父类契约', 'dg-sub');
      /* 多态 */
      g.rect(575, 60, 200, 190, '#c084fc', { rx: 12, fill: 'rgba(13,20,40,.92)' });
      g.text(675, 86, '🎭 多态 Polymorphism', 'dg-title');
      g.text(675, 122, '同一句 speak()', 'dg-sub');
      g.text(675, 148, 'Dog → 汪汪汪', 'dg-label', { fill: '#a3e635', weight: 700 });
      g.text(675, 172, 'Cat → 喵喵喵', 'dg-label', { fill: '#fbbf24', weight: 700 });
      g.text(675, 210, '调用者不用管谁在叫', 'dg-sub');
      return g.done();
    })()
  };

  /* 2. 字符串常量池 */
  DIAGRAMS['d-stringpool'] = {
    title: '字符串常量池 —— 图书馆的共享书',
    caption: '字面量进池共享(两个人借同一本书);new String 自己掏钱买新书;intern() 是"办借书证"。',
    svg: (function () {
      var g = D(760, 320);
      g.rect(90, 50, 380, 200, '#22d3ee', { rx: 12, fill: 'rgba(13,20,40,.92)' });
      g.text(280, 76, '字符串常量池 String Pool(堆内)', 'dg-title');
      g.emoji(440, 78, '📚', 17);
      g.rect(120, 110, 150, 46, '#fbbf24', { rx: 8 });
      g.text(195, 137, '"hello"', 'dg-uml-name', { fill: '#fbbf24' });
      g.rect(290, 110, 150, 46, '#fbbf24', { rx: 8 });
      g.text(365, 137, '"world"', 'dg-uml-name', { fill: '#fbbf24' });
      g.chip(120, 185, 's1 与 s2 指向同一本 📖', '#34d399');
      /* 两个引用 */
      g.box(30, 280, 130, 34, { c: '#818cf8', t: 's1' });
      g.box(180, 280, 130, 34, { c: '#818cf8', t: 's2' });
      g.arrow(95, 280, 170, 160, { t: '引用', dash: true });
      g.arrow(245, 280, 220, 160, { dash: true });
      /* new String */
      g.box(540, 90, 190, 70, { c: '#fb7185', t: 'new String("hello")', sub: '堆里新开一间房 🏠' });
      g.arrow(635, 160, 635, 220, { c: '#fb7185', t: '内容相同,但地址不同' });
      g.box(540, 225, 190, 34, { c: '#fb7185', t: 's3 != s1' });
      g.chip(560, 278, 's3.intern() → 办借书证回池子', '#22d3ee');
      return g.done();
    })()
  };

  /* 3. 异常体系(Throwable 家族树) */
  DIAGRAMS['d-exception'] = {
    title: 'Throwable 家族树 —— 天灾与人祸',
    caption: 'Error 是天灾无力回天(OOM);RuntimeException 是编码事故(可以编译通过);检查异常是"出门前妈妈查伞",编译器逼你处理。',
    svg: (function () {
      var g = D(790, 405);
      g.uml(300, 20, 200, 'Throwable', ['- message'], ['+ getMessage()', '+ printStackTrace()'], '#818cf8');
      g.arrow(350, 119, 220, 152, { hollow: true });
      g.arrow(450, 119, 580, 152, { hollow: true });
      g.uml(110, 155, 220, 'Error ☠️ 天灾', ['OutOfMemoryError', 'StackOverflowError', 'NoClassDefFoundError'], [], '#fb7185');
      g.uml(470, 155, 220, 'Exception 人祸', ['+ 处理了能活'], [], '#34d399');
      g.arrow(530, 210, 400, 297, { hollow: true });
      g.arrow(630, 210, 640, 297, { hollow: true });
      g.uml(255, 300, 290, 'RuntimeException 编译不查 💣', ['NullPointerException', 'ArrayIndexOutOfBounds', 'ClassCastException'], [], '#fbbf24');
      g.uml(580, 300, 200, '检查异常 编译器查', ['IOException', 'SQLException'], [], '#38bdf8');
      return g.done();
    })()
  };

  /* 4. 集合框架类图 */
  DIAGRAMS['d-collection'] = {
    title: '集合框架全家福(必背 UML)',
    caption: 'List 是排队讲顺序,Set 是点名册不重复,Map 是字典按 key 查 —— 三兄弟都是 Collection 的亲戚(Map 例外,自立门户)。',
    svg: (function () {
      var g = D(820, 570);
      g.uml(340, 10, 160, 'Iterable⟨E⟩', [], ['iterator()'], '#64748b', { stereo: '«interface»' });
      g.arrow(420, 92, 420, 108, { hollow: true });
      g.uml(330, 112, 180, 'Collection⟨E⟩', [], ['add()', 'remove()', 'size()'], '#818cf8', { stereo: '«interface»' });
      /* 二级接口 */
      g.uml(40, 260, 170, 'List⟨E⟩ 有序', [], ['get(i)', 'add(i,e)'], '#22d3ee', { stereo: '«interface»' });
      g.uml(330, 260, 170, 'Set⟨E⟩ 去重', [], ['add() 返回布尔'], '#c084fc', { stereo: '«interface»' });
      g.uml(600, 260, 180, 'Map⟨K,V⟩', [], ['put()', 'get()'], '#34d399', { stereo: '自立门户' });
      g.arrow(105, 258, 370, 232, { hollow: true, dash: true });
      g.arrow(470, 258, 440, 232, { hollow: true, dash: true });
      /* 实现类 */
      g.uml(20, 400, 100, 'ArrayList', ['数组 📦'], ['读 O(1)'], '#22d3ee');
      g.uml(132, 400, 100, 'LinkedList', ['双向链表'], ['插删 O(1)'], '#22d3ee');
      g.uml(244, 400, 90, 'Vector', ['sync'], ['老古董'], '#22d3ee');
      g.arrow(70, 398, 100, 361, { hollow: true });
      g.arrow(182, 398, 140, 361, { hollow: true });
      g.arrow(289, 398, 180, 361, { hollow: true, dash: true });
      g.uml(346, 400, 82, 'HashSet', ['哈希表'], ['最常用'], '#c084fc');
      g.uml(440, 400, 96, 'LinkedHashSet', ['+双向链表'], ['保插入序'], '#c084fc');
      g.uml(548, 400, 82, 'TreeSet', ['红黑树'], ['自动排序'], '#c084fc');
      g.arrow(387, 398, 405, 344, { hollow: true });
      g.arrow(488, 398, 445, 344, { hollow: true });
      g.arrow(589, 398, 480, 344, { hollow: true });
      g.uml(650, 400, 140, 'HashMap', ['数组+链表+树'], ['面试宇宙中心'], '#34d399');
      g.arrow(720, 398, 690, 361, { hollow: true });
      /* 注解 */
      g.chip(30, 520, 'Collection:一组元素', '#818cf8');
      g.chip(300, 520, 'Map:键值对,不继承 Collection', '#34d399');
      g.chip(600, 520, 'Set 依赖 equals/hashCode 去重', '#c084fc');
      return g.done();
    })()
  };

  /* 5. HashMap 结构 */
  DIAGRAMS['d-hashmap'] = {
    title: 'HashMap = 快递柜 + 挂链',
    caption: 'hash 定位柜号取模;柜门被占就往后挂;链子太长(≥8)升级红黑树;柜子太挤(size>阈值)整体扩容搬家。',
    svg: (function () {
      var g = D(800, 330);
      var labels = ['0', '1', '2', '3', '4', '5', '6', '7'];
      for (var i = 0; i < 8; i++) {
        var x = 40 + i * 92;
        g.rect(x, 60, 72, 40, '#818cf8', { rx: 8 });
        g.text(x + 36, 84, '柜' + labels[i], 'dg-title');
        if (i === 2) {
          g.rect(x + 16, 118, 40, 30, '#22d3ee', { rx: 6 });
          g.text(x + 36, 137, 'K2', 'dg-label');
          g.rect(x + 16, 160, 40, 30, '#22d3ee', { rx: 6 });
          g.text(x + 36, 179, 'K10', 'dg-label');
          g.rect(x + 16, 202, 40, 30, '#c084fc', { rx: 6 });
          g.text(x + 36, 221, '🌲树', 'dg-label', { fill: '#c084fc' });
          g.arrow(x + 36, 100, x + 36, 114, { sw: 1.2 });
          g.arrow(x + 36, 148, x + 36, 156, { sw: 1.2 });
          g.arrow(x + 36, 190, x + 36, 198, { sw: 1.2 });
        } else if (i === 5) {
          g.rect(x + 16, 118, 40, 30, '#22d3ee', { rx: 6 });
          g.text(x + 36, 137, 'K5', 'dg-label');
          g.arrow(x + 36, 100, x + 36, 114, { sw: 1.2 });
        } else {
          g.text(x + 36, 84 + 40 + 16, 'null', 'dg-sub');
        }
      }
      g.chip(150, 280, 'hash(key) & (n-1) → 柜号', '#818cf8');
      g.chip(380, 280, '冲突 → 尾插挂链(1.8 改尾插)', '#22d3ee');
      g.chip(600, 280, '链长≥8 且容量≥64 → 树化', '#c084fc');
      g.emoji(30, 40, '🗄️', 18);
      return g.done();
    })()
  };

  /* 6. IO 装饰器 */
  DIAGRAMS['d-io-decorator'] = {
    title: 'IO 装饰器 —— 奶茶加料学',
    caption: '基础茶(FileInputStream)一层层套珍珠(缓冲)和奶盖(按类型读),接口始终是"茶",能力层层叠加。',
    svg: (function () {
      var g = D(880, 430);
      g.uml(30, 30, 200, 'InputStream', [], ['+ read()', '+ close()'], '#818cf8', { stereo: '«abstract» 抽象茶底' });
      g.uml(30, 170, 190, 'FileInputStream', ['- fd 文件描述符'], ['读硬盘文件 📁'], '#22d3ee', { stereo: '基础茶底' });
      g.arrow(110, 168, 110, 132, { hollow: true });
      g.uml(280, 170, 210, 'FilterInputStream', ['# in: 持有一杯茶'], ['read() 转发给 in'], '#c084fc', { stereo: '«decorator» 料盒' });
      g.arrow(300, 168, 190, 132, { hollow: true, dash: true, t: '继承', dx: 10 });
      g.uml(470, 300, 190, 'BufferedInputStream', ['- buf[8192]'], ['批读取 8KB 🧋'], '#34d399');
      g.uml(690, 300, 160, 'DataInputStream', [], ['readInt()/readUTF()'], '#fbbf24');
      g.arrow(520, 298, 430, 252, { hollow: true, dash: true });
      g.arrow(740, 298, 492, 252, { hollow: true, dash: true });
      g.chip(640, 40, 'new DataInputStream(', '#fbbf24');
      g.chip(650, 72, '  new BufferedInputStream(', '#34d399');
      g.chip(660, 104, '    new FileInputStream(f)))', '#22d3ee');
      g.text(710, 150, '套三层,还是茶 ☕', 'dg-sub');
      return g.done();
    })()
  };

  /* 7. JMM 主内存/工作内存 */
  DIAGRAMS['d-jmm'] = {
    title: 'Java 内存模型(JMM):黑板与小抄',
    caption: '每个线程都有自己的小抄(工作内存副本),volatile = 小抄作废、必须看黑板 + 写完立刻上黑板。',
    svg: (function () {
      var g = D(800, 380);
      g.rect(280, 20, 240, 100, '#22d3ee', { rx: 12, fill: 'rgba(13,20,40,.92)' });
      g.text(400, 46, '📋 主内存 Main Memory', 'dg-title');
      g.text(400, 68, '共享变量:true 值在黑板', 'dg-sub');
      g.rect(320, 80, 160, 28, '#22d3ee', { rx: 6, fill: 'rgba(34,211,238,.12)' });
      g.text(400, 99, 'flag = false', 'dg-label', { fill: '#22d3ee', weight: 700 });
      /* 线程 A */
      g.rect(60, 195, 200, 105, '#818cf8', { rx: 12, fill: 'rgba(13,20,40,.92)' });
      g.text(160, 220, '🧵 线程 A', 'dg-title');
      g.text(160, 242, '工作内存(小抄)', 'dg-sub');
      g.rect(80, 254, 160, 28, '#818cf8', { rx: 6, fill: 'rgba(129,140,248,.12)' });
      g.text(160, 273, 'flag 副本 = false', 'dg-label');
      /* 线程 B */
      g.rect(540, 195, 200, 105, '#fbbf24', { rx: 12, fill: 'rgba(13,20,40,.92)' });
      g.text(640, 220, '🧵 线程 B', 'dg-title');
      g.text(640, 242, '工作内存(小抄)', 'dg-sub');
      g.rect(560, 254, 160, 28, '#fbbf24', { rx: 6, fill: 'rgba(251,191,36,.12)' });
      g.text(640, 273, 'flag 副本 = false', 'dg-label');
      g.arrow(160, 195, 330, 124, { t: 'read/load', dash: true });
      g.arrow(640, 195, 470, 124, { t: 'read/load', dash: true });
      g.chip(30, 312, '普通变量:可能永远不看黑板 → 可见性问题', '#fb7185');
      g.chip(30, 344, 'volatile:黑板强制刷新 🔄', '#34d399');
      return g.done();
    })()
  };

  /* ═══════════ JVM ═══════════ */

  /* 8. JVM 全家福架构 */
  DIAGRAMS['d-jvmarch'] = {
    title: 'JVM 全家福 —— 一座自动化工厂',
    caption: '原料(class 文件)入库 → 车间(运行时数据区)加工 → 机床(执行引擎)出活 → 保洁(GC)随时清废料。',
    svg: (function () {
      var g = D(840, 470);
      g.box(280, 16, 280, 46, { c: '#22d3ee', t: '类加载子系统 ClassLoader', sub: '加载 → 验证 → 准备 → 解析 → 初始化', e: '📦' });
      g.arrow(420, 62, 420, 92);
      /* 运行时数据区 */
      g.rect(30, 96, 500, 340, '#818cf8', { rx: 14, fill: 'rgba(129,140,248,.05)' });
      g.text(280, 118, '运行时数据区(车间)', 'dg-title');
      g.box(50, 135, 130, 55, { c: '#94a3b8', t: '程序计数器', sub: '线程私有 🔢' });
      g.box(195, 135, 130, 55, { c: '#94a3b8', t: '虚拟机栈', sub: '栈帧/局部变量表' });
      g.box(340, 135, 130, 55, { c: '#94a3b8', t: '本地方法栈', sub: 'native 方法' });
      g.rect(50, 205, 420, 150, '#fbbf24', { rx: 12, fill: 'rgba(251,191,36,.05)' });
      g.text(260, 226, '堆 Heap(线程共享 · GC 主战场)', 'dg-title', { fill: '#fbbf24' });
      g.box(70, 240, 120, 45, { c: '#fbbf24', t: 'Eden 🍼', sub: '新生代 8/10' });
      g.box(200, 240, 60, 45, { c: '#34d399', t: 'S0' });
      g.box(270, 240, 60, 45, { c: '#34d399', t: 'S1' });
      g.box(355, 240, 100, 45, { c: '#fb7185', t: '老年代 Old 🏚️', sub: '比例依收集器' });
      g.text(260, 315, '传统分代示意；G1 等收集器的实际布局不同', 'dg-sub');
      g.box(50, 370, 420, 50, { c: '#c084fc', t: '方法区：HotSpot 8+ 使用元空间', sub: '存放类元数据；字符串常量池在堆中', e: '🗂️' });
      /* 执行引擎 */
      g.rect(570, 96, 240, 180, '#34d399', { rx: 14, fill: 'rgba(52,211,153,.05)' });
      g.text(690, 120, '执行引擎(机床)', 'dg-title', { fill: '#34d399' });
      g.box(590, 135, 200, 40, { c: '#34d399', t: '解释器', sub: '逐行翻译,启动快' });
      g.box(590, 185, 200, 40, { c: '#34d399', t: 'JIT 即时编译器', sub: '热点编译成机器码 🚀' });
      g.box(590, 235, 200, 34, { c: '#34d399', t: 'GC 保洁团队 🧹' });
      g.arrow(530, 190, 566, 190);
      g.box(570, 300, 240, 60, { c: '#38bdf8', t: '本地方法接口 JNI', sub: '连接 C/C++ 世界的桥 🌉' });
      g.arrow(690, 276, 690, 296);
      g.arrow(690, 360, 428, 444, { dash: true, t: '系统调用', dx: 40 });
      g.box(120, 430, 300, 34, { c: '#94a3b8', t: '操作系统 & 硬件', e: '💻' });
      return g.done();
    })()
  };

  /* 9. 双亲委派 */
  DIAGRAMS['d-parent-delegate'] = {
    title: '双亲委派 —— 公司报销审批链',
    caption: 'JDK 9+ 常见委派链：先请求父加载器，父加载器找不到时再尝试自己加载。JDK 8 的 Extension 加载器在 9+ 被 Platform 替代；核心类还受包名与模块机制保护。自定义加载器可以调整委派规则。',
    svg: (function () {
      var g = D(700, 380);
      g.box(200, 30, 300, 52, { c: '#fb7185', t: 'Bootstrap 启动类加载器', sub: 'java.base 等核心模块', e: '👑' });
      g.box(200, 122, 300, 52, { c: '#c084fc', t: 'Platform 平台类加载器', sub: 'JDK 9+ 平台模块', e: '👔' });
      g.box(200, 214, 300, 52, { c: '#38bdf8', t: 'Application 应用类加载器', sub: 'classpath 你写的代码', e: '🧑‍💻' });
      g.box(200, 306, 300, 52, { c: '#a3e635', t: 'Custom 自定义类加载器', sub: '热部署 / 加密 class', e: '🧒' });
      g.arrow(340, 306, 340, 266, { c: '#34d399', t: '① 先问爸爸能干吗', dx: -110 });
      g.arrow(340, 214, 340, 174, { c: '#34d399' });
      g.arrow(340, 122, 340, 82, { c: '#34d399' });
      g.arrow(300, 82, 300, 122, { c: '#fb7185', dash: true, t: '② 搞不定,退回' });
      g.arrow(260, 174, 260, 214, { dash: true });
      g.arrow(220, 214, 220, 266, { dash: true, t: '③ 自己上', tc: '#fbbf24' });
      g.chip(30, 30, '应用不得定义 java.*', '#fb7185');
      g.chip(30, 62, 'java.lang.String 假货 ❌', '#fb7185');
      return g.done();
    })()
  };

  /* 10. 堆分代 */
  DIAGRAMS['d-heap-generational'] = {
    title: '堆的分代地图 —— 对象的一生',
    caption: '传统分代收集器示意，8:1:1 是常见配置示例，并非所有 JVM 的固定布局。晋升受年龄阈值、动态年龄判断和空间担保影响；大对象分配策略也依收集器而异。G1 使用 Region，Humongous 对象另有规则。',
    svg: (function () {
      var g = D(800, 330);
      g.rect(40, 40, 500, 220, '#fbbf24', { rx: 14, fill: 'rgba(251,191,36,.05)' });
      g.text(290, 64, '新生代 Young（比例可配置）', 'dg-title', { fill: '#fbbf24' });
      g.box(70, 85, 300, 130, { c: '#fbbf24', t: 'Eden 伊甸园(8/10)', sub: 'new 出来先住这 🍼', e: '🍼' });
      g.box(390, 85, 130, 55, { c: '#34d399', t: 'Survivor From', sub: '1/10' });
      g.box(390, 160, 130, 55, { c: '#34d399', t: 'Survivor To', sub: '1/10(轮流住)' });
      g.arrow(370, 150, 390, 112, { c: '#34d399', t: 'Minor GC', dx: -30 });
      g.arrow(455, 140, 455, 160, { c: '#34d399', sw: 1.2 });
      g.text(455, 245, '每次 GC 存活 → 年龄+1,From/To 换岗', 'dg-sub');
      g.rect(570, 40, 200, 220, '#fb7185', { rx: 14, fill: 'rgba(251,113,133,.05)' });
      g.text(670, 64, '老年代 Old', 'dg-title', { fill: '#fb7185' });
      g.box(595, 90, 150, 60, { c: '#fb7185', t: '满足条件后晋升 🎓', sub: '年龄 / 空间等条件' });
      g.box(595, 170, 150, 60, { c: '#fb7185', t: '大对象分配 🏀', sub: '策略依收集器而异' });
      g.arrow(520, 112, 595, 118, { c: '#fb7185', t: '🎓', dx: 20 });
      g.arrow(670, 40, 670, 30, { c: '#fb7185' });
      g.text(670, 24, '分配失败可能触发回收或 OOM', 'dg-label', { fill: '#fb7185', weight: 700 });
      g.chip(150, 285, '很多对象寿命短；比例取决于实际负载', '#fbbf24');
      g.chip(560, 285, '停顿取决于收集器与存活数据', '#fb7185');
      return g.done();
    })()
  };

  /* ═══════════ Spring ═══════════ */

  /* 11. IoC */
  DIAGRAMS['d-ioc'] = {
    title: '控制反转 —— 从自由恋爱到婚介所',
    caption: '以前 new 什么自己说了算(强耦合);现在把要求交给容器,容器造好对象再"注入"进来 —— 控制权反转给了 Spring。',
    svg: (function () {
      var g = D(820, 330);
      /* before */
      g.rect(30, 40, 350, 240, '#fb7185', { rx: 14, fill: 'rgba(251,113,133,.05)' });
      g.text(205, 66, '控制正转(自己动手,强耦合)', 'dg-title', { fill: '#fb7185' });
      g.box(60, 90, 130, 50, { c: '#fb7185', t: 'UserService', sub: '里面写死:' });
      g.box(230, 90, 120, 50, { c: '#fb7185', t: 'new UserDao()' });
      g.arrow(190, 115, 228, 115, { c: '#fb7185' });
      g.text(205, 180, '接口换了实现?', 'dg-sub');
      g.text(205, 205, '改源码重新编译 😭', 'dg-sub');
      g.chip(60, 230, '耦合度:焊死 🔩', '#fb7185');
      /* after */
      g.rect(430, 40, 360, 240, '#34d399', { rx: 14, fill: 'rgba(52,211,153,.05)' });
      g.text(610, 66, '控制反转(容器安排,松耦合)', 'dg-title', { fill: '#34d399' });
      g.box(460, 90, 130, 50, { c: '#34d399', t: 'UserService', sub: '@Autowired 伸个手' });
      g.box(640, 90, 120, 50, { c: '#34d399', t: 'UserDao 实例' });
      g.arrow(590, 115, 638, 115, { c: '#34d399', t: '注入 💉' });
      g.rect(470, 180, 280, 60, '#22d3ee', { rx: 10, fill: 'rgba(34,211,238,.07)' });
      g.text(610, 205, 'IoC 容器(婚介所 ❤️)', 'dg-title', { fill: '#22d3ee' });
      g.text(610, 228, '扫描 @Component → 实例化 → 按需注入', 'dg-sub');
      g.chip(460, 250, '换实现只改注解,零改码 ✂️', '#34d399');
      return g.done();
    })()
  };

  /* 12. Bean 生命周期 */
  DIAGRAMS['d-beanlife'] = {
    title: 'Bean 的一生 —— 员工入职全流程',
    caption: '投简历(实例化)→ 填表(属性注入)→ 背调(BPP before)→ 岗前培训(init)→ 上岗(单例池)→ 离职回调(dispose)。',
    svg: (function () {
      var g = D(880, 260);
      var steps = [
        ['1 实例化', '构造器 🎂', '#22d3ee'],
        ['2 属性填充', '@Autowired 💉', '#22d3ee'],
        ['3 Aware', '拿到身份 ID', '#818cf8'],
        ['4 BPP 前置', '背调 🕵️', '#818cf8'],
        ['5 初始化', '@PostConstruct ✅', '#34d399'],
        ['6 BPP 后置', 'AOP 代理就在这', '#34d399'],
        ['7 单例池上岗', 'singletonObjects 💼', '#a3e635'],
        ['8 销毁回调', '@PreDestroy 👋', '#fb7185']
      ];
      for (var i = 0; i < steps.length; i++) {
        var x = 20 + (i % 4) * 215;
        var y = i < 4 ? 50 : 150;
        g.box(x, y, 190, 64, { c: steps[i][2], t: steps[i][0], sub: steps[i][1] });
        if (i % 4 < 3) g.arrow(x + 190, y + 32, x + 215, y + 32, { sw: 1.3 });
      }
      g.arrow(430, 114, 430, 150, { sw: 1.3, dash: true });
      g.arrow(650, 114, 650, 150, { sw: 1.3, dash: true });
      g.arrow(215, 214, 180, 180, { dash: true, sw: 1.2 });
      g.chip(620, 226, '第 6 步是 AOP 代理的出生地(高频考点)', '#c084fc');
      return g.done();
    })()
  };

  /* 13. 三级缓存 */
  DIAGRAMS['d-circular'] = {
    title: '三级缓存 —— 相亲死锁的破解术',
    caption: 'A 等 B、B 等 A 本会死锁;Spring 提前把"半成品 A"的引用放缓存,B 拿到引用就能继续干活,晚点再补全',
    svg: (function () {
      var g = D(820, 330);
      g.box(60, 40, 180, 70, { c: '#22d3ee', t: 'A 创建中 🅰️', sub: '实例化了,属性没填' });
      g.box(580, 40, 180, 70, { c: '#c084fc', t: 'B 创建中 🅱️', sub: '需要注入 A' });
      g.arrow(240, 62, 580, 62, { c: '#22d3ee', t: 'A 依赖 B → 转去创建 B' });
      g.arrow(580, 92, 240, 92, { c: '#c084fc', t: 'B 依赖 A → 一看缓存有!' });
      /* 三级缓存盒子 */
      g.box(80, 160, 220, 90, { c: '#34d399', t: '一级缓存 singletonObjects', sub: '成品 Bean(终版)' });
      g.box(320, 160, 220, 90, { c: '#fbbf24', t: '二级缓存 earlySingleton', sub: '提前暴露的半成品' });
      g.box(560, 160, 230, 90, { c: '#818cf8', t: '三级缓存 factory', sub: '造半成品的工厂(存 lambda)' });
      g.arrow(400, 110, 430, 160, { c: '#fbbf24', t: 'A 先挂二级缓存', dx: 60 });
      g.arrow(600, 250, 620, 110, { dash: true, t: 'B 拿到引用就能继续' });
      g.chip(150, 280, '为什么是三级不是两级? → 为 AOP 代理延迟生成留后门(第 4 章追问)', '#c084fc');
      return g.done();
    })()
  };

  /* 14. SpringMVC 流程 */
  DIAGRAMS['d-mvc'] = {
    title: 'SpringMVC 请求之旅 —— 公司前台调度记',
    caption: '所有请求先到前台(DispatcherServlet),查通讯录(HandlerMapping)派单,部门(Controller)干完活,文员(ViewResolver)排版回信。',
    svg: (function () {
      var g = D(880, 300);
      g.box(20, 120, 130, 60, { c: '#94a3b8', t: '浏览器 🖥️', sub: 'HTTP 请求' });
      g.arrow(150, 150, 190, 150, { t: '①' });
      g.box(190, 110, 210, 80, { c: '#22d3ee', t: 'DispatcherServlet', sub: '前台+总调度 💁' });
      g.arrow(400, 130, 440, 130, { t: '② 查地址簿' });
      g.box(440, 100, 180, 60, { c: '#818cf8', t: 'HandlerMapping', sub: 'URL → Controller' });
      g.arrow(400, 170, 440, 210, { t: '③ 派单' });
      g.box(440, 190, 180, 60, { c: '#34d399', t: 'Controller 🧑‍💻', sub: '@Service 干活' });
      g.arrow(620, 220, 660, 220, { t: '④ 返回数据' });
      g.box(660, 190, 190, 60, { c: '#c084fc', t: 'Model + View 名', sub: '或直接 @ResponseBody' });
      g.arrow(755, 190, 755, 120, { c: '#fbbf24', t: '⑤ 渲染' });
      g.box(660, 60, 190, 60, { c: '#fbbf24', t: 'ViewResolver', sub: '拼模板/转 JSON' });
      g.arrow(660, 90, 400, 90, { c: '#fbbf24', dash: true, t: '⑥ 渲染结果回前台' });
      g.arrow(190, 80, 150, 135, { dash: true, t: '⑦ 响应 📤' });
      return g.done();
    })()
  };

  /* 15. MyBatis 执行流程 */
  DIAGRAMS['d-mybatis'] = {
    title: 'MyBatis 点菜系统 —— 从接口到结果集',
    caption: '你只写接口(菜单),动态代理(服务员)接单,XML 菜谱交给后厨(Executor)炒菜,ResultSetHandler 负责摆盘成 POJO。',
    svg: (function () {
      var g = D(880, 240);
      g.box(15, 80, 150, 70, { c: '#22d3ee', t: 'Mapper 接口', sub: 'UserMapper 📋' });
      g.arrow(165, 115, 205, 115, { t: '动态代理' });
      g.box(205, 80, 160, 70, { c: '#818cf8', t: 'MapperProxy', sub: '服务员 🧑‍🍽️' });
      g.arrow(365, 115, 405, 115, { t: 'SQL ID' });
      g.box(405, 80, 150, 70, { c: '#c084fc', t: 'SqlSession', sub: '会话 + XML 菜谱' });
      g.arrow(555, 115, 595, 115, { t: '执行' });
      g.box(595, 80, 150, 70, { c: '#34d399', t: 'Executor', sub: '后厨 🔥' });
      g.arrow(745, 115, 785, 115, { t: 'JDBC' });
      g.box(785, 80, 90, 70, { c: '#38bdf8', t: 'MySQL', sub: '🗄️' });
      g.arrow(830, 80, 830, 45, { c: '#fbbf24', dash: true, t: 'ResultSet' });
      g.box(600, 20, 200, 40, { c: '#fbbf24', t: 'ResultSetHandler', sub: '摆盘:行 → POJO 🍽️' });
      g.arrow(600, 40, 500, 45, { c: '#fbbf24', dash: true, t: '映射结果' });
      return g.done();
    })()
  };

  /* 导出助手供 diagrams2.js 复用 */
  window.DG = { D: D, esc: esc };
})();
