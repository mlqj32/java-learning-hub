/* ═══════════════════════════════════════════════════════════
   模块:设计模式心法 · 行为型扩展篇(p04 / p05)
   定位:教材式讲解 —— 故事引出 → 痛点 → 演进 → 模式代码 → 取舍 → 面试追问
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.PATTERNS_EXTRA = window.PATTERNS_EXTRA || {};
  window.PATTERNS_IQ = window.PATTERNS_IQ || [];

  window.PATTERNS_EXTRA['p04'] = {
    id: 'p04',
    title: '行为型模式(上):把变化关进笼子',
    minutes: 70,
    points: ['策略', '观察者', '责任链', '模板方法', '状态', '命令'],
    content: `
> [!info] 本章导读 · 六个模式,都在回答"变化来了往哪儿放"
> 创建型管对象怎么造,结构型管对象怎么拼,行为型管的是**对象之间怎么分工、怎么通信** —— 业务代码里最容易膨胀的恰恰是这一层。你在项目里见过的"800 行 Service",八成不是创建或结构出了问题,而是判断、通知、流程、状态全挤在一个方法里。
> 这一章挑六个最值钱的行为型模式,每个都从一段真实的烂代码开场:计价分支、支付后的连环通知、请假逐级审批、泡茶与泡咖啡的重复步骤、订单状态迁移、遥控器上的撤销键。
> - 读完本章你将能:看到长 if-else、连环调用、逐级判断,立刻反应过来该上哪个模式
> - 说清三组最容易混的模式:策略 vs 工厂、状态 vs 策略、模板方法 vs 策略
> - 在 Spring MVC、JdbcTemplate、Spring 事件里指出每个模式的活例子

> [!tip] 日常现场 · 手机里的六个开关
> 拍照时你选"人像 / 夜景 / 微距",这是**策略**:同一个快门,换一套算法。
> 你关注了公众号,它一发文章你手机上就弹通知,这是**观察者**:你和公众号互不认识,只靠"订阅"这条线连着。
> 快递超区要一级级转:站点 → 分拨中心 → 总部,谁有权处理谁就拦下,这是**责任链**。
> 泡面和煮面都要"烧水 → 下料 → 出锅",只有中间一步不同,这是**模板方法**。
> 点外卖后订单依次是"待接单 → 配送中 → 已送达",每个状态下能点的按钮都不一样,这是**状态**。
> 电视遥控器每个键封装一个动作,还支持"回看",这是**命令**。
> ==模式不神秘,它只是给生活里早就存在的分工方式起了个名字。==

> [!tip] 日常电脑现场 · 红绿灯与请假审批
> 路口的红绿灯按状态切换(状态模式),请假要组长→经理→总监逐级审批(责任链),公众号一发文章所有粉丝收到(观察者),泡茶和泡咖啡步骤几乎一样(模板方法)。行为型模式全藏在这些日常流程里。

## 六将分工:先存一张选型表

| 你看到的代码味道 | 该想到 | 一句话判断 |
| --- | --- | --- |
| 长 if-else / switch 在挑算法 | 策略 | 同一件事有多种算法,调用方只想说"用哪种" |
| 一处变化要通知一堆下游 | 观察者 | 发布者不该认识订阅者 |
| 一级级判断"谁能处理" | 责任链 | 处理者排成队,谁行谁上,不行传给下一个 |
| 多个类流程一样、个别步骤不同 | 模板方法 | 流程锁在父类,差异留给子类 |
| 对象行为随自身状态改变 | 状态 | 状态决定行为,行为又推动状态 |
| 要把"请求"存下来 / 排队 / 撤销 | 命令 | 把动作本身封装成对象 |

这张表建议先记结论,下面每个模式都会回来对照一次。

## ⭐⭐⭐ 策略模式 Strategy —— 出行方式不止一种

> [!info] 先讲个场景
> 早上出门,你会在"地铁、打车、骑车、公交"里挑一个:赶时间打车,下雨坐公交,天气好骑车。你并没有为每种方式各买一辆车,而是**保留一套选择权,每天按条件挑一个**。
> 软件里的支付渠道、会员折扣、限流算法、压缩算法,全是这个形状:同一件事,多种算法,运行期选一个。

> [!warn] 不用模式会怎样
> 最常见的写法,是把"选算法"和"执行算法"塞进同一个方法,用 if-else 串起来。需求每加一种,方法就长一截;某种算法改了规则,整个方法都要回归;想单独测"满减",得先造一个能走进那个分支的入参。更隐蔽的是 type 用字符串或魔法数字,拼错一个字母编译期不报,线上才炸。

### 角色与结构

策略模式只有三个角色,少到可以背下来:

| 角色 | 职责 | 本例 |
| --- | --- | --- |
| 策略接口 Strategy | 定义所有算法的统一入口 | DiscountStrategy.discount(amount) |
| 具体策略 ConcreteStrategy | 一种算法的实现 | 原价、满减、会员价 |
| 上下文 Context | 持有策略,把请求转给它 | PriceCalculator |

\`\`\`diagram:u-strategy
\`\`\`

关键点:上下文只认接口,不认识任何具体策略。**"选谁"被推给调用方或工厂,上下文只负责"用"** —— 这就是策略把变化关进笼子的方式。

### 从烂代码到模式代码

初版:三种计价规则写在一个方法里(金额单位统一用分,避免浮点误差)。

\`\`\`java
public class PriceService {
    public int quote(String type, int amount) {
        if ("NORMAL".equals(type)) {
            return amount;
        } else if ("FULL_REDUCE".equals(type)) {
            return amount >= 30000 ? amount - 5000 : amount;   // 满 300 减 50
        } else if ("VIP".equals(type)) {
            return amount * 8 / 10;                            // 会员 8 折
        }
        throw new IllegalArgumentException("未知计价方式: " + type);
    }

    public static void main(String[] args) {
        PriceService svc = new PriceService();
        System.out.println(svc.quote("NORMAL", 39900));
        System.out.println(svc.quote("FULL_REDUCE", 39900));
        System.out.println(svc.quote("VIP", 39900));
    }
}
\`\`\`

\`\`\`output
39900
34900
31920
\`\`\`

十行代码,一眼读完,这个阶段它没有任何问题。真正的成本在变化到来之后,而这种写法把三个变化方向全焊死了:

- **新增"企业月结"**:改 quote,三个老渠道跟着重新测一遍。
- **满减门槛从 300 调到 200**:改 quote,改的人可能碰坏 VIP 分支。
- **想给"满减"写单测**:得先绕过另外两个分支,没法只测一段算法。
- **规则里出现浮点**:顺手写成 0.8,金额迟早对不上账。

模式版:把每种算法搬进自己的类,上下文只持有一个接口。

\`\`\`java
interface DiscountStrategy {
    int discount(int amount);                       // 入参出参都是分
}

class NormalPrice implements DiscountStrategy {
    public int discount(int amount) { return amount; }
}

class FullReduce implements DiscountStrategy {
    public int discount(int amount) { return amount >= 30000 ? amount - 5000 : amount; }
}

class VipPrice implements DiscountStrategy {
    public int discount(int amount) { return amount * 8 / 10; }
}

class PriceCalculator {                             // 上下文
    private final DiscountStrategy strategy;

    PriceCalculator(DiscountStrategy strategy) { this.strategy = strategy; }

    int quote(int amount) { return strategy.discount(amount); }
}

public class StrategyDemo {
    public static void main(String[] args) {
        int amount = 39900;
        System.out.println(new PriceCalculator(new NormalPrice()).quote(amount));
        System.out.println(new PriceCalculator(new FullReduce()).quote(amount));
        System.out.println(new PriceCalculator(new VipPrice()).quote(amount));
    }
}
\`\`\`

\`\`\`output
39900
34900
31920
\`\`\`

行为一模一样,但变化被关进了笼子:新增"企业月结"只是多一个类,PriceCalculator 一行不改;满减改门槛只动 FullReduce;测试可以只 new 一个 FullReduce 断言输出。**代价是类变多了,而且"选谁"这件事跑到了调用方身上** —— 所以真实项目一定会再补一层工厂。

第一层演进:**策略 + 工厂**,把分派也收进一处。

\`\`\`java
import java.util.Map;
import java.util.HashMap;
import java.util.Collections;

// 本代码块独立运行，因此把上一例用到的接口和类也完整带上。
interface DiscountStrategy {
    int discount(int amount);
}
class NormalPrice implements DiscountStrategy {
    public int discount(int amount) { return amount; }
}
class FullReduce implements DiscountStrategy {
    public int discount(int amount) { return amount >= 30000 ? amount - 5000 : amount; }
}
class VipPrice implements DiscountStrategy {
    public int discount(int amount) { return amount * 8 / 10; }
}
class PriceCalculator {
    private final DiscountStrategy strategy;
    PriceCalculator(DiscountStrategy strategy) { this.strategy = strategy; }
    int quote(int amount) { return strategy.discount(amount); }
}

class PriceCalculatorFactory {
    private static final Map<String, DiscountStrategy> TABLE;
    static {
        Map<String, DiscountStrategy> rules = new HashMap<>();
        rules.put("NORMAL", new NormalPrice());
        rules.put("FULL_REDUCE", new FullReduce());
        rules.put("VIP", new VipPrice());
        TABLE = Collections.unmodifiableMap(rules); // Java 8：初始化后不允许修改映射
    }

    static PriceCalculator of(String type) {
        DiscountStrategy strategy = TABLE.get(type);
        if (strategy == null) {
            throw new IllegalArgumentException("未知计价方式: " + type);
        }
        return new PriceCalculator(strategy);
    }
}

public class FactoryStrategyDemo {
    public static void main(String[] args) {
        for (String type : new String[]{"NORMAL", "FULL_REDUCE", "VIP"}) {
            System.out.println(type + ": " + PriceCalculatorFactory.of(type).quote(39900));
        }
        System.out.println("未满门槛: " + PriceCalculatorFactory.of("FULL_REDUCE").quote(29999));
        System.out.println("刚满门槛: " + PriceCalculatorFactory.of("FULL_REDUCE").quote(30000));
        try {
            PriceCalculatorFactory.of("UNKNOWN");
        } catch (IllegalArgumentException e) {
            System.out.println(e.getMessage());
        }
    }
}
\`\`\`

\`\`\`output
NORMAL: 39900
FULL_REDUCE: 34900
VIP: 31920
未满门槛: 29999
刚满门槛: 25000
未知计价方式: UNKNOWN
\`\`\`

用法变成 PriceCalculatorFactory.of("VIP").quote(39900),输出 31920。点击运行即可同时核对三种策略、满减门槛和未知类型分支，无需运行上一个代码块。静态块构建 Map，再包成不可修改视图，兼容网页 Java 8；Java 9 起也可用 Map.of（最多 10 组键值）或 Map.ofEntries，但它们不能直接用于当前网页 JVM。

第二层演进:**枚举 + 函数式**。当每个策略只有一行、数量不超过五六个时,为每个算法建一个类反而啰嗦:

\`\`\`java
import java.util.function.IntUnaryOperator;

enum PriceType {
    NORMAL(a -> a),
    FULL_REDUCE(a -> a >= 30000 ? a - 5000 : a),
    VIP(a -> a * 8 / 10);

    private final IntUnaryOperator op;

    PriceType(IntUnaryOperator op) { this.op = op; }

    int quote(int amount) { return op.applyAsInt(amount); }
}

public class PriceEnumDemo {
    public static void main(String[] args) {
        for (PriceType type : PriceType.values()) {
            System.out.println(type + ": " + type.quote(39900));
        }
    }
}
\`\`\`

PriceType.VIP.quote(39900) 同样输出 31920。枚举版省掉了类文件,但**算法一长就不可读**,超过五行的逻辑还是回退到"接口 + 实现类"。

Spring 里的标准落地:**注入一组策略,key 是 bean 名**。

\`\`\`java
@Service
public class PriceService {
    private final Map<String, DiscountStrategy> strategies;   // key = bean 名称

    public PriceService(Map<String, DiscountStrategy> strategies) {
        this.strategies = strategies;
    }

    public int quote(String type, int amount) {
        DiscountStrategy strategy = strategies.get(type);
        if (strategy == null) {
            throw new IllegalArgumentException("未知计价方式: " + type);
        }
        return strategy.discount(amount);
    }
}

@Component("vip")                                            // 显式对齐前端传的 key
class VipPrice implements DiscountStrategy {
    public int discount(int amount) { return amount * 8 / 10; }
}
\`\`\`

容器启动时会把所有 DiscountStrategy 实现按 bean 名装进 Map。==最容易踩的坑是 bean 名对不上:类叫 VipPrice,默认 bean 名是 vipPrice,而前端传的是 vip,于是永远取不到。==要么用 @Component("vip") 显式命名,要么统一从枚举里取 key。

> [!pitfall] 策略模式和简单工厂到底谁消 if?
> 工厂把 if 换成 Map,策略把 if 换成多态,两者都在"搬 if",没有谁能真正消灭判断。区别是工厂的判断用于**创建对象**,策略的判断用于**选择算法**。实战里 90% 的"策略模式"落地都是"策略 + 工厂 / Map",一条链同时解决创建与执行。

### 优缺点与适用场景

| 优点 | 缺点 | 何时用 | 真实应用 |
| --- | --- | --- | --- |
| 新增算法只加类,符合开闭;算法可独立单测;运行期可替换 | 类数量上升;调用方要知道选哪个;简单两三选一时反而更绕 | 分支三个以上且还在增长;算法需要被复用、组合或热插拔 | JDK 的 Comparator、线程池的 RejectedExecutionHandler、Spring 的 PlatformTransactionManager |

- **典型信号**:同一个方法里出现"根据 type 选算法",而且 type 的取值还在增加。
- **什么时候别用**:只有两个分支、一年都不变;或者每个算法短到只有一行 —— 一个 Map 甚至直接 if 更清楚。
- **一句话对比**:工厂管"生",策略管"变";两者不是替代关系,是常用组合。

### 面试追问

> [!interview] 追问 1:策略模式和简单工厂有什么区别?能一起用吗?
> 工厂解决"对象怎么来",策略解决"行为怎么换",两者正交:工厂的返回值类型可以是策略接口,于是"工厂选实现、策略做行为"。答辩时说清维度不同,再说组合方式,比单说"一个是创建型一个是行为型"更有料。

> [!interview] 追问 2:策略模式能完全消除 if-else 吗?
> 不能。它消除的是"在核心流程里按类型选算法"这类 if,把分派挪进一个 Map 或工厂 —— 分派依然存在,只是从散落各处收敛成一张表。正确说法是"把 if 集中并数据化"。如果选择逻辑本身是多维条件加优先级,硬塞进 Map 会更乱,那是规则引擎或责任链的活。

## ⭐⭐⭐ 观察者模式 Observer —— 订阅之后,你不必认识我

> [!info] 先讲个场景
> 你关注了一个公众号。它发文时,你不用刷新,手机自动弹出通知;它也不需要知道你是谁、用什么手机,只管往"订阅者列表"里挨个推。
> 电商下单成功后要发短信、发邮件、加积分、推企业微信、更新报表 —— 支付服务是那个"公众号",五个下游就是订阅者。

> [!warn] 不用模式会怎样
> 最直觉的写法是在支付成功方法里把下游一个个调一遍。刚开始只有两个调用,很清晰;半年后变成六个,支付方法从"处理支付"变成了"通知总调度"。任何下游加一个字段、换一个客户端,都要改支付核心类并重新回归;某个下游超时,整条支付链路跟着卡住。

### 角色与结构

| 角色 | 职责 | 本例 |
| --- | --- | --- |
| 主题 Subject | 维护订阅者列表,负责注册、注销、通知 | EventBus |
| 观察者 Observer | 定义收到通知后的回调 | OrderListener.onPaid |
| 具体观察者 | 各自实现回调,彼此不知道对方存在 | 邮件、短信、积分三个监听器 |

\`\`\`diagram:u-observer
\`\`\`

### 从烂代码到模式代码

初版:支付服务亲手调用每个下游。

\`\`\`java
// 网页中以控制台打印模拟三个下游，不发送真实邮件或短信。
class MailClient {
    void sendReceipt(String orderNo) { System.out.println("[邮件] 订单 " + orderNo + " 电子回执"); }
}
class SmsClient {
    void sendPaid(String orderNo) { System.out.println("[短信] 订单 " + orderNo + " 支付成功"); }
}
class PointClient {
    void add(String orderNo, int points) { System.out.println("[积分] 订单 " + orderNo + " 增加 " + points); }
}
public class OrderService {
    private final MailClient mail = new MailClient();
    private final SmsClient sms = new SmsClient();
    private final PointClient point = new PointClient();

    public void paySuccess(String orderNo) {
        System.out.println("订单 " + orderNo + " 支付成功");
        mail.sendReceipt(orderNo);      // 下游一
        sms.sendPaid(orderNo);          // 下游二
        point.add(orderNo, 10);         // 下游三
    }

    public static void main(String[] args) {
        new OrderService().paySuccess("A1001");
    }
}
\`\`\`

痛点不在"调了三次",而在这三条隐藏的耦合:

- 支付服务编译期依赖所有下游客户端,想按模块拆分,拆不动。
- 加一个"企业微信通知",要改支付代码,测试范围扩大到支付本身。
- 第二个下游抛异常,第三个积分就永远加不上 —— **通知链没有隔离**。

模式版:发布者只认识一个"订阅者接口",谁想听谁自己注册。

\`\`\`java
import java.util.ArrayList;
import java.util.List;

interface OrderListener {                     // 观察者接口
    void onPaid(String orderNo);
}

class EventBus {                              // 主题:维护订阅关系并通知
    private final List<OrderListener> listeners = new ArrayList<>();

    void subscribe(OrderListener listener) { listeners.add(listener); }

    void unsubscribe(OrderListener listener) { listeners.remove(listener); }

    void publish(String orderNo) {
        System.out.println("== 发布订单支付事件 " + orderNo + " ==");
        for (OrderListener listener : new ArrayList<>(listeners)) {   // 快照,防并发修改
            try {
                listener.onPaid(orderNo);
            } catch (RuntimeException e) {
                System.out.println("[隔离] " + listener.getClass().getSimpleName()
                        + " 失败: " + e.getMessage());
            }
        }
    }
}

class MailListener implements OrderListener {
    public void onPaid(String orderNo) {
        System.out.println("[邮件] 订单 " + orderNo + " 支付回执已发送");
    }
}

class SmsListener implements OrderListener {
    public void onPaid(String orderNo) {
        System.out.println("[短信] 订单 " + orderNo + " 支付成功");
    }
}

class PointListener implements OrderListener {
    public void onPaid(String orderNo) {
        throw new IllegalStateException("积分服务超时");
    }
}

public class ObserverDemo {
    public static void main(String[] args) {
        EventBus bus = new EventBus();
        bus.subscribe(new MailListener());
        bus.subscribe(new SmsListener());
        bus.subscribe(new PointListener());

        bus.publish("A1001");
        bus.publish("A1002");
    }
}
\`\`\`

\`\`\`output
== 发布订单支付事件 A1001 ==
[邮件] 订单 A1001 支付回执已发送
[短信] 订单 A1001 支付成功
[隔离] PointListener 失败: 积分服务超时
== 发布订单支付事件 A1002 ==
[邮件] 订单 A1002 支付回执已发送
[短信] 订单 A1002 支付成功
[隔离] PointListener 失败: 积分服务超时
\`\`\`

两处细节值得单独记:

- **快照遍历**:new ArrayList<>(listeners) 防止监听器在回调里 subscribe/unsubscribe 导致 ConcurrentModificationException。
- **异常隔离**:每个回调单独 try/catch,一个下游挂了不影响其他下游。真实框架会再叠加重试、死信队列和异步线程池,但"隔离"这个思路是一样的。

> [!warn] 观察者最容易被忽略的两个坑
> 一是**通知顺序**:多数实现按注册顺序同步调用,下游若有依赖(必须先建索引再发通知),顺序就变成了隐式契约,最好显式分阶段。二是**循环通知**:A 的监听器又发了事件,事件再触发 A,线上表现为 CPU 飙高、日志刷屏,需要靠事件类型白名单或链路深度限制兜底。

### 推还是拉:接口设计的分水岭

| 方式 | 传什么 | 优点 | 缺点 |
| --- | --- | --- | --- |
| 推 Push | 事件对象里带好全部数据 | 监听器拿起来就用,实现简单 | 事件字段一变,所有监听器跟着改 |
| 拉 Pull | 只给事件对象或主题引用,监听器自己取 | 事件结构演进不影响接口 | 监听器要知道去哪儿取,可能多一次查询 |

JDK 早期给过一套 java.util.Observable / Observer,Java 9 起已标记为废弃,官方理由是事件模型过于简单、不可序列化且没有线程安全保证 —— ==面试里提这一句,足以说明你读过 JDK 源码而不是只背模式名。==

### Spring 里的观察者:ApplicationEvent

\`\`\`java
// 1) 事件:携带发布者与业务数据
public class OrderPaidEvent extends ApplicationEvent {
    private final String orderNo;

    public OrderPaidEvent(Object source, String orderNo) {
        super(source);
        this.orderNo = orderNo;
    }

    public String getOrderNo() { return orderNo; }
}

// 2) 发布:注入 ApplicationEventPublisher 后一行搞定
applicationEventPublisher.publishEvent(new OrderPaidEvent(this, "A1001"));

// 3) 监听:一个注解就完成订阅
@Component
public class SmsListener {
    @EventListener
    public void onPaid(OrderPaidEvent event) {
        System.out.println("[短信] 订单 " + event.getOrderNo() + " 支付成功");
    }
}
\`\`\`

@EventListener 默认**同步、同线程**:监听器异常会包装后抛回发布方,可能连带回滚发布方的事务。要异步就加 @Async 并配好线程池;要保证"事务提交后再通知",用 @TransactionalEventListener(phase = AFTER_COMMIT),否则会出现"短信发了、订单却回滚了"的经典事故。

### 优缺点与适用场景

| 优点 | 缺点 | 何时用 | 真实应用 |
| --- | --- | --- | --- |
| 发布者与订阅者解耦;新增订阅者不改发布者;天然适合一对多广播 | 通知顺序与异常处理要自己兜;事件链路难追踪;同步实现会拖慢发布方 | 一处状态变化要触发多个互不相关的下游;下游数量会增长 | Spring ApplicationEvent、Servlet 的 Listener、MQ 的订阅模型、Nacos 配置变更推送 |

### 面试追问

> [!interview] 追问 1:观察者模式和发布-订阅有什么区别?
> 经典观察者是**直接引用**:主题持有观察者列表并同步调用,双方互相知道类型。发布-订阅引入 broker(EventBus、MQ),发布者只把消息交给 broker,订阅者向 broker 注册,双方互不认识,因此可以跨进程、异步、削峰。一句话:观察者是"我直接打电话给你",发布订阅是"我把消息交给邮局"。

> [!interview] 追问 2:Spring 事件怎么能保证"事务提交后才发通知"?
> 默认的 @EventListener 在事务方法内部就执行了,此时事务还没提交,监听器查库会读到旧数据,发布方回滚时通知也已经发出去了。改用 @TransactionalEventListener(phase = AFTER_COMMIT),Spring 会把监听器挂到事务同步回调上,提交成功才执行;配合 @Async 还能把通知移出主线程。这也是"最终一致性"最常见的第一版实现。

## ⭐⭐⭐ 责任链模式 Chain of Responsibility —— 谁行谁上,不行传给下一个

> [!info] 先讲个场景
> 请假的审批流是这样的:一天以内组长批,三天以内经理批,七天以内总监批,超过七天只能转 HR。请求从组长开始,他处理不了就往上递,谁有权谁签字。
> 网关里的请求也一样:先过鉴权,再过限流,再过日志,最后才到业务接口。每个环节都可能放行,也可能直接把请求打回去。

> [!warn] 不用模式会怎样
> 把审批规则写成 if-else,判据会从"天数"慢慢长成"天数 + 部门 + 职级 + 是否跨级";每加一级审批就要改方法;不同部门想要不同顺序时,只能复制一份改。更麻烦的是"谁能处理"被藏进了数字比较里,规则一改,没人能一眼看出这条链长什么样。

### 角色与结构

| 角色 | 职责 | 本例 |
| --- | --- | --- |
| 处理者 Handler | 定义处理接口与下一环指针 | Approver |
| 具体处理者 | 判断自己能否处理,不能则转发 | TeamLead、Manager、Director |
| 客户端 | 组装链并发起请求 | main 或配置类 |

\`\`\`diagram:u-chain
\`\`\`

### 从烂代码到模式代码

初版:四个分支塞在一个方法里。

\`\`\`java
public class LeaveService {
    public String approve(int days) {
        if (days <= 1) {
            return "组长批准";
        } else if (days <= 3) {
            return "经理批准";
        } else if (days <= 7) {
            return "总监批准";
        }
        return "驳回:超过 7 天";
    }

    public static void main(String[] args) {
        LeaveService service = new LeaveService();
        for (int days : new int[]{1, 3, 7, 8}) {
            System.out.println(days + " 天: " + service.approve(days));
        }
    }
}
\`\`\`

看起来还好,但它把"审批权限"表达成了"天数区间",一旦某部门要求"三天以上必须总监先看",这个 if 链就得重写。而且无法做到"某些请求跳过某一级",因为顺序是写死的代码,不是可配置的数据。

模式版:每个审批人只管两件事 —— 我能不能批、不能就交给下一位。

\`\`\`java
abstract class Approver {
    protected Approver next;

    Approver setNext(Approver next) {          // 返回下一环,方便链式组装
        this.next = next;
        return next;
    }

    final String handle(int days) {            // 模板:先自己,再下一环
        String result = tryApprove(days);
        if (result != null) {
            return result;
        }
        if (next == null) {
            return "驳回:超出审批权限,转 HR";
        }
        return next.handle(days);
    }

    protected abstract String tryApprove(int days);   // 返回 null 表示交给下一环
}

class TeamLead extends Approver {
    protected String tryApprove(int days) { return days <= 1 ? "组长批准" : null; }
}

class Manager extends Approver {
    protected String tryApprove(int days) { return days <= 3 ? "经理批准" : null; }
}

class Director extends Approver {
    protected String tryApprove(int days) { return days <= 7 ? "总监批准" : null; }
}

public class ChainDemo {
    public static void main(String[] args) {
        Approver lead = new TeamLead();
        lead.setNext(new Manager()).setNext(new Director());

        System.out.println("1 天 -> " + lead.handle(1));
        System.out.println("3 天 -> " + lead.handle(3));
        System.out.println("5 天 -> " + lead.handle(5));
        System.out.println("8 天 -> " + lead.handle(8));
    }
}
\`\`\`

\`\`\`output
1 天 -> 组长批准
3 天 -> 经理批准
5 天 -> 总监批准
8 天 -> 驳回:超出审批权限,转 HR
\`\`\`

链式组装有三个必须讲清的点:

- **组装权归客户端**。链的顺序由 main 或 Spring 配置决定,处理者自己不知道自己在第几环。想调整顺序,改组装处,不改任何审批类。
- **兜底必须显式写**。next 为 null 时的分支是责任链最容易漏的地方,漏了就是"请求被静默丢弃",线上表现为用户点了提交、页面转圈、日志里什么都没有。
- **小心循环链**。A 指向 B、B 又指回 A,请求在里面转圈直到栈溢出。可以在组装时校验,或给请求加一个最大跳数。

### 链的另一种形态:逐环加工

上面是"互斥链",有且只有一个人真正处理。还有一种是"每一环都做一点再往下传",网关和过滤器就是这种:

\`\`\`java
import java.util.List;

interface GatewayFilter {
    boolean filter(String req);            // 返回 false = 中断,后面的不再执行
}

class AuthFilter implements GatewayFilter {
    public boolean filter(String req) {
        boolean ok = req.contains("token=");
        System.out.println("[鉴权] " + (ok ? "通过" : "拒绝"));
        return ok;
    }
}

class RateLimitFilter implements GatewayFilter {
    private int left = 1;

    public boolean filter(String req) {
        boolean ok = left-- > 0;
        System.out.println("[限流] " + (ok ? "放行" : "超过 1 次/秒"));
        return ok;
    }
}

public class GatewayDemo {
    public static void main(String[] args) {
        List<GatewayFilter> pipeline = java.util.Arrays.asList(new AuthFilter(), new RateLimitFilter());

        for (String req : new String[]{"GET /order", "GET /order?token=abc"}) {
            System.out.println("--- " + req + " ---");
            for (GatewayFilter filter : pipeline) {
                if (!filter.filter(req)) {
                    System.out.println("请求被中断");
                    break;
                }
            }
        }
    }
}
\`\`\`

\`\`\`output
--- GET /order ---
[鉴权] 拒绝
请求被中断
--- GET /order?token=abc ---
[鉴权] 通过
[限流] 放行
\`\`\`

两种链的区别值得记成一张表:

| 形态 | 特点 | 典型例子 |
| --- | --- | --- |
| 互斥链 | 有且只有一个处理者真正处理,其余只转发 | 请假审批、金额分档、故障按级别上报 |
| 逐环加工 | 每一环都处理一点(校验、改写、埋点)再传给下一个 | Servlet Filter、Spring MVC 拦截器、Netty Pipeline、网关 |

框架里的三个活例子:

- **Spring MVC HandlerInterceptor**:preHandle 返回 false 即中断,后续拦截器与 Controller 都不执行,但已执行过的拦截器的 afterCompletion 仍会回调(常用来清理 ThreadLocal)。
- **Spring Cloud Gateway**:GatewayFilterChain 按 Ordered 顺序执行,filter 里不调用 chain.filter(exchange) 就等于中断,鉴权失败时正是这么干的。
- **Netty ChannelPipeline**:inbound 靠 ctx.fireChannelRead 显式传递,忘了调用不会报错,消息会"消失" —— 这是 Netty 新手最常见的 bug。

> [!best] 责任链的收益不在"少写 if"
> 而在**顺序变成数据、节点变成独立单元**。每个节点可以单独测试、单独开关、按环境调整排列,这在网关、风控、审批这些"规则天天变"的场景里,比自己写 if 值钱得多。

### 优缺点与适用场景

| 优点 | 缺点 | 何时用 | 真实应用 |
| --- | --- | --- | --- |
| 请求发送者与处理者解耦;链可动态增删与排序;每个节点职责单一 | 请求可能无人处理;循环链风险;链路长时调试和性能都变差 | 多个对象可能处理同一请求;处理顺序需要配置;想给流程加可插拔节点 | Servlet Filter、Spring MVC 拦截器、Netty Pipeline、Sentinel 的 ProcessorSlotChain |

### 面试追问

> [!interview] 追问 1:责任链和装饰器模式都是"一层套一层",区别在哪?
> 装饰器要求**每一层都执行**,而且都在同一个对象上叠加增强,链不会中途退出;责任链的每一层可以**拒绝并终止**,后面的节点不执行。装饰器关注"给对象加功能",责任链关注"由谁处理请求"。过滤器链同时具备两者特征,所以面试里说清"是否允许中断"这个判据最稳。

> [!interview] 追问 2:责任链中断后,已经执行的环节怎么收尾?
> 需要配对设计"进入"和"清理"两个回调。Spring MVC 的 afterCompletion 无论成败都会执行,适合释放 ThreadLocal;Netty 的 outbound handler 会沿反方向回传,用来做响应收尾。自己实现时,在 handle 外层用 try/finally 记录已执行节点并逆序清理,别把清理逻辑散落在每个节点里。

## ⭐⭐⭐ 模板方法 Template Method —— 流程定死,差异开放

> [!info] 先讲个场景
> 泡茶和泡咖啡的步骤几乎一样:烧水、冲泡、倒进杯子、加调料。真正的差别只有两步 —— 茶是泡茶叶加柠檬,咖啡是冲咖啡粉加糖奶。你不会为这两杯饮料发明两套完全不同的流程,而是先写一份"标准工序",再只替换不同的那两步。

> [!warn] 不用模式会怎样
> 两个类各写一遍 prepare 方法,四行里两行是复制粘贴。某天要求"水烧到 95 度",两个类都要改;下个月加"热可可",又复制出第三份。更危险的是顺序靠自觉:新人把"加料"写到了"倒水"前面,两杯饮料的做法就不一致了 —— 这种 bug 测试很难覆盖,只能靠人盯。

### 角色与结构

| 角色 | 职责 | 本例 |
| --- | --- | --- |
| 抽象类 | 定义模板方法和固定步骤 | CaffeineBeverage |
| 具体类 | 实现变化的步骤 | Tea、Coffee |
| hook 方法 | 带默认实现的空步骤,子类可选覆盖 | customerWantsCondiments |

\`\`\`diagram:u-template-method
\`\`\`

### 从烂代码到模式代码

初版:两个类各写一遍流程。

\`\`\`java
class Tea {
    void prepare() {
        System.out.println("烧水");
        System.out.println("泡茶叶");
        System.out.println("倒入杯中");
        System.out.println("加柠檬");
    }
}

class Coffee {
    void prepare() {
        System.out.println("烧水");
        System.out.println("冲咖啡粉");
        System.out.println("倒入杯中");
        System.out.println("加糖和奶");
    }
}

public class BeverageBeforeDemo {
    public static void main(String[] args) {
        new Tea().prepare();
        new Coffee().prepare();
    }
}
\`\`\`

模式版:父类把流程写成 final,子类只填两个空。

\`\`\`java
abstract class CaffeineBeverage {
    final void prepare() {                       // 模板方法:流程不许改
        boilWater();
        brew();
        pourInCup();
        if (customerWantsCondiments()) {         // hook:给子类一个开关
            addCondiments();
        }
    }

    private void boilWater() { System.out.println("烧水"); }
    private void pourInCup() { System.out.println("倒入杯中"); }

    protected abstract void brew();              // 必须实现的变化点
    protected abstract void addCondiments();

    protected boolean customerWantsCondiments() { return true; }   // 默认加调料
}

class Tea extends CaffeineBeverage {
    protected void brew() { System.out.println("泡茶叶"); }
    protected void addCondiments() { System.out.println("加柠檬"); }
}

class Coffee extends CaffeineBeverage {
    protected void brew() { System.out.println("冲咖啡粉"); }
    protected void addCondiments() { System.out.println("加糖和奶"); }

    protected boolean customerWantsCondiments() { return false; }  // 这杯不加
}

public class TemplateDemo {
    public static void main(String[] args) {
        System.out.println("--- 茶 ---");
        new Tea().prepare();
        System.out.println("--- 咖啡 ---");
        new Coffee().prepare();
    }
}
\`\`\`

\`\`\`output
--- 茶 ---
烧水
泡茶叶
倒入杯中
加柠檬
--- 咖啡 ---
烧水
冲咖啡粉
倒入杯中
\`\`\`

三个设计决策,每个都有理由:

- **prepare 加 final**:模板方法的本质是"流程所有权归父类"。不加 final,子类重写一次就能让整个框架的流程假设失效,这是很多框架把模板方法声明成 final 的原因(不是语法需要,是契约需要)。
- **hook 有默认实现**:customerWantsCondiments 是"钩子",不是"必须实现"。它让框架在不破坏已有子类的前提下增加扩展点 —— 新增一个 hook,老代码一行不改。
- **抽象步骤尽量少**:父类只抽象真正变化的那几步,烧水、倒杯这种固定动作自己实现,避免子类被迫写无意义的空方法。

> [!info] 好莱坞原则:别找我们,我们会找你
> 模板方法里,是父类的流程在调用子类的步骤,子类从不主动调用父类的模板方法。Spring 的 refresh() 骨架、JdbcTemplate 的回调、Servlet 的 service 分派,都是这个原则:框架掌握主流程,你的代码只作为被调用的片段存在。

### 框架里的模板方法

JdbcTemplate 是最典型的例子。你把 SQL 和"怎么把一行映射成对象"交给它,其余六件事它全包了:

\`\`\`java
public User findById(long id) {
    String sql = "select id, name from users where id = ?";
    return jdbcTemplate.queryForObject(
            sql,
            (rs, rowNum) -> new User(rs.getLong("id"), rs.getString("name")),   // 变化点
            id);
}
\`\`\`

取连接、建 Statement、绑定参数、执行、异常转译、关闭资源,这些都是父类骨架里的固定步骤;RowMapper 就是那个抽象方法。**这也是为什么用 JdbcTemplate 几乎不会连接泄漏** —— 关闭资源的代码在模板里,不在你的 lambda 里。

另外两个常被追问的例子:

- **HttpServlet.service**:父类根据请求方法分派到 doGet / doPost / doDelete,你只重写关心的那个。没重写就返回 405,流程永远由父类掌控。
- **AbstractApplicationContext.refresh**:十二个固定步骤写死,onRefresh、postProcessBeanFactory 等 hook 留给子类(Spring Boot 的 ServletWebServerApplicationContext 就靠 onRefresh 启动内嵌 Tomcat)。

### 优缺点与适用场景

| 优点 | 缺点 | 何时用 | 真实应用 |
| --- | --- | --- | --- |
| 流程只写一遍;子类只关注差异;新增 hook 不破坏老代码 | 继承耦合,父类一改全体受影响;受单继承限制;类数量增加 | 多个类流程高度一致,只有少数步骤不同;框架要给用户留扩展点 | JdbcTemplate、HttpServlet.service、AbstractApplicationContext.refresh、InputStream 的 read 骨架 |

### 面试追问

> [!interview] 追问 1:模板方法和策略模式怎么选?
> 模板方法用**继承**:流程在父类,差异在子类,编译期绑定,一个子类只能有一套实现。策略用**组合**:整个算法抽成对象,运行期可换,还能叠加组合。流程固定、只换少数步骤、变化在编码期就确定 —— 模板方法;整个算法要动态切换、要独立单测、要多个算法组合 —— 策略。一句话:模板方法锁流程放开步骤,策略放开整个算法。

> [!interview] 追问 2:hook 方法和抽象方法有什么区别?为什么模板方法常加 final?
> 抽象方法必须实现,是"你必须给我这一步";hook 有默认实现,是"你可以改这一步",用来加可选扩展点,新增 hook 不会让已有子类编译失败。模板方法加 final 是为了守住流程契约:骨架顺序是父类的设计,子类只能填步骤,不能改流程;不加 final 时,一次误重写就可能让埋点、资源释放、事务边界全部失效。

## ⭐⭐ 状态模式 State —— 一个状态,一套脾气

> [!info] 先讲个场景
> 外卖订单有几个固定阶段:待支付、已支付、已发货、已完成、已取消。同一个"支付"按钮,在待支付时能点、在已支付时提示重复、在已发货时直接置灰;同一个"发货"动作,未支付时不能做、已支付时才能做。
> 换句话说:**对象的行为由它当前的状态决定,而行为执行完又会推动状态变化。**

> [!warn] 不用模式会怎样
> 用 int 或字符串存状态,再在每个动作方法里写 if/switch,是很自然的起点。但状态有 5 个、动作有 6 个时,就是 30 个分支散落在 6 个方法里;加一个"退款中"状态,六个方法全部要补分支,漏一个就是资损或超卖。非法迁移也没人拦:代码里任何地方都能把 state 直接改成 2。

### 角色与结构

| 角色 | 职责 | 本例 |
| --- | --- | --- |
| 上下文 Context | 持有当前状态,对外暴露事件方法 | OrderContext |
| 状态接口 | 声明该状态下可响应的事件 | OrderState |
| 具体状态 | 处理事件,并决定是否迁移到下一个状态 | WaitPay、Paid、Shipped |

\`\`\`diagram:u-state
\`\`\`

### 从烂代码到模式代码

初版:状态用魔法数字,分支铺满每个方法。

\`\`\`java
public class Order {
    private int state = 0;   // 0 待支付 1 已支付 2 已发货 3 已完成 4 已取消

    void pay() {
        if (state == 0) {
            state = 1;
            System.out.println("支付成功");
        } else if (state == 1) {
            System.out.println("请勿重复支付");
        } else {
            System.out.println("当前状态不能支付");
        }
    }

    void ship() {
        if (state == 1) {
            state = 2;
            System.out.println("发货成功");
        } else if (state == 0) {
            System.out.println("未支付不能发货");
        } else {
            System.out.println("当前状态不能发货");
        }
    }
    // cancel、confirm、refund……每加一个动作,都要在上面所有状态里补分支

    public static void main(String[] args) {
        Order order = new Order();
        order.ship(); // 未支付时尝试发货
        order.pay();
        order.pay(); // 重复支付
        order.ship();
        order.pay(); // 发货后不能再支付
    }
}
\`\`\`

模式版:把"某个状态下能做什么"整体搬进一个类,状态自己决定下一个状态。

\`\`\`java
interface OrderState {
    void pay(OrderContext ctx);
    void ship(OrderContext ctx);
    String name();
}

class WaitPay implements OrderState {
    public String name() { return "待支付"; }

    public void pay(OrderContext ctx) {
        System.out.println("支付成功,状态:待支付 -> 已支付");
        ctx.setState(new Paid());
    }

    public void ship(OrderContext ctx) {
        System.out.println("待支付不能发货");
    }
}

class Paid implements OrderState {
    public String name() { return "已支付"; }

    public void pay(OrderContext ctx) {
        System.out.println("已支付,请勿重复支付");
    }

    public void ship(OrderContext ctx) {
        System.out.println("发货成功,状态:已支付 -> 已发货");
        ctx.setState(new Shipped());
    }
}

class Shipped implements OrderState {
    public String name() { return "已发货"; }

    public void pay(OrderContext ctx) { System.out.println("已发货,不能支付"); }

    public void ship(OrderContext ctx) { System.out.println("已发货,请勿重复发货"); }
}

class OrderContext {
    private OrderState state = new WaitPay();

    void setState(OrderState state) { this.state = state; }
    void pay() { state.pay(this); }
    void ship() { state.ship(this); }
    String stateName() { return state.name(); }
}

public class StateDemo {
    public static void main(String[] args) {
        OrderContext order = new OrderContext();
        order.pay();
        order.pay();
        order.ship();
        System.out.println("当前状态: " + order.stateName());
    }
}
\`\`\`

\`\`\`output
支付成功,状态:待支付 -> 已支付
已支付,请勿重复支付
发货成功,状态:已支付 -> 已发货
当前状态: 已发货
\`\`\`

注意这里的转变:**客户端只发事件,不发状态指令**。main 里从头到尾没出现 "把状态改成已支付",它只调用了 pay();下一个状态是谁,由 WaitPay 自己 decision。这是状态模式与策略模式最本质的分界。

把迁移关系单独画出来,比读代码快得多:

| 当前状态 | 事件 | 下一状态 | 业务动作 |
| --- | --- | --- | --- |
| 待支付 | pay | 已支付 | 扣款、发支付成功通知 |
| 待支付 | cancel | 已取消 | 释放库存、撤销预占 |
| 已支付 | ship | 已发货 | 生成运单、通知仓库 |
| 已支付 | refund | 已退款 | 退款、回滚库存 |
| 已发货 | confirm | 已完成 | 结算给商家 |

> [!tip] 状态模式与策略模式的区别
> 策略是"同一件事的多种算法",策略之间互不认识,由外部选定后通常不再变;状态是"同一个对象的多种行为",状态自己负责迁移,客户端只发事件。==一句话:策略由别人选,状态自己切。==
> 状态少于三个、迁移规则一年不变时,枚举 + switch 反而更清楚;状态多、迁移复杂时,再上状态模式或状态机。

### 优缺点与适用场景

| 优点 | 缺点 | 何时用 | 真实应用 |
| --- | --- | --- | --- |
| 状态与行为集中,消除巨型 switch;新增状态不改老状态;非法迁移有统一入口 | 类数量随状态增长;状态间跳转分散在各类里,全局流程要另配一张图 | 状态三个以上且迁移频繁变化;同一动作在不同状态下行为明显不同 | 订单/工单/审批流、Spring StateMachine、电商履约、支付网关的渠道状态 |

### 面试追问

> [!interview] 追问 1:状态模式和策略模式类图几乎一样,怎么区分?
> 看三件事:**谁决定切换**(状态自己切,策略由外部选)、**客户端看到什么**(状态只发 pay/ship 这类事件,策略要明确说"用 VIP 计价")、**意图是什么**(状态表达"现在能做什么、下一步是什么",策略表达"同一算法有多种实现")。答出这三点,比只说"一个是行为型"强得多。

> [!interview] 追问 2:状态迁移为什么建议做成表?
> 代码里的状态迁移散落各个状态类,产品问"退款后还能不能发货"时只能逐个类翻。把"当前状态 + 事件 → 下一状态 + 动作"抽成一张迁移表,既方便产品和测试评审,也能直接驱动状态机执行、做合法性校验和审计日志。状态模式管"行为怎么分布",迁移表管"流程长什么样",两者可以共存。

## ⭐⭐ 命令模式 Command —— 把请求封成一张字条

> [!info] 先讲个场景
> 电视遥控器上有十几个键,每个键对应一个动作:开灯、关灯、调音量、切换信号源。遥控器本身不懂电视,它只负责"按下某个键,执行某个动作";而且它还支持"回看" —— 记住你按过什么,按撤销就把上一个动作反着做一遍。
> 这就是命令模式:**把"请求"本身变成一个对象**,于是它可以被保存、排队、记录、重放、撤销。

> [!warn] 不用模式会怎样
> 如果遥控器直接 new Light().on(),它就得认识所有设备:换一个品牌的灯要改遥控器,加一个"一键关全屋"要改遥控器,想支持撤销更是无从下手 —— 因为你没有地方保存"刚才做了什么"。

### 角色与结构

| 角色 | 职责 | 本例 |
| --- | --- | --- |
| 命令 Command | 声明 execute 与 undo | Command |
| 具体命令 | 把接收者和参数绑在一起 | LightOnCommand、LightOffCommand |
| 接收者 Receiver | 真正干活的对象 | Light |
| 调用者 Invoker | 触发命令,不知道具体做了什么 | RemoteControl |

\`\`\`diagram:u-command
\`\`\`

### 从烂代码到模式代码

初版:遥控器直接持有并指挥具体设备。

\`\`\`java
class Light {
    void on() { System.out.println("灯亮了"); }
    void off() { System.out.println("灯灭了"); }
}
class RemoteControl {
    private final Light light = new Light();

    void pressOn()  { light.on(); }
    void pressOff() { light.off(); }
}

public class RemoteBeforeDemo {
    public static void main(String[] args) {
        RemoteControl remote = new RemoteControl();
        remote.pressOn();
        remote.pressOff();
    }
}
\`\`\`

换个品牌的灯要改遥控器,加一个"开窗帘"要改遥控器,想保存刚才按了什么更没地方放 —— 因为动作没有被表达成一个东西。模式版:把每个动作封装成命令对象,遥控器只认 Command。

\`\`\`java
import java.util.ArrayDeque;
import java.util.Deque;

interface Command {
    void execute();
    void undo();
}

class Light {                                   // 接收者
    void on()  { System.out.println("灯亮"); }
    void off() { System.out.println("灯灭"); }
}

class LightOnCommand implements Command {
    private final Light light;
    LightOnCommand(Light light) { this.light = light; }
    public void execute() { light.on(); }
    public void undo()    { light.off(); }
}

class LightOffCommand implements Command {
    private final Light light;
    LightOffCommand(Light light) { this.light = light; }
    public void execute() { light.off(); }
    public void undo()    { light.on(); }
}

class RemoteControl {                           // 调用者:只认 Command
    private final Deque<Command> history = new ArrayDeque<>();

    void press(Command command) {
        command.execute();
        history.push(command);
    }

    void undoLast() {
        if (history.isEmpty()) {
            System.out.println("没有可撤销的操作");
            return;
        }
        history.pop().undo();
    }
}

public class CommandDemo {
    public static void main(String[] args) {
        RemoteControl remote = new RemoteControl();
        Light light = new Light();

        remote.press(new LightOnCommand(light));
        remote.press(new LightOffCommand(light));
        remote.undoLast();       // 撤销"关灯"
        remote.undoLast();       // 撤销"开灯"
        remote.undoLast();       // 历史已空
    }
}
\`\`\`

\`\`\`output
灯亮
灯灭
灯亮
灯灭
没有可撤销的操作
\`\`\`

命令对象带来的四种能力,本质都是"请求变成了数据":

- **排队**:把命令丢进 BlockingQueue,后台线程慢慢消费,调用方立即返回 —— 线程池的任务队列就是这个模型。
- **记录与重放**:先写命令日志再执行,崩溃后按日志重放,即可恢复状态;数据库 binlog、事件溯源都借了这个思路。
- **撤销与补偿**:历史栈 + undo;分布式场景里没有真正的回滚,就用反向命令做补偿(TCC 的 Cancel)。
- **宏命令**:一个 Command 内部持有一组 Command,execute 时遍历 —— 组合模式加命令模式,"一键关全屋"就是它。

> [!tip] Runnable 就是命令模式
> Runnable 是命令接口(run 相当于 execute),Thread 与 ExecutorService 是调用者,run 里捕获的 Service 是接收者,提交任务就是把命令交给调用者。它唯一缺的是 undo —— 所以业务里要做撤销或补偿,得自己定义带 undo/rollback 的 Command 接口,别硬套 Runnable。

### 优缺点与适用场景

| 优点 | 缺点 | 何时用 | 真实应用 |
| --- | --- | --- | --- |
| 调用者与接收者解耦;支持排队、日志、撤销、重放;新增命令不改调用者 | 每个动作一个类,类数量膨胀;简单直接调用更清楚;撤销要处理状态快照 | 需要撤销/重做、任务排队、操作审计、宏命令 | java.lang.Runnable、Swing 的 Action、工作流引擎的任务与补偿、MQ 消息处理 |

### 面试追问

> [!interview] 追问 1:命令模式怎么实现撤销?和备忘录模式什么关系?
> 两种做法:一是**反操作**,命令自己实现 undo(开灯的反操作是关灯),简单但只适合可逆动作;二是**快照**,执行前把接收者状态存进备忘录,undo 时整体恢复,适合复杂对象但要算内存。命令负责"做了什么",备忘录负责"恢复到哪",两者常一起用:历史栈里存的是"命令 + 执行前快照"。

> [!interview] 追问 2:命令模式和策略模式不都是"把行为抽成对象"吗?
> 抽的东西不同:策略抽的是**算法**,同一个任务换一种算法,调用方关心"用哪种方式算";命令抽的是**请求**,把"调用谁、传什么参数、何时执行"打包,调用方关心"执行/撤销/排队"。策略通常立即执行且无历史,命令强调可存储、可延迟、可回滚。类图相似,意图完全不同。

## 面试速记

- **策略**:同一接口多种算法,上下文只认接口;落地几乎都是"策略 + Map/工厂";Spring 注入 Map 时 key 是 bean 名,对不上就是取不到。
- **观察者**:主题维护订阅者列表;推是带数据、拉是自己取;Spring 事件默认同步同线程、异常回传,事务后通知用 @TransactionalEventListener 的 AFTER_COMMIT。
- **责任链**:请求沿链传递,节点可继续也可中断;必须显式处理"无人处理"和"循环链";网关用返回 false 中断,Netty 靠 ctx.fireChannelRead 传递。
- **模板方法**:父类定骨架、子类填步骤,hook 给可选扩展;JdbcTemplate 的 RowMapper、HttpServlet.service、refresh 的 onRefresh 都是它。
- **状态**:状态对象自己迁移,客户端只发事件;状态多、迁移复杂才上,状态少用枚举 switch 更直白。
- **命令**:请求对象化,换来排队、日志、撤销、重放;Runnable 是命令但没有 undo。
- **三组对比一句话**:工厂管生、策略管变;模板靠继承锁流程、策略靠组合换算法;状态自己切自己、策略由外部选定。
`,
  };

  window.PATTERNS_EXTRA['p05'] = {
    id: 'p05',
    title: '行为型模式(下):了解即可的五个模式',
    minutes: 30,
    points: ['迭代器', '中介者', '备忘录', '访问者', '解释器'],
    content: `
> [!info] 本章导读 · 这五个,知道场景就够了
> GoF 的 23 个模式里,有五个存在感最低:迭代器、中介者、备忘录、访问者、解释器。它们不是不重要,而是**要么已经被语言和框架内置**(迭代器就是 for-each),要么只在特定领域出现(访问者多见于编译器和 AST,解释器多见于规则引擎)。
> 面试对这五个的要求通常是"说出一个场景 + 一句话结构",很少让你手写完整实现。所以本章每个模式只给:一句生活场景、一句话结构、一段 15 行内的代码、一句什么时候会用到 —— 把时间省下来复习前六个高频模式。
> - 读完你将能用三十分钟补齐这五个的"面试可答"版本
> - 拿到一张 23 种模式重要性总表,知道复习该往哪儿使劲

> [!tip] 日常现场 · 五个不起眼的零件
> 用遥控器换台,你只管按"下一个",不用知道电视台列表是数组还是链表 —— 迭代器。
> 机场塔台让所有飞机只跟塔台通话,飞机之间不直接喊话 —— 中介者。
> 打 BOSS 前先存个档,死了读档重来 —— 备忘录。
> 同一份体检数据,要分别导出 PDF、Excel、JSON,数据结构不变、导出方式常加 —— 访问者。
> 一句"会员且金额大于 1000"被系统解析成可执行条件 —— 解释器。
> ==这五个的共同点是:结构简单、场景很窄、一旦用错地方就会显得特别重。==

> [!tip] 日常电脑现场 · Ctrl+Z 与浏览历史
> 文档编辑器的 Ctrl+Z 是备忘录,浏览器的前进后退是命令与迭代器,聊天室的转发是中介者,导出 Word/PDF 是访问者。这五个模式天天在用,只是面试问到能说出场景就够了。

## 先看总表:23 种模式哪些必须会

| 分类 | 模式 | 星级 | 一句话价值 |
| --- | --- | --- | --- |
| 创建型 | 单例 Singleton | ⭐⭐⭐ | 手写双检锁、volatile、枚举防反射,面试必问 |
| 创建型 | 工厂方法 Factory Method | ⭐⭐⭐ | Spring BeanFactory 的底座,常与策略配合消 if |
| 创建型 | 抽象工厂 Abstract Factory | ⭐⭐ | 一整套产品族一起换,能说 Spring 的例子更加分 |
| 创建型 | 建造者 Builder | ⭐⭐ | 参数多、链式调用,Lombok @Builder 天天在用 |
| 创建型 | 原型 Prototype | ⭐ | clone 与深浅拷贝,说出场景即可 |
| 结构型 | 代理 Proxy | ⭐⭐⭐ | AOP 的根,JDK 动态代理与 CGLIB 必考 |
| 结构型 | 装饰器 Decorator | ⭐⭐⭐ | Java IO 流层层包装,与代理的区别常考 |
| 结构型 | 适配器 Adapter | ⭐⭐ | 老接口对接新系统,InputStreamReader 是例子 |
| 结构型 | 外观 Facade | ⭐⭐ | 给复杂子系统一个门面,SLF4J 算半个 |
| 结构型 | 组合 Composite | ⭐⭐ | 树形结构统一处理,菜单与组织架构 |
| 结构型 | 桥接 Bridge | ⭐ | 两个维度独立变化,JDBC 驱动是例子 |
| 结构型 | 享元 Flyweight | ⭐ | 共享细粒度对象,Integer 缓存 -128 到 127 常考 |
| 行为型 | 策略 Strategy | ⭐⭐⭐ | 消 if 第一招,与工厂、状态对比必问 |
| 行为型 | 观察者 Observer | ⭐⭐⭐ | Spring 事件与 MQ 订阅的思想源头 |
| 行为型 | 责任链 Chain of Responsibility | ⭐⭐⭐ | 网关过滤器与审批流,中断与顺序是考点 |
| 行为型 | 模板方法 Template Method | ⭐⭐⭐ | JdbcTemplate 与 Servlet service,hook 是亮点 |
| 行为型 | 状态 State | ⭐⭐ | 订单与工单状态机,与策略的区别必问 |
| 行为型 | 命令 Command | ⭐⭐ | Runnable 就是命令,撤销与队列是卖点 |
| 行为型 | 迭代器 Iterator | ⭐ | 模式本身简单,但 for-each 底层与 fail-fast 要会 |
| 行为型 | 中介者 Mediator | ⭐ | 聊天室与塔台,能举场景即可 |
| 行为型 | 备忘录 Memento | ⭐ | 撤销与存档,常与命令模式一起出现 |
| 行为型 | 访问者 Visitor | ⭐ | 双分派,AST 与多格式导出场景 |
| 行为型 | 解释器 Interpreter | ⭐ | 几乎不用手写,能说出 Spring EL、Drools 即可 |

> [!warn] 这张表的用法
> 三星的八个必须能写代码、能讲源码例子;两星的能说出场景和一次改造经历;一星的被问到能答一句"我在某框架里见过,它解决的是某某问题"就够。==别把时间平均分给 23 个模式,那是性价比最低的复习方式。==

## ⭐ 迭代器模式 Iterator —— 换台不看电视台列表

生活场景:用遥控器换台,你只按"下一个",并不关心电视台列表底层是数组还是链表;集合也一样,遍历方式不该暴露内部结构。

**结构一句话**:把"怎么遍历"从集合里抽出来,集合负责存,迭代器负责"还有没有下一个、下一个是谁"。

**为什么要抽出来**:数组按下标走、链表按指针走、树要递归走,遍历方式本来各不相同。如果业务代码直接写"按下标取",换成链表就得重写;统一成迭代器协议之后,ArrayList 换成 LinkedList,调用方的 for 循环一个字都不用改。

\`\`\`diagram:u-iterator
\`\`\`

\`\`\`java
import java.util.Iterator;
import java.util.List;

public class IteratorDemo {
    public static void main(String[] args) {
        List<String> names = List.of("张三", "李四", "王五");
        Iterator<String> it = names.iterator();
        while (it.hasNext()) {
            System.out.println(it.next());
        }
        for (String n : names) {          // 编译器把 for-each 改写成上面那段
            System.out.println(n);
        }
    }
}
\`\`\`

**什么时候会用到**:需要统一遍历数组、链表、树等不同结构;或者你想把"游标"和"集合"分开,让同一种遍历算法适配多种容器。它派生的两个词也值得知道:外部迭代器把 next 交给调用方,内部迭代器把遍历逻辑收进集合(如 forEach);日常写业务用 for-each 就够,只有在需要"边遍历边控制"时才手动拿 Iterator。

> [!interview] 顺手带走两个考点
> for-each 只能用于 Iterable,编译后就是 iterator + hasNext + next。遍历过程中删除元素必须用 it.remove(),直接调集合的 remove 会因 modCount 变化触发 fail-fast,抛 ConcurrentModificationException。==能说出 modCount 这三个字,这道题就稳了。==

## ⭐ 中介者模式 Mediator —— 有事都找塔台

生活场景:机场塔台。飞机之间不直接通话,所有起降请求都发给塔台,由塔台统一调度,避免 N 架飞机两两协调。

**结构一句话**:对象之间不再互相持有,全部只依赖中介者,由中介者负责转发与协调,网状依赖变成星形依赖。

**算一笔账**:五个用户两两直连是十条通信线,加第六个人就要再连五条;改成都连聊天室之后只有五条线,新人进来只跟聊天室打招呼。这就是中介者最朴素的收益 —— 把 N 乘 N 的复杂度降成 N。

\`\`\`diagram:u-mediator
\`\`\`

\`\`\`java
class ChatRoom {                                   // 中介者
    void send(String from, String msg) {
        System.out.println(from + " 说: " + msg);   // 真实项目里分发给房间内其他人
    }
}

class User {
    private final String name;
    private final ChatRoom room;
    User(String name, ChatRoom room) { this.name = name; this.room = room; }
    void say(String msg) { room.send(name, msg); }  // 只认识中介者,不认识其他用户
}
// 用法:new User("张三", room).say("晚上聚餐?"); new User("李四", room).say("好,七点");
\`\`\`

**什么时候会用到**:多个对象之间是多对多通信,彼此持有导致改一个牵一片 —— 聊天室、GUI 表单控件联动、塔台调度。代价是中介者容易膨胀成上帝对象:所有协调逻辑都往它身上堆,最后它自己变成最难改的那个类,所以中介者内部最好再按业务拆小。微服务里的 API 网关、BFF 可以看作它的分布式变体。

## ⭐ 备忘录模式 Memento —— 存档与读档

生活场景:游戏打到 BOSS 前先存个档,打输了读档重来;编辑器里的 Ctrl+Z 也是同一件事。

**结构一句话**:原发器负责生成快照和恢复快照,备忘录只负责装状态且对外不可改,管理者(通常是栈)负责保管这些快照。

**关键约束**:备忘录对原发器是"可读"的,对其他对象是"只可传递、不可窥探"的 —— 这样历史状态不会被无关代码偷改。编辑器里 Ctrl+Z 是一摞内存快照,游戏存档是写到磁盘的快照,数据库的 savepoint 本质也是同一件事。

\`\`\`diagram:u-memento
\`\`\`

\`\`\`java
class Editor {
    private String text = "";
    void type(String s) { text += s; }
    String text() { return text; }
    Snapshot save() { return new Snapshot(text); }        // 存档
    void restore(Snapshot s) { text = s.value; }          // 读档
    record Snapshot(String value) { }                     // 备忘录:不可变快照
}
// 用法:Editor e = new Editor(); e.type("hello"); var s = e.save();
//      e.type(" world"); e.restore(s);  // text 回到 hello
\`\`\`

**什么时候会用到**:撤销/重做、事务回滚前的状态快照、编辑器历史。注意成本:快照多了很吃内存,对象大时用增量快照或序列化落盘,别把整个聚合根一股脑塞进内存;快照频率也要控制,不是每敲一个字符都值得存一份。

## ⭐ 访问者模式 Visitor —— 数据结构不变,操作随便加

生活场景:同一份体检数据,要导出成 PDF 给本人、Excel 给医生、JSON 给系统对接。数据项是固定的,导出格式却年年新增。

**结构一句话**:元素只提供 accept(visitor),把"能做什么操作"全部外置到访问者里;新增一种操作就新增一个 Visitor,元素类不动。

\`\`\`diagram:u-visitor
\`\`\`

\`\`\`java
interface Shape { void accept(Visitor v); }
record Circle(double r) implements Shape { public void accept(Visitor v) { v.visit(this); } }
record Square(double s) implements Shape { public void accept(Visitor v) { v.visit(this); } }

interface Visitor {
    void visit(Circle c);
    void visit(Square s);
}

class AreaVisitor implements Visitor {                 // 新导出方式 = 新加一个 Visitor
    public void visit(Circle c) { System.out.println("圆面积 " + 3.14 * c.r() * c.r()); }
    public void visit(Square s) { System.out.println("方面积 " + s.s() * s.s()); }
}
\`\`\`

**什么时候会用到**:对象结构稳定、操作经常新增 —— 编译器 AST 的语义检查与代码生成、报表多格式导出、静态分析规则。它和策略的区别是:策略换的是"同一个算法的不同实现",访问者加的是"对同一批元素的全新操作";反过来的场景(操作稳定、元素常加)千万别用,因为每加一种元素,所有 Visitor 都要补一个 visit 方法。

> [!interview] 双分派一句话
> 第一次分派由元素的 accept 完成(决定你是 Circle 还是 Square),第二次分派由 visitor 的重载 visit 完成(决定执行哪段逻辑),两次合起来才确定最终方法。Java 的重载是编译期静态分派,所以 accept 里必须写 v.visit(this),靠 this 的静态类型把元素身份"带"过去 —— 这就是访问者模式在 Java 里能成立的关键。

## ⭐ 解释器模式 Interpreter —— 一句话变成可执行规则

生活场景:风控后台配了一条规则"金额在 1000 元到 5000 元之间",运营改的是规则文本,不是 Java 代码;系统要能把这句话变成可执行的判断。

**结构一句话**:每种语法规则对应一个类,把表达式解析成语法树,interpret 时递归求值;终结符对应叶子,非终结符对应组合节点。它能处理的典型表达式就是"金额大于多少且小于多少"这一类短条件;一旦出现函数、变量作用域和运算符优先级,手写解释器的成本就会超过收益。

\`\`\`diagram:u-interpreter
\`\`\`

\`\`\`java
record Ctx(int amount) { }
interface Expr { boolean test(Ctx c); }
record Gt(int limit) implements Expr {                  // 终结符:大于
    public boolean test(Ctx c) { return c.amount() > limit; }
}

record Lt(int limit) implements Expr {                  // 终结符:小于
    public boolean test(Ctx c) { return c.amount() < limit; }
}

record And(Expr l, Expr r) implements Expr {            // 非终结符:与
    public boolean test(Ctx c) { return l.test(c) && r.test(c); }
}
// 用法:new And(new Gt(100000), new Lt(500000)).test(new Ctx(39900))
// 金额单位是分:39900 分 = 399 元,不满足 1000 到 5000 元 -> false
\`\`\`

**什么时候会用到**:自定义 DSL、简单规则表达式、教学用的迷你语言。它的优点是加一条语法只加一个类,缺点是语法一复杂类就爆炸,而且每个节点一次虚调用,性能也一般 —— 所以它更像"理解语法树与递归求值"的教学模型,而不是生产方案。真实项目几乎不手写:直接用 ANTLR、Spring EL、Drools 或 Aviator 更划算,面试被问到,答"知道结构、生产环境用现成引擎"就是正确答案。

## 面试速记

- **迭代器**:把遍历从集合里抽出来;for-each 编译后就是 iterator + while;遍历中删除用 it.remove(),否则 fail-fast 抛 ConcurrentModificationException。
- **中介者**:网状依赖变星形,代价是中介者可能膨胀成上帝对象;聊天室、塔台、GUI 联动是标准场景。
- **备忘录**:只存状态不存行为,撤销与存档都靠它;快照多了要算内存,可用增量或落盘。
- **访问者**:双分派 —— accept 定元素类型,visit 重载定操作;元素结构稳定、操作常新增时用它,新增元素则要改所有 Visitor。
- **解释器**:一种语法一条规则,递归求值;只适合简单 DSL,复杂语法交给 ANTLR 或表达式引擎。
- **复习优先级**:单例、工厂方法、代理、装饰器、策略、观察者、责任链、模板方法这八个必须能写能讲,其余能说清场景即可。
`,
  };

  window.PATTERNS_IQ.push({ q: '策略模式和简单工厂有什么区别?实际项目里为什么经常把它们写在一起?', a: '两者解决的维度不同:简单工厂解决"对象怎么创建",策略解决"算法怎么替换",一个是创建型一个是行为型,并不互斥。实际项目里常用工厂或 Map 负责"根据类型挑出策略",策略负责"执行算法",于是一条链既收掉了 if-else 又保住了开闭原则。最短的记法是:**工厂管生、策略管变**。' });
  window.PATTERNS_IQ.push({ q: '观察者模式和发布-订阅有什么区别?', a: '经典观察者模式里,主题直接持有观察者列表并同步调用,双方是**紧耦合的直接引用**,发布者知道订阅者的存在。发布-订阅通常引入中间件(EventBus、MQ),发布者只把消息交给 broker,订阅者向 broker 注册,双方互不认识,因此可以跨进程、异步、削峰。一句话:观察者是"我直接打电话给你",发布订阅是"我把消息交给邮局"。' });
  window.PATTERNS_IQ.push({ q: '责任链在网关和过滤器里是怎么应用的?为什么 preHandle 返回 false 就能中断?', a: 'Servlet Filter、Spring MVC 的 HandlerInterceptor、Spring Cloud Gateway 的 GatewayFilterChain、Netty 的 ChannelPipeline 都是责任链:请求按顺序穿过每个节点,节点可以校验、改写、记录,也可以终止。preHandle 返回 false 时,DispatcherServlet 不再调用后续拦截器和 Controller,但已执行过的拦截器的 afterCompletion 仍会回调,用来释放 ThreadLocal。Netty 则靠显式调用 ctx.fireChannelRead 传递,忘了调用就等于静默中断,是常见 bug。' });
  window.PATTERNS_IQ.push({ q: '模板方法和策略模式都能处理"流程相同、部分不同",到底怎么选?', a: '模板方法用**继承**:父类固定流程骨架、子类覆盖个别步骤,绑定发生在编译期,一个子类只能有一套实现,还受单继承限制。策略用**组合**:把整个算法抽成对象,运行期可替换,还能自由组合多个策略。判断标准是:流程步骤固定、只有少数步骤变化且编码期就确定 —— 模板方法;整个算法要动态切换、要独立单测或要叠加组合 —— 策略。' });
  window.PATTERNS_IQ.push({ q: '状态模式和策略模式的类图几乎一样,区别到底在哪?', a: '关键在"谁决定切换"和"客户端看到什么"。策略由外部(调用方、工厂、配置)选定,运行期一般不变,各策略之间互不知道;状态由状态对象自己在处理事件后调用上下文切换下一个状态,客户端只发 pay、ship 这类事件,不关心当前是哪个状态。另一个区别是意图:策略是"同一件事有多种算法",状态是"同一对象在不同状态下行为不同,而且有合法迁移约束"。' });
  window.PATTERNS_IQ.push({ q: '命令模式解决什么问题?Runnable 算命令模式吗?', a: '命令把"请求"封装成对象,于是请求可以被排队、记录日志、延迟执行、撤销重做、跨进程传输,调用者与接收者彻底解耦。Runnable 就是最朴素的命令:run 相当于 execute,Thread 和 ExecutorService 是调用者,run 里捕获的 Service 是接收者,只是它没有 undo。业务里要做撤销或补偿,就得自己定义带 undo 或 rollback 的 Command 接口。' });
  window.PATTERNS_IQ.push({ q: '23 种模式里哪些必须掌握?时间不够怎么取舍?', a: '第一梯队是单例、工厂方法、代理、装饰器、策略、观察者、责任链、模板方法这八个,每一个都要能写代码、能举 Spring 或 JDK 里的活例子,也最常被追问对比。第二梯队是抽象工厂、建造者、适配器、外观、组合、状态、命令,能说出场景和一段改造经历即可。剩下的原型、桥接、享元、迭代器、中介者、备忘录、访问者、解释器属于"说清场景就过关",其中迭代器还要额外会 for-each 的底层和 fail-fast。' });
  window.PATTERNS_IQ.push({ q: 'Spring 事件默认是同步还是异步?监听器抛异常会怎样?', a: '默认同步、同线程:发布方 publishEvent 会依次调用所有监听器,监听器抛出的异常会包装后抛回发布方,可能让发布方的事务一起回滚。要异步就给监听方法加 @Async 并配置线程池,或替换 ApplicationEventMulticaster。还有一个高频坑:事务还没提交就发事件,监听器可能读到旧数据,应该用 @TransactionalEventListener 的 AFTER_COMMIT 阶段。' });
})();
