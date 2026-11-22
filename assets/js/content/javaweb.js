/* ═══════════════════════════════════════════════════════════
   模块:原生 Java Web(Servlet / Cookie / Filter / JSP / JDBC · 6 章)
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.CONTENT = window.CONTENT || {};

  window.CONTENT.javaweb = {
    id: 'javaweb',
    title: '原生 Java Web',
    en: 'JAVA WEB FOUNDATION',
    icon: 'code',
    color: '#8b5cf6',
    tagline: 'Servlet 时代的硬功夫',
    description: '不依赖 Spring 的 Java Web 基本功:Tomcat 与 Servlet 生命周期、请求响应、Cookie/Session、Filter/Listener、JSP 与 MVC 演进、JDBC 与连接池。理解这些,再回头看 SpringMVC 才知道它替你做了什么。',
    minutes: '≈ 14 小时',
    chapters: [
      /* ─────────────────────────────────────────── */
      {
        id: 'ch01',
        title: '从浏览器到 Servlet:Tomcat 与第一个 Web 程序',
        minutes: 55,
        points: ['Tomcat 容器结构', 'Servlet 容器', '@WebServlet', 'URL 映射'],
        content: `
> [!info] 本章导读 · 先讲个故事
> 你在浏览器地址栏敲下 http://localhost:8080/demo/hello,回车,页面弹出一行 Hello, Servlet。整个过程不到 200 毫秒,可服务器上发生的事一点都不少:Tomcat 的 Connector 收下 TCP 连接、解析 HTTP 报文,Container 按 URL 一层层往下找,最后某个 Java 对象的 doGet 方法被调用。
> 刚学 Java 时,程序入口是 main 方法;可 Web 应用里你没有写 main,Tomcat 也没有调用你的 main。真相是:==控制权在容器手里,容器按配置创建你的 Servlet,再回调它的方法==。想明白这一点,后面的生命周期、线程安全、Filter 才有落脚点。
> - 读完本章你将能:说清 Web 服务器与 Servlet 容器的分工
> - 画出 Tomcat 从 Connector 到 Wrapper 的容器树
> - 写出第一个 Servlet,打成 war 部署,并看懂启动日志
> - 分清 @WebServlet 与 web.xml 两种注册方式,记住 URL 映射优先级

> [!tip] 日常电脑现场 · 快递分拣中心
> 你网购一件衣服,只填地址,不需要知道包裹坐哪趟车、经哪个中转场。快递公司(容器)在分拣中心按地址(URL)把包裹分到具体片区(Wrapper),再由快递员(Servlet 实例)送到你手里。你只负责下单(发请求)和收货(看响应),中间的调度全是容器的活。
## 先分清两个角色:Web 服务器与 Servlet 容器
很多人把 Tomcat 叫"Web 服务器",这只说对了一半。它同时干两件事:**接收并解析 HTTP 连接**,以及**管理 Servlet 的生命周期**。前者是 Web 服务器的活,后者是 Servlet 容器的活。
| 角色 | 典型代表 | 主要职责 | 不负责什么 |
| --- | --- | --- | --- |
| Web 服务器 | Nginx、Apache httpd | 静态文件、反向代理、TLS 卸载、限流 | 不会执行 Java 业务代码 |
| Servlet 容器 | Tomcat、Jetty、Undertow | 解析 HTTP、管理 Servlet、线程池、会话 | 大规模静态资源加速 |
| 二合一 | Tomcat 默认模式 | 静态页和 Servlet 都能跑 | 生产环境通常在前面再挂 Nginx |
访问一个静态 index.html,Tomcat 直接读文件返回;访问 /demo/hello,才进入容器找 Servlet。SpringBoot 只是把 Tomcat 内嵌进 jar,所以你能 java -jar 直接启动,==内嵌不等于没有 Tomcat==。
## Tomcat 的容器树:一层套一层
Tomcat 的配置结构像俄罗斯套娃,每一层只负责一件事:

\`\`\`text
Server(整个 Tomcat 实例,监听 8005 关闭端口)
 └── Service(把 Connector 和 Engine 绑在一起)
      ├── Connector :8080(收 TCP、解析 HTTP,可配多个端口)
      └── Engine(处理该 Service 的所有请求)
           └── Host(localhost,按域名找虚拟主机)
                └── Context(/demo,一个 Web 应用 = 一个 war)
                     └── Wrapper(/hello,一个 Servlet 的包装)
\`\`\`
| 层级 | 组件 | 作用 | 排障时看什么 |
| --- | --- | --- | --- |
| Server | Server | 整个实例,管端口与关闭 | server.xml 顶层 |
| Service | Service | 组合 Connector 与 Engine | 一个 Service 一组端口 |
| Connector | Connector | 接收连接、解析协议 | 端口占用、URIEncoding |
| Engine | Engine | 请求处理的总入口 | 虚拟主机路由 |
| Host | Host | 一个域名一台虚拟主机 | appBase 目录 |
| Context | Context | 一个 Web 应用 | context path、部署日志 |
| Wrapper | Wrapper | 一个 Servlet 的生命周期 | 映射与 load-on-startup |
把 demo.war 丢进 webapps,Tomcat 会自动解压、创建 path 为 /demo 的 Context,再根据 web.xml 或注解生成一个 Wrapper。你在浏览器里看到的每一层路径,在容器里都有对应的对象。
## 第一个 Servlet:一个注解,一个类
Servlet 不是普通类,它必须继承 HttpServlet,并让容器知道"哪个 URL 归我管"。最短的写法只需要一个注解:

\`\`\`java HelloServlet.java
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;

@WebServlet("/hello")
public class HelloServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        resp.setContentType("text/html;charset=UTF-8");
        String name = req.getParameter("name");
        if (name == null || name.isBlank()) {
            name = "Servlet";
        }
        PrintWriter out = resp.getWriter();
        out.println("<h1>Hello, " + name + "</h1>");
        out.println("<p>请求方法:" + req.getMethod() + "</p>");
        out.println("<p>上下文路径:" + req.getContextPath() + "</p>");
    }
}
\`\`\`
> [!warn] Tomcat 9 与 Tomcat 10 的包名是两套
> Tomcat 9 及以前用 ==javax.servlet==,Tomcat 10 起迁到 ==jakarta.servlet==(Java EE 改名 Jakarta EE)。把 9 的项目直接丢进 10,启动就报 ClassNotFoundException,编译时也可能找不到 HttpServlet。看教程先看它用的 Tomcat 版本,别混着抄。
把 war 部署成 demo,访问时注意 URL 由"上下文路径 + Servlet 映射"拼成:

\`\`\`shell
curl -i "http://localhost:8080/demo/hello?name=zhen"
\`\`\`

\`\`\`output
HTTP/1.1 200 
Content-Type: text/html;charset=UTF-8
Content-Length: 96
Date: Sat, 15 Nov 2026 02:25:02 GMT
Server: Apache-Coyote/1.1

<h1>Hello, zhen</h1>
<p>请求方法:GET</p>
<p>上下文路径:/demo</p>
\`\`\`
## 打包与部署:war 里到底装了什么
一个能跑的 Web 应用目录结构是硬约定,不是随便放:

\`\`\`text
demo/
├── WEB-INF/                     ← 浏览器访问不到,安全区
│   ├── web.xml                  ← 可选,老式部署描述符
│   ├── classes/                 ← 你的 .class 与资源
│   │   └── com/example/web/HelloServlet.class
│   └── lib/                     ← 第三方 jar
└── index.html                   ← 静态资源,可直接访问
\`\`\`

动手部署的完整流程:

\`\`\`shell
# 1. 编译:servlet-api 由容器提供,不要打进 war
javac -encoding UTF-8 -cp "$CATALINA_HOME/lib/servlet-api.jar" -d build/WEB-INF/classes src/com/example/web/HelloServlet.java

# 2. 组装:静态资源与 WEB-INF 一起放进 build
cp -r web/* build/

# 3. 打 war 并部署
jar -cvf demo.war -C build .
cp demo.war "$CATALINA_HOME/webapps/"
"$CATALINA_HOME/bin/startup.sh"
\`\`\`

\`\`\`output
15-Nov-2026 10:24:31.512 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log Server version name: Apache Tomcat/10.1.33
15-Nov-2026 10:24:33.207 INFO [main] org.apache.catalina.startup.HostConfig.deployWAR Deploying web application archive [/opt/tomcat/webapps/demo.war]
15-Nov-2026 10:24:34.551 INFO [main] org.apache.catalina.startup.HostConfig.deployWAR Deployment of web application archive [/opt/tomcat/webapps/demo.war] has finished in [1,344] ms
15-Nov-2026 10:24:34.612 INFO [main] org.apache.catalina.startup.Catalina.start Server startup in [2048] milliseconds
\`\`\`
## 另一种注册方式:web.xml
注解之前,所有 Servlet 都写在 WEB-INF/web.xml 里。它不是过时知识:老项目、第三方 Servlet、需要集中治理映射的场景都还在用。

\`\`\`xml web.xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="https://jakarta.ee/xml/ns/jakartaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="https://jakarta.ee/xml/ns/jakartaee
                             https://jakarta.ee/xml/ns/jakartaee/web-app_6_0.xsd"
         version="6.0">
    <servlet>
        <servlet-name>hello</servlet-name>
        <servlet-class>com.example.web.HelloServlet</servlet-class>
        <load-on-startup>1</load-on-startup>
    </servlet>
    <servlet-mapping>
        <servlet-name>hello</servlet-name>
        <url-pattern>/hello</url-pattern>
    </servlet-mapping>
    <servlet-mapping>
        <servlet-name>hello</servlet-name>
        <url-pattern>/hi/*</url-pattern>
    </servlet-mapping>
</web-app>
\`\`\`
| 维度 | web.xml | @WebServlet |
| --- | --- | --- |
| 写在哪 | 集中在 WEB-INF/web.xml | 写在 Servlet 类上 |
| 改映射 | 改配置,不必重编译 | 改代码,重新编译打包 |
| 全局视图 | 所有映射一眼看全 | 分散在各个类里 |
| 与注解关系 | metadata-complete=true 时忽略注解 | 默认与 xml 合并,同名以 xml 为准 |
| 适合场景 | 老项目、三方 Servlet、集中治理 | 新项目、自研接口 |
## URL 映射规则:谁更具体谁赢
容器收到 /demo/hello 后,先去掉上下文路径 /demo,拿剩下的 /hello 去匹配。匹配有严格优先级:
| 写法 | 类型 | 能匹配 | 不能匹配 |
| --- | --- | --- | --- |
| /hello | 精确匹配 | 只匹配 /hello | /hello/1、/hello.do |
| /api/* | 路径匹配 | /api/user、/api/order/1 | /apix/user |
| *.do | 扩展名匹配 | /user.do、/a/b/order.do | /user.do/x |
| / | 缺省匹配 | 所有没被更具体规则命中的请求 | 已被精确/路径规则命中的 |
| /* | 通配匹配 | 所有请求,连 JSP 也拦 | 无 |
优先级从高到低:==精确 > 最长路径前缀 > 扩展名 > 缺省==。所以同时存在 /hello 和 /* 时,/hello 走前者,其他请求才落到 /*。
> [!pitfall] 404 先查这三处
> ① 地址有没有少上下文路径:war 叫 demo.war,访问就必须是 /demo/hello,不是 /hello;② web.xml 是否写了 metadata-complete="true",它会让全项目注解失效;③ Tomcat 10 项目里是否还残留 javax.servlet 的 import。三者占新手 404/500 的绝大多数。
## 一次请求在 Tomcat 里走了哪些关
先用一句人话概括:Connector 是门卫,Engine 是大堂经理,Host 按门牌号找楼,Context 按公司名找人,Wrapper 才是真正接待你的那个工位。

\`\`\`diagram:d-servlet-flow
\`\`\`

回到细节:请求先经过 Filter 链(第 4 章),再到 Servlet 实例的 service 方法;service 按 HTTP 方法分派到 doGet/doPost。容器为每个请求分配线程池里的线程,而 Servlet 实例默认只有一个 —— ==单实例、多线程==,这是下一章线程安全问题的根。
> [!interview] 顺手一个追问:一个 Servlet 能映射多个 URL 吗?
> 能。@WebServlet 的 urlPatterns 可以写数组,web.xml 也可以配多个 servlet-mapping;反过来,一个 URL 在生效规则里只会命中一个 Servlet(最具体的赢),不会同时进两个。别把"多个 URL 指向同一个实例"和"一个 URL 进多个 Servlet"搞混。
## 本章小结
- Web 服务器管连接与静态资源,Servlet 容器管 Servlet 生命周期;Tomcat 两者兼任,SpringBoot 只是把它内嵌了。
- Tomcat 容器树:Server → Service → Connector + Engine → Host → Context → Wrapper,一层负责一件事。
- 第一个 Servlet = 继承 HttpServlet + @WebServlet 映射 + 重写 doGet;URL 由上下文路径与映射共同决定。
- 部署单位是 war,WEB-INF 是浏览器访问不到的安全区;注册方式有注解与 web.xml 两套,映射优先级为精确 > 路径 > 扩展名 > 缺省。
## 面试速记
- Tomcat 两层身份:HTTP 服务器(Connector)+ Servlet 容器(Container);内嵌 Tomcat 仍是 Tomcat。
- 容器树背诵版:Server → Service → Connector/Engine → Host → Context → Wrapper。
- 一个 Context 对应一个 Web 应用,一个 Wrapper 对应一个 Servlet 映射;Context 路径就是 war 名(ROOT.war 除外)。
- @WebServlet 与 web.xml 可共存,web.xml 同名配置覆盖注解;metadata-complete="true" 直接关掉注解扫描。
- URL 匹配优先级:精确 > 最长路径 > 扩展名 > 缺省;\`/\` 是静态资源兜底,\`/*\` 会连 JSP 一起拦。
`
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch02',
        title: 'Servlet 生命周期与请求响应',
        minutes: 60,
        points: ['生命周期', '请求参数', '转发 vs 重定向', '线程安全'],
        content: `
> [!info] 本章导读 · 先讲个故事
> 你写了一个点赞接口,在 Servlet 里加了成员变量 int count,每来一个请求就 count++。本地测试一切正常;上线压测,前端说点赞数总比实际少,200 个并发最后只记了 187。你盯着代码看了半天,逻辑没有错 —— 错在你默认了"每个请求都有自己的 Servlet 对象"。
> 真相是:==Servlet 默认只有一个实例,所有请求共享它,由容器的线程池并发调用 service==。这一个事实,牵出了生命周期、request/response 的作用域,以及本章最重要的线程安全。
> - 读完本章你将能:说清四个生命周期阶段各执行几次
> - 正确读取参数、请求头与请求体,处理三种中文乱码
> - 分清转发与重定向,知道 request 域为什么会丢
> - 写出线程安全的 Servlet,避开成员变量陷阱

> [!tip] 日常电脑现场 · 银行只有一个柜台
> 网点只开一个窗口,柜员( Servlet 实例)从早到晚接待所有客户(请求)。客户 A 的资料不能摊在柜台上等客户 B 来了还留着 —— 每笔业务要用自己的单据(局部变量/request 域)。如果柜员把上一位的身份证放进自己抽屉(成员变量),下一位就会拿到别人的信息。
## 生命周期:四个阶段,三个只发生一次
Servlet 的一生只有四个节点,容器负责按顺序调用:

\`\`\`java LifeServlet.java
import jakarta.servlet.ServletConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
@WebServlet(value = "/life", loadOnStartup = 1)
public class LifeServlet extends HttpServlet {
    public LifeServlet() {
        System.out.println("[1] 构造器执行,hash=" + hashCode());
    }
    @Override
    public void init(ServletConfig config) throws ServletException {
        super.init(config);
        System.out.println("[2] init 执行,servletName=" + config.getServletName());
    }
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        System.out.println("[3] service 执行,线程=" + Thread.currentThread().getName());
        resp.getWriter().write("ok");
    }
    @Override
    public void destroy() {
        System.out.println("[4] destroy 执行,释放资源");
    }
}
\`\`\`
启动后连续访问两次,再正常关闭 Tomcat,控制台顺序如下:
\`\`\`output
[1] 构造器执行,hash=1837462
[2] init 执行,servletName=com.example.web.LifeServlet
[3] service 执行,线程=http-nio-8080-exec-1
[3] service 执行,线程=http-nio-8080-exec-2
[4] destroy 执行,释放资源
\`\`\`
| 阶段 | 谁调用 | 次数 | 该做什么 / 不该做什么 |
| --- | --- | --- | --- |
| 构造 | 容器反射 | 1 | 只做轻量初始化;此时拿不到 ServletConfig |
| init | 容器 | 1 | 读初始化参数、建连接池、预热缓存 |
| service | 容器线程池 | 每请求 1 次 | 业务逻辑;严禁修改共享可变状态 |
| destroy | 容器 | 1 | 关资源、刷缓冲;不保证一定执行 |
> [!warn] destroy 不是"一定会执行"
> 正常 shutdown 会走 destroy;但 kill -9、断电、容器崩溃不会。所以关键数据不能只放在 destroy 里落盘 —— 该实时落库就实时落库,destroy 只做"尽力而为"的清理。
## HttpServletRequest:一次请求的档案袋
request 对象由容器为每个请求新建,生命周期只到本次请求结束。常用 API 可以按四类记:
| 类别 | 代表方法 | 说明 |
| --- | --- | --- |
| 取参数 | getParameter、getParameterValues、getParameterMap | 表单/查询串,同名多值用数组 |
| 取头信息 | getHeader、getContentType、getCookies | User-Agent、Content-Type 都从这里拿 |
| 取环境 | getMethod、getRequestURI、getContextPath、getRemoteAddr | 方法、路径、客户端 IP |
| 存数据 | setAttribute、getAttribute、removeAttribute | request 域,转发时共享 |
一个回显接口,把参数、头与 IP 一起打出来:

\`\`\`java EchoServlet.java
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Arrays;
@WebServlet("/echo")
public class EchoServlet extends HttpServlet {
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        req.setCharacterEncoding("UTF-8");
        String username = req.getParameter("username");
        String[] tags = req.getParameterValues("tag");
        String ua = req.getHeader("User-Agent");
        resp.setContentType("text/plain;charset=UTF-8");
        PrintWriter out = resp.getWriter();
        out.println("username=" + username);
        out.println("tags=" + Arrays.toString(tags));
        out.println("UA=" + ua);
        out.println("ip=" + req.getRemoteAddr());
    }
}
\`\`\`
\`\`\`output
$ curl -X POST "http://localhost:8080/demo/echo?username=张三&tag=java&tag=web" -A "curl/8.4"
username=张三
tags=[java, web]
UA=curl/8.4
ip=127.0.0.1
\`\`\`
### 中文乱码:三种现场,一条主线
乱码的本质只有一句话:==编码和解码用了不同的字符集==。按数据流动方向查,现场无非三处:
| 场景 | 典型现象 | 根因 | 解决 |
| --- | --- | --- | --- |
| POST 表单/请求体 | 中文变 ???? 或 ä¸­æ | body 被按 ISO-8859-1 解码 | 第一次 getParameter 之前 setCharacterEncoding("UTF-8") |
| GET 查询串 | URL 里的中文乱码 | Connector 的 URIEncoding 与浏览器不一致 | Tomcat 8+ 默认 UTF-8;旧版在 server.xml 配 URIEncoding="UTF-8" |
| 响应页面/JSON | 页面中文乱码 | 响应头没声明 charset | setContentType("text/html;charset=UTF-8") |
| 存进数据库 | 库里就是 ???? | 连接字符集不对 | JDBC URL 加 characterEncoding=utf8 |
> [!danger] setCharacterEncoding 的时机是硬约束
> 它必须在**第一次读取参数之前**调用。因为容器一旦解析过参数,就会把结果缓存进 request,后面再设编码也不重新解析 —— 你会看到"代码明明写了,还是乱码"。统一做法:编码过滤器里对每个请求先设 UTF-8(第 4 章亲手写)。
## HttpServletResponse:把结果送回去
response 管三件事:状态码、响应头、响应体。最常用的三个动作是设置内容类型、跳转、写输出:
\`\`\`java ResultServlet.java
@WebServlet("/result")
public class ResultServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        boolean needView = req.getParameter("view") != null;
        if (needView) {
            req.setAttribute("msg", "操作成功");
            req.getRequestDispatcher("/WEB-INF/views/ok.jsp").forward(req, resp);
        } else {
            resp.setContentType("application/json;charset=UTF-8");
            resp.setHeader("Cache-Control", "no-store");
            resp.getWriter().write("{\\"code\\":0,\\"msg\\":\\"ok\\"}");
        }
    }
}
\`\`\`
两段跳转代码看着都像"换个页面",底层却是两套机制:
| 维度 | 转发 forward | 重定向 redirect |
| --- | --- | --- |
| 谁在做 | 服务器内部 | 浏览器 |
| 请求次数 | 1 次 | 2 次(第二次是新请求) |
| 地址栏 | 不变 | 变成新地址 |
| request 域 | 共享 | 丢失 |
| 目标范围 | 只能应用内部,可进 WEB-INF | 任意 URL,可跨站 |
| HTTP 方法 | 保持原方法 | 浏览器通常发 GET |
| 典型场景 | 查询后渲染页面 | 登录成功跳首页、PRG 防重复提交 |
> [!pitfall] 跳转之后记得 return
> sendRedirect 只是给浏览器一个 302,方法还会继续往下执行;如果后面还有写响应体的代码,可能抛出响应已提交的异常。forward 同理,转发完成后不应再写 response。养成"跳转即 return"的习惯。
## 线程安全:单实例多线程的第一课
成员变量 count 被所有请求共享,而 count++ 不是原子操作:
\`\`\`java UnsafeCountServlet.java
@WebServlet("/unsafe")
public class UnsafeCountServlet extends HttpServlet {
    private int count = 0;
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        count++;
        try { Thread.sleep(10); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        resp.getWriter().write("count=" + count);
    }
}
\`\`\`
用 200 个并发请求压它,最终结果不是 200:
\`\`\`output
$ seq 1 200 | xargs -P 50 -I{} curl -s "http://localhost:8080/demo/unsafe" > /dev/null
最后一次响应:count=187
[err]丢了 13 次自增 —— 多个线程读到同一个旧值,再各自写回[/err]
\`\`\`

原因:count++ 在字节码里是"读 → 加一 → 写回"三步。线程 A 读到 100,还没写回;线程 B 也读到 100,两个都写 101,一次自增凭空消失。修复优先级:==无状态 > Atomic/Concurrent 容器 > synchronized==(加锁会串行化,能不用就不用)。
\`\`\`java SafeCountServlet.java
@WebServlet("/safe")
public class SafeCountServlet extends HttpServlet {
    private final AtomicInteger count = new AtomicInteger(0);
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        int now = count.incrementAndGet();
        resp.getWriter().write("count=" + now);
    }
}
\`\`\`
> [!danger] 这些成员变量都是雷
> SimpleDateFormat、StringBuilder、普通 HashMap、非线程安全的连接对象,都不能作为 Servlet 的成员变量共享。ServletContext 里的属性也是全应用共享,放集合请用 ConcurrentHashMap;要按线程隔离,才考虑 ThreadLocal(用完必须 remove,否则线程池会串数据)。
## 本章小结
- 生命周期:构造 → init(ServletConfig) → service(每请求) → destroy;构造/init/destroy 各一次,service 多线程多次。
- request 每请求一个,参数/头/域都从它取;response 管状态码、头与输出。
- 乱码主线是编码解码不一致:请求体先 setCharacterEncoding,响应先 setContentType,数据库连接指定字符集。
- 转发是服务端一跳、共享 request;重定向是浏览器两跳、地址栏变化、request 丢失。
- Servlet 单实例多线程,成员变量必须是不可变或线程安全的,最稳的是无状态。
## 面试速记
- 生命周期四步:构造 → init → service → destroy;init 一次、service 每请求、destroy 一次且不保证执行。
- 转发 vs 重定向:一次请求/地址不变/共享 request vs 两次请求/地址改变/request 丢失;forward 能进 WEB-INF,redirect 不能。
- 中文乱码:先 setCharacterEncoding 再 getParameter;响应 setContentType 带 charset;GET 看 Connector 的 URIEncoding。
- 线程安全根因:单实例 + 多线程共享成员变量;解法是无状态、Atomic/Concurrent 容器、最后才 synchronized。
- load-on-startup 正数启动即初始化,数字越小越早;默认 -1 懒加载。
`
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch03',
        title: 'Cookie 与 Session:会话的秘密',
        minutes: 60,
        points: ['HTTP 无状态', 'Cookie 属性', 'JSESSIONID', '分布式 Session'],
        content: `
> [!info] 本章导读 · 先讲个故事
> 你把一件外套加进购物车,关掉浏览器,去吃了个饭,回来重新打开网站 —— 购物车还在。可 HTTP 协议本身是"失忆"的:每个请求都是独立信件,服务器看完就忘,它凭什么认出"你还是刚才那个人"?
> 答案藏在两个地方:要么浏览器每次主动出示一张凭证(Cookie),要么服务器给每个访客一个编号,把状态存在自己这边(Session)。==Cookie 是手环,Session 是存包柜==;本章把这两样东西拆开看,再讲它们在集群下为什么会失灵。
> - 读完本章你将能:说清 Cookie 的六个关键属性与安全边界
> - 手写一套登录 + 会话校验,看懂 JSESSIONID 的来去
> - 对比 Cookie 与 Session,回答分布式 Session 的方案题
> - 知道会话固定与 CSRF 各防什么

> [!tip] 日常电脑现场 · 超市存包柜
> 进超市先把包存进柜子,柜子给你一张带编号的小票(Cookie)。你逛完回来,凭小票开柜取包 —— 包一直存在超市(Session),小票上只有编号(JSESSIONID)。小票丢了,柜子还在,但超市不知道哪个柜子是你的;小票被别人捡到,他也能开你的柜子,所以小票要防偷(HttpOnly/Secure)。
## HTTP 无状态:服务器真的记不住你
打开 F12 的 Network,刷新页面,你会看到每个请求都带着几乎相同的头。服务器处理完就丢,不会为上一个请求保留"这是谁"。无状态带来两个好处:服务器容易横向扩展、请求可以落到任意节点;也带来一个麻烦:**业务需要连续性** —— 登录态、购物车、验证码、分页条件,都要跨请求记住。

业界的解法只有两条路:
| 路线 | 状态放哪 | 客户端每次带什么 | 代表 |
| --- | --- | --- | --- |
| 客户端保存 | 浏览器 | 完整数据(需签名/加密) | Cookie、JWT |
| 服务端保存 | 服务器内存/Redis | 一个编号 | Session |
## Cookie:贴在浏览器上的一张小纸条
服务器在响应头里写 Set-Cookie,浏览器保存;下次同域请求自动在 Cookie 头里带回。先看服务端怎么写:

\`\`\`java CartCookieServlet.java
@WebServlet("/cart/init")
public class CartCookieServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        Cookie cartId = new Cookie("cart_id", "c-20261115-88");
        cartId.setMaxAge(7 * 24 * 3600);   // 秒;0 表示删除,-1 表示会话 Cookie
        cartId.setPath("/");
        cartId.setHttpOnly(true);          // JS 读不到,防 XSS 偷取
        cartId.setSecure(false);           // 生产 HTTPS 必须 true
        resp.addCookie(cartId);
        resp.setContentType("text/plain;charset=UTF-8");
        resp.getWriter().write("cart cookie written");
    }
}
\`\`\`
响应头与下一次请求头长这样:
\`\`\`output
HTTP/1.1 200 
Set-Cookie: cart_id=c-20261115-88; Max-Age=604800; Path=/; HttpOnly
Content-Type: text/plain;charset=UTF-8
GET /cart HTTP/1.1
Host: localhost:8080
Cookie: cart_id=c-20261115-88
\`\`\`
服务端读取时拿到的是一组 Cookie:
\`\`\`java
Cookie[] cookies = req.getCookies();
if (cookies != null) {
    for (Cookie c : cookies) {
        if ("cart_id".equals(c.getName())) System.out.println("cartId=" + c.getValue());
    }
}
\`\`\`
| 属性 | 作用 | 安全/工程要点 |
| --- | --- | --- |
| Name=Value | 键值对 | 值不能含分号、逗号等特殊字符,敏感内容必须加密或只放 ID |
| Max-Age | 存活秒数 | 正数持久化;0 删除;-1 会话级,关浏览器即失效 |
| Expires | 绝对过期时间 | 老属性,与 Max-Age 同时存在时 Max-Age 优先 |
| Path | 生效路径 | / 全站;设 /app 则 /app 下才带,别乱设以免丢 Cookie |
| Domain | 生效域名 | 设 example.com 可被子域共享;不要设成公共后缀 |
| HttpOnly | 禁止 JS 读取 | 防 XSS 偷 Cookie,登录凭证必须开 |
| Secure | 仅 HTTPS 发送 | 防明文链路被嗅探,生产必须开 |
| SameSite | 跨站是否携带 | Lax 为现代浏览器默认,防 CSRF 的第一道闸 |
> [!warn] document.cookie 读不到 HttpOnly
> 在控制台执行 document.cookie,你只能看到没开 HttpOnly 的项。这不是 bug,是保护:XSS 注入的脚本拿不到会话 Cookie,损失被限制。反过来说,==凡是被 JS 读到的 Cookie,都不要放登录凭证==。

> [!tip] 日常电脑现场 · 在浏览器里看 Cookie
> Chrome/Edge:F12 → Application → Storage → Cookies → 选中站点,Name、Value、Domain、Path、Expires、HttpOnly、Secure、SameSite 一目了然。想看"到底哪个请求带了哪个 Cookie",去 Network 点开请求的 Headers。排查登录态,先看这里,比猜代码快。
## Session:服务端给你一个储物柜
第一次调用 req.getSession() 时,容器创建一个 HttpSession 对象,生成唯一 ID(JSESSIONID),通过 Set-Cookie 发给浏览器;之后浏览器每次带回这个 ID,容器就能找到对应会话。Tomcat 默认用 Manager 在内存里维护一个 Map,ID 就是 key。

手写一套最小登录。先看登录接口:

\`\`\`java LoginServlet.java
@WebServlet("/login")
public class LoginServlet extends HttpServlet {
    private static final Map<String, String> USERS = Map.of(
            "zhen", "123456",
            "admin", "admin888"
    );
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        req.setCharacterEncoding("UTF-8");
        String username = req.getParameter("username");
        String password = req.getParameter("password");
        if (password != null && password.equals(USERS.get(username))) {
            HttpSession session = req.getSession();          // 没有就创建
            session.setAttribute("loginUser", username);
            session.setMaxInactiveInterval(30 * 60);         // 30 分钟不活动即过期
            req.changeSessionId();                           // 防会话固定
            resp.sendRedirect(req.getContextPath() + "/profile");
        } else {
            resp.sendRedirect(req.getContextPath() + "/login.html?error=1");
        }
    }
}
\`\`\`
受保护页面用 getSession(false):只查,不创建,避免匿名访问也生成一堆空会话:
\`\`\`java ProfileServlet.java
@WebServlet("/profile")
public class ProfileServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpSession session = req.getSession(false);         // 关键:false
        Object user = session == null ? null : session.getAttribute("loginUser");
        if (user == null) {
            resp.sendRedirect(req.getContextPath() + "/login.html");
            return;
        }
        resp.setContentType("text/html;charset=UTF-8");
        resp.getWriter().write("<h1>欢迎," + user + "</h1>");
    }
}
\`\`\`
\`\`\`output
POST /demo/login  username=zhen&password=123456
HTTP/1.1 302 
Location: /demo/profile
Set-Cookie: JSESSIONID=4F3A9C2D8E1B7A60C5D4; Path=/demo; HttpOnly
GET /demo/profile
Cookie: JSESSIONID=4F3A9C2D8E1B7A60C5D4
HTTP/1.1 200 
<h1>欢迎,zhen</h1>
GET /demo/profile(不带 Cookie)
HTTP/1.1 302 
Location: /demo/login.html
\`\`\`

超时时间可以在 web.xml 里统一配置,不必每个 Session 手写:

\`\`\`xml web.xml
<session-config>
    <session-timeout>30</session-timeout>
    <cookie-config>
        <http-only>true</http-only>
        <secure>true</secure>
    </cookie-config>
    <tracking-mode>COOKIE</tracking-mode>
</session-config>
\`\`\`
> [!interview] 高频追问:session 和 cookie 到底谁依赖谁?
> 默认配置下 Session 依赖 Cookie 传 JSESSIONID。但这不是唯一方式:容器支持 URL 重写(jsessionid 拼在地址上,安全性差,现代基本不用),也可以用自定义请求头或 Token。回答时点明"Session 是服务端存储机制,JSESSIONID 只是它的默认寻址方式",层次会高一截。
## Cookie vs Session:各自守一半
| 维度 | Cookie | Session |
| --- | --- | --- |
| 存储位置 | 客户端浏览器 | 服务端内存或 Redis |
| 容量 | 单域约 4KB,数量也有限 | 受服务端内存/Redis 限制 |
| 安全性 | 明文可改,必须签名或加密 | 客户端只有 ID,数据不落地客户端 |
| 生命周期 | Max-Age 或浏览器会话 | 超时时间、invalidate、容器关闭 |
一句话选型:**轻量、需要客户端记住的偏好用 Cookie;登录态与敏感数据用 Session;跨域/多端/无状态服务再考虑 Token**。
## 分布式 Session:集群下的第一道坎
单机时 Session 放在 Tomcat 内存里没问题。一旦部署两台以上,用户第一次登录落在节点 A,第二次请求被负载均衡打到节点 B,B 的内存里没有这个 JSESSIONID —— 用户就被踢回登录页。常见四种解法:
| 方案 | 做法 | 优点 | 代价 |
| --- | --- | --- | --- |
| 会话粘滞 | 负载均衡按 IP/JSESSIONID 固定节点 | 零改造 | 节点故障即掉线,扩容会漂移 |
| 会话复制 | Tomcat 集群广播 Session | 无需外部组件 | 网络风暴,节点越多越慢 |
| 集中存储 | Session 写 Redis,各节点共享 | 扩容无感、可靠 | 多一次网络 IO,需运维 Redis |
| 无状态 Token | JWT 自带签名声明,服务端不存 | 天然跨节点 | 注销/续期/撤销复杂 |
工程上最常见的是第三条。Spring Session 用一个 Filter 把 HttpSession 的实现替换成 Redis 版本,业务代码几乎不用改:

\`\`\`properties application.properties
spring.session.store-type=redis
spring.session.redis.namespace=shop:session
server.servlet.session.timeout=30m
spring.data.redis.host=127.0.0.1
spring.data.redis.port=6379
\`\`\`
> [!best] 为什么 Redis 版 Session 能"无感替换"
> 因为 Servlet 规范把会话抽象成 HttpSession 接口,Tomcat 的内存实现只是其中一种。Spring Session 提供自己的 HttpSession 实现,并通过过滤器包装 request,业务里 getSession() 拿到的已经是 Redis 版。==面向接口编程的红利,在这里体现得最直观==。
## 安全:两张小纸片的攻防
- **会话固定(Session Fixation)**:攻击者先拿到一个 JSESSIONID 并诱导你用它登录,登录后这个 ID 就成了你的会话。防御:登录成功后调用 req.changeSessionId() 换新 ID,并设置 HttpOnly/Secure。
- **CSRF(跨站请求伪造)**:你在银行站已登录,恶意页面自动向你发起转账请求,浏览器会自动带上 Cookie。防御:SameSite=Lax/Strict、CSRF Token、关键操作二次校验;GET 不做写操作。
- **XSS 偷 Cookie**:脚本读取 document.cookie。防御:HttpOnly + 输出转义 + CSP。
- **会话劫持**:ID 在明文链路被嗅探。防御:全站 HTTPS + Secure Cookie。
> [!danger] Cookie 里不要放这些
> 明文密码、手机号、身份证、余额、权限列表,都不该直接放 Cookie。Cookie 会被用户查看、被插件读取、被中间人截获。正确做法是只放一个无意义的随机 ID,真正的数据放服务端;必须放客户端时,做签名防篡改、加密防泄露,并设短过期时间。
## 本章小结
- HTTP 无状态,会话靠两条路:客户端保存(Cookie)或服务端保存(Session + ID)。
- Cookie 关键属性:Max-Age、Path、Domain、HttpOnly、Secure、SameSite;登录凭证必须 HttpOnly + Secure。
- Session 由容器创建,JSESSIONID 默认走 Cookie;getSession(false) 只查不建,登录成功换 ID 防固定。
## 面试速记
- Cookie 是客户端存储,Session 是服务端存储;JSESSIONID 只是 Session 的默认寻址方式,不是 Session 本身。
- Cookie 六个属性:Max-Age/Expires、Path、Domain、HttpOnly、Secure、SameSite;HttpOnly 防 XSS 读取,Secure 防明文传输,SameSite 防 CSRF。
- Session 超时:web.xml 的 session-timeout(分钟)或 setMaxInactiveInterval(秒);关闭浏览器不等于 Session 立即销毁。
- 分布式 Session 四方案:粘滞、复制、Redis 集中存储、JWT 无状态;Spring Session 用过滤器替换 HttpSession 实现。
- 会话固定靠登录后 changeSessionId 防御;CSRF 靠 SameSite + Token;JWT 放 localStorage 有 XSS 风险。
`
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch04',
        title: 'Filter 与 Listener:横切逻辑的原始形态',
        minutes: 55,
        points: ['FilterChain', '编码过滤器', '登录拦截', 'ServletContextListener'],
        content: `
> [!info] 本章导读 · 先讲个故事
> 项目里 12 个 Servlet,每个都要验登录。第一天你在每个 doGet 开头复制三行判断;第二周产品要求加"接口耗时日志",你又复制 12 段计时;第三周要做权限分级,你开始怀疑人生 —— 这些逻辑和业务毫无关系,却必须出现在每个入口。
> 这就是**横切逻辑(cross-cutting concern)**:它不属于任何一个业务,却横穿所有业务。Spring 用 AOP 和拦截器解决它,而在原生 Servlet 世界里,答案叫 ==Filter(过滤器)== 与 ==Listener(监听器)==。看懂它们,你才知道 SpringMVC 的拦截器不是凭空出现的。
> - 读完本章你将能:说清 Filter 链的执行顺序与生命周期
> - 写出编码过滤器与登录拦截器,并解释为什么能"一处生效,全局管用"
> - 分清 Filter、Interceptor、AOP 三者的位置与能力边界
> - 用 Listener 在应用启动时加载配置、预热缓存

> [!tip] 日常电脑现场 · 地铁安检
> 不管你去几号站台、坐哪条线(Servlet),进站都得先过安检机(Filter)。安检可以有多台串联:先查包裹,再查液体;每台机器检查完把人和行李交给下一台,最后才到站台。出站时反向再经过一遍 —— 过滤器在 chain.doFilter 前后的代码,就是这"进站"和"出站"两段。
## Filter:请求进入 Servlet 前的安检机
Filter 是 Servlet 规范的一部分,不依赖 Spring。核心就一个方法:
\`\`\`java
public interface Filter {
    void init(FilterConfig config) throws ServletException;
    void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException;
    void destroy();
}
\`\`\`
执行模型是一条链:容器把命中的 Filter 串起来,每个 Filter 决定"放行"还是"截断":
\`\`\`text
请求  →  Filter A  →  Filter B  →  Servlet.doGet
响应  ←  Filter A  ←  Filter B  ←  response
chain.doFilter() 之前:进站检查;之后:出站收尾(计时、清 ThreadLocal)
\`\`\`
| 特性 | 说明 |
| --- | --- |
| 归属 | Servlet 规范,Tomcat/Jetty 都支持,与 Spring 无关 |
| 拦截范围 | 所有 HTTP 请求,包括静态资源、JSP、甚至不存在的 URL |
| 能否拿到业务 Bean | 默认拿不到;可通过 ServletContext 或 Spring 的 DelegatingFilterProxy 桥接 |
| 顺序 | web.xml 中 filter-mapping 的先后;注解方式顺序不可靠 |
> [!warn] 注解 Filter 的顺序不要赌
> @WebFilter 没有 order 属性,多个 Filter 的先后由容器扫描顺序决定,不可控。要固定顺序,要么在 web.xml 里按 filter-mapping 顺序声明,要么在 SpringBoot 里用 FilterRegistrationBean.setOrder() 明确指定。编码过滤器必须排在读取参数之前,这条尤其不能赌。
## 编码过滤器:把乱码问题收口到一处
第 2 章说过 setCharacterEncoding 必须赶在 getParameter 之前。与其在每个 Servlet 里写,不如放进 Filter:
\`\`\`java EncodingFilter.java
import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
@WebFilter(filterName = "encodingFilter", urlPatterns = "/*")
public class EncodingFilter implements Filter {
    @Override
    public void init(FilterConfig config) {
        System.out.println("[Filter] init " + config.getFilterName());
    }
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        req.setCharacterEncoding("UTF-8");
        response.setCharacterEncoding("UTF-8");
        long start = System.currentTimeMillis();
        System.out.println("[REQ ] " + req.getMethod() + " " + req.getRequestURI());
        chain.doFilter(request, response);          // 放行:下一个 Filter 或 Servlet
        long cost = System.currentTimeMillis() - start;
        System.out.println("[RESP] " + req.getRequestURI() + " 耗时 " + cost + "ms");
    }
    @Override
    public void destroy() {
        System.out.println("[Filter] destroy");
    }
}
\`\`\`
\`\`\`output
[Filter] init encodingFilter
[REQ ] POST /demo/login
[RESP] /demo/login 耗时 42ms
[REQ ] GET /demo/profile
[RESP] /demo/profile 耗时 8ms
\`\`\`
## 登录拦截:让每个 Servlet 只关心业务
登录校验是 Filter 最经典的用法。下面这个版本拦截全站,白名单放行登录页与静态资源:
\`\`\`java LoginFilter.java
import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
@WebFilter(filterName = "loginFilter", urlPatterns = "/*")
public class LoginFilter implements Filter {
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse resp = (HttpServletResponse) response;
        String path = req.getRequestURI().substring(req.getContextPath().length());
        boolean white = path.equals("/login") || path.equals("/login.html")
                || path.startsWith("/css/") || path.startsWith("/js/")
                || path.equals("/favicon.ico");
        if (white) { chain.doFilter(request, response); return; }
        HttpSession session = req.getSession(false);
        Object user = session == null ? null : session.getAttribute("loginUser");
        if (user != null) {
            System.out.println("[AUTH] 放行 " + path + " user=" + user);
            chain.doFilter(request, response);
        } else {
            System.out.println("[AUTH] 拦截 " + path + " 未登录");
            String from = URLEncoder.encode(path, StandardCharsets.UTF_8);
            resp.sendRedirect(req.getContextPath() + "/login.html?from=" + from);
        }
    }
}
\`\`\`
\`\`\`output
[REQ ] GET /demo/orders
[AUTH] 拦截 /orders 未登录
[RESP] /demo/orders 耗时 3ms
[REQ ] GET /demo/orders
[AUTH] 放行 /orders user=zhen
[RESP] /demo/orders 耗时 11ms
\`\`\`
> [!pitfall] 拦截器写错的四个常见现场
> ① 白名单漏了静态资源,登录页样式全丢;② AJAX 请求被 sendRedirect,AJAX 拿到的是登录页 HTML 而不是 401,前端一脸懵 —— 应判断 Accept 或 X-Requested-With 返回 JSON;③ 放行分支忘了 return,继续走到后面的拦截逻辑;④ 响应已经提交后才 sendRedirect,抛 IllegalStateException。
## Filter / Interceptor / AOP:三层拦截,各管一段
| 维度 | Filter | Spring Interceptor | Spring AOP |
| --- | --- | --- | --- |
| 归属 | Servlet 规范 | Spring MVC | Spring AOP |
| 位置 | Servlet 之前/之后 | DispatcherServlet 内,Handler 前后 | Bean 方法调用前后 |
| 能拿到什么 | request/response,拿不到 Handler | HandlerMethod、ModelAndView,可注入 Bean | 方法参数、返回值、异常 |
| 典型用途 | 编码、跨域、压缩、鉴权、日志 | 登录校验、权限、统一日志、性能 | 事务、缓存、监控、重试 |
| 失效场景 | 只能拦 HTTP,拿不到业务对象 | 静态资源与 404 可能不进 | 同类自调用、private 方法失效 |
一句话记忆:==Filter 在最外层,Interceptor 在 MVC 层,AOP 在方法层==。请求顺序是 Filter → Interceptor.preHandle → Controller → Interceptor.postHandle → Filter 后置。SpringBoot 里注册 Filter 用 FilterRegistrationBean,可精确控制 order;拦截器则实现 WebMvcConfigurer 的 addInterceptors。
## Listener:监听容器自己的生命周期
Filter 管请求,Listener 管事件。最常用的是 ServletContextListener:整个 Web 应用启动时回调一次,关闭时再回调一次。适合做配置加载、缓存预热、连接池初始化这类"应用级"动作。
\`\`\`java AppInitListener.java
import jakarta.servlet.*;
import jakarta.servlet.annotation.WebListener;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;
@WebListener
public class AppInitListener implements ServletContextListener {
    @Override
    public void contextInitialized(ServletContextEvent sce) {
        ServletContext ctx = sce.getServletContext();
        Properties props = new Properties();
        try (InputStream in = ctx.getResourceAsStream("/WEB-INF/app.properties")) {
            if (in == null) throw new IllegalStateException("缺少 /WEB-INF/app.properties");
            props.load(in);
        } catch (IOException e) {
            throw new IllegalStateException("配置加载失败", e);
        }
        Map<String, String> config = new HashMap<>();
        props.forEach((k, v) -> config.put(String.valueOf(k), String.valueOf(v)));
        ctx.setAttribute("appConfig", config);
        ctx.setAttribute("startedAt", System.currentTimeMillis());
        System.out.println("[BOOT] env=" + config.get("app.env") + ", keys=" + config.size());
    }
    @Override public void contextDestroyed(ServletContextEvent sce) { System.out.println("[STOP] context destroyed, release resources"); }
}
\`\`\`
\`\`\`properties app.properties
app.env=prod
app.name=forge
cache.preload=user,order
db.pool.size=20
\`\`\`
\`\`\`output
[BOOT] env=prod, keys=4
15-Nov-2026 10:24:34.612 INFO [main] org.apache.catalina.startup.Catalina.start Server startup in [2048] milliseconds
[STOP] context destroyed, release resources
\`\`\`
| 监听器 | 监听什么 | 典型用途 |
| --- | --- | --- |
| ServletContextListener | 应用启动/销毁 | 加载配置、预热缓存、初始化连接池 |
| HttpSessionListener | 会话创建/销毁 | 在线人数统计、会话审计 |
| ServletRequestListener | 请求开始/结束 | 请求级日志、ThreadLocal 清理 |
| ServletContextAttributeListener | 应用属性变化 | 配置热更新通知 |
> [!best] 预热要快,失败要响
> contextInitialized 里做的事会阻塞应用启动:能异步就异步,必须同步的只做轻量加载。抛异常会让整个应用启动失败,这通常是好事 —— 配置错了就早点炸,别等第一个用户请求才发现。相反,destroy 里不要抛异常,容器关闭阶段没人能处理它。
## 本章小结
- Filter 是 Servlet 规范的横切方案:init 一次、doFilter 每请求、destroy 一次,chain.doFilter 前后分别是前置与后置逻辑。
- 编码过滤器把 setCharacterEncoding 收口到一处;登录过滤器用白名单 + getSession(false) 拦截未登录访问。
- Filter 在最外层、Interceptor 在 MVC 层、AOP 在方法层;顺序与能力边界不同,面试要能画出来。
- Listener 监听容器事件,ServletContextListener 适合启动加载配置、预热缓存,抛异常会让应用启动失败。
- Filter 顺序:web.xml 按 mapping 顺序,SpringBoot 用 FilterRegistrationBean.setOrder() 明确指定。
## 面试速记
- Filter 生命周期:init 一次、doFilter 每请求、destroy 一次;核心是 FilterChain,放行调用 chain.doFilter。
- 编码过滤器必须最先执行,否则 setCharacterEncoding 晚于参数解析,乱码依旧。
- 登录拦截四要素:白名单、getSession(false)、未登录跳转(或 AJAX 返回 401)、放行后 return。
- Filter vs Interceptor vs AOP:规范/MVC/方法三层;Filter 拿不到业务 Bean,Interceptor 能拿 Handler,AOP 能拿方法参数。
- ServletContextListener:contextInitialized 启动一次做初始化,contextDestroyed 关闭时清理;启动逻辑抛异常会阻止应用启动。
`
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch05',
        title: 'JSP 与 MVC 的演进',
        minutes: 55,
        points: ['JSP 本质', 'EL 与 JSTL', 'Model1 vs Model2', '模板引擎'],
        content: `
> [!info] 本章导读 · 先讲个故事
> 你接手一个 2012 年的老项目,打开目录:user.jsp 里前 20 行是数据库连接,中间是 for 循环拼 HTML,底部还有一段 JavaScript 校验。你想改一个字段名,得同时动 JSP、JavaBean 和 SQL;想加个接口给手机 App,发现页面逻辑和 SQL 缠在一起,根本拆不出来。
> 这不是某个人写得烂,而是 **Model1** 时代的结构性写法:JSP 既当控制器又当视图。后来 Servlet + JSP + JavaBean 的 **Model2(MVC)** 把它拆开,再后来前后端分离干脆让 JSP 退场。==看懂这段演进,你才明白 SpringMVC 的 Controller 为什么长那样==。
> - 读完本章你将能:说清 JSP 被容器翻译成 Servlet 的全过程
> - 用 EL 与 JSTL 写出不掺 Java 代码的页面
> - 对比 Model1 与 Model2,画出 MVC 的职责边界
> - 解释 JSP 为什么被 Thymeleaf 与前后端分离取代

> [!tip] 日常电脑现场 · 把电线砌进墙里
> 老装修喜欢把电线直接砌进墙,表面看很整洁;可一旦要加个插座,就得砸墙、补灰、重新刷漆。JSP 把 Java 代码砌进 HTML 就是这样:改一点逻辑,页面、样式、脚本全得跟着动。前后端分离像明装线槽 —— 接口是插座面板,前端想换就换,后端不用砸墙。
## JSP 不是"另一种 HTML",它最终也是 Servlet
JSP(JavaServer Pages)只是写起来像 HTML。第一次被访问时,容器会把它翻译成 Java 源文件,再编译成 class。翻译产物在 Tomcat 的 work 目录里,路径类似:

\`\`\`text
work/Catalina/localhost/demo/org/apache/jsp/user_jsp.java
work/Catalina/localhost/demo/org/apache/jsp/user_jsp.class
\`\`\`

翻译后的类大致长这样(节选,保留结构):

\`\`\`java user_jsp.java(容器生成,节选)
public final class user_jsp extends org.apache.jasper.runtime.HttpJspBase {

    public void _jspService(HttpServletRequest request, HttpServletResponse response)
            throws java.io.IOException, jakarta.servlet.ServletException {
        jakarta.servlet.jsp.JspWriter out = pageContext.getOut();
        response.setContentType("text/html;charset=UTF-8");

        out.write("<html><body>\\n");
        out.write("  <h2>用户列表</h2>\\n");
        String name = (String) request.getAttribute("name");
        out.print(name);
        out.write("\\n</body></html>");
    }
}
\`\`\`

所以 JSP 的本质是:**一个以 HTML 为模板、由容器生成 service 方法的 Servlet**。它同样有 init/destroy,同样单实例多线程,同样不能往成员变量里塞请求数据。
| 内置对象 | 类型 | 相当于 | 作用域 |
| --- | --- | --- | --- |
| request | HttpServletRequest | Servlet 的 request | 一次请求 |
| response | HttpServletResponse | Servlet 的 response | 一次响应 |
| session | HttpSession | 会话 | 一次会话 |
| application | ServletContext | 整个应用 | 应用级 |
| out | JspWriter | 带缓冲的 PrintWriter | 当前页面 |
| pageContext | PageContext | 页面上下文 | 当前页面,可操作其他域 |
| page | Object | this | 当前 JSP 实例 |
| config | ServletConfig | Servlet 配置 | 当前 JSP |
| exception | Throwable | 异常对象 | 仅错误页 |
> [!pitfall] 第一次访问慢,不是代码慢
> JSP 是懒编译:第一次请求才翻译 + 编译,所以首访明显慢,之后走缓存。修改 JSP 会触发重新编译,生产环境要关掉开发模式的热部署,避免用户请求撞上编译窗口。把 JSP 放在 WEB-INF 下还能防止被直接访问,只允许 Controller 转发进来。
## 从脚本片到标签:EL 与 JSTL
最老的写法叫 scriptlet,Java 代码直接拌在 HTML 里。能跑,但难读、难测、难维护:

\`\`\`xml user.jsp(scriptlet 写法)
<%@ page import="java.util.List, com.example.model.User" %>
<%
    List<User> users = (List<User>) request.getAttribute("users");
    for (User u : users) {
%>
    <p><%= u.getId() %> - <%= u.getName() %></p>
<%
    }
%>
\`\`\`

EL(Expression Language)把取值变成表达式,JSTL 把循环、判断变成标签,页面里就不再有 Java 语句:

\`\`\`xml users.jsp(EL + JSTL)
<%@ page contentType="text/html;charset=UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<html>
<body>
  <h2>用户列表</h2>
  <c:forEach var="u" items="\${users}">
    <p>\${u.id} - <c:out value="\${u.name}"/></p>
  </c:forEach>
  <c:if test="\${empty users}">
    <p>暂无数据</p>
  </c:if>
</body>
</html>
\`\`\`

Controller 先把数据放进 request 域,再转发到页面:

\`\`\`java UserListServlet.java
@WebServlet("/users")
public class UserListServlet extends HttpServlet {

    private final UserDao userDao = new UserDao();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        List<User> users = userDao.findAll();
        req.setAttribute("users", users);
        req.getRequestDispatcher("/WEB-INF/views/users.jsp").forward(req, resp);
    }
}
\`\`\`

浏览器最终拿到的仍是纯 HTML:

\`\`\`output
HTTP/1.1 200 
Content-Type: text/html;charset=UTF-8

<html>
<body>
  <h2>用户列表</h2>
  <p>1 - 张三</p>
  <p>2 - 李四</p>
</body>
</html>
\`\`\`

EL 的查找顺序是 page → request → session → application,找不到返回空而不是报错;还能做算术、比较、empty 判断。JSTL 则提供 c:forEach、c:if、c:choose、c:out、c:url 等标签,把控制流从 Java 代码里搬进标签。
> [!warn] c:out 不是可选装饰
> EL 直接输出 \${u.name} 不会做 HTML 转义。如果用户名是 &lt;script&gt;alert(1)&lt;/script&gt;,页面就会执行脚本 —— 这就是存储型 XSS。用 c:out 或前端框架的转义输出,才是正确姿势。别把"页面能显示"当成"页面安全"。
## Model1 与 Model2:为什么一定要有 Controller
Model1 的结构是 JSP + JavaBean:JSP 收参数、调 DAO、拼 HTML,JavaBean 只当数据袋。页面一多,控制逻辑就散落在几十个 JSP 里。Model2 引入 Servlet 当控制器,把职责切成三块:
| 维度 | Model1(JSP + JavaBean) | Model2(Servlet + JSP + JavaBean) |
| --- | --- | --- |
| 入口 | 每个 JSP 自己收请求 | 统一由 Servlet 接收 |
| 控制逻辑 | 散在页面顶部脚本里 | 集中在 Controller |
| 视图 | JSP 兼做控制器与视图 | JSP 只负责渲染 |
| 数据 | JavaBean 在页面里直接用 | Controller 放 request 域再转发 |
| 可测试性 | 必须起容器才能测 | Service 可单元测试 |
| 可维护性 | 页面越多越失控 | 职责清晰,便于分工 |
Model2 的一次完整请求:Servlet 收参数 → 调 Service → 把结果放进 request → forward 到 JSP → JSP 只读数据渲染。SpringMVC 的 DispatcherServlet + Controller + ViewResolver,本质就是这套结构的工程化版本。
\`\`\`output
[Servlet] GET /demo/users -> userDao.findAll() 返回 2 行
[Servlet] setAttribute("users", list) 后 forward 到 /WEB-INF/views/users.jsp
[JSP] 只读 request 域渲染,不再查库
\`\`\`
> [!interview] 高频追问:MVC 是设计模式吗?
> 严格说 MVC 是**架构模式**,不是 GoF 的 23 种设计模式。它约束的是三层职责与依赖方向:Model 管数据与业务,View 管展示,Controller 管接收与调度。SpringMVC 里还叠加了前端控制器、策略模式(HandlerMapping/ViewResolver)等设计模式,但 MVC 本身回答的是"系统怎么分层"。
## JSP 为什么被淘汰
JSP 不是不能跑,而是它的工程代价在现代架构里越来越高:
- **前后端分离**:浏览器、App、小程序都要数据,JSON 接口一份就够;JSP 只能吐 HTML,每端都得重做页面。
- **职责回退**:JSP 太容易写 Java 代码,团队一放松就退回 Model1,技术债越滚越大。
- **调试与编译**:JSP 先翻译再编译,错误栈指向生成代码,定位痛苦;热更新也不如纯 Java。
- **模板能力**:Thymeleaf、FreeMarker 更接近自然 HTML,支持原型预览、表达式更安全,SpringBoot 官方默认推荐 Thymeleaf。
- **安全面**:脚本片可写任意 Java,EL 注入、文件包含、XSS 都更容易出现;现代模板引擎默认转义。
- **部署形态**:JSP 必须打 war 跑在容器里;前后端分离后,后端打 jar、前端静态托管,部署更轻。
| 关注点 | JSP 时代 | 前后端分离 |
| --- | --- | --- |
| 数据传递 | request 域 + EL | JSON 接口 |
| 页面渲染 | 服务端 JSP | 浏览器 Vue/React |
| 接口契约 | 没有,直接出 HTML | OpenAPI/JSON Schema |
| 部署 | war + 外部 Tomcat | jar 内嵌容器 + 静态托管 |
| 联调 | 后端改页面,前端等 | 契约先行,并行开发 |
Thymeleaf 的写法保留"模板"思路,但页面本身就是合法 HTML,浏览器直接打开也能看:

\`\`\`xml users.html(Thymeleaf)
<table>
  <tr th:each="u : \${users}">
    <td th:text="\${u.id}">1</td>
    <td th:text="\${u.name}">张三</td>
  </tr>
</table>
\`\`\`
> [!pitfall] 别把"淘汰"理解成"不用学"
> 大量银行、政务、制造业老系统仍在跑 JSP。接手时你要能看懂 scriptlet、EL、JSTL、web.xml 与 Tomcat 部署;改造时才知道哪些逻辑该搬进 Controller、哪些该抽成接口。==会读老代码,和会写新代码,是两种能力==。
## 本章小结
- JSP 会被容器翻译成 Servlet 的 _jspService,本质仍是 Servlet:单实例、多线程、有九个内置对象。
- EL 负责取值( page → request → session → application ),JSTL 负责循环判断;c:out 做 HTML 转义,防 XSS。
- Model1 让 JSP 兼做控制器与视图;Model2 用 Servlet 当控制器,JSP 只渲染,这就是 MVC 的雏形。
- JSP 退场的原因:前后端分离、职责易回退、编译调试难、模板引擎更安全、部署形态更重。
- 新项目用 REST + JSON 或 Thymeleaf;老项目维护仍要会 JSP,先看懂再改造。
## 面试速记
- JSP 本质:容器把 .jsp 翻译成 Java 类再编译,生成 _jspService,最终仍是 Servlet;首次访问才编译。
- 九个内置对象:request、response、session、application、out、pageContext、page、config、exception。
- EL 查找顺序 page → request → session → application;JSTL 用 c:forEach/c:if/c:out,输出用户内容必须转义。
- Model1 = JSP 兼控制器与视图;Model2 = Servlet 控制 + JSP 视图 + JavaBean 模型;SpringMVC 是 Model2 的工程化。
- JSP 被淘汰:前后端分离、模板引擎更安全好维护、war 部署重;但老项目维护仍必须会。
`
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch06',
        title: 'JDBC 与连接池:数据库访问的原始形态',
        minutes: 70,
        points: ['JDBC 六步', '预编译防注入', '事务与 DAO', '连接池'],
        content: `
> [!info] 本章导读 · 先讲个故事
> 你在 MyBatis 的 Mapper 接口上写了一句 @Select("SELECT * FROM users WHERE id = #{id}"),方法一调,User 对象就回来了。舒服得像魔法。可面试官问"它底层怎么做的",你答不上来;线上连接池被打满,你也不知道该调哪个参数。
> 魔法都有底座。MyBatis 的底座就是 ==JDBC==:加载驱动、拿连接、建 PreparedStatement、执行、遍历 ResultSet、关闭。框架只是把这六步、对象映射、事务与连接管理包了起来。本章把这层拆开,让你既能手写,也能在出问题时知道往哪看。
> - 读完本章你将能:手写 JDBC 六步并正确关闭资源
> - 用代码复现 SQL 注入,并说清 PreparedStatement 为什么能防
> - 写出一段带 commit/rollback 的事务,理解连接池归还前的清理
> - 说清连接池参数含义,以及 MyBatis/JPA 到底替你做了什么

> [!tip] 日常电脑现场 · 公司前台的两部外线电话
> 每个员工要打外线,都去电信申请一条新线路、等师傅上门装机,打完再拆掉 —— 这就是"每次请求新建数据库连接"。现实做法是前台装两部常开的电话(连接池),谁要打电话就借用,说完挂机归还,下一个人接着用。线路是稀缺资源,复用才划算,但只有两部时,人多就得排队(等待超时)。
## JDBC 六步:MyBatis 的底座
\`\`\`java JdbcDemo.java
import java.sql.*;
public class JdbcDemo {
    public static void main(String[] args) throws Exception {
        Class.forName("com.mysql.cj.jdbc.Driver"); // 1. 加载驱动(JDBC 4.0 起可省略,SPI 自动注册)
        String url = "jdbc:mysql://localhost:3306/shop?useSSL=false&serverTimezone=Asia/Shanghai&characterEncoding=utf8"; // URL
        String sql = "SELECT id, username, balance FROM users WHERE id = ?";
        try (Connection conn = DriverManager.getConnection(url, "root", "123456"); // 2. 获取连接
             PreparedStatement ps = conn.prepareStatement(sql)) { // 3. 创建语句
            ps.setLong(1, 1L);
            try (ResultSet rs = ps.executeQuery()) { // 4. 执行
                while (rs.next()) { // 5. 处理结果
                    System.out.printf("%d | %s | %.2f%n", rs.getLong("id"), rs.getString("username"), rs.getBigDecimal("balance"));
                }
            }
        } // 6. try-with-resources 自动关闭 rs、ps、conn
    }
}
\`\`\`
\`\`\`output
1 | zhen | 128.50
\`\`\`
| 步骤 | 做的事 | 关键 API | 常见错误 |
| --- | --- | --- | --- |
| 1 加载驱动 | 注册 Driver 实现 | Class.forName | 驱动 jar 没进 classpath |
| 2 获取连接 | 建立 TCP + 认证 + 会话 | DriverManager.getConnection | URL 参数错、账号密码错 |
| 3 创建语句 | 预编译 SQL | conn.prepareStatement | 用 Statement 拼接参数 |
| 4 执行 | 查询/更新 | executeQuery/executeUpdate | 查询用了 executeUpdate |
| 5 处理结果 | 遍历行、按类型取值 | rs.next/getXxx | 列名写错、类型不匹配 |
| 6 关闭 | 逆序释放资源 | close / try-with-resources | 只关 Connection 漏 ResultSet |
## SQL 注入:字符串拼接的代价
\`\`\`java VulnerableLogin.java
public boolean login(Connection conn, String username, String password) throws Exception {
    String sql = "SELECT id, username FROM users WHERE username = '"
            + username + "' AND password = '" + password + "'";
    System.out.println("SQL = " + sql);
    try (Statement st = conn.createStatement(); ResultSet rs = st.executeQuery(sql)) {
        boolean found = false;
        while (rs.next()) { found = true; System.out.println("登录成功: " + rs.getString("username")); }
        return found;
    }
}
\`\`\`
用户名输入 ==' OR '1'='1' -- ==(密码随便填),SQL 变成恒真条件,整表用户都被查出来:
\`\`\`output
SQL = SELECT id, username FROM users WHERE username = '' OR '1'='1' -- ' AND password = 'x'
登录成功: zhen
登录成功: admin
[err]两行全部命中 —— 没有密码也能登录任意账号[/err]
\`\`\`
改成 PreparedStatement,SQL 结构先编译定型,参数只作为值传入:
\`\`\`java SafeLogin.java
public boolean login(Connection conn, String username, String password) throws Exception {
    String sql = "SELECT id, username FROM users WHERE username = ? AND password = ?";
    System.out.println("SQL = " + sql);
    try (PreparedStatement ps = conn.prepareStatement(sql)) {
        ps.setString(1, username);
        ps.setString(2, password);
        try (ResultSet rs = ps.executeQuery()) {
            boolean ok = rs.next();
            System.out.println(ok ? "登录成功: " + rs.getString("username") : "登录失败: 0 行");
            return ok;
        }
    }
}
\`\`\`
\`\`\`output
SQL = SELECT id, username FROM users WHERE username = ? AND password = ?
参数 = [' OR '1'='1' -- , x]
登录失败: 0 行
\`\`\`
| 维度 | Statement | PreparedStatement |
| --- | --- | --- |
| SQL 结构 | 每次拼接,字符串即结构 | 先编译定型,参数与结构分离 |
| 注入风险 | 高,输入可改变语义 | 低,参数只能当值 |
| 性能 | 每次硬解析 | 可复用执行计划(尤其批量) |
| 适用 | 无参数的 DDL/固定 SQL | 所有带参数的 SQL |
> [!danger] 预编译不是"万能挡箭牌"
> 表名、列名、ORDER BY 字段不能用 ? 占位,因为它们在编译期必须确定。这类结构成分只能用白名单枚举校验,绝不能直接拼用户输入。MyBatis 的 #{} 走 PreparedStatement 的 ?,是安全的;美元符占位是字符串拼接,只允许白名单场景。这条红线,第 5 章模块已经用事故演示过。
## 事务:一组操作要么全成,要么全败
\`\`\`java AccountDao.java
public void transfer(long fromId, long toId, BigDecimal amount) throws SQLException {
    String debit = "UPDATE account SET balance = balance - ? WHERE id = ? AND balance >= ?";
    String credit = "UPDATE account SET balance = balance + ? WHERE id = ?";
    try (Connection conn = dataSource.getConnection()) {
        boolean oldAutoCommit = conn.getAutoCommit();
        conn.setAutoCommit(false);
        try (PreparedStatement a = conn.prepareStatement(debit);
             PreparedStatement b = conn.prepareStatement(credit)) {
            a.setBigDecimal(1, amount);
            a.setLong(2, fromId);
            a.setBigDecimal(3, amount);
            if (a.executeUpdate() != 1) throw new IllegalStateException("余额不足或账户不存在");
            b.setBigDecimal(1, amount);
            b.setLong(2, toId);
            if (b.executeUpdate() != 1) throw new IllegalStateException("收款账户不存在");
            conn.commit();
            System.out.println("转账 " + amount + " 成功,已提交");
        } catch (SQLException | RuntimeException e) {
            conn.rollback();
            System.out.println("转账 " + amount + " 失败,已回滚: " + e.getMessage());
            throw e;
        } finally {
            conn.setAutoCommit(oldAutoCommit);
        }
    }
}
\`\`\`
\`\`\`output
转账 500.00 成功,已提交
转账 2000.00 失败,已回滚: 余额不足或账户不存在
[hl]from 账户余额仍为 1000.00,to 账户未变[/hl]
\`\`\`
> [!best] 连接来自池,归还前必须还原状态
> 连接池借出的连接会被下一个人复用。如果你 setAutoCommit(false) 后忘了还原,下一个拿到这条连接的业务可能一直不提交;如果忘了 rollback,未提交事务会占着锁。规范写法是:进入时记下 oldAutoCommit,finally 还原;异常路径必 rollback;所有语句用 try-with-resources 关闭。
## DAO 模式:把 SQL 关进一个类
DAO(Data Access Object)把"怎么查库"与"业务怎么用数据"分开。业务层只依赖接口,换数据库、换框架都不影响调用方:
\`\`\`java JdbcUserDao.java
public class JdbcUserDao implements UserDao {
    private final DataSource dataSource;
    public JdbcUserDao(DataSource dataSource) { this.dataSource = dataSource; }
    @Override
    public User findById(long id) {
        String sql = "SELECT id, username, balance FROM users WHERE id = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                return new User(rs.getLong("id"), rs.getString("username"), rs.getBigDecimal("balance"));
            }
        } catch (SQLException e) {
            throw new RuntimeException("查询用户失败,id=" + id, e);
        }
    }
}
\`\`\`
## 连接池:别为一次查询开一次连接
MySQL 建立一条连接要 TCP 三次握手、认证、初始化会话变量,成本通常在几十毫秒;高并发下如果每次请求都新建,数据库光握手就忙不过来,还会撞上 max_connections 上限。连接池预先建好一批连接,请求来了借、用完还:
| 参数(HikariCP) | 含义 | 经验值 |
| --- | --- | --- |
| maximumPoolSize | 池内最大连接数 | 10~20 起步,按 DB 上限与实例数算 |
| connectionTimeout | 借连接最长等待 | 3000ms,宁可快速失败 |
| maxLifetime | 连接最长寿命 | 比 MySQL wait_timeout 小,如 30 分钟 |
| leakDetectionThreshold | 借出多久未还告警 | 生产建议开启,如 20 秒 |
\`\`\`properties application.properties
spring.datasource.type=com.zaxxer.hikari.HikariDataSource
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.connection-timeout=3000
spring.datasource.hikari.max-lifetime=1800000
spring.datasource.hikari.leak-detection-threshold=20000
\`\`\`
| 维度 | Druid | HikariCP |
| --- | --- | --- |
| 定位 | 阿里开源,监控与 SQL 防火墙强 | SpringBoot 默认,极致轻快 |
| 核心参数 | initialSize/minIdle/maxActive/maxWait | maximumPoolSize/minimumIdle/connectionTimeout |
> [!danger] 连接池不是越大越好
> 连接数超过数据库处理能力,只会把压力从应用转移到 DB,线程排队、上下文切换反而更慢。经验公式:连接数 ≈ CPU 核数 × 2 + 磁盘并行度,再按实例数分摊,别让 总连接数 超过 MySQL max_connections。另外 maxLifetime 必须小于 wait_timeout,否则会拿到被 MySQL 单方面断开的死连接。
## 引出 ORM:框架替你收的尾
把上面的代码和 MyBatis 对比,框架至少替你做了四件事:ResultSet 到对象的映射、参数绑定与类型转换、分页与动态 SQL、事务与连接的生命周期管理。JPA 更进一步,按对象模型生成 SQL,但代价是复杂查询不易控。
| 方式 | 你写什么 | 框架负责 | 适合 |
| --- | --- | --- | --- |
| 原生 JDBC | SQL + 全部资源管理 | 无 | 学习、极致控制、批处理 |
| MyBatis | SQL + 映射 | 参数、结果映射、分页、事务 | 大多数业务系统 |
| JPA/Hibernate | 实体 + 少量查询 | SQL 生成、级联、缓存 | 领域模型稳定、CRUD 多 |
> [!interview] 一句话收束
> 框架没有消灭 JDBC,而是把 JDBC 的六步、对象映射、连接与事务管理封装进模板。理解 JDBC,你才能在连接池打满、事务不回滚、SQL 注入、流式查询 OOM 这些现场,知道该看哪一层。
## 本章小结
- JDBC 六步:加载驱动 → 获取连接 → 创建语句 → 执行 → 处理结果 → 关闭;生产代码用 DataSource 与 try-with-resources。
- SQL 注入的根因是"输入变成了结构";PreparedStatement 先编译结构、参数只当值,因此安全;表名列名只能用白名单。
- 事务三件套:setAutoCommit(false)、commit、rollback;连接来自池,归还前要还原 autoCommit。
- DAO 把 SQL 与业务隔离;连接池复用连接,参数重点看最大连接、等待时间、寿命与泄漏检测。
## 面试速记
- JDBC 六步:Class.forName → DriverManager → Connection → PreparedStatement → ResultSet → close;JDBC 4 起驱动可 SPI 自动加载。
- 预编译防注入:SQL 结构编译期定型,? 只能是值;表名/列名/ORDER BY 不能用 ?,必须白名单。
- 事务:setAutoCommit(false) → 多条 SQL → commit;异常 rollback;同一 Connection;池连接归还前还原状态。
- 连接池:预建连接复用,省握手与认证;核心参数 maximumPoolSize、connectionTimeout、maxLifetime、leakDetectionThreshold。
`
      }
    ],
    interview: [
      { q: 'Servlet 的生命周期说一下?', a: '四个阶段:**构造 → init(ServletConfig) → service → destroy**。① 容器反射创建实例,只一次;② init 只一次,用于读配置、初始化资源,重写带参 init 要调用 super.init(config);③ 每个请求由容器线程池调用 service,再按方法分派到 doGet/doPost,**单实例多线程**;④ 容器正常关闭时 destroy 一次,释放资源,但 kill -9 不保证执行。load-on-startup 只影响创建时机:默认 -1 首次请求创建,正数启动即创建且数字越小越早。' },
      { q: '转发和重定向的区别?', a: '**forward 是服务端内部跳转**:一次请求,地址栏不变,request 域共享,目标只能是应用内部(可进 WEB-INF),典型是查询后渲染页面。**redirect 是客户端跳转**:服务器返回 302,浏览器再发一次新请求,地址栏改变,request 域丢失,可跳任意 URL,典型是登录成功跳首页、PRG 防重复提交。实现上 forward 用 RequestDispatcher,redirect 用 response.sendRedirect;跳转后记得 return,避免继续写响应。' },
      { q: 'Cookie 和 Session 的区别?', a: '**Cookie 存客户端**,浏览器保存并在同域请求自动携带,单域约 4KB,数据明文可改,关键属性有 Max-Age、Path、Domain、HttpOnly、Secure、SameSite。**Session 存服务端**,客户端只拿一个 JSESSIONID(默认走 Cookie),数据不落客户端,受服务端内存或 Redis 限制,靠超时或 invalidate 销毁。选型:轻量偏好用 Cookie,登录态与敏感数据用 Session,跨域多端再考虑 Token。' },
      { q: '分布式 Session 怎么解决?', a: '四类方案:① **会话粘滞**:负载均衡按 IP 或 JSESSIONID 固定节点,零改造但节点故障掉线、扩容漂移;② **会话复制**:Tomcat 集群广播 Session,无需外部组件但网络开销大;③ **集中存储**:Session 写 Redis,各节点共享,工程主流,Spring Session 用过滤器替换 HttpSession 实现,业务几乎无感;④ **无状态 Token**:JWT 自带签名声明,服务端不存,天然跨节点,但注销、续期、撤销更复杂。' },
      { q: 'Filter 和 Interceptor 有什么区别?', a: '**Filter 属于 Servlet 规范**,在 Servlet 之前/之后执行,能拿到 request/response,但拿不到 Spring 的 Handler 和业务 Bean;拦截范围覆盖所有 HTTP 请求。**Interceptor 属于 Spring MVC**,在 DispatcherServlet 内、Handler 前后执行,能拿到 HandlerMethod、ModelAndView,可注入 Bean;静态资源和 404 可能不进拦截器。执行顺序:Filter → Interceptor.preHandle → Controller → postHandle → afterCompletion → Filter 后置。AOP 则更内层,作用于 Bean 方法调用。' },
      { q: 'JSP 的原理是什么?为什么现在不用了?', a: 'JSP 本质是 Servlet:容器第一次访问时把 .jsp 翻译成 Java 源文件(生成 _jspService),再编译成 class,放在 work 目录;之后走缓存。它同样单实例多线程,有 request、response、session、application、out、pageContext 等九个内置对象。不用它的原因:前后端分离后接口只需 JSON;JSP 容易把 Java 逻辑写回页面,退回 Model1;翻译编译导致调试难、热更新差;Thymeleaf 等模板引擎更安全、更接近原生 HTML;war + 外部容器部署形态偏重。' },
      { q: 'JDBC 的六步是什么?', a: '① **加载驱动**:Class.forName,JDBC 4 起可省略,SPI 自动注册;② **获取连接**:DriverManager.getConnection 或从 DataSource 借;③ **创建语句**:conn.prepareStatement(sql);④ **执行**:executeQuery 返回 ResultSet,executeUpdate 返回影响行数;⑤ **处理结果**:rs.next 遍历,按类型 getXxx;⑥ **关闭**:逆序关闭 ResultSet、Statement、Connection,生产代码用 try-with-resources。核心记忆:驱动、连接、语句、执行、结果、关闭。' },
      { q: 'PreparedStatement 为什么能防 SQL 注入?', a: '因为 **SQL 结构与参数分离**。PreparedStatement 先用 ? 占位把 SQL 交给数据库编译,结构在编译期定型;之后 setString 等传入的参数只作为**值**绑定,不参与语法解析,输入里的引号、OR、注释符都只是字符串内容。Statement 则是把输入拼进 SQL,输入可以改变语义。注意:表名、列名、ORDER BY 字段不能用 ? 占位,只能白名单;MyBatis 的 #{} 走预编译,美元符占位是拼接,不能传用户输入。' },
      { q: '连接池的原理是什么?为什么需要连接池?', a: '建立数据库连接要 TCP 握手、认证、初始化会话,成本几十毫秒,高并发下每次新建会拖垮 DB 并撞上 max_connections。连接池**预先创建一批连接**,请求来了借、用完还,复用连接省掉建连成本,同时限制并发连接数保护数据库。核心参数:maximumPoolSize、minimumIdle、connectionTimeout(借不到快速失败)、maxLifetime(小于 MySQL wait_timeout,避免死连接)、leakDetectionThreshold(借出未还告警)。池不是越大越好,超过 DB 处理能力只会更慢。' },
      { q: 'Servlet 为什么会有线程安全问题?怎么解决?', a: 'Servlet 默认**单实例多线程**:容器只创建一个实例,所有请求由线程池并发调用 service。如果实例里有可变成员变量(如 int count、SimpleDateFormat、普通 HashMap),多个线程会同时读写,出现丢失更新或数据错乱。解决优先级:① **无状态**,请求数据只放局部变量或 request 域;② 用 AtomicInteger、ConcurrentHashMap 等线程安全类型;③ 最后才 synchronized,但会串行化降低吞吐。ServletContext 属性也是全应用共享,同样要线程安全。' },
      { q: 'GET 和 POST 有什么区别?', a: '语义上:GET 是**查询/幂等**,POST 是**提交/非幂等**。传输上:GET 参数拼在 URL 查询串,受 URL 长度与日志暴露限制;POST 参数在请求体,可传文件与大数据。缓存上:GET 可被浏览器/CDN 缓存,POST 默认不缓存。安全上:两者都不加密,HTTPS 才安全;POST 并不比 GET 更安全。工程上:GET 不应产生副作用,写操作必须用 POST/PUT/DELETE;登录表单用 POST,避免密码进 URL 与历史记录。' },
      { q: '中文乱码的原因和解决办法?', a: '根因只有一条:**编码与解码字符集不一致**。① POST 请求体:在第一次 getParameter 之前 setCharacterEncoding("UTF-8"),晚于参数解析就无效;② GET 查询串:看 Connector 的 URIEncoding,Tomcat 8+ 默认 UTF-8,老版本需在 server.xml 配;③ 响应:setContentType("text/html;charset=UTF-8"),让浏览器按 UTF-8 解析;④ 数据库:JDBC URL 加 characterEncoding=utf8,库表用 utf8mb4。统一方案是编码过滤器对所有请求先设 UTF-8。' },
      { q: 'web.xml 和注解配置有什么区别?', a: '**web.xml 是集中式部署描述符**:所有 Servlet、Filter、Listener 的映射写在一个文件里,全局视图清晰,改映射不必重编译,适合老项目、第三方 Servlet、集中治理。**注解(@WebServlet/@WebFilter/@WebListener)是就近声明**:写在类上,直观、少配置,但改映射要改代码重新打包。两者可共存,默认合并;web.xml 的 metadata-complete="true" 会关闭注解扫描,同名配置以 web.xml 为准。注解方式无法可靠指定 Filter 顺序,需要顺序时用 web.xml 或 FilterRegistrationBean。' },
      { q: 'Tomcat 的容器结构是怎样的?', a: '自上而下:**Server(整个 Tomcat 实例)→ Service(绑定 Connector 与 Engine)→ Connector(监听端口、解析 HTTP)+ Engine(请求处理总入口)→ Host(虚拟主机,按域名分发)→ Context(一个 Web 应用,对应一个 war/目录)→ Wrapper(一个 Servlet 的包装,负责其生命周期)**。请求进来先由 Connector 解析,再经 Engine/Host 找到 Context,最后按 URL 映射命中 Wrapper 里的 Servlet;Filter 链在 Servlet 之前执行。一个 Context 一个应用,一个 Wrapper 一个 Servlet 映射,这是 404 排查的定位坐标。' }
    ]
  };
})();
