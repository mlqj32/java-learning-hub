(function () {
  'use strict';
  window.CONTENT = window.CONTENT || {};

  window.CONTENT.javahistory = {
    id: 'javahistory',
    title: 'Java 简史与生态全景',
    en: 'JAVA HISTORY & ECOSYSTEM',
    icon: 'book',
    color: '#eab308',
    tagline: '从 Oak 到 Java 21 的三十年',
    description: '从 Java 的诞生讲起:ME/SE/EE 三兄弟的分工、Java ME 的辉煌与覆灭、功能机 Java 游戏与今天 Java 游戏的区别,再到 Swing/JavaFX 桌面开发初体验。像技术考古一样,把今天写的每一行 Java 放回它的历史坐标。',
    minutes: '≈ 8 小时',
    chapters: [
      {
        id: 'ch01',
        title: 'Java 三十年:从 Oak 到 Java 21',
        minutes: 95,
        points: ['Oak 起源', '版本时间线', 'LTS 节奏', 'OpenJDK 生态'],
        content: `
> [!info] 本章导读 · 一门"失败的家电语言"如何统治后端
> 1991 年,Sun 的绿色小组想给机顶盒写一套交互界面,项目代号 Oak;机顶盒没卖出去,这门语言却顺着浏览器活了下来。三十年后,你写的每一行 Spring 代码,仍然跑在当年那套"虚拟机"设想之上。
> - 读完本章你将能:按时间线说清 Java 5 / 8 / 11 / 17 / 21 各自的关键变化
> - 解释字节码 + JVM 如何做到"一次编写,到处运行"
> - 知道 LTS 是什么、企业升级该按什么节奏走

> [!tip] 日常电脑现场 · 安装器里的"Java 8 Update"
> 给旧系统装插件时,安装向导常常自带一个 Java 运行时,版本还停在 8;而新下载的 IDE 又要求 17 以上。同一台电脑躺着两三个 Java,正是版本节奏留在普通人桌面上的痕迹。

## 绿项目:一台没卖出去的机顶盒

1991 年,James Gosling 带着几位工程师在 Sun 内部启动 Green 项目,目标是给消费电子做一套软件平台,第一个落脚点是交互电视的机顶盒。语言最初叫 **Oak**(橡树,取自 Gosling 办公室窗外那棵树),后来发现 Oak 已被注册,才改名 **Java**(据说灵感来自咖啡豆)。

机顶盒订单没谈成,团队几乎要被裁掉。转折点是 1993 年出现的 Mosaic 浏览器:他们意识到"跨平台的小程序"可以嵌在网页里,于是有了 1995 年发布的 Java 1.0 和那句著名的口号 **Write Once, Run Anywhere**。

> [!warn] "一次编写,到处运行"有个前提
> 它指的是**字节码**不用改,不是"所有平台行为完全一致"。文件路径、字符编码、换行符、GUI 外观、线程调度都可能不同;Java 用统一类库抹平了大部分差异,但"跨平台"从来不是零成本。

## 时间线:五次真正改变写法的版本

| 年份 | 版本 | 标志性变化 | 今天还在用吗 |
| --- | --- | --- | --- |
| 1995 | Java 1.0 | 字节码、Applet、AWT | Applet 已淘汰 |
| 2004 | Java 5 | 泛型、注解、枚举、并发包 | 写法沿用至今 |
| 2014 | Java 8 | Lambda、Stream、新日期时间 | 存量项目主力 |
| 2017 | Java 9 | JPMS 模块化、JShell | 部分框架使用 |
| 2018 | Java 11 | 第一个两年节奏 LTS | 大量企业基线 |
| 2021 | Java 17 | 记录类、密封类、模式匹配 | Spring Boot 3 底线 |
| 2023 | Java 21 | 虚拟线程、switch 模式匹配 | 新项目首选 |

\`\`\`diagram:d-java-history
\`\`\`

把这张图当成"版本地图":每个节点不是孤立的新特性,而是当时硬件与业务压力的一次回应。机器变多,有了并发包;多核普及,有了 Lambda 与 Stream;云原生要求启动快、内存省,有了模块化与虚拟线程。

### Java 5:现代 Java 的语法地基

\`\`\`java
// Java 5 之前:集合什么都装,取出来全靠强转
List names = new ArrayList();
names.add("zhen");
String first = (String) names.get(0);

// Java 5:泛型把类型检查提前到编译期
List<String> safe = new ArrayList<>();
safe.add("zhen");
String value = safe.get(0);
System.out.println(first + " / " + value);
\`\`\`

\`\`\`output
zhen / zhen
\`\`\`

泛型、注解、自动装箱、增强 for、枚举、可变参数、静态导入,再加一个 java.util.concurrent —— 一个版本几乎把今天 Java 的日常语法全部凑齐。很多"Java 老项目"说的就是 Java 5 风格:注解满天飞,但还没有 Lambda。

### Java 8 与 Java 21:两次范式转移

\`\`\`java
import java.util.List;
import java.util.stream.Collectors;

public class VersionTaste {
    public static void main(String[] args) {
        List<String> langs = List.of("Java", "Kotlin", "Go", "Rust");
        String joined = langs.stream()
                .filter(s -> s.length() <= 4)
                .limit(2)
                .map(String::toUpperCase)
                .collect(Collectors.joining(","));
        System.out.println(joined);
    }
}
\`\`\`

\`\`\`output
JAVA,GO
\`\`\`

Java 8 的 Lambda 让"行为"可以像数据一样传递,Stream 把循环改写成流水线,接口有了 default 方法,时间 API 换成了 java.time。到 Java 21,记录类、密封类、模式匹配补齐了"数据导向"的表达,虚拟线程则把高并发从"线程池调参"拉回"一个请求一个线程"的直觉写法。

> [!interview] 面试官真正想听的版本观
> 不要背"Java 8 有 Lambda"这种一句话。按"**语法层 → 类库层 → 运行时层**"三层说:Java 5 统一了语法糖与并发工具;Java 8 引入函数式与新的时间模型;Java 9 动了运行时结构(JPMS);Java 11 收紧 JDK(移除 Java EE 模块);Java 17/21 在语言表达力和线程模型上继续进化。能说出"每个版本解决了什么痛点",比背特性列表高一个档次。

## Sun → Oracle → OpenJDK:谁在管这门语言

| 阶段 | 时间 | 关键事件 | 对开发者的影响 |
| --- | --- | --- | --- |
| Sun 时代 | 1995–2010 | Java 1.0、J2EE、开源源码 | 语言与规范快速铺开 |
| Oracle 收购 | 2010 | Oracle 完成对 Sun 的收购 | 商标与发布节奏更集中 |
| OpenJDK | 2007 起 | GPLv2 开源实现成为主流 | 各家发行版百花齐放 |
| 半年节奏 | 2017 起 | 每年 3 月、9 月各发一版 | 新特性更快落地 |
| LTS 节奏 | 2018 起 | 每两年一个长期支持版 | 企业升级有了明确锚点 |

你现在下载的 JDK,大概率是某个组织基于 OpenJDK 源码构建的**发行版**:Eclipse Temurin、Amazon Corretto、Azul Zulu、Alibaba Dragonwell、Tencent Kona 等。它们共享同一套规范与大部分实现,差别在补丁策略、商业支持、平台优化和许可证条款。

\`\`\`shell
# 看清自己机器上到底是哪个发行版、哪个版本
java -version
java --list-modules | head -5
\`\`\`

\`\`\`output
openjdk version "21.0.2" 2024-01-16 LTS
OpenJDK Runtime Environment Temurin-21.0.2+13 (build 21.0.2+13-LTS)
OpenJDK 64-Bit Server VM Temurin-21.0.2+13 (build 21.0.2+13-LTS, mixed mode, sharing)
java.base@21.0.2
java.compiler@21.0.2
java.datatransfer@21.0.2
java.desktop@21.0.2
java.instrument@21.0.2
\`\`\`

> [!tip] 选 JDK 的三条朴素建议
> 新项目直接上当前 LTS(17 或 21,更新的 25 LTS 也已发布);存量项目先看框架底线,Spring Boot 3 要求 17,老版 Spring Boot 2.7 还能停在 8/11;团队统一发行版与补丁窗口,别让"开发用 Temurin、生产用 Oracle JDK"这种混搭埋雷。

## Java 为什么能活下来

### 字节码 + JVM:把"平台差异"关进一层抽象

\`\`\`text
Hello.java
   │ javac
   ▼
Hello.class(字节码,平台无关)
   │
   ├── JVM on Windows ──► x86 机器码
   ├── JVM on Linux   ──► x86/ARM 机器码
   └── JVM on macOS   ──► ARM/x86 机器码
\`\`\`

JVM 负责加载、校验、解释执行,并把热点代码交给 JIT 编译成本地机器码。这层抽象带来三个额外红利:**自动内存管理**(GC)、**运行期观测**(JFR、JMX、heap dump)、**动态优化**(内联、去虚化、逃逸分析)。很多语言后来也走"字节码 + 运行时"路线,Java 是最早把它做成工业标准的那批。

### 向后兼容:一门"不敢乱改"的语言

Java 对**二进制兼容**极其保守:旧 class 文件在新 JVM 上通常还能跑,废弃 API 先标记 deprecated、再 deprecate for removal、最后才删除。代价是语言演进慢、语法包袱重;收益是企业的十年老系统敢升级 JDK。这门语言的竞争力,有一半来自"不折腾"。

### 生态:从 Maven 中央仓库到 Spring

| 领域 | 代表项目 | Java 的角色 |
| --- | --- | --- |
| Web 后端 | Spring Boot、Quarkus、Micronaut | 主力语言 |
| 大数据 | Hadoop、Kafka、Flink、Spark | 核心实现语言 |
| 搜索与中间件 | Elasticsearch、Cassandra | 主要实现语言 |
| 构建与工具 | Maven、Gradle、IntelliJ IDEA | 宿主语言 |
| 移动端 | Android(历史关系) | 语言基础,运行时自研 |

生态的飞轮是:库多 → 开发快 → 用的人多 → 库更多。语言本身好不好写只是入场券,能不能找到"别人已经踩过坑的轮子"才决定项目生死。

## 今天的 Java 在哪里

- **后端服务**:银行、电商、电信的核心系统大量仍是 Java;Spring Boot 把"起一个服务"压缩到分钟级。
- **大数据与流处理**:Hadoop 生态、Kafka broker、Flink 作业 API 都以 JVM 为主场。
- **Android**:早期应用主要用 Java 写,现在 Kotlin 优先,但运行时与工具链仍与 Java 血脉相连。
- **游戏服务端**:Minecraft Java 版、大量 MMORPG 的网关与战斗服使用 Java/Netty。
- **桌面与工具**:IDE、构建工具、科学计算、企业内部管理端,存在感低但没消失。

> [!best] 学习路线上的位置
> 你不需要为了"历史"去学 Applet 或 J2ME,但需要知道**今天每个设计为什么长这样**:泛型是为了集合安全,模块化是为了裁剪运行时,虚拟线程是为了让阻塞式代码重新变得便宜。历史不是八卦,是设计决策的注脚。

## 本章小结

- 1991 年 Oak 为机顶盒而生,1995 年以 Java 之名转向浏览器与跨平台。
- Java 5 奠定现代语法,Java 8 引入函数式,Java 9 模块化,Java 17/21 是当前企业主线。
- Sun 开源、Oracle 接手,OpenJDK 成为事实标准,发行版只是构建与支持不同。
- 三大生存支柱:**字节码 + JVM、向后兼容文化、庞大生态**。
- 今天 Java 的主战场是后端、大数据与游戏服务端,桌面与移动端是历史延伸。

## 面试速记

- 时间线背六个点:**1995 1.0、2004 Java 5、2014 Java 8、2018 Java 11 LTS、2021 Java 17 LTS、2023 Java 21**。
- LTS 从 Java 11 起每两年一个,非 LTS 每半年一个,只维护到下一个版本发布。
- "一次编写到处运行"靠字节码 + JVM,不保证行为完全一致。
- Java 活下来的核心是生态与兼容性,不是语法先进。
- 升级建议:新项目 21,存量先到 17,框架底线优先于个人喜好。
`
      },
      {
        id: 'ch02',
        title: 'Java ME / SE / EE:三兄弟的分工',
        minutes: 90,
        points: ['ME/SE/EE', 'CLDC+MIDP', 'Servlet 容器', 'Jakarta EE'],
        content: `
> [!info] 本章导读 · 同一个 Java,为什么分三个版本?
> 面试官问"Java ME、SE、EE 有什么区别",很多人只能答出"微版、标准版、企业版"三个中文名。真正要讲清的是:它们共享语言与部分类库,但面向的设备、规范集合、运行容器完全不同。
> - 读完本章你将能:用一张包含关系图说清 ME / SE / EE
> - 说出 CLDC、MIDP、Servlet、EJB 各自属于哪一层
> - 解释 Spring 为什么能在企业开发里取代重量级 EJB

> [!tip] 日常电脑现场 · 浏览器插件与"Java 控制面板"
> 老一辈网民都见过浏览器提示"需要 Java 插件",控制面板里也躺着一个 Java 图标。那个时代 Java 想占领的不只是服务器,还有桌面与网页;今天它退回了后端,但"一次编写"的野心留下了痕迹。

## 先给结论:不是三个语言,是三个"裁剪版本"

Java 的语言(语法、字节码格式、JVM 规范)只有一套,ME / SE / EE 是同一门语言在不同设备与场景下的**平台配置**。可以粗暴理解为:SE 是地基,EE 在地基上盖企业大楼,ME 则是把地基削薄塞进小设备。

| 平台 | 全称 | 面向 | 核心组成 | 典型运行环境 |
| --- | --- | --- | --- | --- |
| Java ME | Micro Edition | 功能机、嵌入式、智能卡 | CLDC/CDC + MIDP + 可选包 | 早期诺基亚/索爱手机 |
| Java SE | Standard Edition | 桌面与服务端通用基础 | JVM + java.base 等核心类库 | 你的电脑、服务器 |
| Java EE | Enterprise Edition | 企业级 Web 与分布式系统 | Servlet/JSP/EJB/JMS/JTA/JPA | Tomcat、WildFly、WebLogic |

> [!warn] 名字变过三次,别被老资料绕晕
> 1999 年叫 **J2ME / J2SE / J2EE**,2006 年去掉数字 2 改成 Java ME / SE / EE;Java EE 在 2017 年由 Oracle 交给 Eclipse 基金会,2019 年起规范改名 **Jakarta EE**。包名也从 javax.* 迁到 jakarta.*,Spring 6 与 Spring Boot 3 已经全面切到 jakarta。

## 包含关系:一张图记住谁包含谁

\`\`\`text
┌──────────────────────────────────────┐
│ Java EE:Servlet/JSP/EJB/JMS/JTA/JPA │
│  ┌────────────────────────────────┐  │
│  │ Java SE:JVM + 核心类库         │  │
│  │  ┌──────────────────────────┐  │  │
│  │  │ Java ME:CLDC + MIDP      │  │  │
│  │  └──────────────────────────┘  │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
\`\`\`

更准确地说,ME 不是 SE 的严格子集:它有自己的虚拟机(KVM)、自己的类库子集和可选包。图中画成嵌套,是为了让你先记住"企业版站在标准版肩膀上,微版是极度裁剪的兄弟"。

### Java SE:你每天都在用的那一层

\`\`\`java
import java.time.LocalDate;
import java.util.List;
public class SeEveryday {
    public static void main(String[] args) {
        List<String> tasks = List.of("写周报", "改 bug", "健身");
        LocalDate day = LocalDate.of(2024, 1, 6);     // 2024-01-06 是周六
        tasks.forEach(t -> System.out.println(day.getDayOfWeek() + " · " + t));
        System.out.println("int 最大值:" + Integer.MAX_VALUE);
    }
}
\`\`\`

\`\`\`output
SATURDAY · 写周报
SATURDAY · 改 bug
SATURDAY · 健身
int 最大值:2147483647
\`\`\`

\`\`\`shell
# SE 的标准类库以模块形式随 JDK 发布
java --list-modules | grep -E "java.sql|java.xml"
\`\`\`

\`\`\`output
java.sql@21.0.2
java.xml@21.0.2
\`\`\`

> [!danger] 输出别照抄,日期会变
> 示例用 LocalDate.of 把日期固定成周六,是为了让输出可复现;真实项目里 LocalDate.now() 取的是运行当天。面试写示例时,宁可固定输入,也别把"今天"硬编码进答案;更不要用双等号比较 LocalDate,要用 equals 或 isEqual。

### Java EE:规范 + 容器,而不是一个 jar

企业版的核心不是"更多类库",而是**一套规范**:Servlet 处理 HTTP,JSP 写模板,EJB 管事务与远程调用,JMS 做消息,JTA 管分布式事务,JPA 做 ORM。规范只定义接口,具体实现由容器提供(Tomcat 只实现 Servlet/JSP 子集,WildFly/WebLogic 才是完整 EE 容器)。

| 规范 | 解决什么 | 今天的替代/演进 |
| --- | --- | --- |
| Servlet | HTTP 请求响应 | Spring MVC 仍跑在 Servlet 之上 |
| JSP | 服务端模板 | Thymeleaf、前后端分离 |
| EJB | 分布式事务、远程调用 | Spring Bean + 声明式事务 |
| JMS | 消息队列 API | Kafka/RocketMQ 客户端并存 |
| JPA | ORM 标准 | Hibernate、Spring Data JPA |
| JTA | 跨库事务 | 本地事务 + 最终一致性 |

\`\`\`xml
<!-- Java EE 时代的 web.xml:一个 Servlet 要在 XML 里登记 -->
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee" version="3.1">
  <servlet>
    <servlet-name>hello</servlet-name><servlet-class>com.example.HelloServlet</servlet-class>
  </servlet>
  <servlet-mapping>
    <servlet-name>hello</servlet-name><url-pattern>/hello</url-pattern>
  </servlet-mapping>
</web-app>
\`\`\`

\`\`\`java
import jakarta.servlet.http.*;
import java.io.IOException;

public class HelloServlet extends HttpServlet {
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("text/plain;charset=UTF-8");
        resp.getWriter().println("hello, jakarta ee");
    }
}
\`\`\`

上面两个文件放进一个 Servlet 容器,访问 /hello 就能看到响应。注意 import 是 **jakarta.servlet**,不是老的 javax.servlet —— 这一个包名的变化,卡住过无数从 Java EE 8 升级到 Jakarta EE 9+ 的项目。

> [!interview] 为什么企业开发当初非要 EE?
> 因为 EE 把企业系统的**横切能力**标准化了:事务、连接池、消息、安全、远程调用,全部由容器托管,开发者只写业务。代价是**重**:EJB 2.x 需要 Home/Remote 接口、部署描述符、容器内测试,一个 Hello World 要写一堆样板代码。Spring 的切入点正是这里 —— 用普通 Java 对象(POJO)+ 依赖注入 + AOP,把"容器能力"从重量级 EJB 里解放出来。

## ME / SE / EE 的典型场景与选择

| 场景 | 该用哪个 | 原因 |
| --- | --- | --- |
| 写一个命令行小工具 | SE | 标准库足够,java 直接运行 |
| 公司内部管理系统 | SE + Spring Boot | Web 能力由框架提供,不必上完整 EE 容器 |
| 银行核心交易系统 | 历史多为 EE 容器 | 需要 JTA、JMS、容器级安全 |
| 功能机小游戏 | ME(MIDP) | 内存与屏幕极小,只能跑裁剪运行时 |
| Android 应用 | Android SDK | 语言相似,运行时与 API 都不是 ME/SE |

> [!pitfall] 三个高频误区与一句补充
> ① **Android 不是 Java ME**:它用 Java 语言写,但编译成 dex 跑在 ART 上,API 是 android.*,没有 MIDP;② **Java SE 不等于只能做桌面**:服务端基础库也属于 SE;③ **Java EE 不是一门语言**:它是一组规范,离开容器就没有"EE 运行时"这回事。
> Java Card 则是更极端的裁剪:跑在 SIM 卡与银行卡芯片里,只保留 Java 的一个子集,应用模型是 Applet。

## 从 EJB 到 Spring:重量级是怎么被替代的

EJB 2.x 的典型写法要求 Bean 实现 SessionBean 接口、提供 ejbCreate/ejbRemove、通过 JNDI 查找远程对象,事务与安全写在部署描述符里。EJB 3.0(2006)吸收了 Spring 的思路,引入注解与 POJO,但此时 Spring 已经靠"轻量、可测试、生态全"拿下了大量项目。

\`\`\`java
// EJB 3 风格:注解 + POJO,已经比 2.x 轻很多
import jakarta.ejb.*;

@Stateless public class EjbTransferService {
    @TransactionAttribute(TransactionAttributeType.REQUIRED)
    public void transfer(long from, long to, long cents) {
        // 容器负责开启/提交事务,方法体只写业务
    }
}
\`\`\`

\`\`\`java
// Spring 风格:普通类 + 注解,不依赖 EE 容器也能跑
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service public class SpringTransferService {
    @Transactional
    public void transfer(long from, long to, long cents) {
        // 同样由代理管事务,但容器可以是 Spring 自己
    }
}
\`\`\`

\`\`\`text
EJB 路线:EE 容器 + 部署描述符/注解 + JNDI 查找 + 容器内测试
Spring 路线:一个 main 方法 + 注解配置即可启动,单测可直接 new
\`\`\`

## 本章小结

- ME / SE / EE 是同一门语言的三套平台配置,不是三门语言。
- SE = JVM + 核心类库;EE = SE + 企业规范集合 + 容器;ME = 针对小设备的裁剪运行时。
- EE 的价值在标准化事务、消息、安全;EJB 2.x 太重,Spring 用 POJO + DI + AOP 接棒。
- Java EE 已改名 Jakarta EE,包名从 javax 迁到 jakarta。
- Android 用 Java 语言但既不是 ME 也不是 SE,运行时是 ART。

## 面试速记

- 一句话区别:**ME 进设备,SE 打基础,EE 做企业**。
- ME 的关键词:CLDC/CDC、MIDP、MIDlet、RecordStore、碎片化。
- EE 的关键词:Servlet/JSP/EJB/JMS/JTA/JPA、规范、容器。
- EJB 2.x 重在高样板与容器绑定;Spring 胜在 POJO、可测试、生态。
- Jakarta EE 9 起包名 jakarta.*,Spring Boot 3 同步切换。
`
      },
      {
        id: 'ch03',
        title: 'Java ME 的覆灭:一个时代的技术考古',
        minutes: 100,
        points: ['MIDlet 生命周期', 'Canvas 绘制', 'RecordStore', '碎片化'],
        content: `
> [!info] 本章导读 · 你当年玩的贪吃蛇,就是 Java 写的
> 诺基亚键盘机里的贪吃蛇、索爱上的赛车、预装柜里的泡泡龙,很多都是 J2ME 应用。它曾经是"跨品牌手机通用"的唯一答案,却在智能机到来后的几年里几乎彻底消失。
> - 读完本章你将能:说清 CLDC / MIDP / MIDlet 的关系
> - 写出 MIDlet 的生命周期骨架与 Canvas 游戏循环
> - 从生态、硬件、开发体验三个角度解释 J2ME 为什么覆灭

> [!tip] 日常电脑现场 · 抽屉里的旧手机
> 清理抽屉翻出一部按键机,开机画面还是熟悉的运营商 Logo,游戏菜单里躺着"贪吃蛇 II"。它不需要登录、不用更新、没有内购,插上电池就能玩 —— 那是 J2ME 时代最典型的产品形态。

## J2ME 的架构:配置 + 简表 + 可选包

J2ME 不是"一个 Java",而是一套分层裁剪方案:

| 层 | 作用 | 代表 |
| --- | --- | --- |
| Configuration | 规定虚拟机能力与最小类库 | CLDC(低端)、CDC(高端) |
| Profile | 规定某一类设备的 API | MIDP(手机)、Foundation/Personal(机顶盒) |

功能机最常见组合是 **CLDC 1.1 + MIDP 2.0**:CLDC 定义了精简虚拟机 KVM 和 java.lang/java.util 的极小子集,MIDP 补上界面(Display/Canvas)、本地存储(RecordStore)、HTTP 连接和 MIDlet 生命周期。

\`\`\`text
应用(MIDlet) → MIDP 2.0(UI / RMS / HTTP / 生命周期)
                    ↓
             CLDC 1.1(KVM + 精简核心类库)
                    ↓
             厂商移植层 → 功能机硬件
\`\`\`

> [!warn] J2ME 代码不能直接用 JDK 17 编译
> javax.microedition.* 这套 API 不在 JDK 里,必须用 WTK(无线工具包)、NetBeans Mobility 或厂商 SDK 加 MIDP 库。今天你可以在 IDE 里读它、在模拟器里跑它,但别指望 javac 17 直接过。

## MIDlet 生命周期:三个方法撑起一个应用

\`\`\`java
import javax.microedition.midlet.*;
import javax.microedition.lcdui.*;

public class HelloMidlet extends MIDlet {
    private Display display; private Form form;
    protected void startApp() throws MIDletStateChangeException {
        if (display == null) {
            display = Display.getDisplay(this);
            form = new Form("Hello J2ME");
            form.append("按挂机键暂停,长按电源键退出");
        }
        display.setCurrent(form);
    }
    protected void pauseApp() {
        // 来电或切到后台:停止定时器、释放音频
    }
    protected void destroyApp(boolean unconditional) throws MIDletStateChangeException {
        // 保存最高分、关闭连接
    }
}
\`\`\`

三个方法对应应用的前台、后台、销毁。注意 **destroyApp 的参数**:true 表示无条件销毁,false 表示应用可以抛异常拒绝退出;当年很多游戏用这个机制弹"确定退出吗"。真实设备上来电会触发 pauseApp,退出则走 destroyApp。

## Canvas 与游戏循环:每一帧都是自己画的

MIDP 没有布局引擎式的游戏框架,只有一块 Canvas 和一支 Graphics 笔。游戏的核心是一个"死循环":读按键 → 更新状态 → 重绘 → 睡一会儿。

\`\`\`java
import javax.microedition.lcdui.*;

public class SnakeCanvas extends Canvas implements Runnable {
    private int headX = 4, headY = 4, dirX = 1, dirY = 0;
    private volatile boolean running = true;
    public void start() { new Thread(this).start(); }
    public void run() {
        while (running) {
            headX = (headX + dirX + 20) % 20; headY = (headY + dirY + 20) % 20;   // 穿墙
            repaint();
            try { Thread.sleep(120); }          // 约 8 帧/秒
            catch (InterruptedException e) { running = false; }
        }
    }
    protected void paint(Graphics g) {
        g.setColor(0x000000); g.fillRect(0, 0, getWidth(), getHeight());
        g.setColor(0x00FF00);
        int cell = getWidth() / 20;
        g.fillRect(headX * cell, headY * cell, cell - 1, cell - 1);
    }
    protected void keyPressed(int keyCode) {
        int a = getGameAction(keyCode);          // 厂商键码归一化
        if (a == UP && dirY == 0)    { dirX = 0;  dirY = -1; }
        if (a == DOWN && dirY == 0)  { dirX = 0;  dirY = 1;  }
        if (a == LEFT && dirX == 0)  { dirX = -1; dirY = 0;  }
        if (a == RIGHT && dirX == 0) { dirX = 1;  dirY = 0;  }
    }
}
\`\`\`

这段代码就是当年无数贪吃蛇、推箱子、飞机大战的共同骨架。真正的游戏还要加:蛇身队列、食物碰撞、分数、加速、音效、暂停菜单、存档。

> [!pitfall] 在后台线程里直接改界面
> MIDP 的 UI 操作必须在**事件线程**里执行,后台线程只能调用 repaint() 请求重绘。很多初学者在游戏线程里直接改 Form 内容,结果在不同机型上表现不一致 —— 碎片化从第一行代码就开始了。

## RecordStore:没有数据库,也要存最高分

MIDP 提供的本地存储叫 **RecordStore**,一个按记录存字节数组的小型存储,容量通常只有几十 KB。

\`\`\`java
import javax.microedition.rms.RecordStore;
import java.io.*;

public class HighScoreStore {
    private static final String STORE = "snake_scores";
    public static void save(int score) throws Exception {
        RecordStore rs = RecordStore.openRecordStore(STORE, true);
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        new DataOutputStream(bos).writeInt(score);
        byte[] data = bos.toByteArray();
        if (rs.getNumRecords() == 0) rs.addRecord(data, 0, data.length);
        else rs.setRecord(1, data, 0, data.length);
        rs.closeRecordStore();
    }
}
\`\`\`

一条最高分只占 4 个字节,但写入的格式值得看一眼:

\`\`\`java
import java.io.*;

public class RecordBytes {
    public static void main(String[] args) throws Exception {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        new DataOutputStream(bos).writeInt(980);
        byte[] data = bos.toByteArray();
        System.out.println("bytes = " + data.length);
        for (byte b : data) System.out.printf("%02X ", b);
        System.out.println();
    }
}
\`\`\`

\`\`\`output
bytes = 4
00 00 03 D4
\`\`\`

980 的十六进制是 0x3D4,补足四个字节就是 00 00 03 D4。功能机时代的内存账,就是这样一字节一字节抠出来的。

## 为什么辉煌:一个二进制,跑遍所有柜台

- **跨品牌通用**:MIDlet 打成 .jar 与 .jad 描述文件,只要目标机支持同一档 CLDC/MIDP 与屏幕尺寸,同一份包就能装进诺基亚、索爱、摩托罗拉、三星。开发者面对的是一套 Java API,而不是每个品牌各一套私有 SDK —— 这是当年唯一可行的"一次开发、多机分发"。
- **运营商预装渠道**:功能机没有开放应用商店,入口在"移动梦网"这类运营商门户与出厂预装。CP/SP 把游戏放进菜单,用户点一下就走短信代扣,下载量与收入直接由运营商账单结算,渠道话语权极大。
- **分成模式**:典型是运营商先抽三到五成通道费,SP 再与 CP 分剩下的钱;一款预装游戏靠"下载一次 2 元"就能月入百万。也正因如此,内置扣费点、误点订阅成了当年最受诟病的灰色地带。
- **门槛低**:一部电脑、一套 WTK、几十 KB 素材就能做游戏,个人开发者也能上架,这又反过来喂大了内容供给。

## 为什么覆灭:不是 Java 输了,是平台输了

| 冲击 | 机制 | 结果 |
| --- | --- | --- |
| 智能机与触摸屏 | 完整 SDK、GPU、多点触控 | 功能机游戏体验被降维打击 |
| 应用商店 | 发布、支付、更新一体化 | 运营商门户模式失效 |
| 碎片化 | 屏幕、键码、堆大小、JSR 各不相同 | 一套代码要适配几百款机型 |
| 塞班崩塌 | 诺基亚生态份额快速下滑 | 预装渠道连根消失 |

iPhone 在 2007 年重新定义了手机交互,App Store 在 2008 年重新定义了分发;Android 同年入场,用完整 SDK 和开放生态接走了开发者。J2ME 的对手不是另一门语言,而是"能装几万个应用、能收钱、能持续更新"的新平台。

> [!best] 技术考古的真正结论
> 平台型技术的生死,取决于**生态与开发体验**,不是语言本身。J2ME 的语言是 Java,语法并不差;它输在工具链割裂、适配成本高、分发被卡、硬件天花板太低。今天选技术栈也一样:先看生态和分发,再看语法优雅。

## 本章小结

- J2ME = CLDC/CDC + MIDP + 可选包,是极度裁剪的 Java 运行时。
- MIDlet 三个生命周期方法:startApp、pauseApp、destroyApp。
- Canvas 逐帧绘制 + 自建线程循环,是当年 2D 游戏的标准骨架。
- RecordStore 用字节数组存小数据,容量以 KB 计。

## 面试速记

- J2ME 关键词:**CLDC、MIDP、MIDlet、Canvas、RecordStore、KVM**。
- 生命周期:startApp 进前台,pauseApp 进后台,destroyApp 销毁;参数 true 为无条件。
- 游戏循环:开线程 → 更新状态 → repaint → sleep 控帧率;UI 更新回事件线程。
- 失败原因从"硬件、分发、碎片化、生态"四点答,别只说"被安卓取代"。
- 一句话升华:**语言决定下限,生态决定生死**。
`
      },
      {
        id: 'ch04',
        title: '功能机 Java 游戏 vs 现代 Java 游戏',
        minutes: 90,
        points: ['J2ME 游戏', 'Minecraft', 'Netty', '游戏服务端'],
        content: `
> [!info] 本章导读 · 同样是 Java 游戏,为什么差了一个宇宙?
> 功能机上的 Java 游戏以 KB 计,画面是几十个像素块;今天的 Minecraft Java 版以 GB 计,模组能改写整个世界规则。两者共享"Java"这个词,却站在完全不同的硬件、运行时与分发体系上。
> - 读完本章你将能:从包体、图形、内存、网络四个维度对比两代 Java 游戏
> - 说出 Minecraft Java 版为什么选 Java、为什么模组生态如此繁荣
> - 解释游戏服务端为什么长期偏爱 Java + Netty

> [!tip] 日常电脑现场 · 启动器与"分配内存"
> 打开 Minecraft 启动器,设置里有一项"分配内存",还会让你选 Java 版本。进游戏后按 F3,左上角滚动着帧率、区块与内存占用,这些普通玩家不看的数字正是 JVM 游戏运行时的仪表盘。

## 功能机时代:几百 KB 里的完整世界

| 约束 | 典型量级 | 开发者的应对 |
| --- | --- | --- |
| 包体 | 几十 KB 到 1 MB | 混淆、压缩图片、砍关卡 |
| 堆内存 | 几百 KB 到 2 MB | 对象池、复用数组、避免 String 拼接 |
| 屏幕 | 128×160 到 240×320 | 一套逻辑多套贴图,按机型适配 |
| CPU | 单核几十 MHz | 定点数、查表、减少浮点 |
| 网络 | GPRS/EDGE 按流量计费 | 单机为主,排行榜用短连接 |

当年的"3D 游戏"多数是**伪 3D**:用预渲染序列帧或等距投影制造纵深感。真正的多边形渲染在功能机上要么没有,要么只有几十个三角形。

\`\`\`properties
# 典型的 JAD 描述文件:应用元信息 + 包大小 + 权限
MIDlet-Name: Snake II
MIDlet-Version: 1.0.3
MIDlet-Vendor: Example Studio
MIDlet-Jar-URL: Snake.jar
MIDlet-Jar-Size: 49152
MIDlet-1: Snake, /icon.png, com.example.SnakeMIDlet
MicroEdition-Configuration: CLDC-1.1
MicroEdition-Profile: MIDP-2.0
\`\`\`

> [!warn] MIDlet-Jar-Size 写错,安装直接失败
> 这个字段是**字节数**,不是 KB;很多运营商还会限制单个 jar 的上限(常见 200 KB 到 1 MB),超过就拒装。当年发行一款游戏,先要和几十家运营商的门户谈包体、签名与分成。

### 逐帧绘制:没有引擎,只有画笔

\`\`\`java
// 伪 3D 赛道:按行缩放贴图,制造远近感
protected void paint(Graphics g) {
    int horizon = getHeight() / 3;
    for (int y = horizon; y < getHeight(); y++) {
        int depth = y - horizon + 1;
        int roadWidth = depth * 6;                 // 越近越宽
        int centerX = getWidth() / 2 + curveOffset(y);
        g.setColor(0x333333);
        g.fillRect(centerX - roadWidth / 2, y, roadWidth, 1);
    }
    g.setColor(0xFFFFFF);
    g.drawString("SCORE " + score, 4, 4, Graphics.TOP | Graphics.LEFT);
}
\`\`\`

\`\`\`java
// 按键处理:厂商键码不同,必须用 getGameAction 归一化
protected void keyPressed(int keyCode) {
    switch (getGameAction(keyCode)) {
        case LEFT:  steer = -1; break;
        case RIGHT: steer = 1;  break;
        case FIRE:  boost();    break;
        default:    break;
    }
}
\`\`\`

\`\`\`java
import java.io.ByteArrayOutputStream;
import java.io.DataOutputStream;
public class SizeBudget {
    public static void main(String[] args) throws Exception {
        ByteArrayOutputStream bos = new ByteArrayOutputStream(); DataOutputStream out = new DataOutputStream(bos);
        out.writeUTF("SNAKE2");      // 2 字节长度 + 6 字节内容
        out.writeInt(49152);         // jar 的字节数
        System.out.println("header bytes = " + bos.size());
        System.out.println("jar KB = " + 49152 / 1024);
    }
}
\`\`\`

\`\`\`output
header bytes = 12
jar KB = 48
\`\`\`

## 现代 Java 游戏:从 Minecraft 到服务端

Minecraft Java 版 2009 年由 Mojang 发布,客户端用 Java + LWJGL(OpenGL 绑定)渲染,世界由方块与区块(chunk)组成,模组通过 Forge/Fabric 等加载器改写游戏逻辑。它的成功证明了一件事:**Java 的性能足够撑起一个沙盒世界,而 JVM 的可移植性让同一份代码跑遍三大桌面系统**。

新版 Minecraft 对 JDK 版本有明确要求(近年版本要求 Java 21),服务器端使用 Netty 处理连接,主循环固定 20 TPS(每 tick 50 毫秒),区块加载、实体 AI、红石更新都在这个节拍里完成。

\`\`\`java
// 游戏主循环的最小骨架:固定节拍,逻辑与渲染解耦
public class TickLoop {
    private static final int TPS = 20;
    private static final long TICK_MS = 1000L / TPS;

    public static void main(String[] args) throws InterruptedException {
        long next = System.currentTimeMillis();
        for (long tick = 0; tick < 5; tick++) {
            next += TICK_MS;
            update(tick);
            long sleep = next - System.currentTimeMillis();
            if (sleep > 0) Thread.sleep(sleep);
        }
    }

    static void update(long tick) {
        // 打印的是计划时间,不是真实时钟
        System.out.println("tick " + tick + " @ " + (tick * TICK_MS) + "ms");
    }
}
\`\`\`

\`\`\`output
tick 0 @ 0ms
tick 1 @ 50ms
tick 2 @ 100ms
tick 3 @ 150ms
tick 4 @ 200ms
\`\`\`

\`\`\`text
客户端                          服务端
┌──────────────┐   TCP/Netty   ┌────────────────────┐
│ 渲染线程      │◄────────────►│ 连接管理(EventLoop)│
│ 区块网格构建  │  自定义协议   │ 主循环 20 TPS       │
│ 输入与预测    │               │ 世界状态/实体 AI    │
└──────────────┘               │ 区块加载与持久化    │
                               └────────────────────┘
\`\`\`

## 为什么游戏服务器偏爱 Java

| 需求 | Java 的对应能力 | 备注 |
| --- | --- | --- |
| 大量长连接 | Netty 事件驱动 + 零拷贝 | 网关、战斗服的标准底座 |
| 跨平台部署 | JVM 一份代码跑 Linux/Windows | 运维不用维护多套二进制 |
| 长时间运行 | JIT 预热后性能稳定 | 越跑越快的特性适合常驻服务 |
| 可观测性 | JFR、JMX、heap dump、async-profiler | 定位卡顿与内存泄漏 |
| 团队效率 | 成熟框架、人才存量 | 招人和交接成本低 |
| 内存管理 | G1/ZGC 可调 | 大堆低停顿场景可用 ZGC |

但也要说清边界:极致帧同步、物理计算、渲染管线仍常用 C++;轻量网关也有人选 Go。Java 的主场是**网关、匹配、世界管理、战斗逻辑、运营后台**这类"连接多、逻辑复杂、团队大"的场景。国内不少游戏团队的后端以 Java/Netty 为主,但这属于工程选择,不是唯一答案。

> [!best] 服务端调优的三条硬规矩
> ① 启动参数把 -Xms 与 -Xmx 设成一样,避免堆反复伸缩;② 优先 G1,大堆(几十 GB)再评估 ZGC,别用默认参数硬扛;③ 用 JFR 或 async-profiler 找分配热点,先减少临时对象,再谈对象池 —— 现代 GC 下滥用对象池往往更慢。

## 两代 Java 游戏的正面对比

| 维度 | 功能机 J2ME 游戏 | 现代 Java 游戏 |
| --- | --- | --- |
| 运行环境 | CLDC/KVM + MIDP | JVM 17/21 + LWJGL/OpenGL |
| 图形 | Canvas 逐帧、精灵图 | 着色器、区块网格、GPU 加速 |
| 网络 | HTTP 短连接、短信计费 | Netty TCP/UDP 长连接 |
| 内存 | 几百 KB,手工复用 | 数 GB,GC 托管 |
| 包体 | 几十 KB 到 1 MB | 数百 MB 到数 GB |
| 分发 | 预装、运营商门户 | 启动器、商店、自建服务器 |
| 开发生态 | 厂商 SDK,高度碎片化 | Gradle、Forge/Fabric、跨平台 |

> [!interview] 为什么 Minecraft 的模组生态这么强?
> 因为 JVM 的**字节码**是可在加载期改写的:Mixin 等工具在类加载时把模组代码织入原版方法,Forge/Fabric 提供事件总线与注册表,模组不需要改源码就能扩展方块、物品、维度。再加上 Java 生态成熟的构建工具与社区,形成了"官方不支持的玩法,社区自己长出来"的正循环。

## 本章小结

- 功能机游戏的核心约束是包体、内存、屏幕与按键,开发靠抠字节与逐帧绘制。
- 现代 Java 游戏的核心是 JVM 性能、OpenGL/LWJGL 渲染、Netty 网络与模组生态。
- Minecraft 证明了 Java 能撑起大型沙盒,模组繁荣来自字节码可改写与社区工具链。
- 游戏服务端偏爱 Java 的理由:Netty、跨平台、可观测、生态与人才,而不是"Java 最快"。
- 技术选型看场景:网关与世界管理用 Java,极致渲染与物理仍交给 C++。

## 面试速记

- 功能机游戏四约束:**包体小、内存小、屏幕小、按键操作**。
- J2ME 游戏骨架:MIDlet + Canvas + 自建线程循环 + RecordStore。
- Minecraft 关键词:**LWJGL/OpenGL、区块、20 TPS、Netty、Forge/Fabric、Java 21**。
- Java 服务端优势:Netty 长连接、JVM 调优、JFR 可观测、生态与团队。
- 回答"Java 适合做游戏吗":分客户端与服务端答,别一刀切。
`
      },
      {
        id: 'ch05',
        title: 'GUI 与游戏开发初步:Swing / JavaFX(点到为止)',
        minutes: 105,
        points: ['Swing', 'JavaFX', '游戏循环', '桌面开发'],
        content: `
> [!info] 本章导读 · 用 Java 写个窗口程序,为什么现在几乎没人这么干?
> 大学课程里的 Swing 计算器、企业内网里的 JavaFX 客户端,确实存在;但你日常用的软件,桌面端几乎被 Web 技术、Electron 和原生应用瓜分。这一章不教你成为桌面开发专家,只把"窗口、事件、重绘"这三件事跑通。
> - 读完本章你将能:用 Swing 写一个能算数的计算器
> - 用 JavaFX 的 Stage/Scene/控件搭一个小窗
> - 理解游戏循环为什么需要 Timer 和重绘

> [!tip] 日常电脑现场 · 公司内网的"老客户端"
> 财务、仓储、医院里常有这样的软件:界面朴素、只在内网用、安装包几百 MB,启动时还要检查 Java 版本。它们大多不是不能改成网页,而是"能用就不动"——这正是桌面 Java 的真实生态位。

## Swing:JDK 自带的"老家具"

Swing 是 JDK 自带的 GUI 工具包(AWT 之上),核心四件套:**JFrame 窗口、JPanel 面板、布局管理器、事件监听器**。布局管理器记住三个就够:BorderLayout 管五区、GridLayout 管等分网格、FlowLayout 管流式排列。

> [!danger] Swing 不是线程安全的
> Swing 组件的创建与更新通常都应在**事件分发线程(EDT)** 里做。主线程直接 new JFrame 并 setVisible 可能暂时正常，但不能依赖组件自动检查来保证线程安全。标准写法是 SwingUtilities.invokeLater；后台计算用 SwingWorker，再将更新交回 EDT。

### 一个能用的计算器

点击下面代码旁的“模拟窗口”，就能按键计算并观察事件日志。倒计时、小球和前面功能机 Canvas 示例也有对应窗口。它们是按本例逻辑制作的网页教学模拟；真实 Swing / JavaFX 仍使用对应 Java 运行环境。

\`\`\`java
import javax.swing.*;
import java.awt.*;

public class Calculator extends JFrame {
    private final JTextField screen = new JTextField("0");
    private double current; private String op = ""; private boolean fresh = true;

    public Calculator() {
        super("计算器");
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        setLayout(new BorderLayout(6, 6));
        screen.setHorizontalAlignment(JTextField.RIGHT);
        screen.setEditable(false); screen.setFont(new Font("Consolas", Font.BOLD, 24));
        add(screen, BorderLayout.NORTH);
        JPanel pad = new JPanel(new GridLayout(4, 4, 4, 4));
        for (String key : "7 8 9 / 4 5 6 * 1 2 3 - 0 . = +".split(" ")) {
            JButton b = new JButton(key);
            b.addActionListener(e -> press(key));
            pad.add(b);
        }
        add(pad, BorderLayout.CENTER);
        setSize(260, 320); setLocationRelativeTo(null);
    }
    private void press(String key) {
        if ("0123456789.".contains(key)) {
            if (fresh) { screen.setText(key.equals(".") ? "0." : key); fresh = false; }
            else if (!key.equals(".") || !screen.getText().contains("."))
                screen.setText(screen.getText() + key);
        } else if (key.equals("=")) {
            double v = Double.parseDouble(screen.getText());
            double r = switch (op) {
                case "+" -> current + v;
                case "-" -> current - v;
                case "*" -> current * v;
                case "/" -> v == 0 ? Double.NaN : current / v;
                default -> v;
            };
            System.out.println(current + " " + op + " " + v + " = " + r);
            screen.setText(String.valueOf(r)); op = ""; fresh = true;
        } else {
            current = Double.parseDouble(screen.getText());
            op = key;
            fresh = true;
        }
    }
    public static void main(String[] args) { SwingUtilities.invokeLater(() -> new Calculator().setVisible(true)); }
}
\`\`\`

运行效果:标题为"计算器"的 260×320 窗口,顶部是一条右对齐的大号显示屏,下面 4×4 网格排列 0-9、小数点、四则运算符与等号。依次点 1、2、+、7、=,显示屏变成 19.0,控制台同步打印:

\`\`\`output
12.0 + 7.0 = 19.0
19.0 * 3.0 = 57.0
57.0 / 4.0 = 14.25
\`\`\`

### JavaFX:更现代的替代品

JavaFX 从 JDK 11 起不再随 JDK 发布,需要单独引入 OpenJFX 依赖。它的模型是 **Stage(窗口)→ Scene(场景)→ 节点树**,界面可以用代码写,也可以用 FXML + CSS。

| 对比项 | Swing | JavaFX |
| --- | --- | --- |
| 随 JDK 发布 | 是 | 否(JDK 11 起独立) |
| 渲染 | 轻量级组件,CPU 为主 | 场景图,支持硬件加速 |
| 样式 | LookAndFeel / UIManager | CSS |
| 界面描述 | 纯 Java 代码 | Java 代码 / FXML |

\`\`\`java
import javafx.animation.*;
import javafx.application.Application;
import javafx.scene.Scene;
import javafx.scene.control.Label;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;
import javafx.util.Duration;

public class CountdownApp extends Application {
    private int remaining = 10;
    public void start(Stage stage) {
        Label label = new Label("倒计时:10");
        label.setStyle("-fx-font-size: 28px; -fx-text-fill: #eab308;");
        VBox root = new VBox(12, label);
        root.setStyle("-fx-padding: 24px; -fx-alignment: center;");
        Timeline timer = new Timeline(new KeyFrame(Duration.seconds(1), e -> {
            remaining--;
            label.setText(remaining > 0 ? "倒计时:" + remaining : "时间到");
        }));
        timer.setCycleCount(10); timer.play();
        stage.setTitle("JavaFX 倒计时"); stage.setScene(new Scene(root, 280, 160));
        stage.show();
    }
    public static void main(String[] args) { launch(args); }
}
\`\`\`

\`\`\`text
小窗标题"JavaFX 倒计时",居中黄色大字每秒变化:10 → 9 → ... → 1 → 时间到
\`\`\`

## 极简游戏循环:Timer + 重绘

Swing 的 javax.swing.Timer 每 16 毫秒触发一次(约 60 FPS),在事件线程里更新坐标并 repaint。JavaFX 用 AnimationTimer,回调参数是纳秒时间戳。核心思想都一样:**固定节拍更新状态,再把状态画出来**。

\`\`\`java
import javax.swing.*;
import java.awt.*;

public class BouncingBall extends JPanel {
    private int x = 170, y = 20, vx = 4, vy = 3;
    public BouncingBall() {
        new Timer(16, e -> {
            x += vx; y += vy;
            if (x <= 0 || x + 20 >= getWidth()) vx = -vx;
            if (y <= 0 || y + 20 >= getHeight()) vy = -vy;
            repaint();
        }).start();
    }
    protected void paintComponent(Graphics g) {
        super.paintComponent(g); g.setColor(new Color(0xEA, 0xB3, 0x08));
        g.fillOval(x, y, 20, 20);
    }
    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            JFrame f = new JFrame("弹跳小球");
            f.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE); f.add(new BouncingBall());
            f.setSize(400, 300); f.setVisible(true);
        });
    }
}
\`\`\`

## 为什么桌面 GUI 不是 Java 主流

| 场景 | 更常见的选择 | 原因 |
| --- | --- | --- |
| 互联网产品 | Web / 小程序 / 移动端 | 免安装、迭代快、跨设备 |
| 跨平台桌面工具 | Electron / Tauri | 前端生态、界面灵活 |
| 企业内部工具 | Swing / JavaFX / Web | 团队会 Java,能复用后端代码 |

- **分发与启动**:JRE + JavaFX 运行时动辄上百 MB,而网页零安装;JVM 启动加类加载,冷启动也慢。
- **生态与定位**:桌面 Java 的轮子越来越少,但仍适合 IDE、交易终端、工业控制、内网管理端这类看重稳定与复用的场景。

> [!info] 点到为止声明
> 面试几乎不问 Swing/JavaFX 的 API 细节,最多问"接触过吗、知道 EDT 吗、Swing 和 JavaFX 区别"。本章的目标是让你**看得懂、改得动、说得出**,不要求背布局管理器常量。真要做桌面产品,优先评估 Web 技术。

## 本章小结

- Swing 四件套:JFrame、JPanel、布局管理器、事件监听;界面更新走 EDT。
- 计算器示例覆盖了输入拼接、运算符暂存、等号求值与控制台验证。
- JavaFX 用 Stage/Scene/节点树 + CSS/FXML,JDK 11 起需单独引入 OpenJFX。
- 游戏循环 = 固定节拍更新状态 + repaint;桌面 Java 适合内部工具与教学。

## 面试速记

- Swing 关键词:JFrame、JPanel、BorderLayout/GridLayout、ActionListener、EDT。
- JavaFX 关键词:Stage、Scene、FXML、CSS、Timeline、AnimationTimer。
- 界面更新必须回 EDT:SwingUtilities.invokeLater 或 SwingWorker。
- 游戏循环三件事:更新状态、重绘、控制帧率;别在循环里阻塞 EDT。
`
      }
    ],
    interview: [
      {
        q: 'Java 的版本历史与 LTS 节奏,面试该怎么答?',
        a: '按三次跃迁答:① 1995 年 Java 1.0 确立字节码 + JVM 的跨平台模型;② 2004 年 Java 5 带来泛型、注解、枚举与并发包;③ 2014 年 Java 8 引入 Lambda、Stream,之后 Java 9 模块化,11/17/21 成为 LTS。2017 年起每半年一个特性版,Java 11 起每两年一个 LTS;企业优先 LTS,新项目用 21。'
      },
      {
        q: 'Java ME、Java SE、Java EE 有什么区别?',
        a: '① SE 是标准版,JVM + java.lang/java.util 等核心类库,是桌面与服务端的基础;② EE 是企业版,在 SE 上增加 Servlet、JSP、EJB、JMS、JTA、JPA 等规范,现改名 Jakarta EE;③ ME 是微版,面向功能机,典型组合 CLDC + MIDP,有精简虚拟机和 MIDlet 模型。SE 打基础,EE 做企业,ME 进设备。'
      },
      {
        q: 'J2ME 当年那么火,为什么会消失?',
        a: '不是语言输了,是平台体验输了。① 智能机带来完整 SDK、触摸屏、GPU 与应用商店,功能机游戏被降维打击;② 碎片化严重,屏幕、堆内存、键码、JSR 各不相同,一套代码要适配几百款机型;③ 分发被运营商门户把控,签名、包体、分成层层设卡,而应用商店把发布变成几分钟的事;④ 诺基亚塞班生态崩塌,预装渠道消失。结论:平台生死取决于生态与开发体验,语言只是载体。'
      },
      {
        q: '功能机上的 Java 游戏是怎么开发的?',
        a: 'CLDC 1.1 + MIDP 2.0 是典型栈:① 入口继承 MIDlet,实现 startApp、pauseApp、destroyApp;② 画面继承 Canvas,在 paint 里用 Graphics 逐帧绘制,按键用 getGameAction 归一化;③ 游戏循环自建线程,更新后 repaint,用 sleep 控帧率;④ 最高分用 RecordStore 存字节数组。'
      },
      {
        q: 'Minecraft 为什么用 Java 写?',
        a: '① 跨平台:一套代码通过 JVM 跑在 Windows、macOS、Linux,小团队无力维护三套原生客户端;② 图形栈成熟:LWJGL 把 OpenGL 封装成 Java API,足够渲染方块世界;③ 生产力:成熟的集合、网络类库让个人开发者快速堆出原型;④ 模组生态:JVM 字节码便于 Forge/Fabric 在加载期转换注入,社区能改写游戏逻辑。代价是性能上限不如 C++,要靠优化兜底。'
      },
      {
        q: 'Swing 和 JavaFX 怎么选?',
        a: '① Swing 随 JDK 发布、资料多、老项目多,适合内部工具与教学,但默认外观陈旧、动画与多媒体弱;② JavaFX 是后续富客户端方案,场景图 + CSS + FXML,内置 Timeline 与硬件加速,界面更现代,但 JDK 11 起要单独引入 OpenJFX;③ 新项目优先 JavaFX 或 Web,老系统继续 Swing;面试说清两者定位与 EDT、Stage/Scene 即可。'
      },
      {
        q: 'Java 适合做游戏服务器吗?',
        a: '适合中后台与网关,不适合极致性能的客户端渲染。① Netty 提供成熟的事件驱动网络层,支撑长连接、粘包拆包与海量连接;② JVM 的 JIT、G1/ZGC 与 JFR 让常驻服务可观测;③ 生态完整,序列化、数据库、消息队列都有现成轮子;④ 固定 tick、控制对象分配、避免 Full GC 是调优重点。帧同步与物理计算仍常用 C++,Java 多承担登录、网关与世界管理。'
      },
      {
        q: 'Java 9 的 JPMS 模块化解决了什么问题?为什么很多项目没用起来?',
        a: '① 目标是强封装与可裁剪:module-info.java 用 requires、exports、opens 声明依赖与开放包,jlink 可裁剪运行时;② 强封装让 internal API 不再随便反射;③ 落地难在生态:大量库依赖 classpath 与反射,拆分包与框架扫描常报错;④ 多数业务仍跑 classpath,模块化多用于 JDK 裁剪。关键词:强封装、可裁剪、迁移成本高。'
      },
      {
        q: '你觉得 Java 未来的趋势是什么?',
        a: '三条主线:① 语言层向数据导向与模式匹配演进,记录类、密封类、switch 模式匹配逐步补齐;② 运行时围绕云原生优化,虚拟线程降低高并发成本,GraalVM 原生镜像与 Leyden 缩短启动、降低内存;③ Panama 让 Java 更顺畅调用本地库。Spring Boot 3 以 Jakarta EE 9+ 与 Java 17 为底线,新项目向 21/25 LTS 集中。'
      },
      {
        q: 'Android 和 Java 是什么关系?',
        a: '① 语言层:Android 主要用 Java 语言(现在 Kotlin 优先);② 运行时:早期 Dalvik 执行 dex,Android 5.0 起换 ART,不是标准 JVM;③ API 层:提供 android.* 与部分 java.* 实现,但没有 MIDP,也不是完整 SE;④ 工具链:编译后经 D8/R8 转 dex,新语法靠 desugaring 下放。'
      }
    ]
  };
})();
