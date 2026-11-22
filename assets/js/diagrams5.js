/* ═══════════════════════════════════════════════════
   SVG 图解库 · 第五批(Java 史 / Servlet / 微服务 / 区块链)
   ═══════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.DIAGRAMS = window.DIAGRAMS || {};
  var D = window.DG.D;

  /* 1. Java 版本时间线 */
  DIAGRAMS['d-java-history'] = {
    title: 'Java 三十年:从 Oak 到 Java 21',
    caption: '1995 年"一次编写到处运行"是口号,2004 年 Java 5 奠定现代 Java,2014 年 Java 8 带来 Lambda,2017 年模块化,2021 年 17 LTS,2023 年 21 的虚拟线程 —— 版本节奏从"三年一版"变成"半年一版"。',
    svg: (function () {
      var g = D(900, 320);
      g.line2(40, 190, 860, 190, '#475569');
      var nodes = [
        ['1995', 'Java 发布', 'Write Once\nRun Anywhere', '#94a3b8', 1],
        ['2004', 'Java 5', '泛型/注解/并发包', '#22d3ee', 1],
        ['2014', 'Java 8', 'Lambda/Stream', '#34d399', 1],
        ['2017', 'Java 9', 'JPMS 模块化', '#818cf8', 0],
        ['2021', 'Java 17', 'LTS 长期支持', '#c084fc', 0],
        ['2023', 'Java 21', '虚拟线程/模式匹配', '#fb7185', 0]
      ];
      nodes.forEach(function (n, i) {
        var x = 70 + i * 150;
        var up = i % 2 === 0;
        var cy = up ? 130 : 250;
        g.line2(x, 190, x, cy);
        g.rect(x - 52, cy - 26, 104, 52, n[3], { rx: 10, fill: 'rgba(13,20,40,.95)' });
        g.text(x, cy - 4, n[0], 'dg-label', { fill: n[3], weight: 700 });
        g.text(x, cy + 14, n[1], 'dg-sub');
        g.text(x, cy + (up ? -38 : 44), n[2].split('\n')[0], 'dg-sub');
        if (n[2].split('\n')[1]) g.text(x, cy + (up ? -22 : 60), n[2].split('\n')[1], 'dg-sub');
      });
      g.text(450, 300, 'Sun(1995–2010) → Oracle(2010–) · OpenJDK 开源 · LTS 每两年一个', 'dg-sub');
      return g.done();
    })()
  };

  /* 2. Servlet 请求流程 */
  DIAGRAMS['d-servlet-flow'] = {
    title: '一次请求在 Tomcat 里走了哪些关',
    caption: '浏览器 → Connector 收连接 → Engine/Host/Context/Wrapper 逐层定位 → 找到 Servlet 实例 → service() 里写响应。Servlet 默认单实例多线程,所以别在成员变量里存请求数据。',
    svg: (function () {
      var g = D(880, 380);
      g.box(20, 50, 130, 60, { c: '#94a3b8', t: '浏览器', sub: 'HTTP 请求', e: '🌐' });
      g.arrow(150, 80, 190, 80, { t: 'TCP' });
      g.rect(196, 30, 220, 300, '#22d3ee', { rx: 12, fill: 'rgba(34,211,238,.04)' });
      g.text(306, 52, 'Tomcat 容器', 'dg-title', { fill: '#22d3ee' });
      g.box(216, 68, 180, 50, { c: '#22d3ee', t: 'Connector', sub: '接收连接/解析 HTTP' });
      g.arrow(306, 118, 306, 138, { sw: 1.2 });
      g.box(216, 142, 180, 46, { c: '#818cf8', t: 'Engine / Host', sub: '按域名找虚拟主机' });
      g.arrow(306, 188, 306, 206, { sw: 1.2 });
      g.box(216, 210, 180, 46, { c: '#c084fc', t: 'Context / Wrapper', sub: '按 URL 找 Servlet' });
      g.arrow(306, 256, 306, 274, { sw: 1.2 });
      g.box(216, 278, 180, 40, { c: '#34d399', t: 'Servlet 实例', sub: '单实例,多线程' });
      /* 生命周期 */
      g.box(470, 60, 180, 60, { c: '#34d399', t: 'init()', sub: '只执行一次' });
      g.box(470, 150, 180, 80, { c: '#fbbf24', t: 'service()', sub: '每个请求一次\ndoGet / doPost' });
      g.box(470, 260, 180, 60, { c: '#fb7185', t: 'destroy()', sub: '容器关闭时' });
      g.arrow(396, 86, 466, 86, { sw: 1.2 });
      g.arrow(396, 230, 466, 196, { sw: 1.2 });
      g.box(700, 140, 150, 100, { c: '#22d3ee', t: '响应', sub: 'HTML / JSON\n状态码 + 头', e: '📤' });
      g.arrow(650, 190, 696, 190, { sw: 1.4 });
      g.chip(470, 330, 'web.xml 或 @WebServlet 决定 URL 映射', '#c084fc');
      return g.done();
    })()
  };

  /* 3. 微服务拓扑 */
  DIAGRAMS['d-microservice'] = {
    title: '微服务全景:一个请求穿过哪些组件',
    caption: '外部流量先到 Nginx(边缘),再进 Gateway(应用网关);Gateway 做鉴权后路由到具体服务;服务之间用 Feign 调用,统一在 Nacos 注册发现,Sentinel 兜底保护。',
    svg: (function () {
      var g = D(880, 420);
      g.box(20, 160, 110, 56, { c: '#94a3b8', t: '客户端', e: '📱' });
      g.arrow(130, 188, 166, 188, { t: 'HTTPS' });
      g.box(172, 150, 120, 76, { c: '#2dd4bf', t: 'Nginx', sub: '边缘反代/负载' });
      g.arrow(292, 188, 328, 188, { t: '转发' });
      g.box(334, 150, 130, 76, { c: '#c026d3', t: 'Gateway', sub: '路由+JWT鉴权' });
      /* 服务 */
      var svcs = [
        ['用户服务', '#22d3ee', 40], ['订单服务', '#34d399', 150], ['库存服务', '#fbbf24', 260]
      ];
      svcs.forEach(function (s) {
        g.box(120, 280 + s[2] * 0.25, 180, 56, { c: s[1], t: s[0], sub: 'Spring Boot' });
      });
      g.arrow(400, 226, 210, 296, { sw: 1.1, dash: true });
      g.arrow(400, 226, 210, 336, { sw: 1.1, dash: true });
      g.arrow(400, 226, 210, 376, { sw: 1.1, dash: true });
      g.box(560, 50, 150, 56, { c: '#818cf8', t: 'Nacos', sub: '注册 + 配置中心' });
      g.box(560, 130, 150, 56, { c: '#fb7185', t: 'Sentinel', sub: '限流/熔断/降级' });
      g.box(560, 210, 150, 56, { c: '#60a5fa', t: 'OpenFeign', sub: '声明式服务调用' });
      g.box(560, 290, 150, 56, { c: '#a3e635', t: '链路追踪', sub: 'Sleuth/SkyWalking' });
      g.arrow(470, 170, 556, 84, { dash: true, sw: 1 });
      g.arrow(470, 186, 556, 158, { dash: true, sw: 1 });
      g.arrow(470, 202, 556, 232, { dash: true, sw: 1 });
      g.arrow(470, 218, 556, 312, { dash: true, sw: 1 });
      g.box(740, 130, 120, 76, { c: '#38bdf8', t: 'MySQL', sub: '各自独立库' });
      g.arrow(470, 300, 736, 186, { dash: true, sw: 1, t: '写库' });
      g.chip(40, 380, '拆服务先拆数据库边界;跨服务事务用 Seata/消息最终一致', '#c026d3');
      return g.done();
    })()
  };

  /* 4. 区块链结构 */
  DIAGRAMS['d-blockchain'] = {
    title: '区块链:一条改不动的账本链',
    caption: '每个区块存着前一块的哈希,篡改任一区块,后面所有区块的哈希都对不上;记账权由共识决定,交易用私钥签名。',
    svg: (function () {
      var g = D(880, 340);
      var blocks = [
        ['区块 N-2', 'hash 0x9f2a', '#94a3b8'],
        ['区块 N-1', 'hash 0x4c7d', '#818cf8'],
        ['区块 N', 'hash 0xa1e8', '#22d3ee'],
        ['新区块', '待打包', '#64748b']
      ];
      blocks.forEach(function (b, i) {
        var x = 40 + i * 205;
        g.rect(x, 70, 175, 150, b[2], { rx: 12, fill: 'rgba(13,20,40,.95)' });
        g.text(x + 87, 96, b[0], 'dg-title', { fill: b[2] });
        g.line2(x + 12, 108, x + 163, 108, b[2]);
        g.text(x + 87, 128, 'prevHash: 上一块哈希', 'dg-sub');
        g.text(x + 87, 148, 'merkleRoot: 交易摘要', 'dg-sub');
        g.text(x + 87, 168, 'nonce: 工作量答案', 'dg-sub');
        g.text(x + 87, 192, b[1], 'dg-label', { fill: b[2], weight: 700 });
        if (i < blocks.length - 1) g.arrow(x + 175, 145, x + 200, 145, { sw: 1.3 });
      });
      g.text(440, 42, '每个区块都"咬住"前一个区块的哈希 → 改一笔要重算后面全部', 'dg-sub');
      g.chip(40, 250, '交易:私钥签名,公钥验证,地址=公钥摘要', '#22d3ee');
      g.chip(40, 288, '共识:PoW 拼算力 / PoS 拼质押 / PBFT 联盟链投票', '#c084fc');
      g.chip(560, 250, '公链:任何人可读写 · 联盟链:准入制', '#34d399');
      g.chip(560, 288, '国内:虚拟货币业务非法,联盟链/技术研究合规', '#fb7185');
      return g.done();
    })()
  };
})();
