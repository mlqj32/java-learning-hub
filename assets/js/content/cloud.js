/* ═══════════════════════════════════════════════════════════
   模块:Nginx 与 Spring Cloud(反代 / 负载 / 注册 / 调用 / 网关 / 治理 · 6 章)
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.CONTENT = window.CONTENT || {};

  window.CONTENT.cloud = {
    id: 'cloud',
    title: 'Nginx 与 Spring Cloud',
    en: 'NGINX & MICROSERVICE',
    icon: 'target',
    color: '#c026d3',
    tagline: '从反向代理到微服务治理',
    description: '先讲 Nginx 反向代理、负载均衡与 HTTPS,再进入 Spring Cloud:注册中心 Nacos、声明式调用 Feign、网关 Gateway、熔断限流 Sentinel、配置中心与分布式事务。把单体到微服务的每一步讲清楚。',
    minutes: '≈ 16 小时',
    chapters: [
      /* ─────────────────────────────────────────── */
      {
        id: 'ch01',
        title: 'Nginx 入门:反向代理与负载均衡',
        minutes: 150,
        points: ['正反代理', 'proxy_pass', 'upstream 算法', 'HTTPS 与限流', '502/504'],
        content: `
> [!info] 本章导读 · 你的域名后面只有一台服务器吗?
> 域名解析到唯一一台 1.2.3.4,机器一挂全站下线;想扩容只能停机换更高配置。可你打开任何一家电商,背后都是几十台机器在分担流量 —— 中间那层"看不见的门",就是 Nginx。
> - 读完本章你将能:讲清正向代理与反向代理的区别
> - 写出带请求头转发的 proxy_pass 与 upstream 配置
> - 用响应码表定位 502/504,而不是盲目调大超时

> [!tip] 日常电脑现场 · 小区门口的快递驿站
> 以前快递员挨家挨户敲门,住户得随时在家;有了驿站,所有快递先送到一个点,再由驿站分拣通知。Nginx 就是这个驿站:外面只认一个地址,里面有多少台后端、谁忙谁闲,外面一概不知。

## 代理的两种方向

\`\`\`text
正向代理:替客户端出门
  [浏览器] --代理--> [Squid] --真实请求--> [example.com]
  目标站只看到代理 IP;用途:统一出口、审计

反向代理:替服务端迎客
  [浏览器] --HTTPS--> [Nginx :443] --HTTP--> [10.0.0.5:8080]
                                      └─────▶ [10.0.0.6:8080]
  浏览器只知道域名;后端 IP、实例数隐藏,TCP 在 Nginx 终止
\`\`\`

判断口诀:**代理帮谁撒谎**。帮客户端隐藏"我要访问谁"是正向;帮服务端隐藏"真正是谁在处理"是反向。Nginx 的五项主业:**静态资源**(root/try_files)、**反向代理**(proxy_pass)、**负载均衡**(upstream)、**HTTPS**(ssl_certificate)、**限流**(limit_req/limit_conn),外加缓存与 rewrite。

| 维度 | 正向代理 | 反向代理 |
| --- | --- | --- |
| 代理对象 | 客户端 | 服务端 |
| 客户端是否知情 | 知道,需显式配代理 | 不知道,以为直连 |
| 部署位置 | 客户端或内网出口 | 服务端入口 |
| 核心目的 | 统一出口、审计、缓存 | 负载均衡、隐藏拓扑、TLS 终止 |
| 典型产品 | Squid、公司上网代理 | Nginx、HAProxy、F5 |

## 安装与目录:先知道改哪个文件

包管理器装的 Nginx,配置都在 ==/etc/nginx==:nginx.conf 依次是全局块(user、worker_processes)、events 块(worker_connections)与 http 块(include mime.types 与 conf.d/*.conf);站点片段放 conf.d,日志在 /var/log/nginx。

源码编译安装默认前缀是 /usr/local/nginx,配置在 conf/nginx.conf、日志在 logs/,没有 conf.d 层,还可能和包管理器版本并存。动手前先 \`nginx -V\` 看 --prefix 与 --conf-path,==改错文件是"改了没生效"的头号原因==。

\`\`\`shell
nginx -t
\`\`\`

\`\`\`output
nginx: configuration file /etc/nginx/nginx.conf test is successful
\`\`\`

\`nginx -t\` 只验语法与文件引用,不探后端存活。reload 由 master 载入新配置、起新 worker,旧 worker 处理完存量再退出,不断连接;restart 先停再起,连接全断,配置错还直接起不来。==生产优先 reload,换二进制或改端口才 restart==。

## 四层结构:events、http、server、location

\`\`\`text
main      worker_processes / pid / error_log
events    worker_connections
http      include / upstream / gzip / limit_req_zone
server    listen / server_name / ssl
location  proxy_pass / root / rewrite
\`\`\`

配置是**树形继承**:内层没写就继承外层,写了就覆盖。location 优先级:==精确 = > 前缀 ^~ > 正则 ~ / ~* > 普通前缀==;搞不清就用 \`nginx -T\` 打印最终配置。改完必须 \`nginx -t\` 通过再 reload —— reload 由 master 拉起新 worker、旧 worker 处理完存量再退出,==不丢请求==;restart 才会断连接。

## 最小可用的反向代理

\`\`\`text /etc/nginx/conf.d/api.conf
upstream order_backend {
    server 10.0.0.5:8080 weight=3 max_fails=2 fail_timeout=10s;
    server 10.0.0.6:8080 weight=1;
    keepalive 32;                       # 与后端复用长连接
}
server {
    listen 80;
    server_name api.shop.com;

    location /api/ {
        proxy_pass http://order_backend;   # 末尾没有 URI,原样转发 /api/...
        proxy_http_version 1.1;
        proxy_set_header Connection "";    # keepalive 必须清空该头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_connect_timeout 3s;          # 连后端:快速失败
        proxy_read_timeout 30s;            # 等响应:按业务定
    }
}
\`\`\`

**proxy_pass 末尾那个斜杠是事故高发点**:末尾带 URI 就替换 location 前缀(\`/api/order/1001\` → \`/order/1001\`),不带就原样转发。

\`\`\`shell
curl -s -H "Host: api.shop.com" http://127.0.0.1/api/order/1001
\`\`\`

\`\`\`output
HTTP/1.1 200 OK
Server: nginx/1.24.0
Content-Type: application/json
X-Real-IP: 203.0.113.7
X-Forwarded-For: 203.0.113.7

{"orderId":1001,"instance":"10.0.0.5:8080","clientIp":"203.0.113.7"}
\`\`\`

后端看到的 TCP 对端永远是 Nginx 的 IP,真实客户端只能从 \`X-Forwarded-For\` 里读。它是个逗号分隔的链条,代理每经过一层追加一个 IP;业务取第一个值,但**不能无条件相信** —— 客户端可以自己伪造。生产用 \`realip\` 模块只信任公司入口的网段,再覆盖 \`$remote_addr\`。

## 负载均衡:算法选错,缓存全废

| 算法 | 配置 | 优点 | 代价与适用 |
| --- | --- | --- | --- |
| 轮询(默认) | 不写策略 | 简单、绝对均匀 | 不感知机器快慢;后端同质时用 |
| 加权轮询 | \`weight=3\` | 按配置分配 | 权重靠人估;机器异构时用 |
| 最少连接 | \`least_conn;\` | 照顾慢请求 | 需统计连接数;长连接业务慎用 |
| IP 哈希 | \`ip_hash;\` | 同一 IP 落同一台 | NAT 后大量用户共享 IP;扩容会漂移 |
| 一致性哈希 | \`hash $request_uri consistent;\` | 扩容只迁移少量 key | 适合缓存分片,不适合无状态服务 |

\`max_fails=2 fail_timeout=10s\` 表示 10 秒内失败 2 次就暂时摘除,10 秒后再试 —— 这是**被动健康检查**,Nginx 开源版不会主动探活。要做主动探测,得上 Nginx Plus、Tengine 或 OpenResty。会话粘滞也别迷信 \`ip_hash\`:手机切基站就会换出口 IP,正解是把 session 放进 Redis,让服务真正无状态。

## 动静分离、gzip 与限流

\`\`\`text
http {
    gzip on;
    gzip_types application/json application/javascript text/css;
    limit_req_zone  $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    server {
        location ~* \\.(js|css|png|woff2)$ { root /data/static; expires 7d; access_log off; }
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            limit_conn conn_limit 20;
            limit_req_status 429;
            proxy_pass http://order_backend;
        }
    }
}
\`\`\`

\`rate=10r/s\` 是令牌桶速率,\`burst=20\` 允许突发 20 个,\`nodelay\` 让突发请求立刻处理而不是排队。\`$binary_remote_addr\` 比 \`$remote_addr\` 省内存,10m 大约能放 16 万个 IPv4。==限流要返回 429 并带 Retry-After,让客户端知道该退避==;直接 503 会让上游误判为故障。

## HTTPS 骨架与证书链

\`\`\`text
server {
    listen 443 ssl;
    server_name api.shop.com;
    ssl_certificate     /etc/nginx/ssl/fullchain.pem;  # 站点证书 + 中间 CA
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;    # 私钥,权限 600
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_session_cache   shared:SSL:10m;

    location /api/ {
        proxy_pass http://order_backend;
        proxy_set_header X-Forwarded-Proto https;
    }
}
server {
    listen 80;
    return 301 https://$host$request_uri;
}
\`\`\`

证书必须是 **fullchain**(站点证书在前、中间 CA 在后),只配站点证书会让部分安卓机报"证书链不完整"。Let's Encrypt 用 certbot 签发,续期后执行 \`nginx -s reload\`;忘记 reload 是"证书明明续了浏览器还报警"的头号原因。

## 502 与 504:一个连不上,一个等不到

| 响应码 | 含义 | 常见原因 | 先查什么 |
| --- | --- | --- | --- |
| 502 Bad Gateway | 连不上上游,或上游回了无法解析的响应 | 进程挂了、端口错、防火墙拦、keepalive 头没清、响应头过大 | \`ss -tlnp\` 看端口;curl 直连后端;error.log 的 upstream 行 |
| 504 Gateway Timeout | 连上了,但 proxy_read_timeout 内没回 | 慢 SQL、锁等待、下游更慢、线程池打满 | 后端慢日志与线程栈;别先调大超时 |
| 499 | 客户端主动断开 | 用户等不及取消、后端太慢 | access.log 的 request_time |

\`\`\`shell
tail -n 50 /var/log/nginx/error.log
ss -tlnp | grep 8080
curl -sv http://10.0.0.5:8080/api/order/1001
curl -s -o /dev/null -w "%{http_code} %{time_connect} %{time_starttransfer}\\n" \\
     -H "Host: api.shop.com" http://127.0.0.1/api/order/1001
\`\`\`

\`\`\`output
2026/11/14 21:03:11 [error] 1887#0: *402 connect() failed (111: Connection refused)
while connecting to upstream, client: 203.0.113.7, upstream: "http://10.0.0.6:8080/api/order/1001"
[err]502[/err] 0.001 0.001 0.001
\`\`\`

排查顺序固定:**先 error.log 看 Nginx 怎么说 → 再直连后端排除 Nginx → 再看后端自身指标**。502 多半是"后端不在";504 多半是"后端在但太慢"。如果 502 日志里出现 \`upstream prematurely closed connection\`,优先查后端 keepalive 与 \`proxy_http_version 1.1\`、\`Connection ""\` 是否配对。

> [!pitfall] 504 不是把超时调大就好了
> 把 \`proxy_read_timeout\` 从 30s 调到 300s,只是让用户多等 5 分钟,线程和连接照样被占满。正确动作是定位慢在哪:慢 SQL 加索引、下游加缓存、长任务改异步。==超时是止损线,不是修复手段==。

## 面试速记

- 正反代理看"替谁撒谎":客户端知情是正向,服务端隐身是反向;Nginx 默认反向。
- 四层结构 main→events→http→server→location,内层覆盖外层;location 优先级 = > ^~ > 正则 > 前缀。
- proxy_pass 末尾带 / 会替换 location 前缀,不带则原样转发;请求头三件套 Host、X-Real-IP、X-Forwarded-For。
- 负载算法:轮询/加权/least_conn/ip_hash/一致性哈希;Nginx 开源版只有被动健康检查。
- 502 是连不上或响应非法,504 是等超时;先 error.log,再直连后端,最后看后端指标。
`
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch02',
        title: '微服务与 Spring Cloud 全景',
        minutes: 140,
        points: ['单体之痛', '微服务拆分', '组件地图', '版本矩阵', 'Spring Cloud Alibaba'],
        content: `
> [!info] 本章导读 · 一个单体应用,是怎么被拆成一堆服务的?
> 最初一个 war 包就能上线,后来代码 50 万行、启动 3 分钟、改一行要回归全站,十几个人挤在一个仓库里互相等待。微服务不是时髦,而是被"发布耦合"和"故障扩散"逼出来的工程选择。
> - 读完本章你将能:说清单体与微服务各自的代价
> - 画出注册、配置、网关、调用、熔断五件套的位置
> - 背下 Boot、Spring Cloud、Alibaba 的版本对应关系

> [!tip] 日常电脑现场 · 大超市与一条街的专卖店
> 大超市一站买齐,可一个收银台排长队就堵住所有人,想改造还得停业;一条街的专卖店各做各的,一家装修不影响别家,但你要跑五家、还要自己记住路线。微服务就是把大超市拆成专卖店,再补一套"导航 + 统一收银"的基础设施。

## 单体不是错,是撑不住

单体应用的问题不在"一个进程",而在**所有能力共享同一个发布单元**:

| 维度 | 单体应用 | 微服务 |
| --- | --- | --- |
| 开发 | 一个仓库,改一处影响全站,合并冲突多 | 按业务边界分仓/分模块,团队并行 |
| 部署 | 改一行也要整体打包重启 | 每个服务独立发布、独立回滚 |
| 故障 | 一个线程池打满,全站一起挂 | 故障隔离,但调用链变长会放大延迟 |
| 事务 | 本地事务,ACID 简单直接 | 跨服务只能最终一致,复杂度陡增 |
| 团队 | 靠一个发布窗口协调几十人 | 小团队 owning 一个服务,边界清晰 |
| 运维 | 一台机器、一份日志 | 几十个进程、需要注册中心/链路追踪/集中日志 |

结论要辩证:**业务简单、团队小,单体是更优解**;只有当"独立部署"带来的收益超过分布式复杂度时,拆分才划算。上来就拆 30 个服务,通常得到的是一个"分布式单体"。

## 微服务到底拆了什么

拆的是**业务能力边界**,不是技术分层。一个电商系统按领域拆成用户、商品、订单、库存、支付;每个服务:

- 独立进程、独立部署、独立扩缩容;
- 独立数据库(至少独立 schema),**不共享表**;
- 通过 HTTP/RPC/MQ 通信,接口即契约;
- 失败是常态,必须自带超时、重试、熔断、幂等。

按技术层拆(Controller 一个服务、Service 一个、DAO 一个)是反例:改一个需求要跨三个仓库发版,一次本地调用变成两次网络跳转,最后只得到一个"分布式单体"。两种拆法差在哪:

| 维度 | 按业务能力拆 | 按技术层拆 |
| --- | --- | --- |
| 边界 | 一个服务闭环一个业务 | 一层一个服务 |
| 改需求 | 通常只动一个仓库 | 三层一起改、一起发 |

> [!warn] 拆服务的第一个决定,是拆数据库
> 两个服务读写同一张表,等于没拆:表结构一变双方一起改,事务还绑在一起。正确顺序是先划清数据归属,再拆代码;跨服务要数据,走接口或订阅事件,而不是直连对方的库。

代价:跨服务要处理超时、重试、幂等;本地事务变分布式事务,只能靠 MQ、补偿与对账做最终一致;运维从一台机器变成几十个进程,还要补注册中心、链路追踪与集中日志。==收益是独立部署,代价是分布式复杂度,业务简单、团队小时单体更划算。==

## Spring Cloud:一套规范,不是一款框架

Spring Cloud 本身几乎不写业务代码,它定义的是**分布式系统的抽象与集成**:服务发现、配置、负载均衡、熔断、网关、链路追踪。具体实现可以换:Nacos 或 Eureka 做注册,Gateway 或 Zuul 做网关,Sentinel 或 Resilience4j 做熔断。

**Spring Cloud Alibaba** 把阿里中间件按同一套抽象接进来:Nacos、Sentinel、Seata、RocketMQ,并提供中文控制台,是国内项目的主流选择。早期 Netflix 套件(Eureka/Hystrix/Ribbon/Zuul)在 2020 版后陆续退出默认组合,新项目别再照着老教程选型。

\`\`\`text
外部流量
   │ HTTPS
   ▼
Nginx 边缘: TLS 终止 / 静态资源 / 抗流量
   │ HTTP
   ▼
Gateway 应用网关: 路由 / 鉴权 / 限流
   │
   ├──────────────┬──────────────┐
   ▼              ▼              ▼
用户服务 ◀─Feign─▶ 订单服务 ◀─Feign─▶ 库存服务
   │              │              │
   └──────────────┴──────────────┘
   Nacos 注册+配置 · Sentinel 熔断 · Sleuth 链路 · Seata 事务
\`\`\`

这张图的背法:**流量从边缘到应用,能力从服务向外挂**。Nginx 管四层/七层入口,Gateway 管业务路由与鉴权,Nacos 让服务互相找到,Sentinel 在调用链上兜底,Seata 处理跨库一致性。

\`\`\`diagram:d-microservice
\`\`\`

再看一张手绘图:外部流量先到 Nginx,再进 Gateway;三个服务之间用 Feign,统一在 Nacos 注册,Sentinel 与 Seata 在旁兜底。

\`\`\`xml pom.xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.4</version>
</parent>

<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>2023.0.1</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-alibaba-dependencies</artifactId>
            <version>2023.0.1.0</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
\`\`\`

> [!danger] 版本对不上,启动就报 NoSuchMethodError
> Spring Cloud 的版本必须与 Boot 严格对应,Alibaba 又必须与 Spring Cloud 对应。==BOM 只负责"管版本",不会帮你纠正不匹配==。Boot 3 用 jakarta 命名空间,2.x 用 javax,混用会在类加载阶段直接炸;遇到诡异的方法找不到,先打印依赖树核对版本,别急着改代码。

| Spring Boot | Spring Cloud | Spring Cloud Alibaba | JDK | 说明 |
| --- | --- | --- | --- | --- |
| 3.2.x | 2023.0.x(Leyton) | 2023.0.1.0 | 17+ | 当前主流组合 |
| 3.0.x / 3.1.x | 2022.0.x(Kilburn) | 2022.0.0.0 | 17+ | 首批 jakarta 体系 |
| 2.6.x / 2.7.x | 2021.0.x(Jubilee) | 2021.0.5.0 | 8/11/17 | 存量项目最多 |
| 2.3.x / 2.4.x | Hoxton / 2020.0 | 2.2.x | 8 | 已停止维护,仅维护老系统 |

查版本只认官方 Wiki 的对照表,不要凭记忆;升级时先升 Boot,再升 Cloud,最后升 Alibaba,每步都跑一遍集成测试。

## 最小工程骨架

\`\`\`yml application.yml
server:
  port: 8080

spring:
  application:
    name: order-service
  cloud:
    nacos:
      discovery:
        server-addr: 127.0.0.1:8848
    sentinel:
      transport:
        dashboard: 127.0.0.1:8858
\`\`\`

\`\`\`java OrderApplication.java
package com.demo.order;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients(basePackages = "com.demo.api")
public class OrderApplication {
    public static void main(String[] args) {
        SpringApplication.run(OrderApplication.class, args);
    }
}
\`\`\`

\`\`\`output
2026-11-14 20:58:31.207  INFO 16240 --- [main] com.demo.order.OrderApplication : Starting OrderApplication using Java 17.0.11 with PID 16240
2026-11-14 20:58:31.208  INFO 16240 --- [main] com.demo.order.OrderApplication : The following 1 profile is active: "dev"
2026-11-14 20:58:32.663  INFO 16240 --- [main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port 8080 (http)
2026-11-14 20:58:33.012  INFO 16240 --- [main] c.a.c.n.registry.NacosServiceRegistry    : nacos registry, ORDER_GROUP@@order-service 10.0.0.5:8080 register finished
2026-11-14 20:58:33.024  INFO 16240 --- [main] com.demo.order.OrderApplication : Started OrderApplication in 2.914 seconds
\`\`\`

\`\`\`shell
mvn -q dependency:tree -Dincludes=org.springframework.cloud:spring-cloud-starter-openfeign
\`\`\`

\`\`\`output
[INFO] +- org.springframework.cloud:spring-cloud-starter-openfeign:jar:4.1.0:compile
[INFO] |  +- io.github.openfeign:feign-core:jar:13.2.1:compile
[INFO] |  \\- org.springframework.cloud:spring-cloud-starter-loadbalancer:jar:4.1.1:compile
\`\`\`

## 从单体到微服务,分几步走

1. **先模块化**:一个仓库内按领域拆 Maven 模块,禁止跨模块访问内部类,先把边界画出来。
2. **再拆进程**:把变化频率最高、资源消耗最大的模块先独立部署,例如订单与搜索。
3. **补基础设施**:注册中心、配置中心、网关、链路追踪,一次只上一个,别同时换四样。
4. **最后拆库**:按服务划数据归属,跨库查询改接口聚合或事件同步。

每一步都要有可回滚方案。微服务是演进出来的,不是一次"大爆炸重构"炸出来的。

> [!best] 一段能加分的回答
> "我们不是为微服务而微服务。先按领域把边界划清,把独立发布收益最大的模块拆出去,同时补齐注册、配置、网关、可观测性。拆库放在最后,因为数据一致性成本最高。"

## 面试速记

- 微服务换来独立部署与故障隔离,代价是分布式复杂度:网络不可靠、事务最终一致、运维成本上升。
- Spring Cloud 是规范集合,Spring Cloud Alibaba 是其中一套实现,不是替代品。
- 五件套:Nacos 注册配置、OpenFeign 调用、Gateway 网关、Sentinel 治理、Seata 事务。
- 版本链:Boot 3.2.x → Cloud 2023.0.x → Alibaba 2023.0.1.0;Boot 2.7 → 2021.0.x → 2021.0.5.0。
- 拆分顺序:先模块化,再拆进程,补基础设施,最后拆数据库。
`
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch03',
        title: 'Nacos:注册中心与配置中心',
        minutes: 160,
        points: ['服务注册', '心跳与健康', '服务发现', '命名空间/分组', '动态刷新'],
        content: `
> [!info] 本章导读 · 服务 A 怎么找到服务 B 的地址?
> 没有注册中心时,地址写在配置文件里:后端扩容一台要改配置,容器重建 IP 变了要改配置,发布窗口永远在改配置。注册中心把这件"记地址"的事变成自动的:服务上线自己登记,下线自动摘除,调用方按名字查。
> - 读完本章你将能:说清注册、心跳、发现、摘除的完整时序
> - 用最小配置把 SpringBoot 服务接进 Nacos
> - 分清命名空间、分组、dataId 各自隔离什么

> [!tip] 日常电脑现场 · 手机通讯录换号
> 朋友换了手机号,你不用背号码,只要通讯录里还是"张三",拨号自然接通。反过来,如果每个人都把号码抄在纸上,一个人换号就得通知所有人。注册中心就是那份**实时通讯录**:服务名是"张三",实例地址是号码。

## 没有注册中心时,地址写在哪

\`\`\`text
静态配置:order-service.yml 里写死 inventory.url = http://10.0.0.7:8080
  扩容要改配置、容器漂移 IP 变了不知道、某台挂了仍然往上打

注册中心:服务启动注册 10.0.0.7:8080,扩容再注册 10.0.0.8:8080
  宕机靠心跳超时摘除;调用方按服务名向注册中心要实例列表
\`\`\`

在注册中心出现前,调用方拿到对方地址只有三条土办法:

| 土办法 | 怎么做 | 什么时候失效 |
| --- | --- | --- |
| 配置硬编码 | inventory.url 写进 yml,改完重启 | 扩容要逐台改;容器 IP 漂移;实例挂了仍往上打 |
| DNS | 后端配域名,调用方解析 | TTL 内摘不掉故障节点;扩容要改解析;短连接解析开销大 |
| 负载均衡器 | 调用方只认 VIP,后面挂实例 | LB 自身单点;上下线要人工改 upstream;多一跳转发 |

三种办法的共同点是==地址清单由人维护==,而云上实例随时创建、漂移、销毁。注册中心解决三件事:**登记**(我是谁、在哪)、**探活**(我还活着吗)、**发现**(别人怎么找到我)。它自己必须高可用,否则整个集群"失联"。

## 注册、心跳、发现:一条完整时序

1. 服务启动,读取 \`spring.application.name\` 与端口,向 Nacos 发起注册。
2. Nacos 写入注册表,默认是**临时实例**,同时建立 gRPC 长连接(Nacos 2.x)。
3. 客户端默认 5 秒心跳;1.x 是 15 秒不健康、30 秒摘除,2.x 叠加 gRPC 长连接,断连感知更快。
4. 消费方订阅服务,拿到实例列表并缓存到本地;Nacos 有变更时主动推送。
5. 消费方用 Spring Cloud LoadBalancer 从列表中选一台发起调用。
6. 服务下线时主动注销;进程被 kill 则靠心跳超时兜底。

> [!warn] 本地缓存是救命稻草,也是脏数据来源
> 消费方会把实例列表缓存在本地文件里。Nacos 整体挂掉时,服务仍能用旧列表继续调用 —— 这是可用性设计;但实例已经漂移时,旧列表会把请求打到不存在的 IP。==排查"调用方说地址不对"时,先看本地缓存目录,再看 Nacos 控制台==。

| 维度 | 临时实例(ephemeral) | 持久实例(persistent) |
| --- | --- | --- |
| 默认 | 是,大多数微服务用这种 | 否,需显式配置 |
| 健康检查 | 客户端心跳,服务端按连接探活 | 服务端主动探测(TCP/HTTP) |
| 一致性 | Distro 协议,AP,优先可用 | Raft 协议,CP,优先一致 |
| 宕机表现 | 心跳超时后自动摘除 | 不会自动摘除,只标记不健康 |
| 适用 | 无状态业务服务 | 数据库、DNS 等需要稳定登记的节点 |

## 把服务接进 Nacos

\`\`\`xml pom.xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
\`\`\`

\`\`\`yml application.yml
server:
  port: 8080
spring:
  application:
    name: order-service
  cloud:
    nacos:
      discovery:
        server-addr: 127.0.0.1:8848   # 集群用逗号分隔
        namespace: dev                # 环境隔离
        group: ORDER_GROUP            # 项目/业务线隔离
        ephemeral: true
\`\`\`

\`\`\`java OrderApplication.java
// import 省略:SpringBootApplication + EnableDiscoveryClient
@SpringBootApplication
@EnableDiscoveryClient   // 2021+ 可省略,保留表达意图
public class OrderApplication { }
\`\`\`

Nacos 2.x 除了 8848 的 HTTP 端口,还要放通 **9848/9849** 两个 gRPC 端口;只开 8848 会看到控制台有实例、客户端却一直重连。控制台是 ==http://ip:8848/nacos==,默认账号密码都是 nacos;生产环境用 \`MODE=cluster\` 加 MySQL 持久化,单机模式的 Derby 不适合多节点。

\`\`\`shell
docker run -d --name nacos -e MODE=standalone \\
  -p 8848:8848 -p 9848:9848 -p 9849:9849 nacos/nacos-server:v2.3.2
\`\`\`

\`\`\`output
2026-11-14 21:15:02.118  INFO 8124 --- [main] c.a.c.n.registry.NacosServiceRegistry : nacos registry, ORDER_GROUP@@order-service 10.0.0.5:8080 register finished
2026-11-14 21:15:02.401  INFO 8124 --- [main] com.demo.order.OrderApplication       : Started OrderApplication in 3.187 seconds
\`\`\`

\`\`\`java InstanceQueryService.java
package com.demo.order.service;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InstanceQueryService {

    private final DiscoveryClient discoveryClient;

    public InstanceQueryService(DiscoveryClient discoveryClient) {
        this.discoveryClient = discoveryClient;
    }

    public List<String> inventoryInstances() {
        return discoveryClient.getInstances("inventory-service").stream()
                .map(i -> i.getHost() + ":" + i.getPort())
                .toList();
    }
}
\`\`\`

\`\`\`output
[inventory] 10.0.0.7:8080
[inventory] 10.0.0.8:8080
[inventory] 10.0.0.9:8080
\`\`\`

## 配置中心:不改包也能改配置

配置中心要解决的是"配置与代码同生命周期"的问题:数据库密码、限流阈值、开关,改一次就重新打包发布,成本太高。Nacos 用三层坐标定位一份配置:

| 坐标 | 作用 | 例子 |
| --- | --- | --- |
| namespace | 环境隔离,权限也按它划 | dev / test / prod |
| group | 项目或业务线隔离 | ORDER_GROUP |
| dataId | 应用 + profile + 扩展名 | order-service-dev.yml |

\`\`\`yml application.yml
spring:
  application:
    name: order-service
  config:
    import: optional:nacos:order-service-dev.yml
  cloud:
    nacos:
      config:
        server-addr: 127.0.0.1:8848
        file-extension: yml
        namespace: dev
        group: ORDER_GROUP
        refresh-enabled: true
\`\`\`

\`\`\`java OrderProperties.java
package com.demo.order.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.stereotype.Component;

@Data
@Component
@RefreshScope
@ConfigurationProperties(prefix = "order")
public class OrderProperties {
    private int payTimeoutSeconds = 900;
    private int maxItemCount = 50;
}
\`\`\`

\`\`\`output
2026-11-14 21:22:14.007  INFO 8124 --- [main] c.a.c.n.c.NacosPropertySourceBuilder : Loading nacos data, dataId: 'order-service-dev.yml', group: 'ORDER_GROUP'
2026-11-14 21:22:14.011  INFO 8124 --- [main] b.c.PropertySourceBootstrapConfiguration : Located property source: [NacosPropertySource{dataId='order-service-dev.yml', group='ORDER_GROUP'}]
2026-11-14 21:24:40.512  INFO 8124 --- [nacos-config] o.s.c.e.event.RefreshEventListener : Refresh keys changed: [order.pay-timeout-seconds]
order.payTimeoutSeconds = 1200
\`\`\`

\`@RefreshScope\` 的作用是让 Bean 在配置变更后**销毁并重新创建**,下次调用就能读到新值;不加它,注入的基本类型字段会一直停在启动时的快照。注意:静态字段、构造器里提前算好的值刷新不到,配置要作为 Bean 字段使用。

> [!pitfall] 配置中心的三个常见坑
> ① dataId 拼错(多了空格、profile 不对),启动不报错但配置就是没生效;② 改了配置忘了点"发布",控制台草稿状态不会推送;③ 把 \`server.port\` 放在远端配置里,端口一变注册地址跟着变,排查时先看启动日志实际端口。

## Nacos、Eureka、Consul 怎么选

| 维度 | Nacos | Eureka | Consul |
| --- | --- | --- | --- |
| CAP | 临时实例 AP,持久实例 CP,可切 | AP,自我保护 | CP,Raft |
| 健康检查 | 心跳 + 长连接,可服务端探测 | 客户端心跳,15 分钟自保 | TCP/HTTP/gRPC/脚本 |
| 配置中心 | 内置,同一套控制台 | 无,需 Spring Cloud Config | 内置 KV |
| 推送方式 | gRPC 长连接 + 本地缓存 | 客户端定时拉取 | 阻塞查询/通知 |
| 控制台与生态 | 中文控制台,阿里生态 | Netflix 已停止演进 | HashiCorp,多数据中心强 |

Eureka 的**自我保护**:15 分钟内心跳续约比例低于 85% 就不摘实例,宁可留着脏数据也不误杀 —— 网络抖动时保护了服务,但会让调用方打到死节点。Nacos 没有这个机制,靠心跳超时摘除和本地缓存兜底。选型上,新项目国内基本默认 Nacos:注册 + 配置一套解决,控制台和权限也够用。

## 面试速记

- 注册中心三件事:登记、探活、发现;消费方拿到的列表会本地缓存,注册中心挂了仍可短时调用。
- 临时实例 AP + 心跳,持久实例 CP + 服务端探测;Nacos 2.x 走 gRPC,必须放通 9848/9849。
- dataId 默认是"应用名-profile.扩展名",namespace 隔离环境,group 隔离项目。
- @RefreshScope 让 Bean 重建以读取新配置;静态字段与启动时算好的值刷新不到。
- Nacos 注册+配置一体;Eureka 只有注册且已停更;Consul 强一致、多数据中心强。
`
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch04',
        title: 'OpenFeign:声明式服务调用',
        minutes: 150,
        points: ['动态代理', '编解码', '负载均衡', '超时重试', '常见坑'],
        content: `
> [!info] 本章导读 · 写个接口加注解就能调远程服务,魔法在哪?
> 定义一个接口、贴上 \`@FeignClient\`,注入后就像调本地方法一样发起 HTTP 请求 —— 没有实现类,却能跑通。魔法不在编译期,而在启动时的代理注册与调用时的请求模板拼装。
> - 读完本章你将能:讲清 Feign 从注解到 HTTP 请求的完整链路
> - 写出带路径参数、请求头、降级的 Feign 客户端
> - 独立排查 404、405、超时与降级不生效

> [!tip] 日常电脑现场 · 对着语音助手说一句话
> 你只说"帮我叫辆车",不用知道是哪家平台接单、走哪条路、司机是谁。语音助手替你翻译意图、找服务、发请求、把结果念给你。Feign 就是代码里的语音助手:你声明"我要调 getById",它负责拼 URL、发请求、把 JSON 变回对象。

## 魔法的入口:@EnableFeignClients

\`\`\`text
启动阶段
  @EnableFeignClients
    -> 扫描 @FeignClient 接口
    -> 为每个接口注册 FeignClientFactoryBean
    -> getObject() 返回 JDK 动态代理(接口没有实现类)

调用阶段
  orderClient.getById(1001L)
    -> 代理拦截 Method
    -> Contract(SpringMvcContract)解析 @GetMapping 等注解
    -> 生成 RequestTemplate:GET /orders/1001
    -> Encoder 编码参数(JSON / query / path)
    -> Client 发送:默认 HttpURLConnection,可换 HC5 / OkHttp
    -> LoadBalancer 把服务名解析成实例,选一台
    -> Decoder 把响应反序列化成 OrderDTO
\`\`\`

关键角色:**Contract** 负责"看懂注解",**Encoder/Decoder** 负责"对象与 HTTP 互转",**Client** 负责"真正发请求",**LoadBalancer** 负责"服务名到 IP"。Spring Cloud 2021 之后 Ribbon 退场,负载均衡统一由 Spring Cloud LoadBalancer 承担。

## 写一个 Feign 客户端

\`\`\`java OrderClient.java
package com.demo.api;

import com.demo.api.dto.OrderCreateReq;
import com.demo.api.dto.OrderDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(
        name = "order-service",              // 注册中心里的服务名
        path = "/orders",                   // 统一前缀
        contextId = "orderClient",           // 同名服务多个接口时区分
        configuration = OrderFeignConfig.class
)
public interface OrderClient {

    @GetMapping("/{id}")
    OrderDTO getById(@PathVariable("id") Long id);

    @GetMapping("/list")
    List<OrderDTO> listByUser(@RequestParam("userId") Long userId,
                              @RequestHeader("X-Trace-Id") String traceId);
    @PostMapping
    OrderDTO create(@RequestBody OrderCreateReq req);
}
\`\`\`

\`\`\`java OrderFeignConfig.java
package com.demo.api;

import feign.Logger;
import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;

public class OrderFeignConfig {
    @Bean
    public Logger.Level feignLoggerLevel() {
        return Logger.Level.BASIC;          // NONE/BASIC/HEADERS/FULL
    }

    @Bean
    public RequestInterceptor traceInterceptor() {
        return template -> template.header("X-Source", "order-service");
    }
}
\`\`\`

\`\`\`java OrderController.java
package com.demo.order.controller;

import com.demo.api.OrderClient;
import com.demo.api.dto.OrderDTO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class OrderController {

    private final OrderClient orderClient;

    public OrderController(OrderClient orderClient) {
        this.orderClient = orderClient;
    }

    @GetMapping("/proxy/orders/{id}")
    public OrderDTO proxy(@PathVariable Long id) {
        return orderClient.getById(id);
    }
}
\`\`\`

\`\`\`output
2026-11-14 21:30:11.402 DEBUG 9216 --- [http-nio-8080-exec-2] com.demo.api.OrderClient : [OrderClient#getById] ---> GET http://order-service/orders/1001 HTTP/1.1
2026-11-14 21:30:11.402 DEBUG 9216 --- [http-nio-8080-exec-2] com.demo.api.OrderClient : [OrderClient#getById] X-Source: order-service
2026-11-14 21:30:11.431 DEBUG 9216 --- [http-nio-8080-exec-2] com.demo.api.OrderClient : [OrderClient#getById] <--- HTTP/1.1 200 OK (29ms)
{"orderId":1001,"userId":88,"amount":199.00,"status":"PAID"}
\`\`\`

注意日志里的 URL 是 \`http://order-service/...\` 而不是 IP —— 请求先到负载均衡器,由它把服务名换成实例地址。**服务名必须与注册中心一致**,并且调用方与提供方要在同一个 namespace/group 下,否则实例列表为空。

## 超时、重试与日志

\`\`\`yml application.yml
spring:
  cloud:
    openfeign:
      client:
        config:
          default:
            connect-timeout: 2000       # 毫秒
            read-timeout: 3000
            logger-level: basic
          order-service:
            connect-timeout: 1000
            read-timeout: 2000
      httpclient:
        hc5:
          enabled: true                 # 用连接池替代默认 HttpURLConnection
    loadbalancer:
      retry:
        enabled: true                   # 仅对幂等接口开启

logging:
  level:
    com.demo.api: debug                 # Feign 日志是 debug 级
\`\`\`

\`\`\`output
2026-11-14 21:34:02.771  WARN 9216 --- [http-nio-8080-exec-5] o.s.c.o.f.FeignBlockingLoadBalancerClient : order-service: 503
2026-11-14 21:34:05.804 ERROR 9216 --- [http-nio-8080-exec-5] c.d.o.c.OrderController : feign.RetryableException: Read timed out executing GET http://order-service/orders/1002
\`\`\`

Spring Cloud OpenFeign 默认 **Retryer.NEVER_RETRY**,不会自动重试;需要重试时优先用 Spring Cloud LoadBalancer 的重试(要引入 spring-retry)或 Sentinel/Resilience4j,并且只对**幂等请求**开。给 POST 下单配 3 次重试,等于给用户下 3 单。

| 维度 | RestTemplate | OpenFeign |
| --- | --- | --- |
| 风格 | 编程式,手写 URL 与参数 | 声明式,接口 + 注解 |
| 代码量 | 每个调用都要拼字符串 | 接口定义一次,处处注入 |
| 负载均衡 | 需 \`@LoadBalanced\` 修饰 Bean | 内置,服务名直接用 |
| 可读性 | URL 模板散落各处 | 接口即契约,天然文档 |
| 错误处理 | 手动判状态码、抛异常 | ErrorDecoder + fallback 统一处理 |
| 灵活度 | 任意请求都能发 | 特殊场景仍需 RestTemplate/WebClient |

## 常见坑:从 404 到降级不生效

| 现象 | 根因 | 处理 |
| --- | --- | --- |
| 405 Method Not Allowed | GET 方法里放了对象参数,被当成请求体 | 用 \`@SpringQueryMap\` 明确按 query 传,或拆成多个 \`@RequestParam\` |
| 404 Not Found | \`name\` 写错、\`path\` 与提供方 context-path 不匹配、服务没注册上 | 看注册中心实例列表;对比提供方 \`server.servlet.context-path\` |
| 调用超时 | 默认 readTimeout 60s,但下游更慢;或没开连接池 | 显式配 connect/read 超时,开 HC5,配下游超时预算 |
| fallback 不触发 | 没开 \`feign.sentinel.enabled\`,或 fallback 类不是 Spring Bean | 打开开关;fallback 实现加 \`@Component\` |
| 同名客户端冲突 | 多个接口共用 name 且配置不同 | 每个接口设置唯一 \`contextId\` |

> [!pitfall] 降级方法签名必须对得上
> \`fallback\` 指定的类要实现 Feign 接口,并且是 Spring Bean;方法名、参数、返回值必须完全一致。写成静态方法、少了参数、返回 \`Object\`,都会在启动时报 \`IllegalStateException\`。\`fallbackFactory\` 能拿到异常原因,排查时比 \`fallback\` 更好用。

> [!warn] 超时要小于上游给你的超时
> 网关 3s、订单 2s、库存 1s 是合理的逐层收缩;如果库存配 10s,订单早就超时返回了,库存还在傻等,线程被占住。==每一层都要有超时预算,并且下游必须小于上游==。

## 面试速记

- Feign 本质:启动时为 @FeignClient 接口生成 JDK 动态代理,调用时由 Contract 解析注解、Encoder 编码、Client 发送、Decoder 解码。
- 服务名调用依赖注册中心 + Spring Cloud LoadBalancer;2021 版后 Ribbon 已退出。
- Spring Cloud OpenFeign 默认不重试;重试只对幂等接口开,POST 不要无脑重试。
- GET 传对象用 @SpringQueryMap;404 查服务名与路径,405 查 GET 带 body。
- fallback 要生效需开启 Sentinel 适配,且实现类必须是 Spring Bean、签名完全一致。
`
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch05',
        title: 'Gateway 网关与统一鉴权',
        minutes: 160,
        points: ['Route/Predicate/Filter', '服务发现路由', 'JWT 鉴权', '跨域', '与 Nginx 分工'],
        content: `
> [!info] 本章导读 · 100 个微服务,难道每个都要写一遍登录校验?
> 每个服务都写 JWT 解析、白名单、跨域、限流,代码重复还是小事,校验逻辑一改就要发 100 次版。网关把这类"所有请求都要过"的事收口到一层,服务只关心业务。
> - 读完本章你将能:说清 Route、Predicate、Filter 三件套
> - 写出基于服务发现的动态路由
> - 用 GlobalFilter 实现统一 JWT 鉴权并正确返回 401

> [!tip] 日常电脑现场 · 公司前台的门禁
> 访客进楼先在前台登记、验身份、领访客牌,里面每个部门不用再查一遍证件。前台还能按事由把人引导到不同楼层 —— 这就是网关:统一验身、统一引导,业务部门只管干活。

## 网关到底替谁干活

网关是**所有外部请求进入微服务集群的唯一入口**,职责可以背成五件事:

- **路由**:按路径、域名、Header 把请求转到对应服务,支持服务发现与灰度;
- **鉴权**:统一校验 JWT/OAuth2,把用户身份放进请求头传给下游;
- **限流**:按路由、IP、用户维度限速,保护后端;
- **日志与追踪**:记录入口耗时、生成 traceId,串联整条调用链;
- **跨域**:在入口统一处理 CORS,不让每个服务各配一遍。

| 维度 | Nginx | Spring Cloud Gateway |
| --- | --- | --- |
| 定位 | 边缘网关,四层/七层入口 | 应用网关,业务路由 |
| 路由依据 | host/path/header,静态配置为主 | 断言 + 服务发现 lb://,可动态 |
| 鉴权能力 | Basic/IP/WAF,粗粒度 | JWT/OAuth2 细粒度,可改写请求 |
| 限流 | limit_req/limit_conn,单机内存 | Redis 令牌桶,可分布式 |
| 典型分工 | TLS、静态资源、抗流量、黑白名单 | 登录校验、路由到服务、灰度、业务限流 |

==两层不是二选一,而是前后配合==:Nginx 在最外层做 TLS 终止与静态资源,挡住大部分无效流量;Gateway 在应用层解析 token、按服务名路由、把用户信息传给下游。

## 三个核心概念:Route、Predicate、Filter

| 概念 | 作用 | 常见写法 |
| --- | --- | --- |
| Route | ID + 目标 URI + 断言 + 过滤器 | \`id: order-route, uri: lb://order-service\` |
| Predicate | 匹配条件,全部满足才命中 | Path / Method / Header / Query / Weight |
| Filter | 命中后加工请求或响应 | StripPrefix / AddRequestHeader / RequestRateLimiter |

请求进来后按顺序:先匹配 Route,再执行该路由的过滤器链,最后转发;全局过滤器 \`GlobalFilter\` 对所有路由生效,适合做鉴权与日志。

## 路由配置实战

\`\`\`yml application.yml
server:
  port: 9000

spring:
  application:
    name: api-gateway
  cloud:
    nacos:
      discovery:
        server-addr: 127.0.0.1:8848
    gateway:
      routes:
        - id: order-route
          uri: lb://order-service      # lb 表示走负载均衡
          predicates:
            - Path=/api/orders/**
            - Method=GET,POST
          filters:
            - StripPrefix=1            # /api/orders/1001 -> /orders/1001
            - AddRequestHeader=X-Gateway, cloud-gateway
\`\`\`

\`StripPrefix=1\` 剥掉 \`/api\` 这一级,\`/api/orders/1001\` 转发为 \`/orders/1001\`。==剥几层取决于目标服务真实路径,不是固定值==;写成 \`StripPrefix=2\` 会变成 \`/1001\`,多半吃 404。生产还应关闭 \`discovery.locator\` 的自动路由,避免服务名裸奔。

\`\`\`shell
curl -s http://127.0.0.1:9000/actuator/gateway/routes | jq '.[0]'
\`\`\`

\`\`\`output
{"route_id":"order-route","uri":"lb://order-service",
 "predicate":"Paths: [/api/orders/**], Methods: [GET, POST]",
 "filters":["StripPrefix=1"]}
\`\`\`

## 全局过滤器:JWT 统一鉴权

\`\`\`java JwtAuthFilter.java
package com.demo.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Component
public class JwtAuthFilter implements GlobalFilter, Ordered {

    private final SecretKey key = Keys.hmacShaKeyFor(
            "cloud-demo-secret-key-must-be-32-bytes!".getBytes(StandardCharsets.UTF_8));

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        if (path.startsWith("/auth/login") || path.startsWith("/auth/register")
                || path.startsWith("/actuator")) {
            return chain.filter(exchange);
        }
        String auth = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (auth == null || !auth.startsWith("Bearer ")) {
            return reject(exchange, "缺少令牌");
        }
        try {
            Claims claims = Jwts.parser().verifyWith(key).build()
                    .parseSignedClaims(auth.substring(7)).getPayload();
            ServerHttpRequest request = exchange.getRequest().mutate()
                    .headers(h -> h.remove("X-User-Id"))
                    .header("X-User-Id", claims.getSubject()).build();
            return chain.filter(exchange.mutate().request(request).build());
        } catch (Exception e) {
            return reject(exchange, "令牌无效或已过期");
        }
    }

    private Mono<Void> reject(ServerWebExchange exchange, String msg) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        String body = "{\\"code\\":401,\\"msg\\":\\"" + msg + "\\"}";
        DataBuffer buffer = exchange.getResponse().bufferFactory()
                .wrap(body.getBytes(StandardCharsets.UTF_8));
        return exchange.getResponse().writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() { return -100; }
}
\`\`\`

\`\`\`shell
# 不带令牌
curl -i http://127.0.0.1:9000/api/orders/1001
# 带令牌
curl -i -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMDAxIn0.Ifqi_fUXnuNnR6woz7EUA0Td4Jvea3so5lqwBVeACxs" http://127.0.0.1:9000/api/orders/1001
\`\`\`

\`\`\`output
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{"code":401,"msg":"缺少令牌"}

HTTP/1.1 200 OK
Content-Type: application/json
{"orderId":1001,"userId":1001,"status":"PAID"}
\`\`\`

> [!danger] Gateway 是 WebFlux,不是 Servlet
> 它跑在 Netty 上,==不能引入 spring-boot-starter-web==,否则 SpringMVC 与 WebFlux 争抢容器,启动即报错。过滤器里禁止写阻塞代码(JDBC、同步 HTTP、Thread.sleep),要调远程用 WebClient 返回 Mono;一个阻塞调用就能卡住整个事件循环。鉴权通过后写 X-User-Id 时,记得先删掉客户端自带的同名头。

## 跨域与 Sentinel 集成

\`\`\`yml application.yml
spring:
  cloud:
    gateway:
      globalcors:
        add-to-simple-url-handler-mapping: true
        cors-configurations:
          "[/**]":
            allowed-origin-patterns: "https://*.shop.com"
            allowed-methods: "*"
            allow-credentials: true
\`\`\`

\`allow-credentials: true\` 时不能用 \`allowed-origins: "*"\`,必须写具体域名或通配模式,否则浏览器直接拒绝。预检请求 \`OPTIONS\` 也要能通过鉴权白名单,否则登录接口的预检会先吃一个 401。

限流首选 \`RequestRateLimiter\` + Redis(令牌桶可跨实例共享);要按业务资源熔断,引入 \`spring-cloud-alibaba-sentinel-gateway\`,Sentinel 会把**路由 ID 当作资源名**,在控制台给它配流控与熔断规则,超限直接返回 429。

## 面试速记

- 网关五职责:路由、鉴权、限流、日志追踪、跨域;核心模型 Route = Predicate + Filter + URI。
- \`lb://service-name\` 走注册中心与负载均衡;\`StripPrefix\` 剥路径层数,剥错就 404。
- GlobalFilter 用 order 控制顺序;鉴权失败直接写响应并 \`setComplete()\`,不要放行。
- Gateway 基于 WebFlux/Netty,不能有 spring-web,过滤器内禁止阻塞。
- Nginx 管边缘(TLS、静态、抗量),Gateway 管应用(鉴权、服务路由、灰度),两层配合。
`
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch06',
        title: 'Sentinel 熔断限流与分布式事务入门',
        minutes: 180,
        points: ['雪崩效应', '限流/熔断/降级', 'Sentinel 规则', 'Seata AT', 'CAP/BASE'],
        content: `
> [!info] 本章导读 · 下游服务挂了,为什么要把上游也拖死?
> 库存服务只是慢了一点,订单服务的线程却全卡在等响应;线程池一满,订单也拒绝新请求;网关再超时,用户看到整站不可用。一个下游的抖动,沿着调用链放大成雪崩 —— 服务保护就是在这里踩刹车。
> - 读完本章你将能:分清限流、熔断、降级的触发条件与动作
> - 用 Sentinel 配出 QPS 限流与慢调用熔断
> - 说清 2PC、TCC、可靠消息、Seata AT 的取舍

> [!tip] 日常电脑现场 · 家里的空气开关
> 插排上同时开空调、电磁炉、电热水壶,总闸"啪"地跳了 —— 不是电器坏了,而是保护装置在过载时主动切断,避免电线起火。熔断器就是这个空气开关:下游持续出错时主动断开,等它恢复了再慢慢合闸。

## 雪崩是怎么发生的

\`\`\`text
正常:订单 -> 库存, RT 50ms, 订单线程池 200, QPS 500, 游刃有余

库存变慢:RT 从 50ms 涨到 5s
  订单每个请求占线程 5s -> 200 个线程 5s 内被占满 -> 新请求排队
  -> 订单 RT 继续上涨 -> 网关读超时 -> 用户重试 -> 流量翻倍
  -> 库存被更多请求压垮 -> 全面不可用

三个放大器:同步调用、无超时、无上限重试
\`\`\`

雪崩的根因不是"下游挂了",而是**上游用无限资源等一个不可用的下游**。三道刹车:**超时**(别等太久)、**限流**(别放太多进来)、**熔断**(别继续打)。再配合线程池隔离,让一个依赖的故障不占满所有线程。

## 限流、熔断、降级不是一回事

| 机制 | 保护谁 | 触发条件 | 动作 | 恢复方式 |
| --- | --- | --- | --- | --- |
| 限流 | 自己 | QPS/并发超过阈值 | 拒绝或排队,返回 429 | 流量降下来立即恢复 |
| 熔断 | 自己,避免被下游拖死 | 慢调用比例、异常比例、异常数超阈值 | 短路,不再调用下游 | 时间窗口后半开试探 |
| 降级 | 用户体验 | 熔断/限流/业务异常 | 返回兜底数据或默认值 | 依赖恢复后回到正常逻辑 |
| 隔离 | 自己 | 资源池打满 | 线程池/信号量隔离,故障不扩散 | 资源释放后恢复 |

一句话:**限流管入口流量,熔断管下游依赖,降级管返回结果,隔离管资源边界**。熔断一定伴随降级,但降级不一定由熔断触发(也可以因为业务开关)。

## Sentinel:一条插槽链做所有治理

\`\`\`text
SphU.entry("createOrder")
  -> NodeSelectorSlot   构建调用树
  -> ClusterBuilderSlot 按来源聚类统计
  -> StatisticSlot      滑动窗口累加 QPS/RT/异常
  -> AuthoritySlot      黑白名单
  -> SystemSlot         系统负载保护(CPU/入口 QPS)
  -> FlowSlot           流控规则(直接/关联/链路)
  -> DegradeSlot        熔断规则(慢调用/异常比例/异常数)
  -> 业务方法
\`\`\`

Sentinel 以**资源**为维度,把每次调用记进滑动窗口,阈值可选 QPS 或线程数,规则命中就在插槽里抛出 \`BlockException\`。规则可以写死在代码里,也可以放 Nacos,由 dashboard 推送 —— 生产用后者,改阈值不用发版。

\`\`\`java OrderService.java
package com.demo.order.service;

import com.alibaba.csp.sentinel.annotation.SentinelResource;
import com.alibaba.csp.sentinel.slots.block.BlockException;
import org.springframework.stereotype.Service;

@Service
public class OrderService {

    @SentinelResource(value = "createOrder",
            blockHandler = "createOrderBlocked",
            fallback = "createOrderFallback")
    public String createOrder(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("userId 不能为空");
        }
        return "订单创建成功: " + userId;
    }

    public String createOrderBlocked(Long userId, BlockException e) {
        return "请求被限流或熔断,请稍后再试";
    }

    public String createOrderFallback(Long userId, Throwable t) {
        return "下单失败,已降级: " + t.getMessage();
    }
}
\`\`\`

\`\`\`yml application.yml
spring:
  cloud:
    sentinel:
      transport:
        dashboard: 127.0.0.1:8858
        port: 8719
      eager: true
      web-context-unify: false          # 链路模式需要,否则所有入口算一个资源
      datasource:
        flow:
          nacos:
            server-addr: 127.0.0.1:8848
            data-id: order-service-flow-rules
            group-id: SENTINEL_GROUP
            rule-type: flow
\`\`\`

\`\`\`output
请求 1 -> 订单创建成功: 1001
请求 2 -> 订单创建成功: 1002
请求 3 -> 请求被限流或熔断,请稍后再试
请求 4 -> 请求被限流或熔断,请稍后再试
[dim]控制台规则:资源 createOrder,阈值类型 QPS,阈值 2,流控模式 直接[/dim]
\`\`\`

\`blockHandler\` 只接 \`BlockException\`(限流/熔断),\`fallback\` 接业务异常;两者签名都要与原方法一致,blockHandler 末尾多一个 \`BlockException\` 参数。业务异常如果不想进 fallback,用 \`exceptionsToIgnore\` 排除。

| 熔断策略 | 触发条件 | 适用 |
| --- | --- | --- |
| 慢调用比例 | RT 超过阈值且比例达阈值,最小请求数满足 | 下游变慢但没报错 |
| 异常比例 | 异常数占比超过阈值 | 下游大量抛错 |
| 异常数 | 统计窗口内异常数超过阈值 | 突发错误,想快速断开 |

> [!warn] 流控模式选错,规则等于没配
> **直接**:资源自身 QPS 超限就限;**关联**:关联资源超限时限自己(比如下单太猛就限支付);**链路**:只限从某个入口进来的调用,需要 \`web-context-unify: false\`。压测发现规则不生效,先看资源名是否一致、规则是否真的推送到了客户端。

## 分布式事务:一致性要花多少钱

跨服务写操作没有单一数据库连接,本地事务管不了。主流方案本质上都在"强一致"和"可用性"之间做交换:

| 方案 | 一致性 | 业务侵入 | 性能 | 典型场景 |
| --- | --- | --- | --- | --- |
| 2PC/XA | 强一致 | 低,数据库支持 | 差,同步阻塞、锁持有久 | 少量强一致、同库异构 |
| TCC | 最终一致 | 高,要写 Try/Confirm/Cancel | 好,两阶段业务补偿 | 支付、资金,需幂等与防悬挂 |
| 可靠消息 | 最终一致 | 中,本地消息表 + MQ | 好,异步削峰 | 下单后发积分、通知 |
| Seata AT | 最终一致(读已提交近似) | 低,加注解即可 | 中,全局锁有竞争 | 大多数业务表操作 |
| Saga | 最终一致 | 高,每步写补偿 | 好,适合长流程 | 跨企业、长事务 |

**Seata AT 的两阶段**:一阶段执行业务 SQL,同时记录 before/after image 到 \`undo_log\`,并申请全局锁;二阶段提交就异步删 undo_log,回滚就用 undo_log 反向补偿,并校验数据是否被脏写。业务代码只需要一个注解:

\`\`\`java OrderTxService.java
package com.demo.order.service;

import com.demo.api.AccountClient;
import com.demo.api.InventoryClient;
import com.demo.order.mapper.OrderMapper;
import io.seata.spring.annotation.GlobalTransactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OrderTxService {

    private final OrderMapper orderMapper;
    private final InventoryClient inventoryClient;
    private final AccountClient accountClient;

    @GlobalTransactional(name = "create-order", rollbackFor = Exception.class)
    public void createOrder(Long userId, Long skuId, int count) {
        orderMapper.insert(userId, skuId, count);
        inventoryClient.deduct(skuId, count);   // 远程分支事务
        accountClient.debit(userId, count * 100L);
    }
}
\`\`\`

\`\`\`output
2026-11-14 22:40:10.118  INFO 12880 --- [main] i.s.tm.api.DefaultGlobalTransaction : Begin new global transaction [10.0.0.5:8091:7362815]
2026-11-14 22:40:10.402  INFO 12880 --- [http-nio-8080-exec-1] i.s.r.d.undo.UndoLogManager        : branch 7362815001 undo_log prepared
2026-11-14 22:40:10.671 ERROR 12880 --- [http-nio-8080-exec-1] i.s.tm.api.DefaultGlobalTransaction : [10.0.0.5:8091:7362815] rollback status: Rollbacked
\`\`\`

> [!danger] AT 不是银弹
> 全局锁会带来写竞争,高并发写同一行时退化成串行;undo_log 需要额外存储;脏写校验失败会回滚失败,必须人工介入。==能靠业务设计避免跨服务事务,就不要上分布式事务==:把强一致的数据放在同一个服务、同一个库,是最便宜的一致性方案。

**CAP** 说分布式系统在分区容错(P)必须成立的前提下,一致性(C)与可用性(A)只能二选一;**BASE** 是 AP 方向的工程妥协:基本可用、软状态、最终一致。多数互联网业务选 BASE,资金账务才在关键环节追求强一致。

## 拆分原则与落地坑

- **按领域拆,不按技术拆**:订单服务包含订单的库、接口、定时任务,而不是"Controller 服务、Service 服务"。
- **数据库私有**:每个服务只写自己的库,别人要数据走接口或订阅事件。
- **粒度宁粗勿细**:一个服务对应一个团队能独立负责的边界;拆太细,一次下单调 8 个服务,延迟和故障点翻倍。
- **先解耦再拆分**:模块内先禁止跨包访问,边界稳定后再拆进程。
- **可观测性先行**:traceId、结构化日志、指标、告警,没有这些,拆完就是黑盒。

> [!pitfall] 四个高频翻车点
> ① **共享数据库**:等于没拆,表结构变更仍然全站联动;② **分布式单体**:服务拆了但必须一起发布,接口强耦合;③ **同步调用链过长**:A→B→C→D,任何一环抖动全链路超时;④ **缺幂等**:超时重试、消息重投都会造成重复下单,接口必须带业务唯一键。

## 面试速记

- 雪崩三放大器:同步调用、无超时、无上限重试;三道刹车:超时、限流、熔断,配合隔离。
- 限流保护自己入口,熔断保护自己不被下游拖死,降级保护用户体验,隔离保护资源边界。
- Sentinel 核心是资源 + 滑动窗口 + 插槽链;blockHandler 接 BlockException,fallback 接业务异常。
- 分布式事务:2PC 强一致但阻塞,TCC 性能好但侵入高,可靠消息最终一致,Seata AT 低侵入但有全局锁。
- CAP 三者不可兼得,BASE 是 AP 的工程妥协;能同库解决就别跨服务,能补偿就别强一致。
`
      }
    ],
    interview: [
      { q: 'Nginx 反向代理的原理是什么?502 和 504 怎么排查?', a: '**原理**:Nginx 作为服务端入口,监听 80/443,按 server_name 与 location 匹配请求,通过 proxy_pass 把请求转发到 upstream,并把响应回写给客户端;它同时承担 TLS 终止、连接复用、缓冲与超时控制。**502** 是连不上上游或上游返回非法响应,常见于后端进程挂了、端口错、keepalive 头没清、响应头过大,先看 error.log 的 upstream 行再直连后端。**504** 是连上了但在 proxy_read_timeout 内没响应,常见于慢 SQL、锁等待、线程池打满,不要先调大超时,要定位后端慢在哪。499 则是客户端先断开。' },
      { q: 'Nginx 有哪些负载均衡算法?各自适用什么场景?', a: '**轮询**默认,按顺序分发,适合同质无状态服务;**加权轮询**用 weight 按机器配置分配;**least_conn** 选活跃连接最少者,适合请求耗时差异大;**ip_hash** 按客户端 IP 哈希做会话粘滞,但 NAT 后大量用户共享 IP、扩容会漂移,现代方案是把 session 放 Redis;**hash key consistent** 是一致性哈希,适合缓存分片,扩容只迁移少量 key;**random two least_conn** 随机两台再择优,适合大规模集群。Nginx 开源版只有被动健康检查(max_fails/fail_timeout),主动探测要 Plus/Tengine/OpenResty。' },
      { q: '微服务相比单体有哪些优缺点?什么时候不该拆?', a: '**优点**:独立开发部署与回滚、故障隔离、按服务扩缩容、技术栈自由、团队边界清晰。**缺点**:网络调用不可靠、延迟放大、跨服务事务只能最终一致、运维与可观测性成本陡增、联调与测试复杂。**不该拆**的情况:业务简单、团队小于 10 人、没有自动化发布与监控、数据库还无法按边界拆开。此时单体加模块化是更优解;强行拆会得到"分布式单体",复杂度上去了,独立性没拿到。' },
      { q: 'Nacos 和 Eureka 有什么区别?为什么新项目多用 Nacos?', a: '**CAP**:Eureka 是 AP,靠客户端心跳与自我保护;Nacos 临时实例 AP(Distro),持久实例 CP(Raft),可按实例类型选择。**功能**:Nacos 注册 + 配置一体,带中文控制台、命名空间、分组、权重、元数据;Eureka 只有注册,配置要另配 Spring Cloud Config。**健康检查**:Nacos 2.x 用 gRPC 长连接 + 心跳,支持服务端主动探测;Eureka 只靠客户端续约,15 分钟续约率低于 85% 进入自我保护、不摘实例。**生态**:Eureka 2.0 已停止演进,新项目国内基本选 Nacos。' },
      { q: 'OpenFeign 的原理是什么?一次调用经过哪些步骤?', a: '启动时 @EnableFeignClients 扫描 @FeignClient 接口,为每个接口注册 FeignClientFactoryBean,getObject() 返回 **JDK 动态代理**。调用时:代理拦截方法 → Contract(SpringMvcContract)解析 @GetMapping 等注解生成 RequestTemplate → Encoder 编码参数 → Client 发请求,默认 HttpURLConnection,可换 HC5/OkHttp → LoadBalancer 把服务名解析成实例并选择 → Decoder 把响应反序列化为对象。核心角色是 Contract、Encoder/Decoder、Client、LoadBalancer 四件套,服务名调用依赖注册中心。' },
      { q: 'Gateway 的作用是什么?和 Nginx 怎么分工?', a: 'Gateway 是应用层统一入口,负责**路由**(断言 + lb:// 服务发现)、**鉴权**(统一解析 JWT 并把用户信息写入请求头)、**限流**(Redis 令牌桶)、**日志追踪**(traceId)与**跨域**。Nginx 是边缘网关,负责 TLS 终止、静态资源、抗流量、IP 黑白名单与粗粒度限流;Gateway 负责业务路由与细粒度鉴权。生产通常 Nginx 在前、Gateway 在后,两层配合而不是二选一。Gateway 基于 WebFlux/Netty,不能引入 spring-web,过滤器内禁止阻塞。' },
      { q: '熔断、降级、限流有什么区别?', a: '**限流**保护自己:入口 QPS/并发超过阈值就拒绝或排队,返回 429,流量降下来立即恢复。**熔断**保护自己不被下游拖死:当下游慢调用比例、异常比例或异常数超阈值,主动短路一段时间,之后半开试探,成功再闭合。**降级**是结果处理:熔断、限流或业务异常时返回兜底数据、默认值或友好提示。**隔离**是资源边界:线程池或信号量隔离,防止一个依赖占满全部线程。四者常组合:限流挡入口,熔断断依赖,降级给兜底,隔离控资源。' },
      { q: 'Sentinel 的原理是什么?规则有哪几类?', a: 'Sentinel 以**资源**为维度,每次调用通过 SphU.entry 进入一条**插槽链**:NodeSelectorSlot 构建调用树、ClusterBuilderSlot 按来源统计、StatisticSlot 用滑动窗口累计 QPS/RT/异常,再依次经过 FlowSlot(流控)、DegradeSlot(熔断)、SystemSlot(系统保护)、AuthoritySlot(黑白名单),命中规则抛 BlockException。规则类型:流控(直接/关联/链路,QPS 或线程数)、熔断(慢调用比例/异常比例/异常数)、系统自适应、热点参数、授权。规则可持久化到 Nacos,由 dashboard 推送,改阈值不用发版。' },
      { q: '服务雪崩是怎么产生的?如何防止?', a: '下游变慢或不可用,上游线程池被同步等待占满,新请求排队,RT 继续上升;用户重试与网关超时进一步放大流量,最终整条链路不可用。三个放大器是同步调用、无超时、无上限重试。**防护**:① 每层设置超时预算,下游必须小于上游;② 限流挡住超过服务能力的入口流量;③ 熔断在下游持续失败时快速短路,半开恢复;④ 线程池/信号量隔离,避免一个依赖占满资源;⑤ 降级返回兜底;⑥ 重试只对幂等请求且限制次数。' },
      { q: '分布式事务有哪些方案?Seata AT 的原理是什么?', a: '**2PC/XA**:数据库层prepare/commit,强一致但同步阻塞、锁持有久。**TCC**:业务层 Try 预留、Confirm 提交、Cancel 补偿,性能好但侵入高,要幂等、防悬挂、防空回滚。**可靠消息**:本地消息表 + MQ,下游消费幂等,做到最终一致。**Seata AT**:一阶段执行业务 SQL 并记录 before/after image 到 undo_log、申请全局锁;二阶段提交异步删 undo_log,回滚用 undo_log 反向补偿并校验脏写。**Saga** 适合长流程,每步配补偿。能同库解决就别跨服务,能最终一致就别强一致。' },
      { q: '微服务应该怎么拆分?粒度怎么把握?', a: '按**业务能力/领域边界**拆(DDD 限界上下文),不按技术分层拆;每个服务拥有自己的数据库,只写自己的数据,别人通过接口或事件获取。粒度标准:一个团队能独立负责、能独立发布、故障能隔离;宁粗勿细,一次下单跨 8 个服务意味着 8 个故障点。落地顺序:先模块化并禁止跨模块访问内部类,再拆变化频率最高/资源消耗最大的模块,补注册、配置、网关、可观测性,最后拆库。避免共享数据库、分布式单体、过长同步调用链与缺幂等。' },
      { q: '配置中心解决什么问题?动态刷新是怎么实现的?', a: '配置中心把配置从代码包中剥离,解决改一个阈值就要重新打包发布的问题,并提供环境隔离(命名空间)、项目隔离(分组)、版本与灰度。Nacos 用 namespace + group + dataId 定位配置,客户端启动时拉取并监听变更,服务端通过长连接推送。Spring Cloud 中 @RefreshScope 让 Bean 在配置变更后销毁重建,下次调用读到新值;底层是 RefreshScope 刷新事件 + 环境属性源更新。静态字段、构造器里提前算好的值刷新不到,配置应作为 Bean 字段使用。' },
      { q: 'CAP 和 BASE 分别是什么?实际系统怎么选?', a: '**CAP**:一致性、可用性、分区容错三者不可同时满足;分布式系统网络分区不可避免,所以 P 必选,实际是在 C 与 A 之间取舍。**BASE**:基本可用、软状态、最终一致,是 AP 方向的工程妥协。选型:注册中心临时实例、商品详情、社交 Feed 选 AP/BASE,允许短暂不一致换可用;资金账务、库存扣减的强一致环节选 CP 或本地事务 + 幂等补偿。多数互联网业务整体走 BASE,只在关键资金链路上追求强一致。' },
      { q: 'Spring Boot、Spring Cloud、Spring Cloud Alibaba 版本怎么对应?', a: '必须按官方对照表逐层匹配:**Boot 3.2.x ↔ Spring Cloud 2023.0.x(Leyton)↔ Alibaba 2023.0.1.0**;**Boot 3.0/3.1 ↔ Cloud 2022.0.x(Kilburn)↔ Alibaba 2022.0.0.0**;**Boot 2.6/2.7 ↔ Cloud 2021.0.x(Jubilee)↔ Alibaba 2021.0.5.0**。Boot 3 使用 Jakarta EE 9(jakarta 包名)与 JDK 17,Cloud 2020 之后 Netflix Ribbon/Hystrix 退出默认组合。BOM 只统一版本,不纠正不匹配;遇到 NoSuchMethodError/ClassNotFoundException 先打印依赖树核对版本。' }
    ]
  };
})();
