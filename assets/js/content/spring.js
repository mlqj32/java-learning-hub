/* ═══════════════════════════════════════════════════════════
   模块:Spring 全家桶(IoC / AOP / 事务 / MVC / Boot / MyBatis · 13 章)
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.CONTENT = window.CONTENT || {};

  window.CONTENT.spring = {
    id: 'spring',
    title: 'Spring 全家桶',
    en: 'SPRING ECOSYSTEM',
    icon: 'leaf',
    color: '#34d399',
    tagline: '从 Bean 到自动配置,吃透框架源码',
    description: '从为什么需要框架讲起:先看清手写 Servlet 的苦,再进入 IoC 容器与 Bean 生命周期、三级缓存、AOP 动态代理、事务传播,直到 SpringMVC 执行流程与 SpringBoot 自动配置 —— 一条线吃透 Spring 全家桶。每章都配背诵版结论、可验证代码与高频追问;SpringBoot 启动流程、Starter 手写、配置日志与部署监控、3.x 升级也一并收进弹药库,MyBatis 核心原理与整合同样不落。',
    minutes: '≈ 32 小时',
    chapters: [
      /* ─────────────────────────────────────────── */
      {
        id: 'ch00',
        title: '为什么需要 Spring:从 Servlet 的苦日子说起',
        minutes: 40,
        points: ['Servlet 痛点', 'IoC 与 AOP', '全家桶地图', '第一个 Boot 应用'],
        content: `
> [!info] 本章导读 · 先讲个故事
> 2005 年,一个后端新人接到需求:给公司做一个员工管理页。他写了 6 个 Servlet —— 列表一个、详情一个、新增一个、修改一个、删除一个、导出又一个;每个类里都自己 new 一次 DAO,每个写方法都套一遍 try-catch 加 commit/rollback。产品经理说"详情页加个访问日志",他只好把日志代码复制进 6 个类:改一处,动全身。
> 那不是他笨,而是"没有框架"的年代,每个后端都在过这种日子:对象自己造、事务自己管、横切逻辑自己抄,想测一个方法还得先启动 Tomcat。**Spring 就是在这堆苦活里长出来的。**
> - 读完本章你将能:说清框架到底替我们解决了哪四件事
> - 亲手跑起一个最小的 SpringBoot 应用
> - 看懂一次请求在 Spring 里经过哪些关卡

> [!tip] 日常电脑现场 · 全屋定制的秘密
> 装修时自己跑建材市场,瓷砖、水泥、五金件分头买,尺寸不对还得来回换货;找了全屋定制,量完尺寸从设计到安装一条线全包。写后端也一样:没框架时连接、事务、日志全靠自己拼,有了 Spring 这些活它替你安排。

## 先看看没有框架的日子

一个最朴素的 Servlet,查询员工列表:

\`\`\`java EmployeeListServlet.java
// 省略 javax.servlet 与项目内 DAO 的 import
public class EmployeeListServlet extends HttpServlet {

    // 痛点一:依赖自己 new —— 换实现、加缓存,都得改这里并重新编译
    private EmployeeDao dao = new EmployeeDaoImpl();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        // 痛点二:横切逻辑 —— 每个 Servlet 的每个方法都要抄一遍日志
        System.out.println("[LOG] " + req.getMethod() + " " + req.getRequestURI());

        Connection conn = null;
        try {
            // 痛点三:事务模板 —— 获取、关自动提交、提交、回滚全靠人肉
            conn = DbUtil.getConnection();
            conn.setAutoCommit(false);
            List<Employee> list = dao.findAll(conn);
            conn.commit();
            resp.getWriter().write(toJson(list));
        } catch (Exception e) {
            if (conn != null) {
                conn.rollback();
            }
            throw new RuntimeException(e);
        } finally {
            DbUtil.close(conn);
        }
    }
}
\`\`\`

这段代码能跑,但每加一个功能,上面三处模板就要再抄一遍。更难受的是测试:想验证"查询结果为空时页面怎么显示",得打包、启动 Tomcat、部署、打开浏览器点一遍 —— 一次验证五分钟起步。

> [!warn] 三个问题,不是三个 bug
> ① **对象管理**:谁创建、何时创建、创建几个,全散落在业务代码里;② **横切逻辑**:日志、权限、事务这些"与业务无关但处处都要"的代码,粘在业务方法里;③ **基础设施模板**:连接、提交、回滚、关闭,重复且容易漏。这不是某个新人写错了,而是"没有框架"本身的结构性成本。

## 框架到底解决了什么

| 痛点 | 手写时代 | 框架的解法 | 一句话效果 |
| --- | --- | --- | --- |
| 对象管理 | 业务类里 new 依赖 | **控制反转 IoC**:容器创建并注入 | 换实现不改业务代码 |
| 横切逻辑 | 日志/权限抄在每个方法 | **AOP**:统一织入方法前后 | 业务类里只剩业务 |
| 事务模板 | 手写 commit / rollback | **声明式事务**:一个注解 | 不再写提交回滚代码 |
| 请求分发 | 一个 URL 一个 Servlet | **MVC**:一个入口 + 注解映射 | 加接口只加一个方法 |

## Spring 的极简史与全家桶地图

2002 年,Rod Johnson 出版《Expert One-on-One J2EE Design and Development》,书中的示例代码后来演化为 **Spring Framework**,2004 年发布 1.0。它最初最大的卖点不是 Boot,而是**用普通 POJO 加依赖注入,替代当时笨重的 EJB**。

\`\`\`text
2002 年书中的原型  ──▶  Spring Framework(2004 起:IoC / AOP / 事务 / MVC)
                              │
                              ├──▶ Spring Boot(2014):约定大于配置 + 内嵌 Tomcat
                              └──▶ Spring Cloud:注册中心、配置中心、网关、熔断
\`\`\`

日常说的"Spring 全家桶",其实是按职责分层的技术栈:

| 模块 | 管什么 | 你会在这里学到 |
| --- | --- | --- |
| Spring Core | IoC 容器、Bean 生命周期、依赖注入 | 对象怎么被创建与管理 |
| Spring AOP | 切面、动态代理、通知 | 日志/权限/事务怎么剥离 |
| Spring TX | 声明式事务、传播行为 | 一个注解背后的提交与回滚 |
| Spring MVC | 前端控制器、参数绑定、返回值处理 | 请求怎么找到你的方法 |
| Spring Boot | 自动配置、starter、内嵌容器 | 为什么加依赖就能跑 |
| Spring Security | 认证与授权 | 登录态与权限控制(本模块不展开) |
| Spring Data / MyBatis | 数据访问 | 一条 SQL 怎么被执行 |

## 第一个 SpringBoot 应用:先准备完整工程

第一次创建项目,先完成 [Maven 与完整 Hello 服务](#/m/engineering/e01):那里提供完整 pom.xml、package、import、目录、构建命令和排错。本节是理解框架作用的代码摘录,不能作为独立文件原样运行。以下依赖版本由工程中的 Spring Boot parent 管理:

\`\`\`xml pom.xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
\`\`\`

启动类:整个应用只有一个 main 方法。

\`\`\`java DemoApplication.java
@SpringBootApplication
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
\`\`\`

再写一个接口。==@RestController== 的意思是:返回值直接写进响应体,不走页面渲染。

\`\`\`java HelloController.java
@RestController
@RequestMapping("/hello")
public class HelloController {

    @GetMapping
    public String hello(@RequestParam(defaultValue = "world") String name) {
        return "hello, " + name;
    }
}
\`\`\`

启动日志示意(时间、进程号、耗时与格式随环境和版本变化):

\`\`\`output
2026-11-14 10:24:31.512  INFO 21840 --- [           main] c.e.demo.DemoApplication : Starting DemoApplication using Java 17.0.9
2026-11-14 10:24:32.744  INFO 21840 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer : Tomcat started on port(s): 8080 (http)
2026-11-14 10:24:32.751  INFO 21840 --- [           main] c.e.demo.DemoApplication : Started DemoApplication in 1.436 seconds
\`\`\`

然后另开一个终端,访问它:

\`\`\`shell
curl "http://localhost:8080/hello?name=zhen"
\`\`\`

\`\`\`output
hello, zhen
\`\`\`

## 一个请求是怎么被处理的(预告)

\`\`\`text
浏览器  GET /hello?name=zhen
   │
   ▼
内嵌 Tomcat(接收 TCP 连接,解析成 HTTP 请求)
   │
   ▼
DispatcherServlet(唯一入口:找 Handler、绑定参数)
   │
   ▼
HelloController#hello  ──▶  HttpMessageConverter  ──▶  浏览器
\`\`\`

中间还有拦截器、参数解析器、异常处理器等组件在协作,细节在后续的 MVC 章节展开。现在只需要记住一句话:==所有请求先到 DispatcherServlet,再由它分派给具体方法==。

> [!pitfall] 别一上来就啃源码
> 新手最容易犯的错:打开 Spring 源码,三天后放弃。正确顺序是**先跑通、再用熟、最后才拆**。本章的目标不是懂原理,而是建立一张地图 —— 知道后面每一章在解决什么问题。

## 这个模块怎么学

按"能跑 → 能懂 → 能改 → 能装配"四级走,别跳步:

1. **先跑通最小示例**:一个启动类、一个 \`@RestController\`,用 curl 看到 hello,先建立"Spring 项目长什么样"的直觉。
2. **再理解 IoC**:把 new 出来的依赖改成构造器注入,观察容器如何创建、装配、管理生命周期 —— 这是后面所有能力的地基。
3. **然后学 AOP 与事务**:用 \`@Transactional\` 和自定义切面看代理怎么生成,理解"自调用为什么失效"。
4. **最后进 Boot 工程化**:starter、自动配置、外部化配置、内嵌容器,把散装知识装进一个可部署的应用。

每章都有可运行的代码,跟着敲一遍,比读三遍正文有用;遇到报错先读栈顶,再对照章节里的"常见坑"。看不懂全部源码不丢人,背下结论、知道去哪个类找,就够用了。

## 本章小结

- 手写 Servlet 的三座大山:对象自己 new、横切逻辑复制粘贴、事务模板重复。
- 框架用四件事回应:IoC 管对象、AOP 管横切、声明式事务管提交回滚、MVC 管请求分发。
- Spring 2004 年起步,SpringBoot 2014 年用"约定 + 自动配置 + 内嵌容器"把门槛打到最低:最小应用 = 一个依赖 + 一个启动类 + 一个接口。
- 请求链路:浏览器 → Tomcat → DispatcherServlet → Controller → 响应。

## 面试速记

- **IoC 是思想,DI 是手段**:控制权从代码反转给容器,注入是落地方式。
- 框架的本质是"带约束的半成品",好莱坞原则:别调用我们,我们会调用你。
- Spring 全家桶分层:Core 管对象、AOP 管增强、TX 管事务、MVC 管请求、Boot 管装配。
- SpringBoot 三大件:starter 聚合依赖、自动配置按条件装配、内嵌容器免部署。
- 回答"为什么用 Spring",按"解耦、可测试、少模板、生态全"四点展开,比背概念更加分。
`
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch01',
        title: 'IoC 容器与 Bean 基础',
        minutes: 30,
        points: ['IoC 思想', 'BeanFactory', 'ApplicationContext', 'XML 与注解'],
        content: `
> [!interview] 本章面试锚点
> "什么是 IoC?IoC 和 DI 是一回事吗?"——开场必须说清:**IoC 是思想(对象的创建与依赖管理权反转给容器),DI 是实现手段(容器在运行时把依赖注入进来)**。Spring 通过 IoC 容器落地这一思想,DI 是它最主要的实现方式。

> [!info] 本章导读 · 对象凭什么不自己 new?
> 你有没有想过:Service 里的 DAO 明明没赋值,运行时却能用?这背后是 Spring 最核心的思想 —— 对象的创建权被交给了容器。
> 本章是整个模块的起点,把这个反直觉的设计讲透,后面所有能力都建立在它之上。
> - 读完本章你将能:用自己的话解释控制反转与依赖注入
> - 分清 BeanFactory 与 ApplicationContext 的差别
> - 用 XML 和注解两种方式把对象交给容器管理

> [!tip] 日常电脑现场 · 外卖平台的派单
> 打开外卖 App 点一份黄焖鸡,你不用知道哪家店接单、哪位骑手来送、路线怎么绕,只等门口敲门。Spring 容器就是这个平台:你声明要一个 Service,它负责把依赖凑齐再送到你手上。

## 控制反转:谁创建对象,谁掌握主动权

\`\`\`diagram:d-ioc
\`\`\`

**IoC 说白了就是一家婚介所**:以前找对象得自己满大街 new,成不成全看缘分;现在把要求填进档案交给中介(容器),中介安排好对象还负责送货上门(注入)。以后想换人,改改档案就行,不用把自己的生活推倒重来。

传统写法与 IoC 写法的本质区别:

\`\`\`java
/** 传统方式:程序主动 new,控制权在程序员手里 */
public class OrderService {
    // 强耦合:想换成 OrderDaoMock 必须改源码重新编译
    private OrderDao orderDao = new OrderDaoImpl();

    public void createOrder() {
        orderDao.save();          // save() 内部打印"订单已保存"
    }
}
\`\`\`

\`\`\`java
/** IoC 方式:控制权反转给容器,面向接口编程,容器负责注入实现 */
@Service
public class OrderService {
    private final OrderDao orderDao;   // 只声明依赖,不创建

    public OrderService(OrderDao orderDao) {   // 构造器注入
        this.orderDao = orderDao;
    }

    public void createOrder() {
        orderDao.save();
    }
}
\`\`\`

- **控制**:对象创建、依赖装配的权利。
- **反转**:这份权利从程序代码反转给了 IoC 容器。
- 收益:解耦(实现可替换)、便于测试(可注入 Mock)、生命周期统一托管。

> [!tip] 一个类比
> 传统方式是自己买菜做饭;IoC 是点外卖 —— ==你只声明"我要什么"(依赖),容器负责"怎么做出来"(创建与装配)==。

## BeanFactory vs ApplicationContext

两者都是容器接口,继承关系:ApplicationContext extends BeanFactory(还合并了消息国际化、事件发布、资源加载等能力)。

| 维度 | BeanFactory | ApplicationContext |
| --- | --- | --- |
| 定位 | 底层容器,Spring 的基础设施 | 高级容器,日常使用的就是它 |
| Bean 加载时机 | **懒加载**:getBean 时才创建 | **预加载**:启动时创建全部单例 |
| 错误暴露 | 首次访问才报配置错误 | 启动期就暴露,符合 fail-fast |
| 附加能力 | 无 | 事件发布、国际化、资源解析、后置处理器自动注册 |
| 典型实现 | DefaultListableBeanFactory | AnnotationConfigApplicationContext、ClassPathXmlApplicationContext |

\`\`\`java
public class ContainerDemo {
    public static void main(String[] args) {
        ApplicationContext ctx =
                new AnnotationConfigApplicationContext(AppConfig.class);
        // 走到这里单例已全部就绪,getBean 只是取出来
        OrderService svc = ctx.getBean(OrderService.class);
        System.out.println(svc.getClass().getSimpleName());
    }
}
\`\`\`

\`\`\`output
# 启动阶段(预实例化,日志节选)
Refreshing org.springframework.context.annotation.AnnotationConfigApplicationContext@1a2b3c
Initializing bean 'orderDao' ...
Initializing bean 'orderService' ...   [hl]单例预实例化完成[/hl]
OrderService
\`\`\`

> [!interview] 高频追问:BeanFactory 和 FactoryBean 别搞混!
> FactoryBean 是一个 Bean,但它**生产别的对象**:容器里暴露的是 ==getObject()== 的返回值。MyBatis 的 ==SqlSessionFactoryBean==、OpenFeign 的 ==FeignClientFactoryBean== 都靠它把第三方对象接入 Spring。面试官问"Mapper 接口为什么能注入",答案链条里就有 FactoryBean(第 13 章展开)。

## 配置方式一:XML(维护老项目必备,理解为主)

\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="
         http://www.springframework.org/schema/beans
         http://www.springframework.org/schema/beans/spring-beans.xsd">

    <bean id="orderDao" class="com.demo.dao.OrderDaoImpl"/>

    <bean id="orderService" class="com.demo.service.OrderService">
        <!-- 构造器注入:ref 指向另一个 Bean -->
        <constructor-arg name="orderDao" ref="orderDao"/>
    </bean>
</beans>
\`\`\`

\`\`\`java
public class XmlDemo {
    public static void main(String[] args) {
        ApplicationContext ctx =
                new ClassPathXmlApplicationContext("applicationContext.xml");
        OrderService svc = ctx.getBean("orderService", OrderService.class);
        svc.createOrder();
    }
}
\`\`\`

\`\`\`output
订单已保存
\`\`\`

## 配置方式二:注解 + Java 配置(SpringBoot 之后的默认形态)

\`\`\`java
@Configuration                      // 声明配置类(等价于一个 XML 文件)
@ComponentScan("com.demo")          // 扫描 @Component/@Service/@Repository/@Controller
@EnableTransactionManagement        // 按需开启功能开关
public class AppConfig {

    @Bean                           // 方法返回值注册为 Bean,名字默认 = 方法名
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
\`\`\`

| 注解 | 标注位置 | 语义 |
| --- | --- | --- |
| @Component | 通用组件 | 泛指交给容器管理的类 |
| @Service | 业务层 | 语义化别名,便于分层 |
| @Repository | 数据访问层 | 额外把持久层异常转译为 DataAccessException |
| @Controller/@RestController | Web 层 | 接收 HTTP 请求 |
| @Bean | 配置类的方法 | 第三方类改不了源码时,用方法手动注册 |

四个 stereotype 注解底层都是 @Component 的派生,@Repository 是唯一有附加行为的(异常转译由 PersistenceExceptionTranslationPostProcessor 完成)。

> [!pitfall] @ComponentScan 扫不到 = Bean 根本不存在
> SpringBoot 默认只扫描==启动类所在包及其子包==。把配置类放到兄弟包下又不指定路径,组件会静默失效,报 ==NoSuchBeanDefinitionException==。排查顺序:先看扫描范围,再看类上注解是否齐全,最后看是否有条件注解挡住了注册。

## 装配细节:常用注解速查与 @Import 三式

### 六个装配细节注解速查

| 注解 | 作用 | 典型场景 |
| --- | --- | --- |
| @DependsOn("a") | 强制初始化顺序:先创建 a 再创建我 | 无显式依赖但有隐式先后要求(初始化器要等资源就绪) |
| @Order(n) | 排序,值越小优先级越高 | 注入 List<T> 的元素顺序、切面/拦截器链顺序 |
| @Lazy | 延迟到首次使用才创建 | 冷启动提速;打破构造器循环依赖(第 4 章) |
| @Primary | 同类型多个候选时的默认首选 | 多数据源里指定默认 DataSource |
| @Qualifier("name") | 按名字精确锁定候选 | @Autowired 面对多个实现时点名二选一 |
| @Scope(proxyMode) | 作用域 + 是否代理 | request/session 作用域须配 TARGET_CLASS,注入的才是代理 |

记忆钩子:@Qualifier 是**点名**,@Primary 是**指定默认**,两者同时出现时 ==@Qualifier 优先==;@Order 不决定"选谁",只决定"排多前";@DependsOn 只管创建先后,不注入任何东西。

### @Import 三式:绕过扫描,直接注册

@ComponentScan 只能扫"带注解的类";@Import 能把**任何类**(包括第三方 jar 里的普通类、纯接口)拉进容器 —— 它是自动配置体系的地基(第 8 章的全部魔法都踩在它上面)。

\`\`\`java
// 第一式:普通类直接导入(类上不需要任何注解)
public class PlainService {
    public void hello() { System.out.println("PlainService 已被容器接管"); }
}

@Configuration
@Import({ PlainService.class })             // 直接注册为一个 Bean,bean 名 = 全限定类名
public class ImportDemoConfig { }

// 验证
ApplicationContext ctx =
        new AnnotationConfigApplicationContext(ImportDemoConfig.class);
ctx.getBean(PlainService.class).hello();
\`\`\`

\`\`\`java
// 第二式:ImportSelector 批量选择(返回要导入的类名数组,逻辑可编程)
public class LogImportSelector implements ImportSelector {
    @Override
    public String[] selectImports(AnnotationMetadata metadata) {
        // 可根据注解元数据、环境动态决定导入哪些类;
        // @EnableAutoConfiguration 就是它读清单文件批量拉配置类
        return new String[]{ "com.demo.log.TraceAspect" };
    }
}

@Configuration
@Import(LogImportSelector.class)
public class SelectorConfig { }
\`\`\`

\`\`\`java
// 第三式:ImportBeanDefinitionRegistrar 手动注册(最底层,权限最大)
public class MapperRegistrar implements ImportBeanDefinitionRegistrar {
    @Override
    public void registerBeanDefinitions(AnnotationMetadata metadata,
                                        BeanDefinitionRegistry registry) {
        // 完全手工构建 BeanDefinition:把包下每个 Mapper 接口
        // 注册为 MapperFactoryBean(接口无实现类,靠 FactoryBean 产代理)
        ClassPathMapperScanner scanner = new ClassPathMapperScanner(registry);
        scanner.scan("com.demo.mapper");
    }
}

@Retention(RetentionPolicy.RUNTIME)
@Import(MapperRegistrar.class)              // 自定义注解也能"背"一个 Registrar
public @interface EnableMappers { }          // @MapperScan 的底层就是这一式
\`\`\`

\`\`\`output
PlainService 已被容器接管
[hl]PlainService 无任何注解也进了容器 —— @Import 绕过组件扫描,直接注册 BeanDefinition[/hl]
\`\`\`

> [!interview] 三式各自的江湖地位(面试串讲)
> 第一式:手动装配第三方普通类;第二式(ImportSelector):==@EnableAutoConfiguration 的核心机制==,SpringBoot 按清单批量拉配置类;第三式(Registrar):==@MapperScan、@EnableFeignClients== 都靠它,接口没有实现类也能注册 FactoryBean。追问"Mapper 接口为什么能注入",标准答案链:**@MapperScan → ImportBeanDefinitionRegistrar → MapperFactoryBean → JDK 动态代理**(第 13 章展开)。

## 两大后置处理器:BeanFactoryPostProcessor vs BeanPostProcessor

这俩名字像双胞胎,但干预的**对象和时机完全不同**,是 Spring 冷门高频题的分水岭:

| 维度 | BeanFactoryPostProcessor(BFPP) | BeanPostProcessor(BPP) |
| --- | --- | --- |
| 干预对象 | **BeanDefinition(配方)** | **Bean 实例(成品)** |
| 时机 | 所有 BeanDefinition 加载完、**实例化之前** | 每个 Bean 的初始化前后 |
| 能做什么 | 改配方:增/删/改 BeanDefinition 的 class、属性、作用域 | 改成品:返回代理对象、修改字段、打补丁 |
| 典型实现 | **ConfigurationClassPostProcessor**(解析 @Configuration/@Bean 的头号功臣)、PropertySourcesPlaceholderConfigurer | ApplicationAwareProcessor、AOP 的 AbstractAutoProxyCreator |
| 招式全家桶 | — | InstantiationAwareBeanPostProcessor(实例化前后 + 属性填充前) |

自定义一个 BFPP,把别人的 Bean "改配方":

\`\`\`java
@Component
public class MyBeanFactoryPostProcessor implements BeanFactoryPostProcessor {
    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory factory) {
        BeanDefinition bd = factory.getBeanDefinition("userService");
        // 配方阶段改属性:所有 UserService 还没 new,改了就生效
        bd.getPropertyValues().add("serviceName", "我是被 BFPP 偷偷改过的");
        System.out.println("[BFPP] 容器里已有 BeanDefinition 数量: "
                + factory.getBeanDefinitionCount() + ",此时还没有任何实例");
    }
}
\`\`\`

\`\`\`output
[BFPP] 容器里已有 BeanDefinition 数量: 6,此时还没有任何实例
[UserService] 构造器执行,serviceName= 我是被 BFPP 偷偷改过的
\`\`\`

BPP 那边再串一遍完整时序(背熟这条链):

\`\`\`text
实例化(构造器) → 属性填充 → Aware 回调
  → postProcessBeforeInitialization → @PostConstruct/afterPropertiesSet
  → postProcessAfterInitialization(AOP 代理就在这一步生成!) → 放入单例池
\`\`\`

> [!interview] 高频追问:为什么 AOP 代理生成在 BPP 而不是 BFPP?
> BFPP 阶段只有"配方"没有对象,代理要包住**实例**;所以 AbstractAutoProxyCreator 实现的是 BPP 的 after 方法 —— 对成品判断是否需要代理,需要就返回动态代理对象塞回单例池。BFPP 里最重要的 ConfigurationClassPostProcessor 则负责把 @Configuration 类解析成一堆新的 BeanDefinition(所有 @Bean 方法由此注册)——**没有它,Spring 全家桶一个 Bean 都不会有**,这句话说出来就是降维打击。

## 面试速记

- IoC 是思想(创建权反转给容器),DI 是实现手段;Spring 容器 = BeanFactory 体系。
- BeanFactory 懒加载是基础设施,ApplicationContext 预实例化单例并附加事件、国际化能力。
- FactoryBean 是"生产 Bean 的 Bean",MyBatis/Feign 接入 Spring 的桥梁,与 BeanFactory 一字之差天壤之别。
- stereotype 注解本质都是 @Component,@Repository 多一层持久层异常转译。
- SpringBoot 默认扫描启动类所在包及子包,扫不到一切都白搭。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch02',
        title: 'Bean 生命周期与作用域',
        minutes: 35,
        points: ['生命周期', 'BeanPostProcessor', '作用域', '初始化与销毁'],
        content: `
> [!interview] 本章面试锚点
> "说一下 Bean 的生命周期"——送分题也是送命题:背流程谁都会,追问"BeanPostProcessor 在哪一步介入""初始化三种方式谁先谁后"立刻见真章。本章给你==背诵版流程 + 可验证的代码==。

> [!info] 本章导读 · 一个 Bean 的一生,像员工从入职到退休
> 容器创建对象不是 new 一下就完事:要填属性、跑初始化、决定作用域,最后还要负责销毁。
> 这些时机既是面试追问点,也是排查注入为空、初始化顺序不对的钥匙;本章承接容器基础,把 Bean 的一生走完。
> - 读完本章你将能:按顺序说出 Bean 生命周期的关键节点
> - 分清 BeanPostProcessor 在初始化前后各做什么
> - 解释单例 Bean 为什么默认不是线程安全的

> [!tip] 日常电脑现场 · 快递的一生
> 下单后你能看到包裹一路"已揽收、运输中、派送中、已签收",每一步都带时间戳;地址填错就卡在中转站,后面全走不动。Bean 进容器也是这条流水线:实例化、填属性、初始化、进单例池,哪一步没通,整个对象就用不了。

## 生命周期全流程(背诵版)

\`\`\`diagram:d-beanlife
\`\`\`

**一个 Bean 的一生,就是一名员工的入职流程**:投简历(实例化)、填一堆表格(属性填充)、岗前培训(初始化),考核通过才挂牌上岗(进单例池);至于退休手续(销毁回调),得等公司关门那天才办。

\`\`\`text
① 实例化 Instantiation   → createBeanInstance():构造器/工厂方法,得到原始对象
② 属性填充 Populate       → populateBean():@Autowired/@Resource 依赖注入
③ Aware 接口回调          → BeanNameAware → BeanFactoryAware → ApplicationContextAware
④ BeanPostProcessor#postProcessBeforeInitialization
⑤ 初始化 Initialization   → @PostConstruct → InitializingBean#afterPropertiesSet
                            → initMethod(@Bean(initMethod = "x"))
⑥ BeanPostProcessor#postProcessAfterInitialization  ← [hl]AOP 代理通常在这里生成[/hl]
⑦ 使用中                  → 单例放入一级缓存 singletonObjects
⑧ 销毁 Destruction        → 容器关闭时:@PreDestroy → DisposableBean#destroy → destroyMethod
\`\`\`

记忆主线:**实例化 → 属性填充 → 初始化 → 使用 → 销毁**,其余全是这四步之间插进去的回调。

### 源码视角(简化版,AbstractAutowireCapableBeanFactory#doCreateBean)

\`\`\`java
// 简化后的主线,真实代码远比这复杂,但骨架一致
protected Object doCreateBean(String beanName, RootBeanDefinition mbd) {
    // ① 实例化:反射调用构造器(此时尚未注入任何依赖)
    BeanWrapper wrapper = createBeanInstance(beanName, mbd, args);
    Object bean = wrapper.getWrappedInstance();

    // ② 属性填充:@Autowired、@Resource 在这一步由后置处理器完成
    populateBean(beanName, mbd, wrapper);

    // ③~⑥ 初始化:Aware 回调 → 前置处理器 → @PostConstruct / afterPropertiesSet
    //        → 后置处理器(AOP 代理在这里把原始对象替换成代理)
    bean = initializeBean(beanName, bean, mbd);

    // ⑦ 注册销毁回调,单例放入一级缓存
    registerDisposableBeanIfNecessary(beanName, bean, mbd);
    return bean;
}
\`\`\`

> [!tip] 为什么 AOP 代理在初始化之后生成?
> 代理要包装的是"属性注入完毕的完整对象",实例化刚结束就代理,代理内部的 target 还是半成品。所以 ==AbstractAutoProxyCreator(它就是一个 BeanPostProcessor)== 在 postProcessAfterInitialization 里判断需要代理则返回代理对象 —— 记住这个时机,第 4 章的三级缓存会在这里做文章。

## 用代码验证回调顺序

\`\`\`java
@Component
public class LifeCycleBean implements BeanNameAware, InitializingBean, DisposableBean {

    public LifeCycleBean() {
        System.out.println("1. 构造器:实例化");
    }

    @Autowired
    public void setOrderDao(OrderDao dao) {          // 属性填充发生的时机
        System.out.println("2. 属性填充:注入依赖");
    }

    @Override
    public void setBeanName(String name) {           // Aware 回调
        System.out.println("3. BeanNameAware: " + name);
    }

    @PostConstruct
    public void postConstruct() {
        System.out.println("4. @PostConstruct");
    }

    @Override
    public void afterPropertiesSet() {               // InitializingBean
        System.out.println("5. afterPropertiesSet");
    }

    @PreDestroy
    public void preDestroy() {
        System.out.println("8. @PreDestroy");
    }

    @Override
    public void destroy() {
        System.out.println("9. DisposableBean.destroy");
    }
}
\`\`\`

\`\`\`java
@Component
public class LogBeanPostProcessor implements BeanPostProcessor {
    @Override
    public Object postProcessBeforeInitialization(Object bean, String name) {
        if (bean instanceof LifeCycleBean) System.out.println("3.5 BeforeInitialization");
        return bean;                       // 返回什么,容器就用什么(可以偷梁换柱)
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String name) {
        if (bean instanceof LifeCycleBean) System.out.println("6 AfterInitialization");
        return bean;
    }
}
\`\`\`

\`\`\`output
1. 构造器:实例化
2. 属性填充:注入依赖
3. BeanNameAware: lifeCycleBean
3.5 BeforeInitialization
4. @PostConstruct
5. afterPropertiesSet
6 AfterInitialization
   ---- main 里调用 ctx.close() 之后 ----
8. @PreDestroy
9. DisposableBean.destroy
\`\`\`

> [!warn] 谁管销毁,由作用域决定
> 只有单例 Bean 的完整生命周期由容器掌管到销毁;==prototype== Bean 创建完成后容器就撒手不管,@PreDestroy 等销毁回调**不会执行**,资源释放要自己负责(比如实现 AutoCloseable 由使用方关闭)。

## 初始化/销毁的三种写法与优先级

| 方式 | 初始化 | 销毁 | 适用 |
| --- | --- | --- | --- |
| JSR-250 注解 | @PostConstruct | @PreDestroy | 推荐,不与 Spring 接口耦合 |
| Spring 接口 | InitializingBean#afterPropertiesSet | DisposableBean#destroy | 与 Spring 强耦合,框架开发常用 |
| @Bean 属性 | initMethod = "init" | destroyMethod = "destroy" | 第三方类,改不了源码时 |

同一 Bean 三种全配,执行顺序固定:**@PostConstruct → afterPropertiesSet → initMethod**(销毁同理:@PreDestroy → destroy → destroyMethod)。

## 四种作用域

| 作用域 | 说明 | 备注 |
| --- | --- | --- |
| singleton(默认) | 每个容器一个实例,启动时创建 | 存一级缓存;线程安全自己负责 |
| prototype | 每次 getBean/注入都新建 | 容器不管销毁 |
| request | 每个 HTTP 请求一个实例 | Web 环境,配 proxyMode 使用 |
| session | 每个会话一个实例 | 同上 |

\`\`\`java
@Component
@Scope(value = WebApplicationContext.SCOPE_REQUEST,
       proxyMode = ScopedProxyMode.TARGET_CLASS)   // 注入的是代理,调用时才取当前请求的实例
public class RequestLogContext { }
\`\`\`

\`\`\`java
// 作用域行为验证
PrototypeBean p1 = ctx.getBean(PrototypeBean.class);
PrototypeBean p2 = ctx.getBean(PrototypeBean.class);
System.out.println("prototype 每次新建: " + (p1 == p2));

SingletonBean s1 = ctx.getBean(SingletonBean.class);
SingletonBean s2 = ctx.getBean(SingletonBean.class);
System.out.println("singleton 全局一个: " + (s1 == s2));
\`\`\`

\`\`\`output
prototype 每次新建: false
singleton 全局一个: true
\`\`\`

> [!pitfall] 单例注入原型:prototype 会"退化"
> singleton 注入 prototype 时,注入只发生一次,之后一直用同一个原型实例 —— "每次新建"的语义丢了。解法:① 原型加 ==proxyMode== 注入代理;② 注入 ==ObjectProvider<PrototypeBean>==,getObject() 时才新建;③ 实现 ObjectFactory。ObjectProvider 是面试的加分答案,还能顺带讲 getIfAvailable 的优雅缺省。

## 事件机制与异步任务

生命周期之外的第二件解耦利器:容器内发布/订阅事件 + @Async 异步化,主流程不必知道谁关心结果。

### 自定义事件三件套:定义、发布、监听

\`\`\`java
// ① 定义事件:继承 ApplicationEvent,携带业务数据(Spring 4.2 后 POJO 也能直接发布)
public class OrderCreatedEvent extends ApplicationEvent {
    private final Long orderId;

    public OrderCreatedEvent(Object source, Long orderId) {
        super(source);
        this.orderId = orderId;
    }

    public Long getOrderId() { return orderId; }
}
\`\`\`

\`\`\`java
// ② 发布:注入 ApplicationEventPublisher(ApplicationContext 本身就实现了它)
@Service
public class OrderService {
    private final ApplicationEventPublisher publisher;

    public OrderService(ApplicationEventPublisher publisher) {
        this.publisher = publisher;
    }

    public void createOrder(Long orderId) {
        System.out.println("主流程:订单 " + orderId + " 落库完成");
        publisher.publishEvent(new OrderCreatedEvent(this, orderId));
    }
}
\`\`\`

\`\`\`java
// ③ 监听:@EventListener 标在任意容器 Bean 的方法上,参数类型即订阅的事件类型
@Component
public class OrderEventListener {

    @EventListener
    public void addPoints(OrderCreatedEvent event) {
        System.out.println("监听器A:积分服务为订单 " + event.getOrderId() + " 加积分");
    }

    @EventListener
    public void sendNotice(OrderCreatedEvent event) {
        System.out.println("监听器B:短信服务通知订单 " + event.getOrderId());
    }
}
\`\`\`

\`\`\`java
// 验证:一次发布,两个监听器先后被回调
orderService.createOrder(1001L);
\`\`\`

\`\`\`output
主流程:订单 1001 落库完成
监听器A:积分服务为订单 1001 加积分
监听器B:短信服务通知订单 1001
\`\`\`

底层一句话:==ApplicationEventMulticaster== 遍历容器里所有监听器,按**事件类型**匹配后依次回调 —— 观察者模式的容器级实现。

### 应用场景与同步语义

| 场景 | 做法 | 收益 |
| --- | --- | --- |
| 业务解耦 | 下单成功发事件,积分/物流/推荐各自监听 | 主流程零依赖,加订阅者不改一行老代码 |
| 审计日志 | 关键操作后发审计事件,统一监听入库 | 敏感操作留痕,不污染业务方法 |
| 缓存刷新 | 数据变更发事件,监听器清本地/远程缓存 | 变更方与缓存方彻底解耦 |

关键认知:**事件监听默认是同步的** —— publishEvent 在哪个线程调用,监听器就在哪个线程执行,主流程要等所有监听器跑完才返回。

> [!tip] 事务提交后再干活:@TransactionalEventListener
> 监听器在事务内被同步触发,可能"事务还没提交就去发通知"。用 ==@TransactionalEventListener(phase = AFTER_COMMIT)== 把执行推迟到**事务成功提交之后**(回滚则跳过),发 MQ、发站外通知的场景必配。

### @Async:把任务丢进线程池

\`\`\`java
@Configuration
@EnableAsync                               // 总开关:开启异步能力
public class AsyncConfig {

    @Bean("taskExecutor")
    public ThreadPoolTaskExecutor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);              // 核心线程数
        executor.setMaxPoolSize(8);               // 最大线程数
        executor.setQueueCapacity(200);           // 阻塞队列容量
        executor.setThreadNamePrefix("async-");   // 线程名前缀,查日志靠它
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}
\`\`\`

\`\`\`java
@Service
public class NotifyService {

    @Async                                  // 方法被代理拦截后提交到 taskExecutor
    public void sendNotice(Long orderId) {
        System.out.println(Thread.currentThread().getName()
                + " 发送通知: " + orderId);
    }
}

// 业务里调用:
notifyService.sendNotice(1001L);
System.out.println(Thread.currentThread().getName() + " 主流程继续,不等通知");
\`\`\`

\`\`\`output
async-1 发送通知: 1001
main 主流程继续,不等通知
[hl]线程名从 main 变成 async-1 —— 方法跑进了自定义线程池,主流程不被拖慢[/hl]
\`\`\`

> [!pitfall] @Async 底层同样是代理,同类自调用照样失效
> @Async 由 ==AsyncAnnotationBeanPostProcessor== 生成代理拦截(默认 SimpleAsyncTaskExecutor 每次新建线程,生产必须自定义线程池)。**this 自调用不经过代理,异步直接退化为同步** —— 与第 5 章 AOP/事务失效同根同源;另注意方法要 public、返回值 void 或 Future,类上没开 @EnableAsync 一切白搭。

### @Scheduled 定时任务 + cron 速查

\`\`\`java
@Component
public class ReportJob {

    @Scheduled(cron = "0 0 2 * * ?")       // 每天 02:00:00 触发
    public void dailyReport() { System.out.println("生成日报"); }

    @Scheduled(fixedRate = 5000)           // 上次【开始】时间 + 5s 触发
    public void heartbeat() { }

    @Scheduled(fixedDelay = 5000)          // 上次【结束】时间 + 5s 触发
    public void cleanup() { }
}
\`\`\`

cron 六位(秒 分 时 日 月 周,日/周互斥用 ? 占位)速查:

| 表达式 | 含义 |
| --- | --- |
| 0/30 * * * * ? | 每 30 秒一次 |
| 0 0/5 * * * ? | 每 5 分钟一次 |
| 0 0 2 * * ? | 每天 02:00 |
| 0 0 2 1 * ? | 每月 1 号 02:00 |
| 0 0 2 ? * MON | 每周一 02:00 |
| 0 0 10,16 * * ? | 每天 10:00 与 16:00 |

> [!warn] @Scheduled 的两个生产坑
> ① 启动类必须加 ==@EnableScheduling==,否则定时任务集体静默;② 默认**单线程**调度器,一个任务耗时会拖住其他任务,生产要配 TaskScheduler 线程池;多实例部署下 @Scheduled **每个节点都会执行一遍**,要加分布式锁或换 xxl-job 等分布式调度。

## 面试速记

- 主线四步:实例化 → 属性填充 → 初始化 → 销毁;Aware、BeanPostProcessor、@PostConstruct 全是插在步骤之间的回调。
- 初始化内部顺序:@PostConstruct → afterPropertiesSet → initMethod;销毁同理三连。
- AOP 代理由 AbstractAutoProxyCreator 在 postProcessAfterInitialization 阶段生成。
- BeanPostProcessor 两大作用:加工 Bean(如 AOP 代理)+ 驱动注入(AutowiredAnnotationBeanPostProcessor 处理 @Autowired)。
- prototype 不受容器销毁管理;singleton 注入 prototype 用 ObjectProvider 或 ScopedProxy 解决。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch03',
        title: '依赖注入与循环依赖',
        minutes: 35,
        points: ['三种注入', '@Autowired vs @Resource', '三级缓存', '构造器循环依赖'],
        content: `
> [!interview] 本章面试锚点
> Spring 面试的"重灾区":@Autowired 原理、三级缓存、为什么构造器注入解决不了循环依赖,三连追问能筛掉 80% 的候选人。核心结论先立住:**三级缓存解决的是"单例 + 字段/Setter 注入"的循环依赖;构造器注入、prototype、@Async 都无解**。

> [!info] 本章导读 · A 要 B,B 又要 A,这个死结怎么解?
> 两个 Service 互相注入,程序没崩还能启动 —— 这不是巧合,而是 Spring 用三级缓存做的兜底。
> 本章紧接着依赖注入,把这张网拆开看,顺便告诉你哪些循环依赖它其实救不了。
> - 读完本章你将能:讲清三级缓存各自存什么、为什么需要三级
> - 判断构造器注入、多例、异步代理为什么无解
> - 用延迟注入等手法拆掉不合理的依赖环

> [!tip] 日常电脑现场 · 互相担保的贷款
> 甲贷款要乙担保,乙贷款又要甲担保,柜台前两人谁也办不下来;银行先给甲开一张担保意向书,让他把手头手续走完,回头再补正式文件。Spring 三级缓存提前暴露的就是这张意向书,让两个各缺一半的对象先撑住。

## 三种注入方式

\`\`\`java
@Service
public class OrderService {

    // ① 构造器注入(Spring 官方推荐):依赖不可变、非空、构造完成即可用
    private final OrderDao orderDao;
    public OrderService(OrderDao orderDao) {
        this.orderDao = orderDao;
    }

    // ② Setter 注入:适合可选依赖(配合 required = false)
    private MetricsReporter metrics;
    @Autowired(required = false)
    public void setMetrics(MetricsReporter metrics) {
        this.metrics = metrics;
    }

    // ③ 字段注入:写法最短,但脱离容器无法实例化,单测要靠反射
    @Autowired
    private UserService userService;
}
\`\`\`

| 维度 | 构造器 | Setter | 字段 |
| --- | --- | --- | --- |
| 不可变(final) | 可以 | 不可以 | 不可以 |
| 依赖为 null 的可能 | 无 | 有 | 有 |
| 单元测试 | 直接 new | 需 setter | 需反射或容器 |
| 循环依赖 | 无法解决 | 可以解决 | 可以解决 |
| 官方态度 | **推荐** | 可选依赖场景 | 不推荐但最流行 |

> [!best] 为什么官方推荐构造器注入
> ① 依赖声明为 final,不可变且线程安全;② 构造完成即处于可用状态,不存在"半初始化对象"逃逸;③ 依赖过多时构造器参数爆炸,==编译期就暴露"这个类职责过重"==,字段注入会掩盖设计问题;④ 单测不启容器也能直接 new。

## @Autowired vs @Resource

| 维度 | @Autowired | @Resource |
| --- | --- | --- |
| 来源 | Spring 提供 | JDK 规范(JSR-250),Spring 兼容 |
| 默认策略 | **先 byType,多个候选再 byName** | **先 byName,失败再 byType** |
| 指定名字 | 配合 @Qualifier("xxx") | @Resource(name = "xxx") |
| 缺失行为 | required = false 可为 null | 直接抛异常 |
| 处理者 | AutowiredAnnotationBeanPostProcessor | CommonAnnotationBeanPostProcessor |

\`\`\`java
public interface PayChannel { }

@Component("aliPay")
public class AliPay implements PayChannel { }

@Component("wxPay")
public class WxPay implements PayChannel { }

@Service
public class PayService {
    @Autowired
    @Qualifier("aliPay")              // byType 出现多个候选 → 用限定符锁定
    private PayChannel payChannel;

    @Resource(name = "wxPay")         // 直接指定 Bean 名字
    private PayChannel wxPayChannel;

    public void pay() {
        System.out.println("use: " + payChannel.getClass().getSimpleName());
        System.out.println("wx : " + wxPayChannel.getClass().getSimpleName());
    }
}
\`\`\`

\`\`\`output
use: AliPay
wx : WxPay
\`\`\`

> [!tip] @Autowired 的完整装配规则(面试原话)
> ① 先按==类型==找,唯一 → 直接注入;② 类型有多个候选 → 按字段名/参数名匹配 Bean 名字;③ 还不行 → 看 @Qualifier 与 @Primary;④ 全部失败且 required = true → 抛 ==NoSuchBeanDefinitionException== 或 ==NoUniqueBeanDefinitionException==。

## 三级缓存:循环依赖的解法

\`\`\`diagram:d-circular
\`\`\`

**三级缓存就像相亲时的"半成品档案"**:A 等 B 回消息,B 又在等 A 回消息,俩人干瞪眼就成了死锁。缓存里先放一份"半成品档案 + 电话号码",对方能先联系上人把事谈成,资料晚点再补全,谁也不用干等谁。

三个 Map 都在 DefaultSingletonBeanRegistry 里:

| 缓存 | 字段名 | 存什么 |
| --- | --- | --- |
| 一级 | singletonObjects | **成品 Bean**(初始化完毕,直接可用) |
| 二级 | earlySingletonObjects | **早期引用**(已实例化未填充属性,可能已是代理) |
| 三级 | singletonFactories | **ObjectFactory 工厂**,回调才决定是否提前做 AOP |

A、B 互相注入的完整时序:

\`\`\`text
1. 创建 A:实例化 → 把"能产出早期 A"的 ObjectFactory 放入三级缓存
2. A 填充属性,发现依赖 B → 触发 getBean(B)
3. 创建 B:实例化 → B 的工厂放入三级缓存
4. B 填充属性,发现依赖 A → getBean(A)
   → 一级没有 → 二级没有 → 三级命中 A 的工厂
   → 工厂.getObject() 产出早期 A(必要时已代理)→ 放入二级缓存,删三级
5. B 拿到早期 A 引用 → B 完成初始化 → B 进入一级缓存
6. 回到 A:注入 B 成功 → A 完成初始化 → A 进入一级缓存
\`\`\`

### 源码简化版(背诵用)

\`\`\`java
// 简化后的主线(DefaultSingletonBeanRegistry#getSingleton)
protected Object getSingleton(String beanName, ObjectFactory<?> factory) {
    // ① 先查缓存:一级成品 → 二级早期引用 → 三级工厂
    Object singleton = getSingleton(beanName, true);
    if (singleton == null) {
        // ② 缓存全空才真正创建(内部走 doCreateBean:实例化→填充→初始化)
        singleton = factory.getObject();
        // ③ 创建完成:写入一级缓存,同时清除二三级
        addSingleton(beanName, singleton);
    }
    return singleton;
}

// 实例化完成后立刻执行的"提前暴露"(doCreateBean 内部):
addSingletonFactory(beanName, () -> getEarlyBeanReference(beanName, mbd, bean));
//                                  ↑ 回调里遍历 SmartInstantiationAwareBeanPostProcessor,
//                                    需要提前 AOP 时才在这里生成代理,而非等到初始化阶段
\`\`\`

> [!interview] 高频追问:为什么是三级,二级不够吗?
> 核心矛盾:**Spring 设计上要求 AOP 代理在初始化之后生成**,但循环依赖时对方在初始化完成前就要拿到引用。三级缓存存工厂不存对象,是**延迟决策**:没发生循环依赖 → 按正常时序初始化后才生成代理;发生了 → 通过工厂提前产出代理放二级缓存。若只有二级(直接放对象),则所有 Bean 都必须提前做 AOP,破坏生命周期设计原则 —— 三级是"正常流程"与"提前暴露"的兼容方案。

## 构造器注入为什么无解

\`\`\`java
@Service
public class A {
    private final B b;
    public A(B b) {                  // 创建 A 必须先有 B
        this.b = b;
    }
}

@Service
public class B {
    private final A a;
    public B(A a) {                  // 创建 B 必须先有 A —— 死锁
        this.a = a;
    }
}
\`\`\`

\`\`\`output
***************************
APPLICATION FAILED TO START
***************************
Description:
The dependencies of some of the beans in the application context form a cycle:
   a (constructor) ──> b (constructor) ──> a
Action:
[err]Requested bean is currently in creation: 对象还没 new 出来,连"半成品引用"都不存在[/err]
\`\`\`

三级缓存的本质是"先实例化、再暴露早期引用";构造器注入把实例化和取依赖绑死在同一步,**没有时间窗口可以暴露早期引用**。同样无解的还有:prototype 作用域(不走三级缓存)、@Async 增强的 Bean(代理生成时机特殊,启动即报错,需要 @Lazy 兜底)。

\`\`\`java
// 逃生通道:@Lazy 打破创建链条(注入的是延迟代理,首次调用才真正解析)
@Service
public class A {
    private final B b;
    public A(@Lazy B b) {
        this.b = b;
    }
}
\`\`\`

> [!warn] 循环依赖该修不该绕
> 三级缓存是兜底不是许可。出现循环依赖几乎都说明职责划分有问题(抽第三个类、发事件解耦)。SpringBoot 2.6+ ==默认禁止循环依赖==(spring.main.allow-circular-references = false),生产方向是修设计,而不是依赖容器兜底。

## 面试速记

- 注入方式:构造器(官方推荐,final 不可变)/ Setter(可选依赖)/ 字段(流行但不利于测试)。
- @Autowired 先 byType 后 byName,@Resource 先 byName 后 byType;多候选用 @Qualifier/@Primary。
- 三级缓存:一级成品、二级早期引用、三级 ObjectFactory;三级的意义是"发生循环依赖时才提前做 AOP"。
- 无解三兄弟:构造器注入、prototype、@Async;逃生通道 @Lazy。
- SpringBoot 2.6+ 默认禁止循环依赖,方向是修设计而不是关报错。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch04',
        title: 'AOP 面向切面编程',
        minutes: 30,
        points: ['动态代理', 'JDK vs CGLIB', '通知顺序', '失效场景'],
        content: `
> [!interview] 本章面试锚点
> AOP 三连:动态代理怎么选型?通知执行顺序是什么?哪些场景切面会失效?先玩下面的演示,直观感受一次调用是怎么穿过代理链的,再往下对号入座。

> [!info] 本章导读 · 日志和事务,为什么不该写进业务代码?
> 记录日志、校验权限、开启事务,这些事每个方法都要做,却和业务逻辑毫无关系。
> AOP 把它们抽出来统一织入,业务类从此只关心业务;本章也是后面事务能够生效的底层基础。
> - 读完本章你将能:说清 JDK 代理与 CGLIB 的选型依据
> - 讲出通知的五种类型与执行顺序
> - 判断哪些场景切面会悄悄失效

> [!tip] 日常电脑现场 · 给手机套个壳
> 手机加个壳,防摔防水的功能就有了,你没拆机,也没改一行系统代码;想换手感,壳一摘一换就行。AOP 就是这层壳:日志、事务、权限套在业务方法外面,业务类自己一个字都不用动。

\`\`\`demo:aop-proxy
\`\`\`

## 底层:两种动态代理

Spring AOP 是**运行期动态代理**(编译期织入是 AspectJ,Spring 只是借用了它的注解体系):

| 维度 | JDK 动态代理 | CGLIB |
| --- | --- | --- |
| 实现机制 | 反射实现接口(Proxy + InvocationHandler) | **继承目标类**,ASM 改写字节码生成子类 |
| 前提 | 目标必须实现接口 | 类和方法不能是 final |
| 代理对象类型 | 接口的实例 | 目标类的子类 |
| 方法调用 | Method 反射 | FastClass 索引直接调用 |
| Spring 中的默认 | 早期版本有接口时默认 | **SpringBoot 2.x 起全局默认** |

SpringBoot 2.x 起默认 ==proxyTargetClass = true==(优先 CGLIB),即使目标实现了接口也用 CGLIB,保证注入时按具体类型装配不出错。

### JDK 动态代理手写一遍(面试手写高频)

\`\`\`java
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

public class JdkProxyDemo {
    interface OrderService { void create(); }
    static class OrderServiceImpl implements OrderService {
        public void create() { System.out.println("创建订单"); }
    }

    public static void main(String[] args) {
        OrderService target = new OrderServiceImpl();
        OrderService proxy = (OrderService) Proxy.newProxyInstance(
                target.getClass().getClassLoader(),
                target.getClass().getInterfaces(),
                new InvocationHandler() {
                    public Object invoke(Object p, Method m, Object[] a) throws Throwable {
                        System.out.println("[before] 记录日志");
                        Object ret = m.invoke(target, a);   // 反射调用目标方法
                        System.out.println("[after]  提交事务");
                        return ret;
                    }
                });
        proxy.create();
        System.out.println(proxy instanceof OrderService);
    }
}
\`\`\`

\`\`\`output
[before] 记录日志
创建订单
[after]  提交事务
true
\`\`\`

> [!tip] 一句话记住两者关系
> ==有接口 → JDK 代理,无接口 → CGLIB==;SpringBoot 2.x 后统一默认 CGLIB。追问"为什么默认改 CGLIB":避免"同一个 Bean 有的注入点按接口、有的按类"导致的类型不匹配问题。

## 切点、切面、通知与执行顺序

\`\`\`java
@Aspect
@Component
public class LogAspect {

    @Pointcut("execution(* com.demo.service..*Service.*(..))")
    public void serviceLayer() { }                 // 切点签名,方法体永远为空

    @Around("serviceLayer()")
    public Object around(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.currentTimeMillis();
        try {
            Object ret = pjp.proceed();            // 放行到目标方法
            System.out.println("耗时: " + (System.currentTimeMillis() - start) + "ms");
            return ret;
        } catch (Throwable e) {
            System.out.println("异常: " + e.getMessage());
            throw e;                               // 必须抛出,否则异常被吞、事务不回滚
        }
    }

    @Before("serviceLayer()")
    public void before(JoinPoint jp) {
        System.out.println("before: " + jp.getSignature().getName());
    }

    @After("serviceLayer()")
    public void after(JoinPoint jp) {
        System.out.println("after(最终通知,无论成败)");
    }

    @AfterReturning("serviceLayer()")
    public void afterReturning(JoinPoint jp) {
        System.out.println("afterReturning(正常返回才走)");
    }
}
\`\`\`

调用一次 orderService.create()(目标方法打印"创建订单"),完整输出:

\`\`\`output
before: create
创建订单
耗时: 12ms
after(最终通知,无论成败)
afterReturning(正常返回才走)
\`\`\`

**通知执行顺序(Spring 5.2.7+,背诵版)**:

\`\`\`text
@Around 前半段 → @Before → 目标方法 → @Around 后半段 → @After → @AfterReturning / @AfterThrowing
\`\`\`

多个切面用 ==@Order== 或 Ordered 接口排序,**值越小优先级越高、越在外层**。

> [!warn] 5.2.7 是个分水岭
> Spring 5.2.7 之前,@After 与 @AfterReturning 排在 @Around 后半段之前(旧顺序:Around 前半 → Before → After → AfterReturning → Around 后半)。回答时==先报版本再说顺序==,否则面试官拿旧文档挑战你。

## AOP 失效场景(与事务失效高度重合)

\`\`\`java
@Service
public class OrderService {
    public void create() {
        this.saveLog();                    // [err]this 是原始对象,不走代理,切面失效[/err]
    }

    @Transactional
    public void saveLog() { }
}
\`\`\`

失效的根因只有一句话:**AOP 靠代理对象拦截调用,而 this 调用绕过了代理**。常见场景:

| 场景 | 根因 | 解法 |
| --- | --- | --- |
| 方法内 this 自调用 | 绕过代理 | 注入自身代理 / AopContext / 拆类 |
| 方法非 public | 代理只拦截 public | 改 public |
| final / static 方法 | CGLIB 无法继承重写 | 避免修饰 |
| 类内 new 的对象 | 不归容器管,无代理 | 交给容器 |
| 异常被 try-catch 吞掉 | 通知感知不到异常 | 重新抛出 |

\`\`\`java
// 解法:注入自身代理(SpringBoot 会正确处理,注入的是代理对象)
@Service
public class OrderService {
    @Autowired
    private OrderService self;             // 注入的是代理,不是 this 指向的原始对象

    public void create() {
        self.saveLog();                    // 走代理,切面/事务生效
    }

    @Transactional
    public void saveLog() { }
}
\`\`\`

> [!pitfall] AopContext.currentProxy() 有开关
> 用 ==((OrderService) AopContext.currentProxy()).saveLog()== 也能解决自调用,但必须开启 ==@EnableAspectJAutoProxy(exposeProxy = true)==,否则运行时直接抛 IllegalStateException。新人最常栽在这个开关上。

## 面试速记

- Spring AOP = 运行期动态代理;AspectJ 是编译期织入,Spring 只借用其注解。
- JDK 代理基于接口反射;CGLIB 继承生成子类,final 无法代理;SpringBoot 2.x 默认 CGLIB。
- 通知顺序(5.2.7+):Around 前半 → Before → 目标 → Around 后半 → After → AfterReturning/Throwing;@Order 值越小越外层。
- 失效万变不离其宗:**没走代理**(自调用、非 public、final、new 出来的对象、异常被吞)。
- @Around 里 catch 后必须重新 throw,否则事务回滚也被一并吞掉。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch05',
        title: '事务管理与传播机制',
        minutes: 35,
        points: ['声明式事务', '7 种传播行为', '失效 8 连', '隔离级别'],
        content: `
> [!interview] 本章面试锚点
> 事务是业务面试必考项,追问路径固定:传播行为 → 失效场景 → @Transactional 底层是什么。先玩下面的演示,亲手触发一次回滚,再背结论。

> [!info] 本章导读 · 钱扣了,订单没生成,问题出在哪?
> 事务不是加个注解就万事大吉:方法自己调自己会失效、异常被吞会失效、传播行为配错会让该回滚的没回滚。
> 本章从一次扣款成功但下单失败的事故讲起,接着 AOP 把事务的边界讲清楚。
> - 读完本章你将能:区分编程式与声明式事务的适用场景
> - 背下七种传播行为,说清 REQUIRED 与 REQUIRES_NEW 的差别
> - 排查八种事务失效场景并给出修复方案

> [!tip] 日常电脑现场 · 转账只成功一半
> 网购付款时页面显示"已支付",后台扣库存那一步却超时,结果钱扣了货没锁上,只能人工退款。事务就是给这几步套一个总开关:扣款、减库存、生成订单要么全部记账,要么一条都不算数。

\`\`\`demo:tx-rollback
\`\`\`

## 编程式 vs 声明式

\`\`\`java
// ① 编程式事务:手动控制边界,粒度细,适合局部精确控制
@Service
public class TransferService {
    @Autowired
    private TransactionTemplate txTemplate;

    public void transfer(long from, long to, int amount) {
        txTemplate.executeWithoutResult(status -> {
            accountDao.deduct(from, amount);
            accountDao.add(to, amount);
        });                                     // lambda 内全程同一事务
    }
}
\`\`\`

\`\`\`java
// ② 声明式事务:AOP 代理自动包裹,业务零侵入(99% 的场景)
@Service
public class OrderService {

    @Transactional(rollbackFor = Exception.class)
    public void createOrder(Order order) {
        orderDao.insert(order);
        stockDao.deduct(order.getSkuId(), order.getCount());
    }
}
\`\`\`

> [!warn] rollbackFor 为什么必写
> 默认只对 ==RuntimeException 与 Error== 回滚,**受检异常不回滚**。方法里抛个 IOException,数据照样提交。生产规范:统一写 ==@Transactional(rollbackFor = Exception.class)==,别赌异常类型。

## 7 种传播行为(默写级)

| 传播行为 | 语义 | 记忆点 |
| --- | --- | --- |
| REQUIRED(默认) | 有事务就加入,没有就新建 | 最常用 |
| REQUIRES_NEW | **挂起当前事务,自己新开一个** | 内外事务独立提交/回滚 |
| NESTED | 在当前事务内开保存点 | 外层回滚带走内层,内层回滚不影响外层 |
| SUPPORTS | 有就加入,没有就非事务跑 | 查询类方法 |
| NOT_SUPPORTED | 挂起当前事务,以非事务运行 | 长查询不想占连接事务 |
| NEVER | 有事务就抛异常 | 强制非事务 |
| MANDATORY | 没有事务就抛异常 | 强制要求调用方已有事务 |

\`\`\`java
@Service
public class AuditService {
    // 审计日志:订单回滚了,操作日志也要留下 → 开新事务
    @Transactional(propagation = Propagation.REQUIRES_NEW,
                   rollbackFor = Exception.class)
    public void record(String action) {
        auditDao.insert(action);
    }
}

@Service
public class OrderService {
    @Transactional(rollbackFor = Exception.class)
    public void createOrder(Order order) {
        orderDao.insert(order);
        try {
            auditService.record("create:" + order.getId());
        } catch (Exception e) {
            // REQUIRES_NEW 的内层事务自己回滚,不影响外层,这里可以降级
            log.warn("audit fail", e);
        }
    }
}
\`\`\`

\`\`\`output
2026-01-01 12:00:00 WARN  OrderService - audit fail: Duplicate entry
[hl]外层 createOrder 正常提交:order 表新订单保留[/hl]
[hl]内层 record 单独回滚:audit 表无脏数据[/hl]
\`\`\`

REQUIRES_NEW 与 NESTED 一句话区分:**REQUIRES_NEW 是两个独立事务(内层已提交后,外层回滚不影响它);NESTED 是同一事务的保存点(外层回滚,内层跟着消失)**。

## 事务失效 8 种场景(大合集,背诵)

| # | 场景 | 根因 |
| --- | --- | --- |
| 1 | 方法内 this 自调用 | 没走代理 |
| 2 | 方法非 public | 事务切面只匹配 public |
| 3 | 抛受检异常未配 rollbackFor | 默认不回滚受检异常 |
| 4 | 异常被 try-catch 吞掉 | 切面看不到异常 |
| 5 | 对象没被 Spring 管理(new 出来的) | 没有代理 |
| 6 | 数据库引擎不支持事务(MyISAM) | 底层就没事务 |
| 7 | 传播行为配置错误(如 NOT_SUPPORTED) | 压根在非事务里跑 |
| 8 | 多线程调用 | 事务绑定 ThreadLocal,子线程不共享 |

\`\`\`java
@Transactional(rollbackFor = Exception.class)
public void createOrder(Order order) {
    orderDao.insert(order);
    this.deductStock(order);            // [err]失效场景 1:自调用,注解形同虚设[/err]
}

public void deductStock(Order order) {
    stockDao.deduct(order.getSkuId(), order.getCount());   // 不在事务内!
}
\`\`\`

\`\`\`output
orderDao.insert(order)   → 已提交(无事务,SQL 逐条自动提交)
deductStock 抛异常        → 方法异常结束
[err]order 表多了脏订单、库存未扣 —— 这就是事务失效的代价[/err]
\`\`\`

> [!pitfall] 第 8 种最隐蔽:事务与 ThreadLocal
> 事务连接绑定在 ==ThreadLocal==(TransactionSynchronizationManager)上。@Transactional 方法里开线程池写库,子线程用的是**另一个连接**,不在当前事务里 —— 主线程回滚了,子线程的数据照样提交。跨线程的一致性要用编程式事务手动编排,或改造成消息表/最终一致方案。

## @Transactional 的底层与隔离级别

底层一句话:**AOP 环绕通知 + 事务管理器**。启动时事务 Advisor 扫描 @Transactional 生成切面;调用时 ==TransactionInterceptor== 环绕拦截:开启事务(获取连接、setAutoCommit(false)、绑定 ThreadLocal)→ 目标方法正常 → 提交,抛出 rollbackFor 匹配的异常 → 回滚。真正的提交回滚由 JDBC ==Connection== 完成。

隔离级别(默认 ==DEFAULT==,即沿用数据库的默认档位):

| 隔离级别 | 脏读 | 不可重复读 | 幻读 |
| --- | --- | --- | --- |
| READ_UNCOMMITTED | 有 | 有 | 有 |
| READ_COMMITTED | 无 | 有 | 有 |
| REPEATABLE_READ | 无 | 无 | InnoDB 基本没有(MVCC + 间隙锁) |
| SERIALIZABLE | 无 | 无 | 无 |

> [!interview] 高频追问:Spring 事务和 MySQL 事务什么关系?
> Spring 事务是**应用层封装**,自己不实现事务,只是用统一 API(PlatformTransactionManager)编排 JDBC 的连接、提交、回滚;传播行为是 Spring 在应用层用"连接复用/挂起/保存点"模拟出来的概念,**数据库层并没有传播行为一说**。分清这两层,追问就难不倒。

## 面试速记

- 声明式 = AOP 代理 + TransactionInterceptor;编程式 = TransactionTemplate,粒度更细。
- 传播行为背三巨头:REQUIRED(加入)、REQUIRES_NEW(挂起新开,互不影响)、NESTED(保存点,外层回滚带走内层)。
- 默认只回滚 RuntimeException/Error,统一写 rollbackFor = Exception.class。
- 失效 8 连:自调用、非 public、受检异常、异常被吞、非容器管理、MyISAM、传播配置错、多线程。
- 隔离级别默认 DEFAULT 沿用数据库;InnoDB 的 RR 靠 MVCC + 间隙锁基本消灭幻读。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch06',
        title: 'SpringMVC 执行流程',
        minutes: 25,
        points: ['DispatcherServlet', '九大组件', '请求全流程', '拦截器'],
        content: `
> [!interview] 本章面试锚点
> "讲一下 SpringMVC 的执行流程"——必考画图题。回答框架:**一个入口(DispatcherServlet)+ 九大组件 + 六步流程**。带着"前端控制器模式"这个设计思想讲,层次立刻不一样。

> [!info] 本章导读 · 按下回车之后,请求在公司里跑了哪些部门?
> 浏览器发出一个请求,到你的 Controller 方法被执行,中间要经过找路由、绑参数、转返回值好几道工序,每一道都有人负责。
> 这套分工就是 MVC,也是前面所有能力最终对外的出口。
> - 读完本章你将能:完整画出一次请求的执行流程
> - 说清九大组件各自的职责
> - 分清过滤器和拦截器的边界与顺序

> [!tip] 日常电脑现场 · 银行大堂取号
> 进门先在取号机点"个人业务",拿到 A035 号小票,广播叫号后你走到 3 号窗口,柜员只看号码和证件就办完了。一次 HTTP 请求也这样:DispatcherServlet 取号,HandlerMapping 找窗口,HandlerAdapter 负责真正办理。

## 九大组件(挑重点记)

| 组件 | 作用 | 常考度 |
| --- | --- | --- |
| HandlerMapping | 找到能处理请求的 Handler(Controller 方法)+ 拦截器链 | 必考 |
| HandlerAdapter | **真正执行** Handler(反射调方法、参数绑定) | 必考 |
| HandlerExceptionResolver | 异常统一解析(@ExceptionHandler/@ControllerAdvice) | 常考 |
| HandlerInterceptor | 拦截器扩展点 | 必考 |
| ViewResolver | 逻辑视图名 → 真实 View(前后端分离下弱化) | 常考 |
| MultipartResolver | 文件上传解析 | 了解 |
| LocaleResolver / ThemeResolver | 国际化 / 主题 | 了解 |

前后端分离时代 ViewResolver 弱化为直接返回 JSON,但 **HandlerMapping → HandlerAdapter → HandlerExceptionResolver** 这条主线永远是核心。

## 请求处理全流程(六步背诵版)

\`\`\`diagram:d-mvc
\`\`\`

**DispatcherServlet 就是公司的前台兼调度中心**:所有客户请求一律先到前台,前台看一眼工单类型,派给对应部门(Controller)处理,结果收回来统一盖章再答复客户。部门怎么换班扩编,客户完全无感。

\`\`\`text
① 请求统一到达 DispatcherServlet(前端控制器,唯一入口)
② 查 HandlerMapping → 返回 HandlerExecutionChain(Handler + 拦截器链)
③ 按 Handler 类型选 HandlerAdapter
④ 拦截器 preHandle → 参数绑定 → 执行 Controller 方法 → 返回值处理
   (@ResponseBody:HttpMessageConverter 转 JSON 直接写回;
    普通返回:ViewResolver 解析视图 → View 渲染)
⑤ 有异常?→ HandlerExceptionResolver 兜底 → @ControllerAdvice 统一处理
⑥ 拦截器 postHandle → 渲染/写响应 → afterCompletion
\`\`\`

### 源码骨架(简化版 doDispatch,感受主线)

\`\`\`java
// 简化后的 DispatcherServlet#doDispatch,真实代码更长但主线一致
protected void doDispatch(HttpServletRequest request,
                          HttpServletResponse response) throws Exception {
    // ② HandlerMapping:找到 Handler 与拦截器链
    HandlerExecutionChain mappedHandler = getHandler(request);
    // ③ 适配器:按 Handler 类型选
    HandlerAdapter ha = getHandlerAdapter(mappedHandler.getHandler());

    // ④ 拦截器 preHandle,返回 false 则流程终止
    if (!mappedHandler.applyPreHandle(request, response)) return;

    // 真正执行 Controller(参数绑定 + 反射调用)
    ModelAndView mv = ha.handle(request, response, mappedHandler.getHandler());

    mappedHandler.applyPostHandle(request, response, mv);        // ⑥ postHandle
    processDispatchResult(request, response, mappedHandler, mv); // 渲染/异常解析
    mappedHandler.triggerAfterCompletion(request, response, null); // afterCompletion
}
\`\`\`

> [!tip] 设计思想是加分项
> DispatcherServlet 是典型的**前端控制器(Front Controller)模式**:所有请求集中入口,再用九大组件分发协作;组件都是接口 + 默认实现,启动时加载默认配置,随时可替换 —— 这就是"开放封闭原则"在框架层的落地。

## 参数绑定与返回值

\`\`\`java
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    // GET /api/orders/1001
    @GetMapping("/{id}")
    public Order detail(@PathVariable Long id,
                        @RequestParam(required = false) Set<String> fields) {
        return orderService.detail(id);          // 对象 → Jackson 序列化为 JSON
    }

    // POST /api/orders,Content-Type: application/json
    @PostMapping
    public Result create(@RequestBody @Valid OrderCreateDTO dto) {
        return Result.ok(orderService.create(dto));   // JSON 反序列化 + 校验
    }
}
\`\`\`

\`\`\`shell
curl -s http://localhost:8080/api/orders/1001
curl -s -X POST http://localhost:8080/api/orders -H "Content-Type: application/json" -d '{"skuId":1,"count":2}'
\`\`\`

\`\`\`output
{"id":1001,"skuId":1,"count":2,"status":"CREATED"}
{"code":0,"msg":"ok","data":{"id":2001}}
\`\`\`

绑定规则速记:==@PathVariable== 取路径段、==@RequestParam== 取查询串/表单项、==@RequestBody== 取请求体(JSON → 对象,靠 HttpMessageConverter)、==@RequestHeader/@CookieValue== 取头/Cookie。不加注解的 POJO 参数按**查询串/表单字段名自动装配到 setter**。

> [!pitfall] @RequestBody 一个方法只能有一个
> 请求体是流,只能读一次,出现两个 @RequestBody 必然失败。嵌套结构直接用 DTO 字段表达,不要试图收第二个 body。另外 @Valid + BindingResult 或全局异常处理器接 MethodArgumentNotValidException 是参数校验的标准姿势。

## 拦截器 vs 过滤器(必考对比)

| 维度 | Filter | HandlerInterceptor |
| --- | --- | --- |
| 归属 | Servlet 规范,容器(Tomcat)回调 | SpringMVC 提供,DispatcherServlet 调度 |
| 作用范围 | **DispatcherServlet 之前**,所有请求含静态资源 | 进入 MVC 之后,只拦 Handler |
| 执行粒度 | doFilter 前后 | preHandle / postHandle / afterCompletion |
| 能拿到的信息 | 只有 request/response | 还有 Handler 与 ModelAndView |
| 异常 | 不进 @ControllerAdvice | 会走 HandlerExceptionResolver |

\`\`\`java
@Component
public class AuthInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse resp,
                             Object handler) {
        String token = req.getHeader("Authorization");
        if (token == null || token.isBlank()) {
            resp.setStatus(401);
            return false;                    // false = 链条到此为止,Handler 不执行
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest req, HttpServletResponse resp,
                                Object handler, Exception ex) {
        // 无论成败都会执行:清理 ThreadLocal(如用户上下文)的标准位置
    }
}
\`\`\`

\`\`\`java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Autowired
    private AuthInterceptor authInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/login", "/api/register");
    }
}
\`\`\`

\`\`\`output
GET /api/orders/1001(无 token):
[err]HTTP 401 —— preHandle 返回 false,Controller 根本没执行[/err]
GET /api/login → 200(excludePathPatterns 放行)
\`\`\`

## 全局异常·参数校验与过滤器

### @RestControllerAdvice:全局异常统一出口

\`\`\`java
// ① 自定义业务异常:携带业务码
public class BusinessException extends RuntimeException {
    private final int code;

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }

    public int getCode() { return code; }
}
\`\`\`

\`\`\`java
// ② 统一响应体 + 全局异常处理器
public record Result(int code, String msg, Object data) {
    public static Result ok(Object data)            { return new Result(0, "ok", data); }
    public static Result fail(int code, String msg) { return new Result(code, msg, null); }
}

@RestControllerAdvice                  // = @ControllerAdvice + @ResponseBody,结果自动转 JSON
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)          // 业务异常:原样透出业务码
    public Result handleBusiness(BusinessException e) {
        return Result.fail(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(Exception.class)                  // 兜底:细节进日志,不进响应
    public Result handleOther(Exception e) {
        log.error("unhandled exception", e);            // @Slf4j 提供的 log
        return Result.fail(500, "系统繁忙,请稍后再试");
    }
}
\`\`\`

\`\`\`java
// ③ 业务代码里随手抛,Controller 不用写 try-catch
Order order = orderDao.find(id);
if (order == null) {
    throw new BusinessException(40401, "订单不存在");
}
\`\`\`

\`\`\`output
GET /api/orders/9999 →
[hl]HTTP 200,body:{"code":40401,"msg":"订单不存在","data":null}[/hl]
业务错误用 body 里的 code 表达,HTTP 状态码保持 200,前端只认 code
\`\`\`

匹配规则:**按异常类型就近匹配**(子类优先);没被接住的异常上抛,由 Exception 兜底方法收尾。

### 参数校验:@Validated + JSR-303 注解

常用校验注解速查:

| 注解 | 规则 | 常用于 |
| --- | --- | --- |
| @NotNull | 非 null(可以是空串) | id、对象引用 |
| @NotBlank | 非 null 且去空格后非空 | 姓名、标题 |
| @Size(min,max) | 长度/元素个数范围 | 字符串、集合 |
| @Pattern(regexp) | 正则匹配 | 手机号、编号 |
| @Min / @Max | 数值边界 | 年龄、数量 |
| @Email | 邮箱格式 | 邮箱字段 |

\`\`\`java
public class OrderCreateDTO {

    @NotNull(message = "不能为空")
    private Long skuId;

    @Min(value = 1, message = "至少为 1")
    private Integer count;

    @NotBlank(message = "不能为空")
    @Size(max = 20, message = "最长 20 字")
    private String receiver;

    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    private String phone;
}

@RestController
public class OrderController {

    @PostMapping("/api/orders")
    public Result create(@RequestBody @Valid OrderCreateDTO dto) {   // @Valid 触发校验
        return Result.ok(orderService.create(dto));
    }
}
\`\`\`

> [!info] @Valid 与 @Validated 分工
> ==@Valid==(JSR-303):支持**嵌套对象级联校验**(字段上再标 @Valid);==@Validated==(Spring):支持**分组校验**,且能标在类上让 @RequestParam/@PathVariable 也走校验。Bean 入参校验失败抛 ==MethodArgumentNotValidException==,非 Bean 参数校验失败抛 ==ConstraintViolationException== —— 两把都要接。

校验失败转统一格式(在 GlobalExceptionHandler 里追加):

\`\`\`java
@ExceptionHandler(MethodArgumentNotValidException.class)
public Result handleInvalid(MethodArgumentNotValidException e) {
    String msg = e.getBindingResult().getFieldErrors().stream()
            .map(f -> f.getField() + " " + f.getDefaultMessage())
            .collect(Collectors.joining("; "));
    return Result.fail(40001, msg);       // 所有字段错误一次说清
}
\`\`\`

\`\`\`output
POST /api/orders,body:{"skuId":null,"count":0,"receiver":"","phone":"123"} →
[hl]{"code":40001,"msg":"skuId 不能为空; count 至少为 1; receiver 不能为空; phone 手机号格式不正确","data":null}[/hl]
\`\`\`

### OncePerRequestFilter:保证"一次请求只走一次"

普通 Filter 在**请求转发(forward)或异步分发(ASYNC)**时会被再次进入,鉴权、埋点这类只该执行一次的逻辑就会重复跑。==OncePerRequestFilter==(Spring 提供)用 request attribute 做已执行标记,保证一次请求内核心逻辑只执行一次,并提供 shouldNotFilterAsyncDispatch 开关控制异步分发是否过滤 —— 这就是"为什么需要它"的完整答案。

\`\`\`java
public class JwtAuthFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse resp,
                                    FilterChain chain) throws ServletException, IOException {
        String token = req.getHeader("Authorization");
        if (token == null || !jwtVerifier.verify(token)) {   // 只执行一次的鉴权
            resp.setStatus(401);
            resp.getWriter().write("{\\"code\\":40100,\\"msg\\":\\"未登录\\"}");
            return;                    // 不调 chain.doFilter,后续链路全部终止
        }
        chain.doFilter(req, resp);     // 放行
    }
}

@Bean
public FilterRegistrationBean<JwtAuthFilter> jwtFilter() {   // 注册并控制顺序
    FilterRegistrationBean<JwtAuthFilter> reg =
            new FilterRegistrationBean<>(new JwtAuthFilter());
    reg.addUrlPatterns("/api/*");
    reg.setOrder(1);                   // 数字越小越先执行
    return reg;
}
\`\`\`

### Filter 与 Interceptor:执行顺序与异常范围

\`\`\`text
请求 → Filter.doFilter(前半段) → DispatcherServlet
     → Interceptor.preHandle → Controller 方法执行 → postHandle → 写响应
     → Interceptor.afterCompletion → Filter.doFilter(后半段) → 响应离开

异常流向(关键差异):
Controller 抛异常 → 拦截器只有 afterCompletion 被通知,
                    随后交给 @RestControllerAdvice 统一处理 ✓
Filter 内抛异常   → @RestControllerAdvice 管不到 ✗,
                    走容器 ErrorPage,或在 Filter 里自己 try-catch 写响应
\`\`\`

> [!pitfall] postHandle 在前后端分离下基本没用
> REST 接口走 @ResponseBody,postHandle 拿到的 ModelAndView 是空的,且它执行在响应写出之前,改不了已序列化的 body;要在写响应前加工返回值,用 ==ResponseBodyAdvice== 才是正解。ThreadLocal(用户上下文)清理放 afterCompletion 最稳 —— preHandle 返回 false 时它自己的 afterCompletion 不执行,但**前面已通过的拦截器**都会执行。

分工口诀:Filter 管编码/跨域/认证,Interceptor 管登录态/权限,Advice 管异常兜底 —— 别在 Filter 里调业务,别在 Advice 里做鉴权。

## 面试速记

- 执行流程六步:入口 → HandlerMapping → HandlerAdapter → preHandle + 执行 → 异常解析/渲染 → postHandle + afterCompletion。
- 核心三组件:HandlerMapping 找人、HandlerAdapter 干活、HandlerExceptionResolver 兜底。
- Filter 属 Servlet 规范拦在容器层,Interceptor 属 SpringMVC 拦在 Handler 层,范围与能力不同。
- 参数绑定三板斧:@PathVariable 路径、@RequestParam 查询串、@RequestBody 请求体。
- 拦截器 afterCompletion 是清理 ThreadLocal(用户上下文)的标准位置。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch07',
        title: 'SpringBoot 自动配置原理',
        minutes: 30,
        points: ['EnableAutoConfiguration', '条件注解', 'starter', '内嵌 Tomcat'],
        content: `
> [!interview] 本章面试锚点
> "SpringBoot 为什么开箱即用?"标准答案一句话:**约定大于配置 + 自动配置**。追问路径:@SpringBootApplication 里有什么 → 自动配置清单在哪 → 条件注解怎么生效 → 怎么自定义 starter。本章按这条追问链组织。

> [!info] 本章导读 · 为什么加个依赖,项目就自己配好了?
> 引入 web starter,端口、编码、JSON 转换全都默认就绪,你一行配置都没写。
> 这不是魔法,而是一份清单加一堆条件注解在背后工作;本章收束整个模块,让你能自己写 starter。
> - 读完本章你将能:拆解 @SpringBootApplication 的三个组成部分
> - 讲清自动配置的加载链路与条件装配
> - 动手写出一个可用的自定义 starter

> [!tip] 日常电脑现场 · 换显卡自动装驱动
> 把新显卡插上主板,开机后系统自己认出型号、装好驱动,分辨率直接对了,你并没有点过任何安装向导。Spring Boot 的自动配置就是这种即插即用:类路径上一出现某个 jar,对应的配置类就按条件自己生效。

## 从 @SpringBootApplication 拆开

\`\`\`java
@SpringBootConfiguration     // 本质是 @Configuration,启动类就是个配置类
@EnableAutoConfiguration     // 自动配置的总开关(核心)
@ComponentScan               // 扫描启动类所在包及子包
public @interface SpringBootApplication { }
\`\`\`

\`\`\`java
// @EnableAutoConfiguration 内部(简化)
@AutoConfigurationPackage                        // 把启动类所在包注册为默认扫描包
@Import(AutoConfigurationImportSelector.class)   // 关键:导入选择器
public @interface EnableAutoConfiguration { }
\`\`\`

关键认知:自动配置类都在第三方 jar 包里,**@ComponentScan 根本扫不到**,它们是靠 ==@Import + ImportSelector== 在配置类解析阶段**主动读清单文件拉进容器**的 —— 这句话是理解分水岭。

## 清单文件:spring.factories 与 imports 文件

\`\`\`properties
# SpringBoot 2.7 之前:META-INF/spring.factories(节选)
org.springframework.boot.autoconfigure.EnableAutoConfiguration=org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration
\`\`\`

\`\`\`text
# SpringBoot 3.0 起:META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
# 内容就是一行一个全限定类名,不再走 spring.factories
org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration
org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration
\`\`\`

| 项 | SpringBoot 2.7 前 | SpringBoot 3.0+ |
| --- | --- | --- |
| 注册文件 | META-INF/spring.factories | META-INF/spring/...AutoConfiguration.imports |
| 读取方式 | SpringFactoriesLoader | ImportCandidates |
| 推荐注解 | @Configuration | @AutoConfiguration |

\`\`\`java
// AutoConfigurationImportSelector 的核心(简化版,直接背)
protected List<String> getCandidateConfigurations(AnnotationMetadata metadata) {
    // 2.7-:SpringFactoriesLoader 读 spring.factories;3.0+:读 .imports 文件
    List<String> configurations = loadCandidateFiles();
    configurations = removeDuplicates(configurations);
    configurations = getConfigurationClassFilter().filter(configurations); // 条件过滤
    fireAutoConfigurationImportEvents(configurations, exclusions);
    return configurations;
}
\`\`\`

> [!warn] 2.7 → 3.0 的迁移是高频新考点
> 自动配置注册从 ==spring.factories== 迁移到 ==AutoConfiguration.imports== 文件,注解推荐用 ==@AutoConfiguration==(内部含代理配置)。面试聊到 SpringBoot 3 提这个细节,非常显专业。

## 条件注解:按需装配的开关

| 注解 | 生效条件 |
| --- | --- |
| @ConditionalOnClass | 类路径存在指定类(引了依赖) |
| @ConditionalOnMissingBean | 容器中**没有**该 Bean 才生效 → 用户自定义优先 |
| @ConditionalOnBean | 容器中存在指定 Bean |
| @ConditionalOnProperty | 配置项满足条件 |
| @ConditionalOnWebApplication | 是 Web 应用 |

\`\`\`java
// 自动配置类的典型形态(仿 RedisAutoConfiguration,简化版)
@AutoConfiguration
@ConditionalOnClass(RedisOperations.class)            // 引了依赖(类在 classpath)才继续
@EnableConfigurationProperties(RedisProperties.class) // yml 的 spring.data.redis.* 绑定到这
public class RedisAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean(name = "redisTemplate")  // 用户没自己定义才给默认
    public RedisTemplate<Object, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<Object, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        return template;
    }
}
\`\`\`

\`\`\`java
public class CheckAutoConfig {
    public static void main(String[] args) {
        // pom 里引了 spring-boot-starter-data-redis → 自动配置生效
        ApplicationContext ctx = SpringApplication.run(App.class);
        System.out.println(ctx.containsBean("redisTemplate"));
    }
}
\`\`\`

\`\`\`output
true
\`\`\`

> [!tip] "默认配置怎么让位给用户"一句话答法
> 自动配置一律 ==@ConditionalOnMissingBean== 兜底:**用户定义了就用用户的,没定义才给默认值**。这就是"约定大于配置"的机制本质 —— 先约定,后让位。

## starter 原理与自定义

starter 只是**依赖聚合 + 自动配置入口**,本身几乎没有代码:

\`\`\`xml
<!-- 官方命名:spring-boot-starter-xxx;第三方命名:xxx-spring-boot-starter -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
\`\`\`

一个 starter 背后通常两层:==spring-boot-starter-xxx==(聚合依赖)→ ==spring-boot-xxx-autoconfigure==(自动配置类 + imports 清单)。

自定义 starter 三步:

- 写功能类 + 自动配置类(带 @ConditionalOnXxx 与 @EnableConfigurationProperties 绑定 yml);
- 在 ==META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports== 登记配置类全限定名;
- 打包发布,使用者引依赖即用,零 XML、零手动配置。

> [!pitfall] 版本交给 BOM 管
> SpringBoot 用 ==spring-boot-dependencies== BOM 统一锁版本,自己的 starter 引第三方库时**不要写死版本号**,否则与 BOM 冲突时依赖仲裁结果不可预测。引入 starter 后用 ==mvn dependency:tree== 排查传递依赖是基本功。

## 内嵌 Tomcat:为什么 jar 能直接跑

传统:打 war → 装外部 Tomcat → 部署。SpringBoot 反转:**Tomcat 作为 jar 依赖进项目,启动时由代码创建**。

\`\`\`java
// ServletWebServerFactoryAutoConfiguration 的思路(简化)
@AutoConfiguration
@ConditionalOnClass({ Servlet.class, Tomcat.class })     // 引了 tomcat-embed 依赖
public class EmbeddedTomcatAutoConfiguration {
    @Bean
    public TomcatServletWebServerFactory tomcatServletWebServerFactory() {
        return new TomcatServletWebServerFactory();      // 工厂负责创建内嵌 Tomcat
    }
}
\`\`\`

启动主线:==SpringApplication.run()== → 推断应用类型(Servlet Web)→ 创建对应的 ApplicationContext → refresh() 的 ==onRefresh()== 里调 ==createWebServer()== → 工厂启动内嵌 Tomcat,监听 ==server.port==。

\`\`\`shell
# 一行命令启动 Web 应用,不需要任何外部容器
mvn spring-boot:run
\`\`\`

\`\`\`output
Tomcat started on port 8080 (http) with context path ''
[hl]Started Application in 2.314 seconds (process running for 2.9)[/hl]
\`\`\`

## 配置加载:@Value·@ConfigurationProperties 与优先级

### 六维对比:零散取值 vs 整组绑定

| 维度 | @Value | @ConfigurationProperties |
| --- | --- | --- |
| 松散绑定 | 不支持,键名必须完全一致 | **支持**:kebab-case / 下划线 / 大写自动映射 camelCase |
| SpEL | **支持** #{...} 表达式 | 不支持 |
| 配置元数据 | 无提示 | 配 configuration-processor 有 yml 自动补全 |
| JSR-303 校验 | 不支持 | **支持** @Validated + 字段注解 |
| 类型安全 | 弱:拿到字符串手动转 | **强**:直接绑定字段/集合/嵌套对象 |
| 批量管理 | 逐个注解,散落各处 | **一个类收拢一组配置**,前缀统一 |

背诵版:==零散取一个值用 @Value,一组相关配置用 @ConfigurationProperties==;Boot 官方的 ServerProperties / RedisProperties 全是后者。

### @ConfigurationProperties:嵌套对象 + @Validated 校验

\`\`\`yml
# application.yml
app:
  mail:
    host: smtp.example.com
    port: 465
    ssl-enabled: true              # kebab-case → 字段 sslEnabled(松散绑定)
    default-cc: [zhang@example.com, li@example.com]
    retry:                         # 嵌套前缀 → 内部类 Retry
      max-attempts: 3
      interval-seconds: 10
\`\`\`

\`\`\`java
@ConfigurationProperties(prefix = "app.mail")
@Validated                                        // 开启 JSR-303 校验
public class MailProperties {

    @NotBlank                                     // 校验注解直接标字段
    private String host;

    @Min(1) @Max(65535)
    private int port = 25;

    private boolean sslEnabled = false;

    private List<String> defaultCc = new ArrayList<>();

    private final Retry retry = new Retry();      // 嵌套对象按 app.mail.retry 绑定

    public static class Retry {
        @Min(1) private int maxAttempts = 3;
        private int intervalSeconds = 5;
        // getter/setter 省略
    }
    // getter/setter 省略
}
\`\`\`

\`\`\`java
// 生效方式:① 类上加 @Component;② 用 @EnableConfigurationProperties 注册(自动配置类都这么干)
@Configuration
@EnableConfigurationProperties(MailProperties.class)
public class MailConfig { }

@Service
public class MailService {
    private final MailProperties props;

    public MailService(MailProperties props) { this.props = props; }

    public void show() {
        System.out.println(props.getHost() + ":" + props.getPort()
                + " ssl=" + props.isSslEnabled()
                + " retry=" + props.getRetry().getMaxAttempts());
    }
}
\`\`\`

\`\`\`output
smtp.example.com:465 ssl=true retry=3
[hl]kebab-case 自动映射 camelCase,嵌套前缀 app.mail.retry 绑进内部类[/hl]
\`\`\`

> [!tip] 松散绑定的唯一例外
> ==环境变量没有大小写与点号语义==,必须写成 APP_MAIL_SSLENABLED 形式(点变下划线),SpringBoot 靠规范命名反向映射;这也是容器/k8s 部署传配置的标准姿势。

### 外部化配置优先级(面试背诵版,高 → 低)

\`\`\`text
① 命令行参数                              --server.port=9090
② SPRING_APPLICATION_JSON                 环境变量或系统属性里的 JSON 配置
③ Java 系统属性(-D 启动参数)             java -Dserver.port=9090 -jar app.jar
④ 操作系统环境变量                         SERVER_PORT=9090
⑤ application-{profile}.yml / properties  被 spring.profiles.active 激活的那份
⑥ application.yml / application.properties 主配置文件
更高优先级的同名键覆盖更低的;官方完整清单有十几项,面试背这 6 级足够。
\`\`\`

\`\`\`shell
# 验证:yml 里写 server.port=8080,命令行直接压过它
java -jar app.jar --server.port=9090
\`\`\`

\`\`\`output
Tomcat started on port [hl]9090[/hl] (http)
[hl]命令行优先级最高,覆盖了 application.yml 里的 8080[/hl]
\`\`\`

> [!interview] 高频追问:同目录下 properties 和 yml 谁优先?
> 同优先级时 ==.properties > .yml==(properties 后加载,同名键覆盖 yml)。追问"k8s 为什么要用环境变量传配置":镜像里的 application.yml 是⑥级,环境变量是④级,==一次构建、多环境部署==时改环境变量即可覆盖,不用重打镜像。

### @PropertySource 与 Environment 读取

\`\`\`java
// @PropertySource:加载 SpringBoot 主流程不扫描的自定义 properties 文件
@Configuration
@PropertySource(value = "classpath:custom.properties", encoding = "UTF-8")
public class CustomConfig { }

// classpath:custom.properties 内容
// biz.token=abc123
// biz.timeout=3000
\`\`\`

\`\`\`java
@Service
public class TokenService {
    private final Environment env;              // 所有外部化配置的统一门面

    public TokenService(Environment env) { this.env = env; }

    public void print() {
        System.out.println(env.getProperty("biz.token"));
        System.out.println(env.getProperty("biz.missing", "5000"));  // 带默认值
    }
}
\`\`\`

\`\`\`output
abc123
5000
[hl]Environment 聚合了全部配置源,@Value 解析占位符底层也是走它[/hl]
\`\`\`

## 面试速记

- 自动配置 = @EnableAutoConfiguration + AutoConfigurationImportSelector 读清单 + 条件注解过滤。
- 清单文件:2.7 前 spring.factories,3.0+ META-INF/spring/...AutoConfiguration.imports。
- @ConditionalOnMissingBean 是"用户配置优先"的机制保障,先约定后让位。
- starter = 依赖聚合 + 自动配置;自定义三步:功能类、配置类、登记 imports 文件。
- 内嵌 Tomcat:ServletWebServerFactory 工厂在 refresh 的 onRefresh 阶段创建并启动。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch07a',
        title: 'SpringBoot 启动流程与内嵌容器',
        minutes: 30,
        points: ['SpringApplication.run', 'Environment', '内嵌 Tomcat', 'Runner 扩展点'],
        content: `
> [!info] 本章导读 · main 方法里一行 run(),背后到底发生了什么?
> 你只写了三行:一个注解、一个 main、一句 SpringApplication.run,项目就带着 Tomcat 跑起来了。
> 可面试官偏要问:这行 run 里创建了几个对象?Tomcat 是什么时候 new 出来的?Runner 在哪个阶段执行?本章把这一行拆成十几步,让你以后看启动日志都能对上号。
> - 读完本章你将能:说出 run() 的完整步骤与沿途发布的关键事件
> - 讲清内嵌 Tomcat 的"创建"与"启动"分别发生在哪一步
> - 用 Runner、Listener 在正确的时机插入初始化逻辑

> [!tip] 日常电脑现场 · 双击游戏图标
> 双击桌面上的游戏图标,登录器、更新、加载资源、进主界面,进度条一格一格走完,里面的进程你一个都没手动启动过。SpringApplication.run 同样是这一长串动作:准备环境、建容器、启动内嵌 Tomcat、发布事件,最后才轮到你的代码。

## 一行代码的魔法:SpringApplication.run 全景

\`\`\`java App.java
@SpringBootApplication
public class App {
    public static void main(String[] args) { SpringApplication.run(App.class, args); }
}
\`\`\`

这行 run 分两段:**构造 SpringApplication** 与 **执行 run 模板方法**。构造阶段做三件事:按 classpath 推断 Web 类型(NONE / SERVLET / REACTIVE)、从 spring.factories 加载 ApplicationContextInitializer 与 ApplicationListener、推断主类。run 阶段则是一条固定流水线:

| 步骤 | 阶段 | 关键动作 |
| --- | --- | --- |
| 1 | 构造 | 推断 Web 类型、加载 Initializer 与 Listener、定位主类 |
| 2 | prepareEnvironment | 创建 Environment,加载 application.yml,激活 profile |
| 3 | printBanner | 打印 Banner(banner-mode=off 可关) |
| 4 | createApplicationContext | 按 Web 类型反射创建 AnnotationConfigServletWebServerApplicationContext |
| 5 | prepareContext | 应用 Initializer、注册主类 BeanDefinition、发布 ContextLoadedEvent |
| 6 | refreshContext | 配置类解析 → 自动配置 → 单例化 → onRefresh 创建 Tomcat |
| 7 | finishRefresh | WebServerStartStopLifecycle 启动 Tomcat,发布 ContextRefreshedEvent |
| 8 | listeners.started | 发布 ApplicationStartedEvent,LivenessState=CORRECT |
| 9 | callRunners | 依次执行 ApplicationRunner 与 CommandLineRunner |
| 10 | listeners.ready | 发布 ApplicationReadyEvent,ReadinessState=ACCEPTING_TRAFFIC |

\`\`\`text
new SpringApplication(App.class): 推断 Web 类型 / 读 spring.factories 加载 Initializer 与 Listener
run(args):
  ① prepareEnvironment  application.yml、profile、EnvironmentPostProcessor
  ② printBanner → ③ createApplicationContext → ④ prepareContext(注册主类)
  ⑤ refreshContext     配置类解析 → 自动配置 → 单例化 → onRefresh 建 Tomcat
  ⑥ finishRefresh      启动 Tomcat、发布 ContextRefreshedEvent
  ⑦ listeners.started → ⑧ callRunners → ⑨ listeners.ready(ApplicationReadyEvent)
\`\`\`

## Environment 与配置加载时机

application.yml 不是启动类读的,而是在 ==prepareEnvironment== 阶段由 **ConfigDataEnvironmentPostProcessor**(一个 EnvironmentPostProcessor)按 spring.config.name / location 找出来加载的,随后才轮到容器创建。所以任何"要在 Bean 创建前读配置"的逻辑,都该挂在这一步。

\`\`\`java MyEnvPostProcessor.java
public class MyEnvPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment env, SpringApplication app) {
        Map<String, Object> map = new HashMap<>();
        map.put("app.region", "cn-hangzhou");
        env.getPropertySources().addLast(new MapPropertySource("myEnv", map));
    }
}
\`\`\`

\`\`\`properties META-INF/spring.factories
# EnvironmentPostProcessor 这类 SPI 在 Boot 3 里仍然登记在 spring.factories
org.springframework.boot.env.EnvironmentPostProcessor=com.demo.config.MyEnvPostProcessor
\`\`\`

> [!info] 配置优先级一句话回顾
> 命令行 > SPRING_APPLICATION_JSON > 系统属性 > 环境变量 > application-{profile}.yml > application.yml。完整清单与 @ConfigurationProperties 的细节在前面的章节已经拆过,这里只补一条:**后加载的 EnvironmentPostProcessor 优先级更低,想覆盖别人就用 addFirst**。

## 内嵌 Tomcat:jar 为什么能自带服务器

传统部署是"先装 Tomcat,再把 war 丢进去";SpringBoot 反过来:**Tomcat 就是一组 jar(tomcat-embed-core),由 main 线程在进程内 new 出来**。入口在 ServletWebServerApplicationContext:

\`\`\`java
// ServletWebServerApplicationContext(简化)
@Override
protected void onRefresh() {
    super.onRefresh();
    createWebServer();                  // 创建 Tomcat 与 Connector,此时还没监听端口
}

private void createWebServer() {
    ServletWebServerFactory factory = getWebServerFactory();     // TomcatServletWebServerFactory
    this.webServer = factory.getWebServer(getSelfInitializer());  // new Tomcat() + addContext
}
\`\`\`

真正的 start 在 refresh 的最后一步:==finishRefresh → WebServerStartStopLifecycle#start → TomcatWebServer#start==,日志 "Tomcat started on port 8080" 就是这里打的。**创建在 onRefresh、启动在 finishRefresh**,这个细节能区分看过源码的人和只背过八股的人。
另外,不装 Tomcat 的底气:容器版本随依赖走,IDE 直接 run main,打包后 ==java -jar== 即可,天然适合容器化。

\`\`\`yml application.yml
server:
  port: 8080
  tomcat:
    threads:
      max: 200             # 最大工作线程
      min-spare: 10        # 最小空闲线程
    accept-count: 100      # 等待队列长度
    max-connections: 8192  # 最大连接数
    connection-timeout: 2s
\`\`\`

换容器只需排除 Tomcat starter、引入对应 starter(以 Jetty 为例;Undertow 换 spring-boot-starter-undertow):

\`\`\`xml pom.xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <exclusion>
            <groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-tomcat</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-jetty</artifactId>
</dependency>
\`\`\`

\`\`\`output
Tomcat started on port 8080 (http) with context path ''
Started App in 1.874 seconds (process running for 2.31)
\`\`\`

> [!pitfall] 换容器别只加依赖
> 只加 spring-boot-starter-jetty 而不排除 spring-boot-starter-tomcat,两个容器都留在 classpath,自动配置按优先级只启一个,但依赖冲突与端口行为会变得极难排查。**先排除,再加**。

## 启动扩展点

容器刷新完成后、对外宣告就绪前,SpringBoot 留了两个"启动即执行"的钩子:

| 维度 | ApplicationRunner | CommandLineRunner |
| --- | --- | --- |
| 入参 | ApplicationArguments,可解析 --key=value | String[] 原始参数 |
| 执行时机 | refresh 之后、ApplicationReadyEvent 之前 | 相同,两者按 @Order 混排 |
| 适用场景 | 需要区分选项参数与普通参数 | 简单脚本式参数 |
| 抛异常 | 启动失败,进程退出 | 同样失败退出 |

\`\`\`java StartupRunners.java
@Component
@Order(1) public class CacheWarmUpRunner implements ApplicationRunner {
    @Override
    public void run(ApplicationArguments args) {
        System.out.println("option names = " + args.getOptionNames());
        System.out.println("[warm-up] 热点数据加载完成");
    }
}
@Component
@Order(2) public class SimpleRunner implements CommandLineRunner {
    @Override public void run(String... args) {
        System.out.println("[simple] args length = " + args.length);
    }
}
\`\`\`

\`\`\`shell
java -jar app.jar --env=prod
\`\`\`

\`\`\`output
option names = [env]
[warm-up] 热点数据加载完成
[simple] args length = 1
\`\`\`

> [!warn] Runner 里不要做长耗时任务
> Runner 是同步执行的,卡住就意味着 ApplicationReadyEvent 迟迟不发,K8s 的 readiness 探针会判定未就绪。预热要么异步,要么放进 SmartLifecycle 分阶段做。

ApplicationListener 是另一条线:实现 ==ApplicationListener<ApplicationReadyEvent>==,或直接用 ==@EventListener(ApplicationReadyEvent.class)==,就能监听从 ApplicationStartingEvent 到 ApplicationFailedEvent 的全过程,适合做埋点、审计与启动耗时统计。

@SpringBootApplication 本身是三合一:==@SpringBootConfiguration==(本质 @Configuration,启动类也是配置类)、==@EnableAutoConfiguration==(@Import 自动配置选择器)、==@ComponentScan==(扫描启动类所在包及子包)。三者拆开也能用,合在一起只是省事。

## 启动过程一图流

\`\`\`text
main() → SpringApplication.run()
  ├─ prepareEnvironment ─────▶ Environment(application.yml / profile)
  ├─ createApplicationContext ▶ ServletWebServerApplicationContext
  ├─ refreshContext: 配置类解析 → 自动配置 → 单例化 → onRefresh 建 Tomcat
  ├─ finishRefresh: 启动 Tomcat + 发布 ContextRefreshedEvent
  ├─ callRunners: ApplicationRunner / CommandLineRunner
  └─ ready: ApplicationReadyEvent,流量放行
\`\`\`

## 面试速记

- 启动主线:构造 SpringApplication → prepareEnvironment → createContext → prepareContext → refresh → started → callRunners → ready。
- application.yml 在 prepareEnvironment 阶段由 ConfigDataEnvironmentPostProcessor 加载,profile 同时激活。
- 内嵌 Tomcat 创建于 onRefresh,启动于 finishRefresh 的 WebServerStartStopLifecycle。
- Runner 在容器刷新后、应用就绪前执行;ApplicationReadyEvent 之后才算真正对外服务。
- @SpringBootApplication = @SpringBootConfiguration + @EnableAutoConfiguration + @ComponentScan。
`
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch07b',
        title: 'Starter 与条件装配:手写一个 Starter',
        minutes: 32,
        points: ['starter 分层', '@Conditional', 'AutoConfiguration.imports', '请求日志实战'],
        content: `
> [!info] 本章导读 · 为什么加一个 starter 依赖,整套能力就装好了?
> 引一个 spring-boot-starter-web,Tomcat、Jackson、参数绑定全部就位;引一个 mybatis-spring-boot-starter,连 SqlSessionFactory 都不用自己写。
> 这些"加依赖即生效"的魔法,拆开看只有两样东西:**依赖套餐**和**条件装配**。本章不只讲原理,还带你从零写一个能用的请求日志 starter。
> - 读完本章你将能:说清 starter 与 autoconfigure 为什么要拆两个模块
> - 熟练使用 @Conditional 全家桶做按需装配
> - 独立写出一个带配置开关、能被业务项目直接引用的 starter

> [!tip] 日常电脑现场 · 手机一键换机
> 换新手机时点一下"一键换机",通讯录、照片、聊天记录整包搬过去,你既没逐项导出,也没管两边格式对不对。Starter 就是这个搬家包:一个依赖带进一组 jar,自动配置再把它装好,业务项目开机即用。

## Starter = 依赖套餐 + 自动配置

starter 本身几乎没有代码,它只做两件事:**把一组依赖打包**,再**通过自动配置类把能力装进容器**。命名上有分工:官方是 spring-boot-starter-xxx,第三方是 xxx-spring-boot-starter,自动配置模块通常叫 xxx-spring-boot-autoconfigure;拆成两个模块是为了让依赖搬运与代码实现解耦,使用者可以只引 autoconfigure 自行管理依赖。

\`\`\`text
业务项目
  └── reqlog-spring-boot-starter             (只有 pom,负责依赖聚合)
        └── reqlog-spring-boot-autoconfigure (代码:配置类 + 过滤器 + imports 清单)
              └── spring-boot-autoconfigure  (提供 @AutoConfiguration 等基础设施)
\`\`\`

## @Conditional 全家桶

自动配置的候选类有上百个,如果全部生效,没引数据库也要建连接池、没引 Redis 也要连 Redis。**条件注解就是"按需生效"的开关**:条件不满足,整个配置类或 @Bean 直接跳过。

| 注解 | 生效条件 | 一行示例 |
| --- | --- | --- |
| @ConditionalOnClass | 类路径存在指定类 | \`@ConditionalOnClass(DataSource.class)\` |
| @ConditionalOnMissingClass | 类路径不存在才生效 | \`@ConditionalOnMissingClass("redis.clients.jedis.Jedis")\` |
| @ConditionalOnBean | 容器里已有指定 Bean | \`@ConditionalOnBean(DataSource.class)\` |
| @ConditionalOnMissingBean | 容器里没有才生效,留给用户覆盖 | \`@ConditionalOnMissingBean(name = "redisTemplate")\` |
| @ConditionalOnProperty | 配置项匹配指定值 | \`@ConditionalOnProperty(name = "reqlog.enabled", havingValue = "true")\` |
| @ConditionalOnResource | 资源文件存在 | \`@ConditionalOnResource(resources = "classpath:app.yml")\` |
| @ConditionalOnWebApplication | 应用类型匹配 | \`@ConditionalOnWebApplication(type = Type.SERVLET)\` |
| @ConditionalOnExpression | SpEL 结果为 true | \`@ConditionalOnExpression("#{environment['app.mode'] == 'cloud'}")\` |

> [!warn] @ConditionalOnMissingBean 的生效前提
> 它只能看到**已经注册的 BeanDefinition**。自动配置类必须排在用户配置之后处理(SpringBoot 保证),否则会出现"用户 Bean 还没注册,默认 Bean 先占位"的覆盖事故。自己写自动配置时,别在普通 @Configuration 里乱用这个注解。

## 自动配置类怎么被发现

自动配置类在第三方 jar 里,@ComponentScan 扫不到,只能靠清单文件主动登记:

| 项 | spring.factories(2.7 前) | AutoConfiguration.imports(2.7+ / 3.0 标准) |
| --- | --- | --- |
| 路径 | META-INF/spring.factories | META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports |
| 格式 | properties,key 加逗号分隔类名 | 一行一个全限定类名 |
| 读取方式 | SpringFactoriesLoader | ImportCandidates |
| 推荐注解 | @Configuration | @AutoConfiguration |
| 现状 | 3.0 起 EnableAutoConfiguration 条目被忽略 | 唯一生效的自动配置清单 |

迁移的动机很实际:spring.factories 是个大杂烩,启动时必须解析整个文件、容易误加载无关条目;独立 imports 文件专用于自动配置,一行一个类,读取更轻,还支持 ==@AutoConfiguration(before/after)== 显式排序,diff 也更清晰。

> [!info] 别把 spring.factories 一棍子打死
> 3.0 只废掉了其中的 ==EnableAutoConfiguration== 条目。EnvironmentPostProcessor、ApplicationListener 等其他 SPI 仍然登记在 spring.factories,写自定义扩展时要分清。

## 实战:手写请求日志 Starter

需求:业务项目引入即可打印每个请求的方法、路径、状态码与耗时;用 reqlog.enabled 控制开关,超过阈值打 WARN,并支持排除路径。先建两个模块:

\`\`\`xml pom.xml
<!-- 模块一:reqlog-spring-boot-autoconfigure,放代码 -->
<dependency>
    <groupId>org.springframework.boot</groupId><artifactId>spring-boot-autoconfigure</artifactId>
</dependency>

<!-- 模块二:reqlog-spring-boot-starter,只有依赖聚合,没有一行 Java -->
<dependency>
    <groupId>com.demo</groupId><artifactId>reqlog-spring-boot-autoconfigure</artifactId>
    <version>1.0.0</version>
</dependency>
\`\`\`

配置属性类(绑定 yml,prefix 用 kebab-case):

\`\`\`java ReqLogProperties.java
@ConfigurationProperties(prefix = "reqlog")
public class ReqLogProperties {
    private boolean enabled = false;
    private long slowThresholdMs = 500;
    private List<String> excludePatterns = new ArrayList<>();
    // getter / setter 省略
}
\`\`\`

自动配置类:Web 应用 + 开关打开才生效,并交给用户覆盖的机会:

\`\`\`java ReqLogAutoConfiguration.java
@AutoConfiguration
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
@ConditionalOnProperty(prefix = "reqlog", name = "enabled", havingValue = "true")
@EnableConfigurationProperties(ReqLogProperties.class)
public class ReqLogAutoConfiguration {
    @Bean
    @ConditionalOnMissingBean
    public FilterRegistrationBean<ReqLogFilter> reqLogFilter(ReqLogProperties props) {
        FilterRegistrationBean<ReqLogFilter> reg = new FilterRegistrationBean<>(new ReqLogFilter(props));
        reg.addUrlPatterns("/*");
        reg.setOrder(Ordered.HIGHEST_PRECEDENCE + 10);
        return reg;
    }
}
\`\`\`

过滤器实现,排除路径与慢请求阈值都在这里消化:

\`\`\`java ReqLogFilter.java
public class ReqLogFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(ReqLogFilter.class);
    private final ReqLogProperties props;
    public ReqLogFilter(ReqLogProperties props) { this.props = props; }
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return props.getExcludePatterns().stream().anyMatch(uri::startsWith);
    }
    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse resp,
                                    FilterChain chain) throws ServletException, IOException {
        long start = System.nanoTime();
        try {
            chain.doFilter(req, resp);
        } finally {
            long costMs = (System.nanoTime() - start) / 1_000_000;
            String line = req.getMethod() + " " + req.getRequestURI() + " -> "
                    + resp.getStatus() + " " + costMs + "ms";
            if (costMs >= props.getSlowThresholdMs()) {
                log.warn("[SLOW] " + line);
            } else {
                log.info(line);
            }
        }
    }
}
\`\`\`

最后登记清单文件(路径与文件名一个字都不能错):

\`\`\`text META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
com.demo.reqlog.ReqLogAutoConfiguration
\`\`\`

业务项目引依赖、写配置,启动即生效:

\`\`\`yml application.yml
reqlog:
  enabled: true
  slow-threshold-ms: 300
  exclude-patterns:
    - /actuator
\`\`\`

\`\`\`output
2026-05-12 10:21:33.412  INFO 8124 --- [nio-8080-exec-1] c.d.reqlog.ReqLogFilter : GET /api/users -> 200 18ms
2026-05-12 10:21:34.907  WARN 8124 --- [nio-8080-exec-2] c.d.reqlog.ReqLogFilter : [SLOW] GET /api/report -> 200 512ms
[hl]enabled=true 生效:两个请求都进了过滤器,超过 300ms 的打了 WARN[/hl]
\`\`\`

## 调试自动配置

自动配置不生效时,第一步永远是打开 debug 报告:

\`\`\`shell
java -jar demo.jar --debug
\`\`\`

\`\`\`output
==================== CONDITIONS EVALUATION REPORT ====================
Positive matches:
   DataSourceAutoConfiguration matched: @ConditionalOnClass found DataSource
Negative matches:
   RedisAutoConfiguration: @ConditionalOnClass did not find RedisOperations
[hl]Positive 是生效的,Negative 是被条件挡掉的,Exclusions 是手动排除的[/hl]
\`\`\`

三种常用手段:==--debug== 或 logging.level.org.springframework.boot.autoconfigure=DEBUG 看条件报告;==spring.autoconfigure.exclude== 或 @SpringBootApplication(exclude = XxxAutoConfiguration.class) 精准排除;引 ==spring-boot-configuration-processor== 让 IDE 对你的配置前缀有补全与提示。装了 Actuator 还可以直接访问 /actuator/conditions。

## 面试速记

- starter = 依赖聚合 + 自动配置;官方 spring-boot-starter-xxx,第三方 xxx-spring-boot-starter。
- 拆两个模块:starter 管依赖,autoconfigure 管代码与清单,使用者可只引后者。
- 条件装配按 classpath、容器 Bean、配置项决定是否生效,@ConditionalOnMissingBean 保障用户优先。
- 3.0 起自动配置只认 AutoConfiguration.imports;spring.factories 仍承载其他 SPI。
- 调试三板斧:--debug 条件报告、exclude 排除、configuration-processor 元数据提示。
`
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch07c',
        title: '配置·日志·打包部署与监控',
        minutes: 35,
        points: ['多环境 profile', 'SLF4J + Logback', '可执行 jar', 'Docker 与 Actuator'],
        content: `
> [!info] 本章导读 · 本地跑通只是开始,上线跑稳才是本事
> 开发机上 mvn spring-boot:run 一切正常,一上生产却可能:配置读错、日志写满磁盘、jar 启动参数漏带、健康检查全红。
> 本章把"能跑"推进到"跑稳":多环境配置、日志体系、可执行 jar、Docker 部署与 Actuator 监控,一次配齐。
> - 读完本章你将能:用 profile 管理多环境并说清配置优先级
> - 配出控制台 + 滚动文件 + 异步的 Logback 方案
> - 用 Docker 与 Actuator 把应用稳稳送上线

> [!tip] 日常电脑现场 · 绿色免安装软件
> 官网下载一个 zip,解压到 D 盘,双击里面的 exe 就能用,不写注册表、不走向导,换台电脑拷过去照样跑。Spring Boot 打出的可执行 jar 也是这个思路:依赖全塞进包里,一句 java -jar 就能起。

## 多环境配置实战

环境差异不应该改代码,只应该换配置。下面用 --- 分隔三份文件:主文件写通用项,各环境文件只写差异:

\`\`\`yml application.yml
spring:
  application:
    name: demo
  profiles:
    active: dev                 # 生产用 --spring.profiles.active=prod 覆盖
server:
  port: 8080
---
# application-dev.yml
logging.level.com.demo: debug
app.upload-dir: D:/tmp/upload
---
# application-prod.yml
logging.level.com.demo: info
app.upload-dir: /data/upload
spring.datasource.url: jdbc:mysql://\${DB_HOST:localhost}:3306/demo?serverTimezone=Asia/Shanghai
\`\`\`

占位符的冒号后面是默认值:环境变量没提供时用它兜底。Bean 级别的环境隔离则用 @Profile:

\`\`\`java StorageConfig.java
@Configuration
public class StorageConfig {
    @Bean @Profile("dev")
    public Storage localStorage() { return new LocalStorage("D:/tmp/upload"); }
    @Bean @Profile("prod")
    public Storage ossStorage() { return new OssStorage("oss-cn-hangzhou"); }
}
\`\`\`

| 优先级 | 来源 | 示例 |
| --- | --- | --- |
| 1 | 命令行参数 | --server.port=9090 |
| 2 | SPRING_APPLICATION_JSON | 环境变量里的 JSON 配置 |
| 3 | Java 系统属性 | -Dserver.port=9090 |
| 4 | 操作系统环境变量 | SERVER_PORT=9090 |
| 5 | application-{profile}.yml | 被激活的 application-prod.yml |
| 6 | application.yml | 主配置文件 |

> [!tip] profile 只决定"哪份文件生效"
> 它不改变优先级:application-prod.yml 仍然低于环境变量。生产密钥一律用环境变量或配置中心注入,别提交进仓库。

## 日志体系:SLF4J 门面 + Logback 实现

**门面模式**:SLF4J 只定义 Logger 接口,不负责输出;Logback 才是实现。业务代码只依赖 slf4j-api,换 Log4j2 不用改一行代码;第三方库的日志也全部汇到门面,再由实现统一决定格式与落盘方式。

\`\`\`xml logback-spring.xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder><pattern>%d{HH:mm:ss.SSS} %highlight(%-5level) [%thread] %cyan(%logger{40}) - %msg%n</pattern></encoder>
    </appender>
    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>logs/app.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
            <fileNamePattern>logs/app.%d{yyyy-MM-dd}.%i.log.gz</fileNamePattern>
            <maxFileSize>100MB</maxFileSize>
            <maxHistory>15</maxHistory>
        </rollingPolicy>
        <encoder><pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} %-5level [%thread] %logger{40} - %msg%n</pattern></encoder>
    </appender>
    <appender name="ASYNC" class="ch.qos.logback.classic.AsyncAppender">
        <queueSize>1024</queueSize>
        <discardingThreshold>0</discardingThreshold>
        <appender-ref ref="FILE"/>
    </appender>
    <springProfile name="dev"><logger name="com.demo" level="DEBUG"/></springProfile>
    <springProfile name="prod"><logger name="com.demo" level="INFO"/></springProfile>
    <root level="INFO"><appender-ref ref="CONSOLE"/><appender-ref ref="ASYNC"/></root>
</configuration>
\`\`\`

也可以在 yml 里临时调级别:==logging.level.com.demo.order: debug==,适合排查某个包的日志。

\`\`\`output
10:21:33.412 INFO  [nio-8080-exec-1] c.d.order.OrderService - 创建订单 id=1001
[hl]时间、级别、线程、类名都由 pattern 决定[/hl]
\`\`\`

> [!warn] 两个容易踩的坑
> springProfile / springProperty 只在 ==logback-spring.xml== 里生效,文件名写成 logback.xml 就退化成普通配置;AsyncAppender 的 discardingThreshold=0 保证 WARN/ERROR 不被丢弃,但队列满时仍可能丢日志,审计日志不要只落异步文件。

## java -jar 为什么能跑:可执行 jar 解剖

Spring Boot Maven 插件会把普通 jar 重新打包(repackage),看看里面:

\`\`\`shell
jar tf demo.jar | head -8
\`\`\`

\`\`\`output
META-INF/MANIFEST.MF
BOOT-INF/classes/com/demo/App.class
BOOT-INF/lib/spring-boot-3.3.2.jar
BOOT-INF/lib/spring-core-6.1.11.jar
org/springframework/boot/loader/JarLauncher.class
\`\`\`

MANIFEST 里 ==Main-Class: org.springframework.boot.loader.JarLauncher==、==Start-Class: com.demo.App==。JarLauncher 先创建 **LaunchedURLClassLoader**,把 BOOT-INF/classes 与 BOOT-INF/lib 下每个嵌套 jar 都变成可加载的 URL,再反射调用 Start-Class 的 main。普通 JVM 不认识 jar 里的 jar,这个自定义类加载器就是钥匙。

jar 内还有 ==layers.idx==,把依赖、spring-boot-loader、快照依赖、应用代码分层。Docker 构建时按层 COPY,只改业务代码就只重建最后一层,依赖层全部命中缓存。

| 维度 | 可执行 jar | war |
| --- | --- | --- |
| 容器 | 内嵌,进程内创建 | 外部 Tomcat 部署 |
| 启动方式 | java -jar | 丢进 webapps |
| 类加载 | LaunchedURLClassLoader | 容器 ClassLoader |
| 适用场景 | 微服务、容器化 | 老平台、共享容器 |

> [!pitfall] Boot 3.2 起 loader 包名变了
> JarLauncher 从 ==org.springframework.boot.loader== 移到 ==org.springframework.boot.loader.launch==,类名不变。排查启动脚本或自定义 loader 时先确认版本,别照着老文章抄路径。

## Docker 部署

多阶段构建:构建阶段带 Maven 与 JDK,运行阶段只留 JRE,镜像更小:

\`\`\`dockerfile Dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline
COPY src ./src
RUN mvn -q -DskipTests package
FROM eclipse-temurin:17-jre
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
COPY --from=build /build/target/demo-0.0.1-SNAPSHOT.jar app.jar
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 CMD curl -fsS http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
\`\`\`

\`\`\`shell
docker build -t demo:1.0 .
docker run -d --name demo -p 8080:8080 -e SPRING_PROFILES_ACTIVE=prod demo:1.0
docker inspect --format "{{.State.Health.Status}}" demo
\`\`\`

\`\`\`output
 => => naming to docker.io/library/demo:1.0
[hl]healthy[/hl]
\`\`\`

## 生产监控与稳定性

\`\`\`yml application.yml
management:
  endpoints.web.exposure.include: health,info,metrics,prometheus,loggers
  endpoint.health.show-details: when-authorized
\`\`\`

| 端点 | 作用 | 生产建议 |
| --- | --- | --- |
| health | 健康检查(DB/Redis/Disk) | 必开,细节只给授权用户 |
| info | 构建与版本信息 | 开放 |
| metrics | JVM、HTTP、连接池指标 | 只对内网监控开放 |
| loggers | 运行时调整日志级别 | 鉴权后开放 |
| env | 配置与系统属性 | 不对外暴露 |
| beans | Bean 列表 | 不对外暴露 |

指标采集是 Micrometer 的活:它把 JVM、HTTP、缓存、数据源统一成 Meter,再加一个 registry 就能输出到 Prometheus。==micrometer-registry-prometheus== 加 Actuator,\`/actuator/prometheus\` 直接可抓。

优雅停机只需两行:==server.shutdown=graceful== 与 ==spring.lifecycle.timeout-per-shutdown-phase=30s==。

它的动作顺序是:停止接收新请求 → 等待在途请求完成 → 销毁 Bean 与连接池。K8s 的 terminationGracePeriodSeconds 要大于这个超时,并配 preStop 睡眠,否则流量还没摘完进程就没了。

启动优化:==-Dspring.main.lazy-initialization=true== 延迟初始化能缩短启动时间,但把启动期错误推迟到首次调用,生产要权衡;AOT 在构建期生成代理与反射元数据,配合 GraalVM 可做原生镜像,常规 JVM 部署也能减少启动开销。

> [!danger] Actuator 是后门,不是展示柜
> include 千万别写 "*":==/actuator/env== 会带出配置键值,==/actuator/beans== 暴露内部结构。生产只暴露 health、info、metrics,并放在内网或加鉴权。

## 面试速记

- 多环境:application.yml 写通用项,application-{profile}.yml 写差异,spring.profiles.active 决定激活谁;优先级为命令行 > JSON > 系统属性 > 环境变量 > profile 文件 > 主配置。
- SLF4J 是门面,Logback 是实现;logback-spring.xml 支持 springProfile 与异步、滚动。
- 可执行 jar:JarLauncher + LaunchedURLClassLoader 加载 BOOT-INF/classes 与 BOOT-INF/lib,layers.idx 优化镜像分层。
- 上线三件套:Actuator health 探针、graceful shutdown、Micrometer 指标。
`
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch07d',
        title: 'SpringBoot 3 与工程化实战',
        minutes: 32,
        points: ['Jakarta 迁移', '虚拟线程', '切片测试', 'CORS 与缓存'],
        content: `
> [!info] 本章导读 · 升级 Spring Boot 3,你的 javax 都改完了吗?
> 老项目升到 Boot 3,第一波报错往往不是业务代码,而是满屏的 javax.servlet 找不到类;第二波是测试跑不起来、跨域突然失效。
> 本章把 3.x 的硬变化、虚拟线程、测试切片与工程化配置一次讲透,让升级不再是碰运气。
> - 读完本章你将能:完成 javax 到 jakarta 的迁移并说清 Boot 3 的基线要求
> - 在 JDK 21 上正确开启虚拟线程并避开 pinning 陷阱
> - 用切片测试与全局配置把工程化细节补齐

> [!tip] 日常电脑现场 · 系统大版本升级
> 手机推送新系统,升完发现旧 App 闪退、充电提示音没了、某个权限开关挪了位置 —— 硬件没坏,是底层接口换了名字。Spring Boot 3 升级同理:javax 改成 jakarta,包名一变,全项目的 import 都得跟着搬。

## Spring Boot 3 的重大变化

Boot 3 的第一硬指标是 **Java 17 基线**,第二是 **Jakarta EE 9**:javax 命名空间整体搬到 jakarta,依赖与 import 都得跟着换。

| 旧包(javax) | 新包(jakarta) | 影响 |
| --- | --- | --- |
| javax.servlet.* | jakarta.servlet.* | Filter、Listener、HttpServletRequest |
| javax.persistence.* | jakarta.persistence.* | JPA 实体注解 |
| javax.validation.* | jakarta.validation.* | @NotNull、@Valid |
| javax.annotation.* | jakarta.annotation.* | @PostConstruct、@Resource |

\`\`\`output
***************************
APPLICATION FAILED TO START
***************************
Caused by: java.lang.ClassNotFoundException: javax.servlet.Filter
\`\`\`

第三是 **GraalVM 原生镜像与 AOT**:构建期就把 Bean 定义、代理、反射元数据算好,运行时启动可压到几十毫秒、内存大幅下降。代价是封闭世界假设:反射、资源、动态代理都要显式 hint,字节码增强类库可能直接不支持。另外,Boot 3 用 Micrometer Observation 统一指标与链路追踪,一次 Observation 同时产出 metrics 与 trace。

> [!warn] 原生镜像不是免费午餐
> 启动快、内存省,但构建动辄几分钟,反射与动态代理要逐个补 hint,调试体验也差。IO 密集、弹性伸缩的 Serverless 场景收益最大;内部管理后台没必要上。

## 虚拟线程:一个开关背后的线程模型

虚拟线程需要 **JDK 21**,而 Boot 3 的基线是 17 —— 在 17 上打开这个开关不会生效,只会提示不可用。满足版本后,一行配置就能让 Tomcat 用虚拟线程处理请求:

\`\`\`yml application.yml
spring:
  threads:
    virtual:
      enabled: true
server:
  tomcat:
    threads:
      max: 200          # 虚拟线程模式下不再限制请求并发,留作兜底
\`\`\`

\`\`\`java VirtualThreadDemo.java
// 平台线程池:200 个线程就是 200 的并发上限
ExecutorService pool = Executors.newFixedThreadPool(200);
// 虚拟线程:每个任务一个虚拟线程,阻塞时自动让出载体线程
try (ExecutorService vt = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 1; i <= 3; i++) {
        int taskId = i;
        vt.submit(() -> System.out.println("task-" + taskId + " on " + Thread.currentThread()));
    }
}
\`\`\`

\`\`\`output
task-1 on VirtualThread[#21]/runnable@ForkJoinPool-1-worker-2
task-2 on VirtualThread[#22]/runnable@ForkJoinPool-1-worker-1
task-3 on VirtualThread[#23]/runnable@ForkJoinPool-1-worker-3
\`\`\`

> [!pitfall] 三个必须知道的限制
> JDK 21 里在 synchronized 块中阻塞会 **pinning** 载体线程,改用 ReentrantLock;虚拟线程不是银弹,数据库连接池只有 10 个连接,并发再高也是排队;CPU 密集任务没有收益,而且虚拟线程不要池化,用完即弃。

## 测试:切片测试与 @SpringBootTest

测试金字塔一句话:大量单元测试打底,少量切片测试验证 Web/数据层,极少数 @SpringBootTest 做端到端。

\`\`\`java OrderApiTest.java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class OrderApiTest {
    @Autowired
    private TestRestTemplate rest;
    @Test
    void shouldReturnOrder() {
        Order order = rest.getForObject("/api/orders/1001", Order.class);
        assertThat(order.getStatus()).isEqualTo("PAID");
    }
}
\`\`\`

\`\`\`java OrderControllerTest.java
@WebMvcTest(OrderController.class)          // 只加载 MVC 层,不连数据库
class OrderControllerTest {
    @Autowired
    private MockMvc mockMvc;
    @MockBean
    private OrderService orderService;      // 依赖用 Mock 顶替
    @Test
    void shouldReturnJson() throws Exception {
        given(orderService.findById(1001L)).willReturn(new Order(1001L, "PAID"));
        mockMvc.perform(get("/api/orders/1001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAID"));
    }
}
\`\`\`

\`\`\`output
Status = 200
[hl]切片测试只加载 MVC 层,启动快、隔离好,适合接口契约验证[/hl]
\`\`\`

> [!tip] 3.4 起 @MockBean 改名了
> 新版用 ==@MockitoBean== 替代 @MockBean,旧注解标记废弃。写新项目直接用新注解,读老代码知道它俩是一回事即可。

## 常用工程配置

跨域与静态资源映射都挂在 WebMvcConfigurer 上:

\`\`\`java WebConfig.java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("https://*.example.com")
                .allowedMethods("GET", "POST", "PUT", "DELETE")
                .allowCredentials(true)
                .maxAge(3600);
    }
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/files/**").addResourceLocations("file:/data/upload/");
    }
}
\`\`\`

上传大小限制在 yml 里配,默认只有 1MB:

\`\`\`yml application.yml
spring.servlet.multipart.max-file-size: 10MB
spring.servlet.multipart.max-request-size: 20MB
\`\`\`

缓存抽象:==@EnableCaching== 开启,@Cacheable 标注查询方法,RedisCacheManager 决定存哪、存多久:

\`\`\`java CacheConfig.java
@Configuration
@EnableCaching
public class CacheConfig {
    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .disableCachingNullValues();
        return RedisCacheManager.builder(factory).cacheDefaults(config).build();
    }
}
@Service
public class UserService {
    @Cacheable(cacheNames = "user", key = "#id")   // 第一次查库,第二次直接命中缓存
    public User findById(Long id) {
        System.out.println("hit db, id=" + id);
        return userMapper.selectById(id);
    }
}
\`\`\`

\`\`\`output
hit db, id=1001
[dim]第二次调用同一 id:方法体没有执行,直接命中缓存[/dim]
\`\`\`

> [!info] 一句话说清 @Cacheable 原理
> 它由 CacheInterceptor 通过 **AOP 代理**拦截:先按 key 查缓存,命中直接返回,未命中才执行方法并回填 —— 与事务同属代理增强,所以自调用一样会失效。

## 常见坑清单

| 现象 | 根因 | 解法 |
| --- | --- | --- |
| 启动报循环依赖 | 构造器注入互指 / 字段互相注入 | 重构分层、@Lazy,Boot 2.6+ 默认禁止 |
| 事务不回滚 | 自调用、非 public、异常被吞 | 走代理调用、rollbackFor、别 catch 后不抛 |
| @Async 不异步 | 自调用、未开 @EnableAsync、默认线程池不复用 | 拆类调用、自定义线程池 |
| 配置绑不上 | prefix 写成驼峰、字段缺 setter | prefix 用小写 kebab-case,补 configuration-processor |
| jar 依赖冲突 | 传递依赖版本不一致 | mvn dependency:tree、交给 BOM 管理 |
| 时间差 8 小时 | JVM 时区 UTC、连接串没写时区 | -Duser.timezone=Asia/Shanghai、serverTimezone |
| 跨域预检失败 | allowCredentials 配了通配来源 | 用 allowedOriginPatterns,放行 OPTIONS |

## 面试速记

- Boot 3 基线 Java 17 + Jakarta EE 9,javax.servlet 全部换 jakarta.servlet。
- 原生镜像靠 AOT 与 RuntimeHints,启动快但反射、动态代理要显式登记。
- 虚拟线程要 JDK 21,spring.threads.virtual.enabled=true;synchronized 阻塞会 pinning。
- 测试分层:@SpringBootTest 端到端,@WebMvcTest 切片 + MockMvc + MockBean。
- @Cacheable 由 CacheInterceptor 代理拦截,自调用失效;跨域注意凭据与通配来源不能共存。
`
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch08',
        title: 'MyBatis 核心原理与整合',
        minutes: 30,
        points: ['执行流程', '#{} vs \${}', '一二级缓存', 'Mapper 动态代理'],
        content: `
> [!interview] 本章面试锚点
> MyBatis 三连:执行流程、#{} 与 \${} 的区别(防注入)、Mapper 接口没有实现类为什么能注入。最后一问直接连回第 2 章的 FactoryBean 与第 5 章的动态代理 —— 框架知识要串成网。

> [!info] 本章导读 · 只有接口没有实现类,凭什么能注入?
> 你写了一个 Mapper 接口,既没有实现类,也没有 new,运行时却能调用 —— 背后是动态代理加 FactoryBean 的组合拳。
> 本章把数据访问这块拼图补上,也把前面容器与 AOP 的知识串成一张网。
> - 读完本章你将能:跟踪一条 SQL 从接口调用到结果映射的全过程
> - 分清预编译占位符与字符串拼接的安全边界
> - 说清 Mapper 接口被注入的实现原理

> [!tip] 日常电脑现场 · 在菜单上点菜
> 你对着菜单指一下鱼香肉丝,服务员记下代号送进后厨,厨师照菜谱做,端上来的盘子和菜单图对得上。调 Mapper 接口就是这样:你只写接口方法名,XML 里的 SQL 是菜谱,结果映射负责把菜摆成你要的样子。

## 执行流程:一条 SQL 的旅程

\`\`\`diagram:d-mybatis
\`\`\`

**MyBatis 就是一套点菜系统**:你写的接口是菜单,XML 是后厨的菜谱,MapperProxy 是跑堂的服务员,Executor 是掌勺的后厨,结果集映射负责最后摆盘上菜。你只管点菜,菜怎么炒出来的,问后厨就输了。

\`\`\`text
SqlSessionFactoryBuilder.build()  → 解析 mybatis-config + Mapper.xml → SqlSessionFactory(单例,重量级)
SqlSessionFactory.openSession()   → SqlSession(一次会话,非线程安全,轻量)
SqlSession.selectList()           → Executor(执行器,一级缓存在这层)
                                  → StatementHandler(创建 JDBC Statement)
                                  → ParameterHandler(#{} 预编译占位)
                                  → 执行 JDBC → ResultSetHandler(结果映射为 Java 对象)
\`\`\`

四大对象:**Executor、StatementHandler、ParameterHandler、ResultSetHandler**。MyBatis 的插件(分页插件等)就是用动态代理拦截这四大对象的方法 —— 又见动态代理。

\`\`\`java
// 纯 MyBatis(不整合 Spring)最小示例,看清角色分工
public class MyBatisDemo {
    public static void main(String[] args) throws Exception {
        SqlSessionFactory factory = new SqlSessionFactoryBuilder()
                .build(Resources.getResourceAsStream("mybatis-config.xml"));
        try (SqlSession session = factory.openSession()) {
            // 底层:configuration.getMapper(UserMapper.class) → 返回动态代理
            UserMapper mapper = session.getMapper(UserMapper.class);
            User u = mapper.selectById(1001L);
            System.out.println(u.getName());
        }
    }
}
\`\`\`

\`\`\`output
星薇Star
\`\`\`

整合 Spring 后你感知不到这些对象:==SqlSessionTemplate==(线程安全,每次操作借一个 SqlSession)与 ==MapperFactoryBean==(又是 FactoryBean!)把一切藏进了容器。

## Mapper 接口为什么能直接注入

接口没有实现类,Spring 注入的其实是 **JDK 动态代理**:

\`\`\`java
// MapperProxyFactory(简化版):Mapper 接口 → 代理对象
public <T> T getMapper(Class<T> type, SqlSession sqlSession) {
    MapperProxy<T> proxy = new MapperProxy<>(sqlSession, type, methodCache);
    // 与第 5 章 JDK 动态代理同款配方:接口 + InvocationHandler
    return (T) Proxy.newProxyInstance(
            type.getClassLoader(), new Class[]{ type }, proxy);
}

// MapperProxy#invoke(简化):按方法签名找到 MappedStatement(SQL 元数据)再执行
public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
    if (Object.class.equals(method.getDeclaringClass())) {
        return method.invoke(this, args);          // toString/hashCode 走原生
    }
    return execute(method, args);                  // 按 CRUD 路由到 select/insert/...
}
\`\`\`

注入链条(面试串讲版):**@MapperScan → ImportBeanDefinitionRegistrar 把每个接口注册为 MapperFactoryBean → FactoryBean.getObject() 返回 JDK 代理 → 容器里能注入的"实现类"就是代理**。

## #{} 与 \${}:必考 + 安全红线

| 维度 | #{} | \${} |
| --- | --- | --- |
| 处理方式 | 预编译占位符 ==(PreparedStatement 的 ?)== | **字符串拼接进 SQL** |
| 防注入 | 天然防 | 不防,注入重灾区 |
| SQL 结构 | 编译期已定型,值后传 | 每次拼接都可能改变结构 |
| 适用场景 | 传值(99% 的场景) | 动态表名/列名/ORDER BY 字段名 |

\`\`\`java
// 入参 name = "张三' OR '1'='1"
@Select("SELECT * FROM user WHERE name = \${name}")   // [err]直接拼接![/err]
// 实际执行:SELECT * FROM user WHERE name = '张三' OR '1'='1' → 恒真,全表泄露
List<User> hack(String name);

@Select("SELECT * FROM user WHERE name = #{name}")    // 安全:值只是参数
// 实际执行:SELECT * FROM user WHERE name = ? → 参数查不到,注入失败
List<User> safe(String name);
\`\`\`

> [!danger] \${} 只有唯一豁免场景
> **列名/表名/排序字段**这类不能加引号的结构成分,且值必须来自==白名单枚举==(绝不能来自用户输入)时才允许 \${},例如 \`ORDER BY \${column}\` 中 column 只能在 "created_at"/"id" 两个白名单里选。其余一切传值,一律 #{}。

## 动态 SQL(XML 里的 if/where/foreach)

\`\`\`xml
<select id="search" resultType="User">
    SELECT id, name, status FROM user
    <where>
        <if test="name != null and name != ''">
            AND name LIKE CONCAT('%', #{name}, '%')
        </if>
        <if test="statusList != null and statusList.size() > 0">
            AND status IN
            <foreach collection="statusList" item="s" open="(" separator="," close=")">
                #{s}
            </foreach>
        </if>
    </where>
</select>
\`\`\`

- ==<where>== 自动去掉开头多余的 AND/OR;==<if test>== 用 OGNL 判断;==<foreach>== 拼 IN 列表;还有 ==<set>==(update 动态列)与 ==<choose/when/otherwise>==(switch 语义)。
- XML 里写小于号比较要转义 ==&lt;== 或用 ==<![CDATA[ ]]>== 包裹,否则被当标签解析报错。

## 一级缓存与二级缓存

| 维度 | 一级缓存 | 二级缓存 |
| --- | --- | --- |
| 作用域 | SqlSession 级(默认开启) | namespace(mapper)级,手动开启 |
| 失效条件 | 增删改、flushCache、关闭 session | 同 namespace 的写操作清空 |
| Spring 中的表现 | 未开事务时每次新 session,形同失效 | 开启后跨 session 共享 |
| 生产建议 | 保留默认 | **慎用/关闭**:多表脏读 + 分布式失效 |

\`\`\`java
SqlSession s1 = factory.openSession();
User u1 = s1.getMapper(UserMapper.class).selectById(1L);
User u2 = s1.getMapper(UserMapper.class).selectById(1L);
System.out.println("同一 session 第二次: " + (u1 == u2));   // 一级缓存命中

SqlSession s2 = factory.openSession();
User u3 = s2.getMapper(UserMapper.class).selectById(1L);
System.out.println("跨 session: " + (u1 == u3));            // 一级缓存不共享
\`\`\`

\`\`\`output
同一 session 第二次: true
跨 session: false
\`\`\`

查询顺序:**二级缓存 → 一级缓存 → 数据库**(任一命中即返回)。

> [!pitfall] 整合 Spring 后一级缓存"消失"了?
> 不是消失,是每次请求从 ==SqlSessionTemplate== 拿**新的 SqlSession**,一级缓存作用域立刻切走。**开启事务(@Transactional)时整个事务共用同一个 SqlSession**,一级缓存才在事务内生效。二级缓存在多表关联时极易脏读(namespace 感知不到别的表的变更),分布式部署更是直接失效 —— 生产结论:一级默认,二级关闭。

## TypeHandler 与插件机制

### TypeHandler:JavaType 与 JDBCType 的翻译官

MyBatis 给参数设值(PreparedStatement.setXxx)与读结果(ResultSet.getXxx)都经过 ==TypeHandler== 完成类型转换;内置几十个覆盖常用类型,**对不上号的(比如 List 存成 JSON 字符串)就自定义**:

\`\`\`java
// List<String> ↔ 数据库 JSON 字符串(JDK 17 + Jackson)
@MappedTypes(List.class)                          // 作用的 Java 类型
@MappedJdbcTypes(JdbcType.VARCHAR)                // 对应的 JDBC 类型
public class JsonListTypeHandler extends BaseTypeHandler<List<String>> {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Override   // Java → 数据库:写入时序列化为 JSON 字符串
    public void setNonNullParameter(PreparedStatement ps, int i,
                                    List<String> list, JdbcType jdbcType) throws SQLException {
        try {
            ps.setString(i, MAPPER.writeValueAsString(list));
        } catch (JsonProcessingException e) {
            throw new SQLException("list to json failed", e);
        }
    }

    @Override   // 数据库 → Java:读取时反序列化
    public List<String> getNullableResult(ResultSet rs, String column) throws SQLException {
        return parse(rs.getString(column));
    }

    @Override
    public List<String> getNullableResult(ResultSet rs, int col) throws SQLException {
        return parse(rs.getString(col));
    }

    @Override
    public List<String> getNullableResult(CallableStatement cs, int col) throws SQLException {
        return parse(cs.getString(col));
    }

    private List<String> parse(String json) throws SQLException {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return MAPPER.readValue(json, new TypeReference<List<String>>() { });
        } catch (JsonProcessingException e) {
            throw new SQLException("json to list failed", e);
        }
    }
}
\`\`\`

\`\`\`java
// 注册使用:@Result 指定 typeHandler(也可在 mybatis-config.xml 全局注册)
@Results(id = "userMap", value = {
        @Result(property = "tags", column = "tags",
                typeHandler = JsonListTypeHandler.class)
})
@Select("SELECT id, tags FROM user WHERE id = #{id}")
User selectById(Long id);
\`\`\`

\`\`\`output
user.tags 列里实际存的是: ["vip","beta"]
selectById(1).getTags() 拿到的是: [vip, beta]
[hl]List 与 VARCHAR 之间的翻译全程由 TypeHandler 完成,业务代码无感[/hl]
\`\`\`

> [!tip] 复杂对象入库的标准答案
> 面试被问"对象/集合字段怎么存库",答 ==自定义 TypeHandler==(底层 JSON 序列化)比"手动转 String"显功力;MyBatis-Plus 的 JSON 字段映射、枚举映射全是这一套机制。

### 插件机制:责任链 + 动态代理包装四大对象

原理一句话:**Configuration 持有 InterceptorChain(责任链),创建四大对象时用 ==JDK 动态代理==层层包装(InterceptorChain#pluginAll),调用时按 @Signature 命中的插件依次拦截** —— Executor / StatementHandler / ParameterHandler / ResultSetHandler 都可以被代理,又见第 5 章动态代理。

\`\`\`java
@Intercepts({
    @Signature(type = Executor.class, method = "query",
               args = {MappedStatement.class, Object.class,
                       RowBounds.class, ResultHandler.class})
})
public class SqlCostInterceptor implements Interceptor {

    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        long start = System.currentTimeMillis();
        try {
            return invocation.proceed();       // 放行:沿责任链走到目标对象
        } finally {
            System.out.println("SQL 耗时: "
                    + (System.currentTimeMillis() - start) + "ms");
        }
    }

    @Override
    public Object plugin(Object target) {
        // 只代理 Executor,其余对象原样放行
        return (target instanceof Executor) ? Plugin.wrap(target, this) : target;
    }
}
\`\`\`

\`\`\`xml
<!-- mybatis-config.xml 注册插件(整合 SpringBoot 时用 ConfigurationCustomizer 注册) -->
<plugins>
    <plugin interceptor="com.demo.plugin.SqlCostInterceptor"/>
</plugins>
\`\`\`

\`\`\`output
SQL 耗时: 12ms
[hl]proceed() 沿责任链传递,所有插件包装完才真正触达 JDBC[/hl]
\`\`\`

拦截点由 ==@Signature==(type + method + args)精确声明,签名之外的方法不会被碰到。**PageHelper 一句话原理**:拦截 Executor#query,先执行 COUNT 查总数、再把 LIMIT 子句改写进 SQL 后放行 —— 分页就这样"无侵入"塞进来的。

> [!warn] 插件能改 SQL,也是事故高发区
> 插件拿得到 BoundSql,理论上能篡改任何 SQL 内容(分页、多租户隔离、脱敏都靠它);但多层代理的执行顺序**与注册顺序相反**(后注册的在外层先执行),排查"SQL 被谁改了"时先查插件注册清单。

## 面试速记

- 执行流程:SqlSessionFactory → SqlSession → Executor → StatementHandler → ParameterHandler/ResultSetHandler;插件代理四大对象。
- Mapper 能注入:@MapperScan 注册 MapperFactoryBean,getObject() 返回 JDK 代理,代理按方法找 MappedStatement 执行。
- #{} 预编译防注入;\${} 字符串拼接,只允许列名/排序字段且必须白名单。
- 一级缓存 SqlSession 级默认开;Spring 未开事务时每次新 session,等于失效。
- 二级缓存 namespace 级,多表脏读 + 分布式失效,生产关闭。
`
      }
    ],
    interview: [
      { q: 'IoC 和 DI 是什么关系?', a: '**IoC(控制反转)是思想**:对象的创建与依赖装配权从程序代码反转给容器,降低耦合。**DI(依赖注入)是实现 IoC 的主要手段**:容器在运行时把依赖传递进来(构造器/Setter/字段三种)。可以说 IoC 是目的、DI 是手段。Spring 的 IoC 容器是 BeanFactory 体系,ApplicationContext 是它的高级形态(预实例化 + 事件 + 国际化)。' },
      { q: 'Bean 的生命周期说一下?', a: '主线四步:**实例化 → 属性填充 → 初始化 → 销毁**。细化回调:① 构造器实例化;② @Autowired/@Resource 属性填充;③ Aware 回调(BeanNameAware 等);④ BeanPostProcessor 前置处理;⑤ 初始化:@PostConstruct → InitializingBean#afterPropertiesSet → initMethod;⑥ 后置处理(AOP 代理在此生成);⑦ 使用,单例入一级缓存;⑧ 销毁:@PreDestroy → destroy → destroyMethod。单例由容器管到销毁,prototype 不管销毁。' },
      { q: '三级缓存为什么是三级?二级不行吗?', a: '三级缓存存的是 **ObjectFactory 工厂**,不是对象。核心矛盾:Spring 要求 AOP 代理在**初始化之后**生成,但循环依赖时对方在初始化前就要引用。用工厂做**延迟决策**:没循环依赖 → 正常时序初始化后才代理;有循环依赖 → 工厂提前产出代理放二级缓存。若只有二级直接放对象,所有 Bean 都必须提前创建代理,破坏生命周期设计。三级 = 正常流程与提前暴露的兼容方案,一级成品、二级早期引用、三级工厂。' },
      { q: '@Autowired 的实现原理?', a: '由 **AutowiredAnnotationBeanPostProcessor**(BeanPostProcessor 体系)在**属性填充阶段**处理:① 扫描 @Autowired/@Value 标注的成员;② 按**类型**找候选,多个则按字段名匹配,再不行看 @Qualifier/@Primary;③ 找不到且 required=true 抛 NoSuchBeanDefinitionException;④ 反射写入字段(private 也 setAccessible 强写)。@Resource 由 CommonAnnotationBeanPostProcessor 处理,先按名字后按类型。' },
      { q: '循环依赖怎么解决?哪些情况解决不了?', a: '**能解决**:单例 + 字段/Setter 注入。流程:A 实例化后把 ObjectFactory 放三级缓存 → 填充属性要 B → 创建 B → B 要 A 时从工厂拿到早期 A(必要时已代理)→ B 完成入一级缓存 → A 拿到 B 完成入一级缓存。**解决不了**:① 构造器注入(未实例化,无引用可暴露);② prototype(不走缓存);③ @Async 增强 Bean(代理时机特殊)。**逃生通道:@Lazy** 注入延迟代理。SpringBoot 2.6+ 默认禁止循环依赖。' },
      { q: 'BeanPostProcessor 有什么作用?', a: '它是容器的 **Bean 加工钩子**,每个 Bean 初始化前后回调:① postProcessBefore/AfterInitialization 可检查、修改甚至**整体替换** Bean(AOP 代理就在 After 阶段替换原始对象);② 两大代表作:AbstractAutoProxyCreator(AOP)、AutowiredAnnotationBeanPostProcessor(@Autowired 注入);③ 更早一层还有 BeanFactoryPostProcessor/BeanDefinitionRegistryPostProcessor,在实例化前改 BeanDefinition(如 @ConfigurationClassPostProcessor、@MapperScan)。一句话:Spring 的"魔法"几乎全挂后置处理器上。' },
      { q: '@Configuration 为什么不能换成 @Component?', a: '@Configuration 类会被 **CGLIB 增强成子类代理**:@Bean 方法被拦截后先查容器,单例已存在就直接返回容器实例,**保证 @Bean 方法互调时拿到的永远是同一个单例**。换成 @Component 没有 CGLIB 代理,方法互调就是普通 Java 调用,每次执行方法体都 new 新对象,破坏单例语义。这就是 full 模式与 lite 模式的区别:@Component 下的 @Bean 是 lite 模式,不做拦截。' },
      { q: 'AOP 的原理?JDK 和 CGLIB 怎么选?', a: 'Spring AOP 是**运行期动态代理**:BeanPostProcessor(postProcessAfterInitialization)阶段由 AbstractAutoProxyCreator 生成代理,调用时走拦截器链再到目标方法。**JDK 代理**:基于接口反射实现(Proxy + InvocationHandler),必须有接口。**CGLIB**:继承目标类生成子类(ASM 改字节码),final 类/方法无法代理。**SpringBoot 2.x 起默认 CGLIB**(proxyTargetClass=true)。AspectJ 是编译期织入,Spring 只借用其注解体系。' },
      { q: '事务的传播行为?REQUIRED 和 REQUIRES_NEW 区别?', a: '7 种:REQUIRED(默认,有则加入无则新建)、REQUIRES_NEW(挂起当前,新开事务)、NESTED(保存点)、SUPPORTS、NOT_SUPPORTED、NEVER、MANDATORY。**REQUIRED**:同一事务,内层异常整体回滚。**REQUIRES_NEW**:两个独立事务,内层回滚不影响外层,内层已提交后外层回滚也不影响它;典型场景是审计日志 —— 订单回滚了日志也要留。**NESTED** 是同一事务内保存点,外层回滚会带走内层。' },
      { q: '事务失效的场景有哪 8 种?', a: '① **自调用**:this 调用没走代理;② 方法**非 public**:切面只拦截 public;③ 抛**受检异常**没配 rollbackFor(默认只回滚 RuntimeException/Error);④ 异常被 **try-catch 吞掉**;⑤ 对象**没被 Spring 管理**(new 出来的);⑥ 引擎**不支持事务**(MyISAM);⑦ **传播行为配错**(如 NOT_SUPPORTED);⑧ **多线程**:事务绑定 ThreadLocal,子线程不共享连接。万变不离其宗:要么没走代理,要么异常没递到切面手里。' },
      { q: '@Transactional 的底层实现原理?', a: '**AOP + 事务管理器**。① 启动时事务 Advisor 扫描 @Transactional 生成切面;② 调用时 TransactionInterceptor 环绕拦截:获取连接、setAutoCommit(false)、把连接绑定到 ThreadLocal(TransactionSynchronizationManager);③ 目标方法正常返回 → commit,抛出 rollbackFor 匹配的异常 → rollback。真正的提交回滚由 JDBC Connection 完成,Spring 只做统一编排(PlatformTransactionManager 抽象),所以传播行为是应用层概念,数据库层没有。' },
      { q: '过滤器和拦截器的区别?', a: '**归属**:Filter 是 Servlet 规范,Tomcat 容器回调;Interceptor 是 SpringMVC 提供,DispatcherServlet 调度。**范围**:Filter 拦在 DispatcherServlet 之前,所有请求(含静态资源)都过;Interceptor 只拦进入 MVC 的 Handler。**粒度**:Filter 只有 doFilter 前后;Interceptor 有 preHandle/postHandle/afterCompletion 三个时机,能拿到 Handler 与 ModelAndView。**异常**:Interceptor 内异常走 HandlerExceptionResolver(@ControllerAdvice 兜底),Filter 不会。分工:Filter 管编码/跨域/全局安全,Interceptor 管登录态与权限。' },
      { q: 'SpringMVC 的执行流程?', a: '① 请求统一进入 **DispatcherServlet**(前端控制器);② **HandlerMapping** 按 url 找到 Handler(Controller 方法)与拦截器链;③ **HandlerAdapter** 适配执行;④ 拦截器 preHandle → 参数绑定 → 执行 Controller;⑤ 返回值处理:@ResponseBody 走 HttpMessageConverter 转 JSON 写回,普通返回走 ViewResolver 渲染;⑥ 异常由 HandlerExceptionResolver(@ControllerAdvice)兜底;⑦ postHandle → 渲染 → afterCompletion。核心思想:前端控制器模式 + 九大组件协作。' },
      { q: 'SpringBoot 自动配置的流程?', a: '① @SpringBootApplication 包含 **@EnableAutoConfiguration**;② 它 @Import 了 **AutoConfigurationImportSelector**;③ 读取清单文件(2.7 前读 META-INF/spring.factories,3.0+ 读 META-INF/spring/...AutoConfiguration.imports)拿到全部候选配置类;④ **条件注解过滤**(@ConditionalOnClass 类路径有依赖、@ConditionalOnMissingBean 用户没自定义才生效);⑤ 生效的配置类注册 Bean。一句话:引导类 + ImportSelector + 清单文件 + 条件装配,先约定后让位。' },
      { q: 'starter 的原理?怎么自定义 starter?', a: 'starter = **依赖聚合 + 自动配置**,本身几乎无代码,分两层:xxx-spring-boot-starter 聚合依赖,xxx-spring-boot-autoconfigure 放配置类与清单。**自定义三步**:① 写功能类 + @AutoConfiguration 配置类(@ConditionalOnClass/@ConditionalOnMissingBean + @EnableConfigurationProperties 绑定 yml);② 在 META-INF/spring/...AutoConfiguration.imports 登记全限定类名;③ 打包发布,引依赖即用。命名:官方 spring-boot-starter-xxx,第三方 xxx-spring-boot-starter;版本交给 BOM 管理。' },
      { q: 'MyBatis 中 #{} 和 ${} 的区别?', a: '**#{} 是预编译占位符**:替换成 JDBC 的 ?,值经 PreparedStatement 参数传入,**天然防 SQL 注入**,SQL 结构编译期定型。**${} 是字符串拼接**:值直接拼进 SQL,可能改变结构,是注入重灾区。结论:传值一律 #{};${} 仅限动态表名/列名/ORDER BY 字段名等结构成分,且值必须来自白名单。反例:name 传 "a OR 1=1",${} 拼出恒真条件全表泄露,#{} 只会查不到。' },
      { q: '@Value 和 @ConfigurationProperties 有什么区别?', a: '六个维度:**① 松散绑定** —— @ConfigurationProperties 支持 kebab-case/下划线自动映射 camelCase,@Value 要求键名完全一致;**② SpEL** —— @Value 支持 #{} 表达式,后者不支持;**③ 元数据** —— 后者配 spring-boot-configuration-processor 有 yml 自动补全;**④ JSR-303 校验** —— 后者支持类上 @Validated 加字段注解,@Value 不支持;**⑤ 类型安全** —— 后者直接绑定字段/集合/嵌套对象,@Value 拿到字符串手动转;**⑥ 批量管理** —— 后者一个类收拢一组配置。结论:零散单值用 @Value,一组相关配置用 @ConfigurationProperties,Boot 官方的 ServerProperties 就是范本。' },
      { q: 'Spring 事件机制的原理与应用场景?', a: '三角色:**ApplicationEvent**(事件,继承它或直接发 POJO)、**ApplicationEventPublisher**(发布器,容器实现了它,注入即用)、**@EventListener**(监听方法,启动时由 EventListenerMethodProcessor 收集注册)。底层 **ApplicationEventMulticaster** 按事件类型广播给匹配的监听器。要点:**默认同步执行**,publishEvent 的线程就是监听器的线程,主流程等监听器跑完才返回;要异步给监听器方法加 @Async。**事务联动**:@TransactionalEventListener(phase = AFTER_COMMIT) 保证事务提交后才触发,发 MQ/发通知必配。应用:业务解耦(下单后积分、物流各自监听)、审计日志、缓存刷新;本质是观察者模式,代价是链路隐式化,监听器异常要自己兜住,别拖垮主流程。' },
      { q: '@Async 的原理与失效场景?', a: '原理:@EnableAsync 开启后,AsyncAnnotationBeanPostProcessor 给标 @Async 的 Bean 生成**代理**,方法调用被拦截后提交线程池执行 —— 与事务、AOP 同一套代理体系。默认线程池是 **SimpleAsyncTaskExecutor**(每次新建线程、不复用),生产必须自定义 ThreadPoolTaskExecutor(核心数、队列容量、拒绝策略、线程名前缀)。失效场景:① **同类 this 自调用**,没走代理,与事务失效同根同源;② 方法非 public;③ 没加 @EnableAsync 开关;④ 返回值要 void 或 Future,调用方才拿得到结果;⑤ 跨线程陷阱:异步方法不共享调用方的事务连接与 ThreadLocal(如用户上下文),需要显式传参或用装饰器传递。' },
      { q: '全局异常处理怎么做?@RestControllerAdvice 的原理?', a: '三步:① 自定义业务异常 BusinessException(带 code 与 message);② 写 **@RestControllerAdvice** 类(等于 @ControllerAdvice 加 @ResponseBody,返回值自动转 JSON),内部用 **@ExceptionHandler(XxxException.class)** 声明处理方法,返回统一响应体;③ 匹配规则:**按异常类型就近匹配,子类优先**;业务异常透出业务码,Exception 兜底返回通用提示,堆栈只进日志不进响应。参数校验失败单独接 MethodArgumentNotValidException,拼接字段错误信息返回 400 码。**边界**:它只处理进入 DispatcherServlet 之后的异常,Filter 里抛的异常到不了这里,要用 ErrorPage 机制或在 Filter 内自行写响应。' },
      { q: '自定义 Starter 里 AutoConfiguration.imports 和 spring.factories 有什么区别?', a: '两者都是自动配置类的登记清单,差别在版本与读取方式:**spring.factories** 是 2.7 之前的通用 SPI 文件,properties 格式,key 为 org.springframework.boot.autoconfigure.EnableAutoConfiguration,value 逗号分隔多个配置类,由 SpringFactoriesLoader 读取;同一文件还承载 ApplicationListener、EnvironmentPostProcessor 等其他 SPI。**AutoConfiguration.imports** 是 2.7 引入、3.0 起唯一生效的机制,路径 META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports,一行一个全限定类名,由 ImportCandidates 读取,推荐配合 @AutoConfiguration 注解。新写 starter 一律登记 imports 文件;3.0 起 spring.factories 里的 EnableAutoConfiguration 条目会被直接无视。' },
      { q: 'Spring、SpringMVC、SpringBoot 三者是什么关系?SpringBoot 解决了什么痛点?', a: '**Spring Framework 是底座**:提供 IoC 容器、AOP、事务等核心能力。**SpringMVC 是 Spring 体系里的 Web 层框架**,基于 DispatcherServlet 处理 HTTP 请求。**SpringBoot 不是新框架,而是工程化脚手架**:starter 聚合依赖、自动配置按条件装配、内嵌 Tomcat 让应用一个 jar 就能跑。它解决四个痛点:依赖版本冲突、XML 样板配置过多、部署依赖外置容器、缺少统一监控与外部化配置。一句话:Spring 提供能力,SpringMVC 是 Web 入口,SpringBoot 让两者开箱即用。' },
      { q: '什么是框架?使用 Spring 相比手写 Servlet 有哪些好处?', a: '**框架是带约束的半成品**:搭好骨架、留出扩展点,你只填业务,控制权反转给框架。相比手写 Servlet 的好处:① **对象管理**:依赖由容器创建注入,换实现不改业务代码,也便于注入 Mock 测试;② **横切逻辑**:日志、权限、事务用 AOP 统一织入,不必每个方法复制;③ **基础设施模板**:声明式事务自动完成连接、提交、回滚、释放;④ **Web 效率**:一个 DispatcherServlet 加注解映射替代"一个 URL 一个 Servlet",参数绑定、JSON 序列化、全局异常处理都由框架代劳。代价是要遵守框架约定并理解生命周期。' },
      { q: 'SpringBoot 的启动流程说一下?', a: '① 构造时推断 Web 类型、加载 Initializer 与 Listener;② prepareEnvironment 加载 yml、激活 profile;③ createContext 建容器、注册主类;④ refreshContext 自动配置并在 onRefresh 建 Tomcat;⑤ finishRefresh 启动;⑥ 执行 Runner、发布 ready。' },
      { q: '内嵌 Tomcat 的原理是什么?', a: 'tomcat-embed-core 作为依赖打进 jar。ServletWebServerApplicationContext 在 onRefresh 调用 TomcatServletWebServerFactory#getWebServer 创建 Tomcat,finishRefresh 阶段启动并监听 server.port,无需外部容器。' },
      { q: '怎么自定义一个 Starter?', a: '① 建两个模块:starter 聚合依赖,autoconfigure 放代码;② 用 @ConfigurationProperties 绑定 yml,自动配置类加 @AutoConfiguration 与 @ConditionalOnClass;③ 在 META-INF/spring/...AutoConfiguration.imports 登记类名;④ 业务项目引 starter 即生效。' },
      { q: '@Conditional 注解有什么作用?', a: '自动配置类有上百个候选,不能全生效。条件注解按 classpath、容器 Bean、配置项、Web 类型等判断,不满足就跳过整个配置类或 @Bean。典型:@ConditionalOnClass 有依赖才装配,@ConditionalOnMissingBean 用户没定义才给默认值。它让同一份 jar 适配不同项目,是"按需装配"的开关,也是约定大于配置的落地点。' },
      { q: 'AutoConfiguration.imports 和 spring.factories 有什么区别?', a: '2.7 前自动配置登记在 spring.factories 的 EnableAutoConfiguration 键下,由 SpringFactoriesLoader 解析;3.0 起改用专用清单 AutoConfiguration.imports,一行一个类名,由 ImportCandidates 读取。好处是读取更轻、支持排序;其他 SPI 仍留在 spring.factories。' },
      { q: '可执行 jar 是怎么跑起来的?LaunchedURLClassLoader 做了什么?', a: '插件重新打包:业务类进 BOOT-INF/classes,依赖进 BOOT-INF/lib,MANIFEST 指定 Main-Class=JarLauncher、Start-Class=主类。JarLauncher 创建 LaunchedURLClassLoader,把 classes 与嵌套 jar 组装成 URL,再反射调用 Start-Class 的 main。' },
      { q: 'SpringBoot 配置优先级从高到低是怎样的?', a: '命令行参数 > SPRING_APPLICATION_JSON > Java 系统属性 > 操作系统环境变量 > application-{profile}.yml > application.yml。同名键高优先级覆盖低优先级。k8s 里用环境变量覆盖镜像内 yml 就是利用这一点:一次构建、多环境部署。注意环境变量没有点号,需写成 SERVER_PORT 这种下划线形式。' },
      { q: 'SLF4J 和 Logback 是什么关系?为什么用门面?', a: 'SLF4J 是日志门面,只定义 Logger 接口;Logback 是实现。业务代码依赖 slf4j-api,第三方库的 JCL、log4j 等也通过桥接汇入门面,最终由 Logback 决定格式与落盘。好处是换实现不改业务代码、日志 API 统一。Boot 默认 Logback,支持 logback-spring.xml 的 springProfile、滚动与异步 Appender。' },
      { q: 'Actuator 有哪些常用端点?健康检查怎么做?', a: '常用 health、info、metrics、loggers、env,默认只暴露 health。health 聚合 DataSource、Redis、Disk 等 HealthIndicator,全部 UP 才返回 UP,适合 K8s 探针。生产用 exposure.include 精确开放,show-details 设 when-authorized,env/beans 不暴露。' },
      { q: '优雅停机怎么配置?原理是什么?', a: 'server.shutdown=graceful 开启,timeout-per-shutdown-phase 设等待上限。停机时先停止接收新请求,等待在途请求完成,再销毁 Bean 与连接池。K8s 的 terminationGracePeriodSeconds 要大于该超时并配 preStop 摘流量,否则请求仍会打到关闭中的 Pod。' },
      { q: '升级 SpringBoot 3 有哪些关键变化?', a: 'Java 17 基线;Jakarta EE 9,javax.servlet、persistence、validation 全换 jakarta,老依赖需升级;自动配置只认 AutoConfiguration.imports;可观测性统一到 Micrometer Observation;支持 GraalVM 与 AOT。升级时先升 JDK 与依赖,再全局替换 import。' },
      { q: 'GraalVM 原生镜像的优缺点?', a: 'Boot 3 用 AOT 在构建期生成 Bean 定义、代理与反射元数据,再交给 GraalVM 编译成本地可执行文件。优点是启动几十毫秒、内存低、无 JVM 预热;限制是封闭世界:反射、资源、动态代理、JNI 都要 RuntimeHints 显式登记,动态类加载和部分字节码增强库不支持,构建也慢。适合 Serverless 与弹性伸缩,不适合频繁改动的内部服务。' },
      { q: '@SpringBootTest 和切片测试有什么区别?', a: '@SpringBootTest 启动完整容器,适合端到端;@WebMvcTest 只加载 MVC 层,配合 MockMvc 与 @MockBean 验证接口契约,启动快、隔离好;还有 @DataJpaTest 等切片。遵循测试金字塔:单元测试打底,少量切片,极少数全量集成。Boot 3.4 对应 Spring Framework 6.2 起可用 @MockitoBean 替代 @MockBean;后者在 Boot 中被弃用,并非简单同类改名。' },
      { q: '@Cacheable 的原理是什么?什么情况下会失效?', a: '@EnableCaching 导入缓存基础设施,@Cacheable 方法被 CacheInterceptor 以 AOP 代理拦截:先按 key 查缓存,命中直接返回,未命中执行方法并回填。key 默认 SimpleKeyGenerator,也可用 SpEL。自调用不走代理会失效;多实例要用集中式 CacheManager 并设 TTL。' }
    ]
  };
})();
