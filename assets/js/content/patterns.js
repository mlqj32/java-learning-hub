/* ═══════════════════════════════════════════════════════════
   模块:设计模式心法(6 章)
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.CONTENT = window.CONTENT || {};

  window.CONTENT.patterns = {
    id: 'patterns',
    title: '设计模式心法',
    en: 'DESIGN PATTERNS',
    icon: 'gem',
    color: '#f472b6',
    tagline: '六大原则打底,二十三种招式实战',
    description: '从一段被需求撑爆的代码讲起:支付判断从 10 行涨到 80 行,让你先看懂“为什么需要模式”。六大原则是内功,二十三种模式是招式。从双检锁单例、动态代理一路写到 Spring 与 JDK 源码复盘 —— 每个模式都给可运行代码,让你原理讲得清、代码写得出、源码举得出。',
    minutes: '≈ 12 小时',
    chapters: [
      /* ─────────────────────────────────────────── */
      {
        id: 'ch00',
        title: '为什么需要设计模式:从一段会“膨胀”的代码说起',
        minutes: 30,
        points: ['代码膨胀', '开闭原则', '23 种模式', '过度设计'],
        content: `
> [!info] 本章导读 · 先讲个故事
> 第一年你给公司写支付:type 等于 1 走支付宝,等于 2 走微信,十行代码一下午搞定。
> 半年后产品陆续加了银行卡、积分抵扣、优惠券、企业月结。你打开 PaymentService,它已经 300 行,每个分支里还塞着风控、签名、对账、退款回调。
> **每加一种支付方式,都要改这个类,再把所有支付分支重新测一遍。** 这一章要回答的就是:为什么变化一来,总在动核心代码?
> - 读完本章你将能:说清设计模式到底解决什么问题
> - 说出 23 种模式的三大分类,知道每类对应哪种变化
> - 判断什么时候该上模式、什么时候老老实实写 if

> [!tip] 日常电脑现场 · 乐高积木与图纸
> 同一盒乐高,照着图纸能拼出城堡,没有图纸就只能拼出一堆方块。装修也是,师傅按水电图和柜体图施工,你想加个插座,改的是图纸不是墙。设计模式就是前人画好的那几张图,遇到同样的结构,照着搭就行。

> [!tip] 本模块的星级约定
> ⭐⭐⭐ = 面试高频,必须会手写、能讲透;⭐⭐ = 需要理解,能说清场景与代价;⭐ = 了解即可,面试能报出名字和用途即可。

## 没有模式的世界:需求是怎么把代码撑爆的

需求第一次来时,最快的写法往往就是最好的写法:

\`\`\`java
public class PaymentService {
    public void pay(int type, int cents) {
        if (type == 1) {
            System.out.println("支付宝支付 " + cents + " 分");
        } else if (type == 2) {
            System.out.println("微信支付 " + cents + " 分");
        } else {
            throw new IllegalArgumentException("不支持的支付方式: " + type);
        }
    }
}
\`\`\`

\`\`\`output
支付宝支付 9900 分
微信支付 9900 分
\`\`\`

十行代码,一眼读完。问题不在代码本身,而在**需求会一直来**。

三个月后,渠道从 2 种变成 5 种,每种还要风控、签名、记账、开票。真实项目里 pay 方法已经 80 多行,这里只截主干:

\`\`\`java
public class PaymentService {
    public void pay(int type, int cents, String orderNo, boolean needInvoice) {
        if (type == 1) {
            riskCheck(orderNo);
            String sign = alipaySign(orderNo, cents);
            alipayClient.pay(orderNo, cents, sign);
            saveFlow(orderNo, "ALIPAY", cents);
            if (needInvoice) issueInvoice(orderNo);
        } else if (type == 2) {
            riskCheck(orderNo);
            String sign = wechatSign(orderNo, cents);
            wechatClient.unifiedOrder(orderNo, cents, sign);
            saveFlow(orderNo, "WECHAT", cents);
            if (needInvoice) issueInvoice(orderNo);
        } else if (type == 3) {
            riskCheck(orderNo);
            bankClient.transfer(orderNo, cents);
            saveFlow(orderNo, "BANK", cents);
            if (needInvoice) issueInvoice(orderNo);
        } else if (type == 4) {
            // 积分抵扣:校验余额、扣积分、记账,又是十几行
        } else if (type == 5) {
            // 优惠券:校验、锁定、核销、记账,又是十几行
        }
    }
}
\`\`\`

五个分支里,每一组都有四行是复制粘贴出来的,而且它们的变化节奏完全一样:

| 变化 | 要改哪里 | 代价 |
| --- | --- | --- |
| 新增一种支付 | 在 pay 里再加一个 else if | 整个类重新测试 |
| 风控规则调整 | 五个分支都要改 | 漏改一个就是事故 |
| 只想测微信支付 | 得把整个类跑起来 | 单元测试写不动 |

代码从 10 行长到 80 行,不是因为业务复杂了 8 倍,而是因为**"怎么支付"这个变化点被焊死在核心方法里**。开闭原则说"对扩展开放、对修改关闭",本质就是把这根焊点换成插座。

## 设计模式到底是什么

设计模式不是谁发明的,而是**前人踩坑之后总结出来的招式模板**:同一类问题反复出现,大家试来试去,发现某几种解法最稳,于是给它们起了名字。

一个模式完整地说,是四件事:

| 要素 | 回答什么 | 支付例子里 |
| --- | --- | --- |
| 场景 | 什么时候能用 | 支付渠道会不断增加 |
| 问题 | 要解决什么痛点 | 每加渠道都要改核心类 |
| 解法 | 职责怎么分 | 抽 PayChannel 接口,各渠道自己实现 |
| 代价 | 多了什么成本 | 类变多、跳转变多、新人要多看两个文件 |

只背"解法"的人,会在不需要它的地方硬套;把"场景"和"代价"一起记住,才知道什么时候该用。

> [!warn] 常见误解:背下 23 张类图不等于会用模式
> 面试能画出 UML 只是入门。真正的分水岭是:看到一个需求变化,能说出"这是哪类变化、哪几个模式接得住、用了要付什么代价"。==模式是给变化准备的,不是给简历准备的。==

还有反直觉的一点:**很多模式比名字更早存在**。JDK 的 IO 流在模式书出版前就已经是层层包装的装饰器;Spring 的 BeanFactory 也不是照着工厂模式写的。模式是**事后归纳的共同语言**,让你和同事用四个字说清一套结构。

## 23 种模式的全景地图

GoF 的 23 种模式按"管什么"分成三类:

| 类别 | 数量 | 一句话 | 生活比喻 | 代表模式 |
| --- | --- | --- | --- | --- |
| 创建型 | 5 | 管对象怎么造,把 new 收拢到一处 | 奶茶店:你只报口味,不用进后厨 | 单例、工厂方法、抽象工厂、建造者、原型 |
| 结构型 | 7 | 管对象怎么拼,用组合增强能力 | 奶茶加料:珍珠椰果层层叠加,还是那杯奶茶 | 代理、适配器、装饰器、外观、组合、桥接、享元 |
| 行为型 | 11 | 管对象怎么协作,把算法与调用者分开 | 公众号:你订阅它推送,彼此不用认识 | 策略、观察者、责任链、模板方法、状态、命令、迭代器、中介者、备忘录、访问者、解释器 |

分类不是考点,是**检索目录**:下次遇到"加功能就要改一堆 if",先想行为型的策略;遇到"老接口不能改但要接新系统",先想结构型的适配器;遇到"对象创建太重、太散",先想创建型。

> [!tip] 记忆锚点:三类各记一个最常用的
> 创建型记**工厂**(Spring 的 Bean 就是工厂造的),结构型记**代理**(AOP 的根基),行为型记**策略**(消除 if-else 的常客)。这三个吃透,另外二十个都能顺着"场景 → 解法"推出来。

## 模式不是银弹

先看一段被"过度设计"改造过的代码。原本只有三个分支:

\`\`\`java
// 诚实版本:五秒钟看懂
if (level == 1) return 100;
if (level == 2) return 200;
return 300;
\`\`\`

有人学了策略模式,连夜改成这样:

\`\`\`java
interface LevelStrategy { int score(); }
class Vip1 implements LevelStrategy { public int score() { return 100; } }
class Vip2 implements LevelStrategy { public int score() { return 200; } }
class Normal implements LevelStrategy { public int score() { return 300; } }

public class ScoreService {
    private final java.util.Map<Integer, LevelStrategy> table = java.util.Map.of(
        1, new Vip1(), 2, new Vip2(), 3, new Normal());

    public int score(int level) {
        return table.getOrDefault(level, new Normal()).score();
    }
}
\`\`\`

功能没变,文件从 1 个变成 4 个,读代码的人要在四个文件之间跳。**这就是过度设计:为想象中的变化付真实的维护成本。** 三个信号可以自检:接口只有一个实现、抽象只为"以后可能扩展"、包完一层新同事要问"为什么不直接写"。

> [!pitfall] 先让它跑,再让它好
> 业界有个"三次法则":第一次直接写,第二次复制一遍,第三次出现同样的变化时再重构。==模式是为已经发生的变化准备的,不是为脑补的变化准备的。== 面试里敢说"这个场景三个 if 更清楚,我不上策略",反而是加分项。

## 怎么学才不白学

- **场景驱动,不按目录背**:先记"什么问题 → 什么模式",比如"多处 if 分派同一件事"对应策略,"不改接口又要增强"对应装饰器或代理。
- **去 Spring 和 JDK 里找活的例子**:AOP 是动态代理,IO 流是装饰器,ApplicationEvent 是观察者。模式在源码里长什么样,比类图有说服力。
- **每个模式手写 30 行以内能跑的最小例子**:能跑通、能改坏、能修好,才算真正理解。
- **先写坏再改好**:故意写一段膨胀的 if-else,再用模式重构,对照两次的差别,比直接看答案印象深十倍。

学习路线一句话:**原则 → 创建型 → 结构型 → 行为型 → Spring 与 JDK 源码复盘**。当前面四步走完,你会发现模式不是新知识,而是给已经写过的代码补上名字。

## 本章小结

- 代码膨胀的根因不是业务复杂,而是**变化点被写死在核心流程里**。
- 设计模式 = 场景 + 问题 + 解法 + 代价,四样一起记才算会。
- 23 种模式分三类:创建型 5(怎么造)、结构型 7(怎么拼)、行为型 11(怎么协作)。
- 模式有成本,过度设计比不设计更难维护;先用最简单的方式跑通。
- 学习顺序:原则 → 按场景认模式 → 手写最小例子 → 源码里验证。

## 面试速记

- 定义背这版:"设计模式是在特定场景下,针对反复出现的设计问题,被反复验证过的解决方案模板,包含明确的代价。"
- 23 种分三类:创建型 5、结构型 7、行为型 11;各记一个常用:工厂、代理、策略。
- 模式的价值是**复用经验与统一术语**,不是减少代码行数。
- 过度设计的信号:单一实现还抽接口、为未知需求加抽象层、包装后更难读。
- 被问"什么时候不用模式":需求稳定、只有一种实现、抽象成本高于收益时,直接写最直白的代码。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch01',
        title: '设计模式六大原则(UML 类图基础、开闭、单一职责、里氏替换、依赖倒置、接口隔离、迪米特)',
        minutes: 30,
        points: ['UML 类图', '开闭原则', '里氏替换', '依赖倒置', '迪米特'],
        content: `
> [!interview] 章节定位
> 设计模式的面试很少直接考"背定义",而是考**原则落地的判断力**:"这段代码违反了什么原则?怎么改?"本章先补齐 UML 看图能力,再用可运行代码把六大原则逐一落地 —— 六大原则是后面四章所有模式的"内功心法"。

> [!info] 本章导读 · 为什么面试官总问"这段代码违反了什么原则"?
> 你接手过一个 800 行的 God Class:算钱、发邮件、拼 SQL、写日志全在一个类里,改一处怕崩三处 —— 这就是原则缺位的日常。本章是全模块的内功底子,先把 UML 看图和六大原则练成条件反射。
> - 读完本章你将能:对照 UML 类图说清六种关系的强弱
> - 用"变化理由"判断一个类要不要拆
> - 把开闭原则落到接口与扩展点上

> [!tip] 日常电脑现场 · 插线板与标准螺丝
> 插线板留了五个孔,不管插的是台灯、充电器还是电饭煲,接口都一样,这就是面向接口。家具用标准螺丝,换个牌子照样能装上,要是每个厂家都自己定螺纹,你家柜子坏了就再也配不到件。六大原则讲的,就是给代码定这几种通用接口。

## UML 类图速成:看懂模式图的入场券

\`\`\`diagram:u-class-basics
\`\`\`

六种关系分别看线型、箭头与生命周期：

| 关系 | UML 记号 | 代码形态 | 例子 |
| --- | --- | --- | --- |
| 依赖 | 虚线箭头 | 方法参数/局部变量 | 方法里用了另一个类 |
| 关联 | 实线箭头 | 成员变量 | 学生持有老师引用 |
| 聚合 | 空心菱形 | 整体与部分可独立存在 | 部门与员工 |
| 组合 | 实心菱形 | 独占所有权,生命周期绑定 | 人与心脏 |
| 实现 | 空心三角虚线 | implements | Dog 实现 Runnable |
| 泛化 | 空心三角实线 | extends | Dog 继承 Animal |

> [!tip] 聚合与组合一句话区分
> 聚合是"has-a,可拆伙"(部门散了员工还在),组合是"contains-a,一损俱损"(人没了心脏也没意义)。判断标准就一条:**生命周期是否绑定**。

## 开闭原则 OCP:总纲

**对扩展开放,对修改关闭**:加功能靠新增类,不改老代码。

\`\`\`java
// 收银台:新增支付渠道 = 新增一个类,收银台一行不改
import java.util.ArrayList;
import java.util.List;

interface PayChannel {
    void pay(int cents);
}
class WechatPay implements PayChannel {
    public void pay(int cents) { System.out.println("微信支付 " + cents + " 分"); }
}
class AliPay implements PayChannel {
    public void pay(int cents) { System.out.println("支付宝支付 " + cents + " 分"); }
}

public class Cashier {
    private final List<PayChannel> channels = new ArrayList<>();

    void register(PayChannel c) { channels.add(c); }   // 扩展点
    void checkout(int cents) {
        for (PayChannel c : channels) c.pay(cents);
    }

    public static void main(String[] args) {
        Cashier cashier = new Cashier();
        cashier.register(new WechatPay());
        cashier.register(new AliPay());
        cashier.checkout(9900);
    }
}
\`\`\`

\`\`\`output
微信支付 9900 分
支付宝支付 9900 分
\`\`\`

> [!interview] 高频追问:开闭原则这么绝对,谁能完全遵守?
> 不能,也不必。OCP 是**方向**不是铁律:稳定的核心逻辑对扩展开放,频繁变化的配置/策略抽成接口。Spring 的 Bean 注入、策略表、SPI 都是 OCP 的工业化落地。答"原则指导取舍"比答"必须严格遵守"高一档。

## 单一职责 SRP:一个类只有一个变化理由

\`\`\`java
// 反面:算薪与发邮件混在一个类,任何一侧改动都要回归整个类
class Employee {
    void calcSalary() { /* 财务规则,变化频率高 */ }
    void sendPayslipMail() { /* 消息渠道,技术选型常变 */ }
}
// 正面:拆开,各自只有一个变化方向
class PayrollCalculator { void calcSalary() { } }
class PayslipMailer      { void sendMail() { } }
\`\`\`

判定口诀:能不能用一句话说清这个类是干嘛的(且不含"和"、"以及")。

## 里氏替换 LSP:子类不能背叛父类的约定

任何父类出现的地方,子类换上去必须行为正确 —— 子类只增强,不改变契约。

\`\`\`java
class Rectangle {
    protected int w, h;
    void setW(int w) { this.w = w; }
    void setH(int h) { this.h = h; }
    int area() { return w * h; }
}
class Square extends Rectangle {          // 数学上正方形是长方形,代码里继承是灾难
    @Override void setW(int w) { this.w = this.h = w; }
    @Override void setH(int h) { this.w = this.h = h; }
}

public class LspDemo {
    static void resize(Rectangle r) {     // 依赖父类契约的通用代码
        r.setW(4);
        r.setH(5);
        System.out.println(r.area());     // 契约:宽 4 高 5,面积应为 20
    }

    public static void main(String[] args) {
        resize(new Rectangle());
        resize(new Square());
    }
}
\`\`\`

\`\`\`output
20
25
\`\`\`

> [!pitfall] "is-a"不等于"能继承"
> 正方形数学上是长方形,但 setW/setH 的行为契约被 Square 破坏了。继承看的是**行为契约**,不是概念分类;拿不准就用组合(正方形持有长方形)。

## 依赖倒置 DIP:高层依赖抽象

模块间依赖抽象(接口),不依赖具体实现 —— 这是 Spring IoC 的理论根基。

\`\`\`java
interface Storage {                        // 抽象
    void save(String data);
}
class MysqlStorage implements Storage {
    public void save(String data) { System.out.println("存入 MySQL: " + data); }
}
class RedisStorage implements Storage {
    public void save(String data) { System.out.println("存入 Redis: " + data); }
}

class OrderService {                       // 高层模块只认接口
    private final Storage storage;
    OrderService(Storage s) { storage = s; }   // 构造器注入
    void createOrder(String order) { storage.save(order); }
}

public class DipDemo {
    public static void main(String[] args) {
        new OrderService(new MysqlStorage()).createOrder("订单1001");
        new OrderService(new RedisStorage()).createOrder("订单1001");
    }
}
\`\`\`

\`\`\`output
存入 MySQL: 订单1001
存入 Redis: 订单1001
\`\`\`

## 接口隔离 ISP:别逼实现类吃胖接口

\`\`\`java
interface Workable { void work(); }
interface Eatable { void eat(); }

class Human implements Workable, Eatable {
    public void work() { System.out.println("人类工作"); }
    public void eat()  { System.out.println("人类吃饭"); }
}
class Robot implements Workable {          // 机器人只实现自己需要的能力
    public void work() { System.out.println("机器人干活,不用吃饭"); }
}

public class IspDemo {
    public static void main(String[] args) {
        new Human().work();
        new Robot().work();
    }
}
\`\`\`

\`\`\`output
人类工作
机器人干活,不用吃饭
\`\`\`

反面教材:一个 Worker 胖接口塞进 work/eat/sleep,机器人被迫实现 eat() 抛 UnsupportedOperationException。接口按"能力"拆,不按"角色"堆。

## 迪米特法则 LoD:只和直接朋友说话

迪米特法则(Law of Demeter)要求:一个对象应该对其他对象**知道得尽可能少**——只调用自己的方法、成员/参数的方法、自己创建的对象的方法,不要 \`a.getB().getC().doSomething()\` 这种"链式穿越"。

反例:OrderService 里直接写 \`order.getUser().getAddress().getCity()\`,订单服务被迫了解用户和地址的内部结构;地址模型一改,订单代码跟着崩。

正例:让 Order 提供 \`getCity()\`,内部委托给 user/address,外部只调一层。代价是多写几个"转发方法",换来的是**变化被隔离在对象内部**——这正是"最少知识"的价值。

> [!tip] 一句话记忆
> 只和直接朋友说话,别跟朋友的朋友套近乎。

## 六大原则关系图(背这个框架)

\`\`\`text
          开闭原则(总纲:对扩展开放,对修改关闭)
    ┌───────────┬───────────┬───────────┐
单一职责      里氏替换      依赖倒置      接口隔离 / 迪米特
(类的边界)   (继承的约束)  (依赖的方向)  (接口与外部的克制)
\`\`\`

> [!best] 补一条工程铁律:组合优于继承
> "优先使用组合而不是继承"是所有原则的落点:继承把子类绑死在父类的**实现细节**上,父类改一个 protected 方法就可能击穿所有子类,还容易暴露不该暴露的 API;组合只依赖接口契约,运行期还能替换。**策略、装饰器、桥接、代理的本质都是组合** —— 持有接口,而不是继承实现。判断顺序:先问"是否 is-a 且行为契约完全不变",不是就用组合。

\`\`\`java
// 继承:Stack 继承了 ArrayList,add(index) 等非栈语义被一起暴露
class ArrayListStack<E> extends java.util.ArrayList<E> {
    void push(E e) { add(e); }
}
// 组合:只暴露栈语义,内部容器可随时替换
class Stack<E> {
    private final java.util.Deque<E> inner = new java.util.ArrayDeque<>();
    void push(E e) { inner.push(e); }
    E pop() { return inner.pop(); }
}
\`\`\`

## 补充原则:合成复用与 UML 类图关系

六大原则之外,还有一条被反复引用的工程原则:**合成复用原则(CARP,Composite/Aggregate Reuse Principle)** —— 优先用组合/聚合复用行为,而不是继承。本章开头已经给过 UML 六种关系的定义,这一节换两个更实用的角度:为什么继承容易爆炸,以及拿到一张类图先看哪根箭头。

### 合成复用:继承是白盒,组合是黑盒

| 复用方式 | 关系 | 耦合点 | 运行期可替换 | 封装性 | 什么时候用 |
| --- | --- | --- | --- | --- | --- |
| 继承 | is-a | 父类实现细节(protected 也可见) | 否,编译期定死 | 白盒,子类依赖父类内部 | 行为契约稳定,确实是同一类事物 |
| 组合 | contains-a,同生共死 | 只依赖接口 | 是,构造注入 | 黑盒,只看到公开契约 | 能力拼装、策略可换 |
| 聚合 | has-a,可独立存活 | 只依赖接口 | 是,构造/setter 注入 | 黑盒 | 整体与部分生命周期独立 |

继承像"基因改造",子类天生带着父类的一切,父类改一个 protected 方法就可能击穿所有子类;组合像"插卡",需要什么能力插什么模块,拔掉也不伤主体。

\`\`\`java ComposeDemo.java
// 反例:每加一个能力就多一层子类,能力组合越多,类数量指数爆炸
class Order { int price() { return 100; } }
class VipOrder extends Order { int price() { return 90; } }
class PromoVipOrder extends VipOrder { int price() { return 80; } }
class LoggedPromoVipOrder extends PromoVipOrder { }   // 只想加日志,又被迫继承一层

// 正例:订单只负责组装,价格策略通过组合注入
interface PricePolicy { int calc(int origin); }
class VipPrice implements PricePolicy { public int calc(int o) { return o - 10; } }
class PromoPrice implements PricePolicy { public int calc(int o) { return o * 8 / 10; } }

class ComposedOrder {
    private final PricePolicy policy;
    ComposedOrder(PricePolicy policy) { this.policy = policy; }
    int price(int origin) { return policy.calc(origin); }
}

public class ComposeDemo {
    public static void main(String[] args) {
        System.out.println("原价: " + new ComposedOrder(p -> p).price(100));
        System.out.println("VIP: " + new ComposedOrder(new VipPrice()).price(100));
        System.out.println("大促: " + new ComposedOrder(new PromoPrice()).price(100));
        ComposedOrder vipPromo =
                new ComposedOrder(p -> new PromoPrice().calc(new VipPrice().calc(p)));
        System.out.println("VIP+大促: " + vipPromo.price(100));
    }
}
\`\`\`

\`\`\`output
原价: 100
VIP: 90
大促: 80
VIP+大促: 72
\`\`\`

反例里 \`Vip\`、\`Promo\`、\`Log\` 三个维度要枚举 8 个子类;正例只有 3 个策略类,任意叠加,新增"节日价"只需加一个实现,\`ComposedOrder\` 一行不改 —— 这就是合成复用同时满足开闭原则的原因。继承不是禁用:模板方法、抽象基类仍有价值,判断标准是"子类是否真的是一种父类,且父类实现不会变"。

\`\`\`java LifecycleDemo.java
import java.util.List;

class Player { }
class Team {
    private final List<Player> players;          // 聚合:队员从外部传入,队伍解散队员仍在
    Team(List<Player> players) { this.players = players; }
}

class Heart { }
class Human {
    private final Heart heart = new Heart();     // 组合:心脏在内部创建,人没了心脏无意义
}
\`\`\`

### UML 六种关系:箭头怎么读

\`\`\`diagram:u-relations
\`\`\`

| 关系 | 线型 | 端点 | 指向 | 生命周期 | 代码识别 |
| --- | --- | --- | --- | --- | --- |
| 依赖 | 虚线 | 开放箭头 | 使用者 → 被使用者 | 临时 | 方法参数、局部变量、静态调用 |
| 关联 | 实线 | 开放箭头(可双向) | 持有方 → 被持有方 | 各自独立 | 成员变量 |
| 聚合 | 实线 | 空心菱形 | 整体 ◇— 部分 | 部分可独立 | 整体管理部分,部分可独立存在 |
| 组合 | 实线 | 实心菱形 | 整体 ◆— 部分 | 同生共死 | 整体独占部分,生命周期绑定 |
| 泛化 | 实线 | 空心三角 | 子类 → 父类 | — | extends |
| 实现 | 虚线 | 空心三角 | 实现类 → 接口 | — | implements |

记忆法：**三角指向父类或接口，菱形在整体一端；泛化用实线，实现用虚线；空心菱形可独立，实心菱形绑定生命周期**。再压缩成一句:"依赖用一下、关联有一下、聚合聚一下、组合合一下、泛化是它、实现像它"。

> [!best] 看图先看箭头,再谈模式
> 面试让你画策略模式：Context 持有 Strategy 接口可画成**关联**，具体策略**实现**接口用虚线空心三角。装饰器要同时画出“实现或继承组件契约”和“持有组件引用”两条关系。接口用实现，抽象父类用继承；是否使用聚合或组合，还要看整体与部分的所有权、生命周期，不能只凭构造器注入或 new 判断。

## 面试速记

- OCP 是总纲:扩展靠新增类;SRP 管**类的粒度**,ISP 管**接口的粒度**。
- LSP 本质是**契约**不能被削弱;is-a 概念关系 ≠ 能继承,拿不准用组合。
- DIP 是 Spring IoC 的理论根基:高层依赖抽象,实现通过注入替换。
- 聚合与组合看生命周期:可独立存活是聚合,同生共死是组合。
- 迪米特一句话:不跟朋友的朋友说话,少知道少耦合。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch02',
        title: '创建型模式(单例[含双检锁+枚举]、简单工厂、工厂方法、抽象工厂、建造者、原型)',
        minutes: 35,
        points: ['单例四写法', 'volatile', '工厂三级', '建造者', '原型'],
        content: `
> [!interview] 章节定位
> 创建型模式的核心问题:**把"对象怎么造"封装起来,调用方只管要,不管造**。单例是绝对核心(手写 + 追问到 volatile 与反射破坏),工厂家族要能说清三级递进,建造者要举得出项目例子。先点演示,直观感受单例的线程竞争。

> [!info] 本章导读 · 一个 new,能惹出多少麻烦?
> 项目里到处 new 对象:数据库配置散落在十个类、单例被反射一撞就碎、构造参数多到要数三遍。创建型模式就是把这些"造对象"的乱账收拢起来,让调用方只管要、不管造。
> - 读完本章你将能:手写双检锁单例并解释 volatile 的作用
> - 说清简单工厂、工厂方法、抽象工厂的三级递进
> - 用建造者收拾参数爆炸的构造器

> [!tip] 日常电脑现场 · 代工厂怎么造手机
> 你在官网下单买手机,选颜色、选内存、选套餐,工厂照着配置单把零件组装好,你不需要知道屏幕是哪家供应商的。点外卖选套餐也一样,主食、饮料、小菜勾好,厨房照着配,你不用管哪口锅先开火。创建型模式就是把造对象的这堆选择,收进一张配置单。

\`\`\`demo:singleton
\`\`\`

## 单例:全局只有一个实例

四种主流写法,从简到繁:

### 1. 饿汉式:类加载时即创建

\`\`\`java
public class SingletonEager {
    private static final SingletonEager INSTANCE = new SingletonEager();  // 类加载即创建
    private SingletonEager() {}
    public static SingletonEager getInstance() { return INSTANCE; }
}
\`\`\`

线程安全由 JVM 类加载机制保证(<clinit> 只执行一次且自带锁);缺点:不管用不用都先造,大对象拖慢启动。

### 2. 双检锁 DCL:懒加载 + 线程安全(面试主秀)

\`\`\`java
public class SingletonDCL {
    private static volatile SingletonDCL instance;   // volatile 是考点,见下方追问

    private SingletonDCL() {}

    public static SingletonDCL getInstance() {
        if (instance == null) {                       // 第一次检查:多数请求直接返回,不加锁
            synchronized (SingletonDCL.class) {
                if (instance == null) {               // 第二次检查:排队进来的线程别重复创建
                    instance = new SingletonDCL();
                }
            }
        }
        return instance;
    }
}
\`\`\`

> [!interview] 高频追问:为什么必须 volatile?
> ==instance = new SingletonDCL()== 不是原子操作,分三步:① 分配内存 → ② 初始化对象 → ③ 引用指向内存。②③ 可能被**重排为 ①③②**:线程 A 执行完 ①③ 的瞬间,线程 B 第一次判空发现 instance != null,直接返回一个**还没初始化完成**的对象。volatile 两重作用:禁止 ②③ 重排 + 保证写可见性。只答"可见性"不得分,核心是**指令重排**。

### 3. 静态内部类:借 JVM 的锁实现懒加载

\`\`\`java
public class SingletonHolder {
    private SingletonHolder() {}
    private static class Holder {
        static final SingletonHolder INSTANCE = new SingletonHolder();
    }
    public static SingletonHolder getInstance() { return Holder.INSTANCE; }
}
\`\`\`

Holder 类只在第一次 getInstance 时才被加载(JVM 保证 <clinit> 线程安全)—— 懒加载 + 线程安全 + 无锁,是 DCL 的优雅替代。

### 4. 枚举:Effective Java 终极推荐

\`\`\`java
public enum SingletonEnum {
    INSTANCE;
    public void serve() { System.out.println("枚举单例干活"); }
}
\`\`\`

验证一致性:

\`\`\`java
public class SingletonTest {
    public static void main(String[] args) throws Exception {
        SingletonDCL a = SingletonDCL.getInstance();
        SingletonDCL b = SingletonDCL.getInstance();
        System.out.println("两次获取同一实例: " + (a == b));

        // 100 个线程并发获取,看拿到几个实例
        java.util.Set<SingletonDCL> set = java.util.concurrent.ConcurrentHashMap.newKeySet();
        for (int i = 0; i < 100; i++) {
            new Thread(() -> set.add(SingletonDCL.getInstance())).start();
        }
        Thread.sleep(500);
        System.out.println("100 个线程拿到的实例数: " + set.size());
    }
}
\`\`\`

\`\`\`output
两次获取同一实例: true
100 个线程拿到的实例数: 1
\`\`\`

> [!pitfall] 破坏单例的三种方式与防御
> ① **反射**:setAccessible 调私有构造器 → 构造器里判"已存在即抛异常";② **序列化**:反序列化会 new 新对象 → 加 ==readResolve()== 方法返回 INSTANCE;③ **克隆**:不实现 Cloneable 或 clone() 直接 return getInstance()。**枚举天然免疫全部三种**:JVM 层面禁止反射创建枚举对象,枚举序列化由 JVM 特殊处理 —— 这就是"枚举单例最安全"的完整论证。

| 写法 | 线程安全 | 懒加载 | 防反射/序列化 | 点评 |
| --- | --- | --- | --- | --- |
| 饿汉式 | 是(类加载) | 否 | 否 | 简单,可能浪费 |
| 双检锁 | 是(volatile) | 是 | 否 | 面试主秀,必会手写 |
| 静态内部类 | 是(类加载) | 是 | 否 | DCL 的优雅替代 |
| 枚举 | 是 | 否 | **是** | 最安全,生产推荐 |

## 简单工厂:一个工厂 + 判断分支

\`\`\`diagram:d-factory-uml
\`\`\`

用餐饮生意来类比工厂三级:简单工厂是**路边包子铺**,一个灶台啥都做,想加新品种就得改菜单(改工厂代码);工厂方法是**品牌加盟**,每类包子开一家专卖店,加品类只是多开一家店,老店纹丝不动;抽象工厂则是**中央厨房**,一次配齐一整套菜系的全家桶,换主题就整套换。

\`\`\`java
// 简单工厂:加产品就要改工厂的 switch,违反开闭(严格说不属于 GoF 23 种)
// 注:以下接口与实现类可放同一文件,只有演示主类声明 public
interface Shape { void draw(); }
class Circle implements Shape { public void draw() { System.out.println("画圆形"); } }
class Rect implements Shape { public void draw() { System.out.println("画矩形"); } }

class SimpleFactory {
    static Shape create(String type) {
        switch (type) {
            case "circle": return new Circle();
            case "rect":   return new Rect();
            default: throw new IllegalArgumentException(type);
        }
    }
}
\`\`\`

把 new 的决定权从调用方挪到工厂,调用方只认参数 —— 但每加一种图形都要动工厂,于是有了工厂方法。

## 工厂方法:一个产品一个工厂

\`\`\`java
interface ShapeFactory {                 // 工厂本身抽象:加产品 = 加一对类,零修改
    Shape create();
}
class CircleFactory implements ShapeFactory {
    public Shape create() { return new Circle(); }
}
class RectFactory implements ShapeFactory {
    public Shape create() { return new Rect(); }
}

public class FactoryMethodDemo {
    public static void main(String[] args) {
        new CircleFactory().create().draw();
        new RectFactory().create().draw();
    }
}
\`\`\`

\`\`\`output
画圆形
画矩形
\`\`\`

## 抽象工厂:一次造一族

产品成"家族"(同主题的按钮 + 输入框)时,给每个家族一个工厂:

\`\`\`java
interface Button { void render(); }
interface Input  { void render(); }

class WinButton implements Button { public void render() { System.out.println("Windows 按钮"); } }
class WinInput  implements Input  { public void render() { System.out.println("Windows 输入框"); } }
class MacButton implements Button { public void render() { System.out.println("Mac 按钮"); } }
class MacInput  implements Input  { public void render() { System.out.println("Mac 输入框"); } }

interface UIFactory {                    // 抽象工厂:面向"一族产品"
    Button createButton();
    Input  createInput();
}
class WinFactory implements UIFactory {
    public Button createButton() { return new WinButton(); }
    public Input  createInput()  { return new WinInput(); }
}
class MacFactory implements UIFactory {
    public Button createButton() { return new MacButton(); }
    public Input  createInput()  { return new MacInput(); }
}

public class AbstractFactoryDemo {
    static void paint(UIFactory f) {     // 客户端只依赖抽象工厂
        f.createButton().render();
        f.createInput().render();
    }
    public static void main(String[] args) {
        paint(new MacFactory());
        paint(new WinFactory());
    }
}
\`\`\`

\`\`\`output
Mac 按钮
Mac 输入框
Windows 按钮
Windows 输入框
\`\`\`

> [!warn] 抽象工厂的扩展痛点
> 加**一族**产品(新主题)容易:新写一个工厂类;但加**一个品种**(所有主题都要加"下拉框")要改接口和全部工厂 —— 品种维度违反开闭。这就是面试题"工厂方法 vs 抽象工厂"的答题内核。

## 建造者:分步组装复杂对象

\`\`\`java
public class HttpRequest {
    private final String url;            // 必填
    private final String method;         // 必填
    private final int timeoutMs;         // 可选
    private final boolean retry;         // 可选

    private HttpRequest(Builder b) {
        this.url = b.url;
        this.method = b.method;
        this.timeoutMs = b.timeoutMs;
        this.retry = b.retry;
    }

    public static class Builder {
        private final String url;
        private final String method;
        private int timeoutMs = 3000;    // 可选项给默认值
        private boolean retry = false;

        public Builder(String url, String method) {
            this.url = url;
            this.method = method;
        }
        public Builder timeout(int ms) { this.timeoutMs = ms; return this; }   // 链式
        public Builder retry(boolean r) { this.retry = r; return this; }
        public HttpRequest build() { return new HttpRequest(this); }
    }

    @Override
    public String toString() {
        return method + " " + url + " timeout=" + timeoutMs + "ms retry=" + retry;
    }

    public static void main(String[] args) {
        System.out.println(new HttpRequest.Builder("https://api.demo.com/order", "POST")
                .timeout(5000)
                .retry(true)
                .build());
    }
}
\`\`\`

\`\`\`output
POST https://api.demo.com/order timeout=5000ms retry=true
\`\`\`

适用信号:构造参数 4 个以上、有可选参数、构造后不可变。Spring Security 的 HttpSecurity、Lombok 的 @Builder 都是它。

## 原型:clone 复用昂贵对象

\`\`\`java
import java.util.ArrayList;
import java.util.List;

class Question implements Cloneable {
    String title;
    List<String> options;

    Question(String t, List<String> o) { title = t; options = o; }

    @Override
    public Question clone() {                       // 深拷贝:引用字段也要复制
        try {
            Question c = (Question) super.clone();  // 浅拷贝出基础副本
            c.options = new ArrayList<>(options);   // 不补这行,两个对象共享同一份 List
            return c;
        } catch (CloneNotSupportedException e) {
            throw new AssertionError(e);
        }
    }
}

public class PrototypeDemo {
    public static void main(String[] args) {
        Question paper = new Question("JVM 堆分为哪几代?",
                new ArrayList<>(List.of("A. 新生代", "B. 老年代", "C. 元空间", "D. 栈")));

        Question exam = paper.clone();
        exam.options.remove(2);                     // 改副本不影响原卷

        System.out.println("原卷: " + paper.options);
        System.out.println("考卷: " + exam.options);
    }
}
\`\`\`

\`\`\`output
原卷: [A. 新生代, B. 老年代, C. 元空间, D. 栈]
考卷: [A. 新生代, B. 老年代, D. 栈]
\`\`\`

> [!tip] 原型模式的现实形态
> 实战中很少直接用 Object.clone(),更常见的是**拷贝构造器**(new Question(other))或序列化深拷贝。Spring 的 ==prototype== 作用域 Bean 每次获取都新造,名字同源。

## 创建型模式总表

| 模式 | 解决什么 | 关键词 |
| --- | --- | --- |
| 单例 | 全局唯一实例 | volatile、枚举防破坏 |
| 工厂方法 | 一个产品一个工厂 | 子类决定造什么 |
| 抽象工厂 | 一族产品一起造 | 产品家族 |
| 建造者 | 分步组装复杂对象 | 链式、不可变 |
| 原型 | clone 复用 | 深浅拷贝 |

## 单例的三种破坏与防御

前面提示框给过结论,这一节把破坏**亲手复现一遍**:只有亲眼看到 \`a == b\` 输出 false,才会真正理解"私有构造器不是保险箱"。三种路径分别是反射、序列化和克隆,枚举单例对三者天然免疫。

### 反射破坏:private 只是编译期约定

\`\`\`java ReflectAttack.java
import java.lang.reflect.Constructor;

class Singleton {
    private static final Singleton INSTANCE = new Singleton();
    private Singleton() {}
    static Singleton getInstance() { return INSTANCE; }
}

public class ReflectAttack {
    public static void main(String[] args) throws Exception {
        Singleton a = Singleton.getInstance();
        Constructor<Singleton> c = Singleton.class.getDeclaredConstructor();
        c.setAccessible(true);          // 关掉访问检查,private 形同虚设
        Singleton b = c.newInstance();  // 又造了一个
        System.out.println("a == b ? " + (a == b));
    }
}
\`\`\`

\`\`\`output
a == b ? false
\`\`\`

防御思路:构造器里判断"实例已存在就抛异常"。饿汉式直接判 \`INSTANCE != null\`;懒加载式用一个静态标志,注意标志必须声明在实例字段**之前**,否则类初始化时会被重新赋 false。

\`\`\`java SafeSingleton.java
class SafeSingleton {
    private static final SafeSingleton INSTANCE = new SafeSingleton();

    private SafeSingleton() {
        if (INSTANCE != null) {          // 第一次构造时 INSTANCE 还是 null,放行
            throw new IllegalStateException("单例已存在,禁止反射创建");
        }
    }

    static SafeSingleton getInstance() { return INSTANCE; }
}
\`\`\`

\`\`\`java ReflectDefense.java
import java.lang.reflect.Constructor;

public class ReflectDefense {
    public static void main(String[] args) throws Exception {
        SafeSingleton a = SafeSingleton.getInstance();
        Constructor<SafeSingleton> c = SafeSingleton.class.getDeclaredConstructor();
        c.setAccessible(true);
        try {
            c.newInstance();
        } catch (Exception e) {
            System.out.println("防御生效: " + e.getCause().getMessage());
        }
        System.out.println("仍是同一实例: " + (a == SafeSingleton.getInstance()));
    }
}
\`\`\`

\`\`\`output
防御生效: 单例已存在,禁止反射创建
仍是同一实例: true
\`\`\`

### 序列化破坏:反序列化不走构造器

对象序列化后再反序列化,JDK 会**重新分配一个对象**,完全不调用构造器,所以构造器里的判空防御对它无效。

\`\`\`java SerialAttack.java
import java.io.*;

class SerSingleton implements Serializable {
    private static final long serialVersionUID = 1L;
    private static final SerSingleton INSTANCE = new SerSingleton();
    private SerSingleton() {}
    static SerSingleton getInstance() { return INSTANCE; }
}

public class SerialAttack {
    public static void main(String[] args) throws Exception {
        SerSingleton a = SerSingleton.getInstance();
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        try (ObjectOutputStream out = new ObjectOutputStream(bos)) {
            out.writeObject(a);
        }
        try (ObjectInputStream in = new ObjectInputStream(
                new ByteArrayInputStream(bos.toByteArray()))) {
            SerSingleton b = (SerSingleton) in.readObject();
            System.out.println("a == b ? " + (a == b));
        }
    }
}
\`\`\`

\`\`\`output
a == b ? false
\`\`\`

防御:加一个 \`readResolve()\`,反序列化在返回对象前会调用它,用返回值替换刚造出来的新对象。

\`\`\`java
private Object readResolve() {
    return INSTANCE;      // 反序列化返回前被调用,新对象被丢弃
}
\`\`\`

加上之后同一份序列化数据再反序列化,输出变回 \`a == b ? true\`。\`readResolve\` 必须保持 private(或至少不被继承覆盖),否则子类可以绕过;这也是 Effective Java 推荐枚举单例的原因之一 —— 枚举连这个方法都不用写。

### 枚举:JVM 层的双重免疫

\`\`\`java EnumDefense.java
import java.io.*;
import java.lang.reflect.Constructor;

enum EnumSingleton {
    INSTANCE;
    void serve() { System.out.println("enum 单例干活"); }
}

public class EnumDefense {
    public static void main(String[] args) throws Exception {
        // 1) 反射:构造器存在,但 newInstance 被 JVM 直接拒绝
        try {
            Constructor<EnumSingleton> c =
                    EnumSingleton.class.getDeclaredConstructor(String.class, int.class);
            c.setAccessible(true);
            c.newInstance("HACK", 1);
        } catch (Exception e) {
            System.out.println("反射失败: " + e.getClass().getSimpleName()
                    + " / " + e.getMessage());
        }

        // 2) 序列化:JVM 按 name 反序列化,回来还是同一个常量
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        try (ObjectOutputStream out = new ObjectOutputStream(bos)) {
            out.writeObject(EnumSingleton.INSTANCE);
        }
        try (ObjectInputStream in = new ObjectInputStream(
                new ByteArrayInputStream(bos.toByteArray()))) {
            EnumSingleton b = (EnumSingleton) in.readObject();
            System.out.println("序列化后同一实例? " + (b == EnumSingleton.INSTANCE));
        }
    }
}
\`\`\`

\`\`\`output
反射失败: IllegalArgumentException / Cannot reflectively create enum objects
序列化后同一实例? true
\`\`\`

原因是源码级的两道锁:① \`Constructor.newInstance\` 里有 \`if ((clazz.getModifiers() & Modifier.ENUM) != 0) throw new IllegalArgumentException("Cannot reflectively create enum objects")\`;② 枚举序列化只写常量名,反序列化走 \`Enum.valueOf\`,JVM 保证返回已有常量,根本不创建新对象。枚举单例的代价是不能懒加载(类加载即创建)、且已经继承了 \`Enum\`,不能再继承其他类 —— 单例场景下这点约束可以接受。

| 破坏方式 | 复现关键 | 普通单例防御 | 枚举单例 |
| --- | --- | --- | --- |
| 反射 | \`getDeclaredConstructor\` + \`setAccessible\` + \`newInstance\` | 构造器判 INSTANCE 非空,抛异常 | JVM 直接拒绝,抛 IllegalArgumentException |
| 序列化 | \`writeObject\` / \`readObject\` 绕过构造器 | 实现 \`private Object readResolve()\` 返回 INSTANCE | 只写 name,反序列化返回同一常量 |
| 克隆 | \`clone()\` 复制堆对象 | 不实现 Cloneable,或 clone 返回 INSTANCE | 枚举无 clone,天然免疫 |

> [!best] 选型结论
> 能用枚举就用枚举:代码最少、天然防反射/序列化/克隆,Effective Java 明确推荐。需要懒加载或必须继承某个基类时,用**静态内部类 + 构造器防御 + readResolve**;DCL 主要作为面试手写题,生产更偏好前两者。

## 面试速记

- 单例四写法:饿汉(类加载安全)、DCL(volatile 防重排)、静态内部类(借 <clinit> 锁)、枚举(全免疫)。
- DCL 的 volatile:防止"分配→初始化→赋引用"重排为"分配→赋引用→初始化",避免别的线程拿到半成品。
- 破坏单例三板斧:反射(构造器判空)、序列化(readResolve)、克隆;枚举全免疫。
- 工厂方法加"产品"符合开闭,抽象工厂加"一族"符合开闭、加"一个品种"违反开闭 —— 两者区别的答题核心。
- 建造者解决多参数构造可读性;原型重点考深浅拷贝,引用字段必须手动复制。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch03',
        title: '结构型模式(代理、适配器、装饰器、外观、组合、桥接、享元)',
        minutes: 35,
        points: ['动态代理', '装饰器', '适配器', '外观', '享元'],
        content: `
> [!interview] 章节定位
> 结构型模式的核心问题:**用组合与包装,在不改原类的前提下改变或增强对象的能力**。代理(AOP 的根基)与装饰器(IO 的根基)是重中之重,适配器/外观是工程高频,组合/桥接/享元记典型场景即可。

> [!info] 本章导读 · 不改原代码,怎么给对象加上新能力?
> 老接口被十几个模块依赖,动一行都可能炸;但日志、事务、缓存又必须加上去。结构型模式的答案很统一:不拆原类,用包装与组合把能力叠上去。
> - 读完本章你将能:分清代理与装饰器的意图差别
> - 用动态代理手写一个迷你 AOP
> - 认出 JDK IO 流里的装饰器链条

> [!tip] 日常电脑现场 · 手机壳与转接头
> 手机加个壳,功能一点没变,但摔一下不心疼了;老接口的耳机插不进新手机,加个转接头就通了。奶茶点单时加珍珠加椰果,还是那杯茶,只是往上叠了几层。这些都不需要拆开原物,套一层、转一下、加一点就够了,代理、适配器和装饰器干的是同一件事。

## 代理模式:控制访问的"中间人"(重点)

静态代理手写一个同接口包装类;真正的主角是**动态代理**:运行期自动生成代理类。

\`\`\`java
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

interface UserService {
    void save(String name);
}
class UserServiceImpl implements UserService {
    public void save(String name) { System.out.println("保存用户: " + name); }
}

public class JdkProxyDemo {
    public static void main(String[] args) {
        UserService target = new UserServiceImpl();

        UserService proxy = (UserService) Proxy.newProxyInstance(
                target.getClass().getClassLoader(),
                target.getClass().getInterfaces(),
                new InvocationHandler() {
                    public Object invoke(Object p, Method m, Object[] arg) throws Throwable {
                        System.out.println("[前置] 开启事务");
                        Object result = m.invoke(target, arg);   // 反射调用目标方法
                        System.out.println("[后置] 提交事务");
                        return result;
                    }
                });

        proxy.save("星薇Star");
        System.out.println("代理类继承自: " + proxy.getClass().getSuperclass().getName());
    }
}
\`\`\`

\`\`\`output
[前置] 开启事务
保存用户: 星薇Star
[后置] 提交事务
代理类继承自: java.lang.reflect.Proxy
\`\`\`

注意输出的最后一行:JDK 动态代理生成的 $Proxy0 **继承了 Proxy**,Java 单继承,所以 JDK 代理只能代理接口。

| 维度 | JDK 动态代理 | CGLIB |
| --- | --- | --- |
| 实现方式 | 反射生成接口的实现类 | 字节码生成**目标类的子类** |
| 要求 | 目标必须实现接口 | 类与方法不能是 final |
| 依赖 | JDK 自带 | 需 cglib 依赖(JDK17+ 要开放模块) |
| 调用速度 | 反射,持续优化中 | FastClass 索引,快 |
| Spring 默认 | 目标有接口时 | 无接口时(SpringBoot 2.x+ 默认全走 CGLIB) |

> [!warn] JDK17 下的 CGLIB 坑
> JDK17 模块化封装了 JDK 内部 API,CGLIB 反射修改生成类会抛 ==InaccessibleObjectException==,需要加 --add-opens 参数绕过 —— Spring Framework 6 因此彻底移除了 CGLIB 依赖,改用内建的类生成器。面试能说出这个版本细节非常加分。

## 适配器:让不兼容的接口合作

\`\`\`java
class Power220 {                          // 旧系统:只有 220V 输出
    int output220() { return 220; }
}
interface Power5 {                        // 新系统:期望 5V 接口
    int output5();
}

class PowerAdapter implements Power5 {    // 适配器:组合旧对象,实现新接口
    private final Power220 source;
    PowerAdapter(Power220 source) { this.source = source; }
    public int output5() { return source.output220() / 44; }
}

public class AdapterDemo {
    public static void main(String[] args) {
        System.out.println("手机充电电压: " + new PowerAdapter(new Power220()).output5() + "V");
    }
}
\`\`\`

\`\`\`output
手机充电电压: 5V
\`\`\`

对象适配器(组合)优于类适配器(继承)。JDK 经典:==Arrays.asList()== 把数组适配成 List;Spring MVC 的 HandlerAdapter 让各种类型的 Handler 适配统一调用。

## 装饰器:同接口层层增强(重点)

\`\`\`diagram:d-decorator-uml
\`\`\`

装饰器就像**奶茶加料**:同一杯茶,套一层"珍珠"就多了嚼头的加钱接口,再套"奶盖"、又套"芋泥",层层叠加;可递到手上的杯子始终还是那杯茶 —— **接口不变,能力叠加**。想加几种料、按什么顺序加,由客人(调用方)自由组合,不必为每种组合单开一个新类。

\`\`\`java
// 咖啡加料:不搞继承爆炸(MilkLatte/SugarLatte/MilkSugarLatte...),一层层包装
interface Coffee {
    String desc();
    int price();                          // 单位:分
}
class Latte implements Coffee {
    public String desc() { return "拿铁"; }
    public int price() { return 1500; }
}

abstract class CoffeeDecorator implements Coffee {   // 装饰器与咖啡同接口
    protected final Coffee inner;                     // 持有被装饰者
    CoffeeDecorator(Coffee inner) { this.inner = inner; }
}
class Milk extends CoffeeDecorator {
    Milk(Coffee c) { super(c); }
    public String desc() { return inner.desc() + "+奶"; }
    public int price() { return inner.price() + 200; }
}
class Syrup extends CoffeeDecorator {
    Syrup(Coffee c) { super(c); }
    public String desc() { return inner.desc() + "+糖浆"; }
    public int price() { return inner.price() + 300; }
}

public class DecoratorDemo {
    public static void main(String[] args) {
        Coffee order = new Syrup(new Milk(new Latte()));   // 洋葱式包装,顺序可换
        System.out.println(order.desc() + " = " + order.price() + " 分");
    }
}
\`\`\`

\`\`\`output
拿铁+奶+糖浆 = 2000 分
\`\`\`

JDK 的 IO 流就是教科书级装饰器链:

\`\`\`java
import java.io.BufferedInputStream;
import java.io.ByteArrayInputStream;
import java.io.DataInputStream;
import java.io.InputStream;

public class StreamDecoratorDemo {
    public static void main(String[] args) throws Exception {
        InputStream in = new BufferedInputStream(       // 装饰:加缓冲
                new DataInputStream(                    // 再装饰:加基本类型读取
                        new ByteArrayInputStream("ZCode".getBytes())));
        System.out.println(in.read());                  // 读走一个字节 'Z'
        System.out.println(in.available());             // 剩余 4 个字节
    }
}
\`\`\`

\`\`\`output
90
4
\`\`\`

## 外观 Facade:给复杂子系统一个统一入口

\`\`\`java
class SubStock { void check() { System.out.println("① 校验库存"); } }
class SubPay   { void pay()   { System.out.println("② 扣减支付"); } }
class SubShip  { void ship()  { System.out.println("③ 安排发货"); } }

class OrderFacade {                       // 门面:客户端只认识它
    private final SubStock s = new SubStock();
    private final SubPay p = new SubPay();
    private final SubShip h = new SubShip();
    void submit() { s.check(); p.pay(); h.ship(); }
}

public class FacadeDemo {
    public static void main(String[] args) {
        new OrderFacade().submit();
    }
}
\`\`\`

\`\`\`output
① 校验库存
② 扣减支付
③ 安排发货
\`\`\`

Spring MVC 的 DispatcherServlet 是整个 Web 层的门面,SLF4J 是日志体系的门面。

## 组合 Composite:树形结构统一处理

\`\`\`java
import java.util.ArrayList;
import java.util.List;

interface Node { long size(); }           // 文件与文件夹同一接口

class FileNode implements Node {
    private final long bytes;
    FileNode(long bytes) { this.bytes = bytes; }
    public long size() { return bytes; }
}
class DirNode implements Node {
    private final List<Node> children = new ArrayList<>();
    void add(Node n) { children.add(n); }
    public long size() {                  // 递归聚合,调用方无感层级
        long sum = 0;
        for (Node n : children) sum += n.size();
        return sum;
    }
}

public class CompositeDemo {
    public static void main(String[] args) {
        DirNode src = new DirNode();
        src.add(new FileNode(1200));
        src.add(new FileNode(800));
        DirNode project = new DirNode();
        project.add(src);
        project.add(new FileNode(300));
        System.out.println("项目总大小: " + project.size() + " 字节");
    }
}
\`\`\`

\`\`\`output
项目总大小: 2300 字节
\`\`\`

## 桥接 Bridge:两个正交维度解耦

形状 × 颜色,2×2 用继承要 4 个类,3×3 要 9 个 —— 桥接把两维分开演化,2+2 搞定。

\`\`\`java
interface Color { String name(); }
class Red  implements Color { public String name() { return "红色"; } }
class Blue implements Color { public String name() { return "蓝色"; } }

abstract class Shape {
    protected final Color color;          // 桥:形状持有颜色的引用
    Shape(Color color) { this.color = color; }
    abstract void draw();
}
class Circle extends Shape {
    Circle(Color color) { super(color); }
    void draw() { System.out.println("圆形是" + color.name()); }
}
class Rect extends Shape {
    Rect(Color color) { super(color); }
    void draw() { System.out.println("矩形是" + color.name()); }
}

public class BridgeDemo {
    public static void main(String[] args) {
        new Circle(new Red()).draw();
        new Rect(new Blue()).draw();
    }
}
\`\`\`

\`\`\`output
圆形是红色
矩形是蓝色
\`\`\`

JDBC 就是桥接:Driver 接口桥接"Java API"与各家"数据库实现",两边独立演化。

## 享元 Flyweight:共享细粒度对象

\`\`\`java
import java.util.HashMap;
import java.util.Map;

class TreeIcon {                          // 内部状态(纹理)共享,外部状态(坐标)现传
    private final String texture;
    TreeIcon(String texture) { this.texture = texture; }
    void draw(int x, int y) { System.out.println(texture + " 画在(" + x + "," + y + ")"); }
}

class TreeIconFactory {
    private static final Map<String, TreeIcon> POOL = new HashMap<>();
    static TreeIcon get(String type) {
        return POOL.computeIfAbsent(type, TreeIcon::new);   // 有就复用,没有才建
    }
}

public class FlyweightDemo {
    public static void main(String[] args) {
        TreeIcon a = TreeIconFactory.get("松树");
        TreeIcon b = TreeIconFactory.get("松树");
        a.draw(10, 20);
        b.draw(30, 40);
        System.out.println("同一份贴图对象: " + (a == b));
    }
}
\`\`\`

\`\`\`output
松树 画在(10,20)
松树 画在(30,40)
同一份贴图对象: true
\`\`\`

==Integer.valueOf(-128~127)== 的缓存、String 常量池、线程池复用,都是享元思想。

## 解释器 Interpreter:一条文法,一棵类树(GoF 补充)

结构型七模式之外的补充成员:把表达式抽象成接口,终结符(数字/变量)与非终结符(加减乘)各是一个类,递归求值。编译器 AST、规则引擎、Spring EL 都是它的放大版。

\`\`\`java
interface Expr { int eval(); }
class Num implements Expr {                         // 终结符:数字
    private final int v; Num(int v) { this.v = v; }
    public int eval() { return v; }
}
class Add implements Expr {                         // 非终结符:递归组合
    private final Expr l, r; Add(Expr l, Expr r) { this.l = l; this.r = r; }
    public int eval() { return l.eval() + r.eval(); }
}
public class DslDemo {
    public static void main(String[] args) {
        Expr e = new Add(new Num(1), new Add(new Num(2), new Num(3)));  // 1 + (2 + 3)
        System.out.println("表达式结果: " + e.eval());
    }
}
\`\`\`

\`\`\`output
表达式结果: 6
\`\`\`

适用信号:语法规则少且稳定、需要频繁新增"表达式类型"而不是新增"操作";规则一复杂就上 ANTLR,手写解释器只适合迷你 DSL。它与组合模式结构相似(都是树),但意图是**求值/解释**,不是统一处理结构。

## 结构型模式总结

| 模式 | 一句话 | 典型出处 |
| --- | --- | --- |
| 代理 | 控制访问 + 增强 | Spring AOP |
| 装饰器 | 同接口层层包装加能力 | Java IO 流 |
| 适配器 | 转换不兼容接口 | Arrays.asList |
| 外观 | 简化子系统入口 | DispatcherServlet |
| 组合 | 树形结构统一接口 | 目录树/菜单树 |
| 桥接 | 两维度分离演化 | JDBC |
| 享元 | 共享细粒度对象 | Integer 缓存 |
| 解释器 | 用类树表达文法并递归求值 | 自定义 DSL / 规则引擎 |

> [!interview] 高频追问:装饰器和代理长得几乎一样,区别在哪?
> 结构相同(同接口、持有目标、前后插逻辑),**意图不同**:装饰器的目的是**增强功能**,调用方主动层层包装、知道包了几层(Buffered 包 DataInputStream);代理的目的是**控制访问**,增强逻辑(事务、日志、鉴权)对调用方透明,AOP 的代理用户根本感知不到。一句话:==装饰器管"加料",代理管"把关"==。

## 面试速记

- JDK 代理生成的 $Proxy0 继承 Proxy → 只能代理接口;CGLIB 造子类 → final 类/方法不可代理。
- Spring AOP 选型:有接口默认 JDK 代理,SpringBoot 2.x 起默认 CGLIB(proxyTargetClass=true)。
- 装饰器与代理结构同、意图异:增强 vs 控制访问。
- IO 流体系是装饰器教科书:ByteArrayInputStream 被包 Buffered 再包 DataInputStream。
- 享元拆"内部状态(共享)/外部状态(现传)";Integer 缓存 -128~127。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch04',
        title: '行为型模式(策略、观察者、责任链、模板方法、状态、命令、迭代器、中介者、备忘录、访问者)',
        minutes: 40,
        points: ['策略', '观察者', '责任链', '模板方法', '状态'],
        content: `
> [!interview] 章节定位
> 行为型模式解决**对象之间如何分工与通信**。面试四大重点:策略(消除 if-else)、观察者(解耦广播)、责任链(拦截器/网关)、模板方法(骨架复用),其余六个理解典型场景即可。本章十种模式全部给可运行代码。

> [!info] 本章导读 · if-else 堆成山,真的只是因为需求多吗?
> 下单折扣、审批流转、消息通知,每个需求都往主干里塞一个分支,最后没人敢动那个方法。行为型模式专治"对象之间怎么分工、算法怎么替换"。
> - 读完本章你将能:用策略加路由表替掉同质化的 if 分支
> - 手写责任链与观察者,理解框架里的同构实现
> - 判断状态模式与普通分支的边界

> [!tip] 日常电脑现场 · 遥控器与红绿灯
> 空调遥控器上只有几个键,按制冷它走一套流程,按除湿换另一套,你不用管压缩机内部怎么运转。路口红绿灯也是,灯色一变,该停的停、该走的走,不需要交警挨个指挥。行为型模式管的就是这件事:谁在什么状态下该做什么,以及请求该沿着哪条链传下去。

## 策略模式:算法可整体替换(重点)

\`\`\`java
import java.util.HashMap;
import java.util.Map;

interface Discount {
    int calc(int price);                  // 策略统一接口
}
class VipDiscount implements Discount {   // 半价
    public int calc(int price) { return price / 2; }
}
class NewUserDiscount implements Discount {   // 立减 10 元
    public int calc(int price) { return price - 1000; }
}

public class StrategyDemo {
    // 策略表:类型 → 策略(Spring 里就是 @Autowired Map<String, Discount> 自动注入)
    private static final Map<String, Discount> STRATEGIES = new HashMap<>();
    static {
        STRATEGIES.put("vip", new VipDiscount());
        STRATEGIES.put("new", new NewUserDiscount());
        STRATEGIES.put("none", price -> price);          // Lambda 本身就是一个策略
    }

    public static void main(String[] args) {
        System.out.println("VIP 半价: " + STRATEGIES.get("vip").calc(20000));
        System.out.println("新人立减: " + STRATEGIES.get("new").calc(20000));
    }
}
\`\`\`

\`\`\`output
VIP 半价: 10000
新人立减: 19000
\`\`\`

> [!best] 消除 if-else 的三段论(面试必背)
> ① 把每个分支抽成策略类(或 Lambda/枚举);② 用 Map 建立"类型 → 策略"路由表;③ Spring 环境 ==@Autowired Map<String, Discount>==(key = Bean 名)自动收集全部策略。新增折扣 = 新增一个类 + 注册路由,主干零修改 —— 同时满足开闭原则。

## 观察者模式:一对多的事件广播(重点)

\`\`\`diagram:d-observer-uml
\`\`\`

观察者模式就是**微信公众号**:你(观察者)关注了公众号(被观察者),它一发文,所有粉丝的手机同时响。粉丝随时可以**取关**,公众号也能继续涨粉,彼此互不拖累 —— 这正是"一对多广播、双方解耦"的生活版。

\`\`\`java
import java.util.ArrayList;
import java.util.List;

interface OrderObserver {                 // 观察者
    void onPaid(String orderId);
}
class EmailNotifier implements OrderObserver {
    public void onPaid(String orderId) { System.out.println("邮件通知: 订单 " + orderId + " 已支付"); }
}
class SmsNotifier implements OrderObserver {
    public void onPaid(String orderId) { System.out.println("短信通知: 订单 " + orderId + " 已支付"); }
}

class OrderSubject {                      // 被观察者:只管广播,不知道谁在听
    private final List<OrderObserver> observers = new ArrayList<>();
    void subscribe(OrderObserver o) { observers.add(o); }
    void placeOrder(String orderId) {
        System.out.println("订单 " + orderId + " 创建成功");
        for (OrderObserver o : observers) o.onPaid(orderId);
    }
}

public class ObserverDemo {
    public static void main(String[] args) {
        OrderSubject subject = new OrderSubject();
        subject.subscribe(new EmailNotifier());
        subject.subscribe(new SmsNotifier());
        subject.placeOrder("1001");
    }
}
\`\`\`

\`\`\`output
订单 1001 创建成功
邮件通知: 订单 1001 已支付
短信通知: 订单 1001 已支付
\`\`\`

业务价值:下单动作与"发邮件/发短信/加积分"解耦,新增通知方式不改下单代码;配上 MQ 就升级为异步事件驱动。

## 责任链模式:请求沿链传递,直到有人处理(重点)

\`\`\`java
abstract class Approver {
    protected final int limit;            // 本级可批的最大天数
    private Approver next;
    Approver(int limit) { this.limit = limit; }
    Approver linkTo(Approver next) { this.next = next; return next; }   // 链式组装
    void handle(String name, int days) {
        if (days <= limit) {
            System.out.println(getClass().getSimpleName() + " 批准 " + name + " 请 " + days + " 天");
        } else if (next != null) {
            next.handle(name, days);      // 超出权限,传给下一环
        } else {
            System.out.println("没有人能批 " + days + " 天假");
        }
    }
}
class GroupLeader extends Approver { GroupLeader() { super(1); } }
class Manager extends Approver { Manager() { super(3); } }
class Director extends Approver { Director() { super(7); } }

public class ChainDemo {
    public static void main(String[] args) {
        Approver chain = new GroupLeader();
        chain.linkTo(new Manager()).linkTo(new Director());
        chain.handle("小张", 1);
        chain.handle("小李", 5);
        chain.handle("小王", 10);
    }
}
\`\`\`

\`\`\`output
GroupLeader 批准 小张 请 1 天
Director 批准 小李 请 5 天
没有人能批 10 天假
\`\`\`

> [!interview] 责任链在拦截器/网关里怎么用?
> Spring MVC 的 ==HandlerInterceptor==(preHandle → 业务 → postHandle → afterCompletion)与 Netty 的 ==pipeline== 都是责任链:每个节点做完自己的事决定**放行(return true)/拦截(return false)**,顺序由注册顺序决定。登录校验 → 权限 → 限流 → 日志,一条链各管一段,新增校验 = 新增拦截器注册上链,Controller 零感知。

## 模板方法:父类定骨架,子类填细节(重点)

\`\`\`java
abstract class GameLoader {
    final void load() {                   // final:骨架不许子类改
        System.out.println("== " + gameName() + " ==");
        connect();
        login();
        enterLobby();
        if (needPatch()) patch();         // 钩子方法:子类可改变流程
        System.out.println("进入游戏");
    }
    abstract String gameName();           // 必须实现的变化点
    void connect()    { System.out.println("连接服务器"); }
    void login()      { System.out.println("登录账号"); }
    void enterLobby() { System.out.println("进入大厅"); }
    boolean needPatch() { return true; }  // 钩子:默认有补丁
    void patch()      { System.out.println("下载更新包"); }
}
class MobileGame extends GameLoader {
    String gameName() { return "手游"; }
    boolean needPatch() { return false; } // 手游热更新,跳过补丁
}

public class TemplateDemo {
    public static void main(String[] args) {
        new MobileGame().load();
    }
}
\`\`\`

\`\`\`output
== 手游 ==
连接服务器
登录账号
进入大厅
进入游戏
\`\`\`

JdbcTemplate 的 execute(获取连接 → 回调 → 释放资源)、JUnit 的 setUp/test/tearDown 都是模板方法。要点:**父类控流程(final),子类填步骤**;钩子方法控制可选步骤。

## 状态模式:行为随状态切换

\`\`\`java
interface OrderState {
    void pay(OrderCtx ctx);
    void ship(OrderCtx ctx);
}
class WaitPay implements OrderState {
    public void pay(OrderCtx c)  { System.out.println("支付成功 → 已付款"); c.state = new Paid(); }
    public void ship(OrderCtx c) { System.out.println("未付款不能发货!"); }
}
class Paid implements OrderState {
    public void pay(OrderCtx c)  { System.out.println("已付款,勿重复支付"); }
    public void ship(OrderCtx c) { System.out.println("发货完成 → 已发货"); c.state = new Shipped(); }
}
class Shipped implements OrderState {
    public void pay(OrderCtx c)  { System.out.println("已发货,无需支付"); }
    public void ship(OrderCtx c) { System.out.println("不能重复发货"); }
}
class OrderCtx {                          // 上下文:持有当前状态
    OrderState state = new WaitPay();
    void pay()  { state.pay(this); }
    void ship() { state.ship(this); }
}

public class StateDemo {
    public static void main(String[] args) {
        OrderCtx order = new OrderCtx();
        order.ship();                     // 非法操作由状态自己拦截
        order.pay();
        order.ship();
        order.pay();
    }
}
\`\`\`

\`\`\`output
未付款不能发货!
支付成功 → 已付款
发货完成 → 已发货
已发货,无需支付
\`\`\`

对比 if-else 版:新增"退款""已完成"状态,if-else 版要改所有方法;状态版只需新增一个状态类 —— 状态自己知道"收到这个事件该怎么办、切到哪"。

## 命令模式:请求封装成对象,支持撤销与排队

\`\`\`java
interface Command {
    void execute();
    void undo();
}
class Editor {
    String text = "";
    void append(String s)  { text += s; }
    void deleteLast(int n) { text = text.substring(0, text.length() - n); }
}
class AppendCmd implements Command {      // 一个操作 = 一个对象(可入栈、可排队、可记日志)
    private final Editor editor;
    private final String input;
    AppendCmd(Editor editor, String input) { this.editor = editor; this.input = input; }
    public void execute() { editor.append(input); }
    public void undo()    { editor.deleteLast(input.length()); }
}

public class CommandDemo {
    public static void main(String[] args) {
        Editor editor = new Editor();
        Command c1 = new AppendCmd(editor, "Hello");
        Command c2 = new AppendCmd(editor, " JVM");
        c1.execute();
        c2.execute();
        System.out.println("当前文本: " + editor.text);
        c2.undo();
        System.out.println("撤销后: " + editor.text);
    }
}
\`\`\`

\`\`\`output
当前文本: Hello JVM
撤销后: Hello
\`\`\`

命令对象可入栈实现 undo/redo、可持久化做操作日志、可入队做异步任务 —— MQ 的消息、线程池的 Runnable 都是广义命令。

## 迭代器模式:统一遍历集合的入口

\`\`\`java
import java.util.Iterator;
import java.util.NoSuchElementException;

class BookShelf implements Iterable<String> {
    private final String[] books = {"JVM 实战", "Effective Java", "设计模式"};

    @Override
    public Iterator<String> iterator() {
        return new Iterator<String>() {
            private int index = 0;
            public boolean hasNext() { return index < books.length; }
            public String next() {
                if (!hasNext()) throw new NoSuchElementException();
                return books[index++];
            }
        };
    }
}

public class IteratorDemo {
    public static void main(String[] args) {
        for (String book : new BookShelf()) {   // 调用方不需要知道内部是数组还是链表
            System.out.println("阅读: " + book);
        }
    }
}
\`\`\`

\`\`\`output
阅读: JVM 实战
阅读: Effective Java
阅读: 设计模式
\`\`\`

> [!pitfall] 增强for底层就是迭代器
> 遍历中直接删元素抛 ==ConcurrentModificationException==,考的就是迭代器的 fail-fast 机制(用 modCount 校验结构是否被改)。正确姿势:==iterator.remove()== 或直接 removeIf。

## 中介者模式:网状依赖收敛成星型

\`\`\`java
import java.util.HashMap;
import java.util.Map;

class ChatRoom {                          // 中介者:所有人只认识它
    private final Map<String, User> users = new HashMap<>();
    void join(User user) { users.put(user.name, user); user.room = this; }
    void relay(String from, String to, String msg) {
        User target = users.get(to);
        if (target != null) target.receive(from, msg);
    }
}
class User {
    final String name;
    ChatRoom room;                        // 不直接持有其他 User
    User(String name) { this.name = name; }
    void receive(String from, String msg) { System.out.println(name + " 收到 " + from + ": " + msg); }
    void talk(String to, String msg) { room.relay(name, to, msg); }
}

public class MediatorDemo {
    public static void main(String[] args) {
        ChatRoom room = new ChatRoom();
        User a = new User("阿海");
        User b = new User("小甄");
        room.join(a);
        room.join(b);
        a.talk("小甄", "周末一起复盘面试吗?");
    }
}
\`\`\`

\`\`\`output
小甄 收到 阿海: 周末一起复盘面试吗?
\`\`\`

N 个对象两两关联是 N(N-1) 条线,引入中介降为 2N 条;MVC 的 Controller、机场塔台都是中介者。

## 备忘录模式:状态快照与回滚

\`\`\`java
class GameState {
    int level, hp;
    GameState(int level, int hp) { this.level = level; this.hp = hp; }

    static class Save {                   // 备忘录:只读快照
        final int level, hp;
        Save(int level, int hp) { this.level = level; this.hp = hp; }
    }
    Save save() { return new Save(level, hp); }             // 创建快照
    void restore(Save s) { level = s.level; hp = s.hp; }    // 回滚
    @Override public String toString() { return "等级 " + level + " 血量 " + hp; }
}

public class MementoDemo {
    public static void main(String[] args) {
        GameState hero = new GameState(10, 100);
        GameState.Save snapshot = hero.save();   // 打 boss 前存档

        hero.level = 15;
        hero.hp = 30;
        System.out.println("战后: " + hero);

        hero.restore(snapshot);                  // 读档回滚
        System.out.println("读档后: " + hero);
    }
}
\`\`\`

\`\`\`output
战后: 等级 15 血量 30
读档后: 等级 10 血量 100
\`\`\`

数据库事务回滚、编辑器 Ctrl+Z、内存快照都是备忘录思想。

## 访问者模式:数据结构稳定,操作多变

\`\`\`java
import java.util.List;

interface Shape { String accept(Visitor v); }      // 双分派第一步:元素接受访问者
class CircleShape implements Shape { public String accept(Visitor v) { return v.visitCircle(this); } }
class SquareShape implements Shape { public String accept(Visitor v) { return v.visitSquare(this); } }

interface Visitor {
    String visitCircle(CircleShape c);
    String visitSquare(SquareShape s);
}
class XmlVisitor implements Visitor {      // 新增一种"操作"只需新增一个访问者
    public String visitCircle(CircleShape c) { return "<circle/>"; }
    public String visitSquare(SquareShape s) { return "<square/>"; }
}
class AreaVisitor implements Visitor {
    public String visitCircle(CircleShape c) { return "面积 = 3.14 * r * r"; }
    public String visitSquare(SquareShape s) { return "面积 = a * a"; }
}

public class VisitorDemo {
    public static void main(String[] args) {
        List<Shape> shapes = List.of(new CircleShape(), new SquareShape());
        shapes.forEach(s -> System.out.println(s.accept(new XmlVisitor())));
        shapes.forEach(s -> System.out.println(s.accept(new AreaVisitor())));
    }
}
\`\`\`

\`\`\`output
<circle/>
<square/>
面积 = 3.14 * r * r
面积 = a * a
\`\`\`

代价:加一种**元素**要改所有访问者(接口加方法)。适用前提:元素稳定、操作多变,如编译器的 AST 遍历、ASM 字节码框架。

## 行为型模式速查表

| 模式 | 一句话 | 典型场景 |
| --- | --- | --- |
| 策略 | 算法可替换 | 折扣/支付路由 |
| 观察者 | 一对多广播 | 事件监听/MQ |
| 责任链 | 逐环处理放行 | 拦截器/网关过滤器 |
| 模板方法 | 骨架复用 | JdbcTemplate |
| 状态 | 状态驱动行为 | 订单流/工作流 |
| 命令 | 请求对象化 | undo、任务队列 |
| 迭代器 | 统一遍历 | 增强 for |
| 中介者 | 网状收敛星型 | 聊天室/塔台 |
| 备忘录 | 快照回滚 | 事务/Ctrl+Z |
| 访问者 | 稳结构变操作 | AST/ASM |

## 面试速记

- 策略消除 if-else 三步:抽策略 → 建路由表(Map/枚举) → Spring 注入 Map<String, 接口>。
- 观察者解耦"发生了什么"与"谁关心";配 MQ 后升级为异步发布订阅。
- 责任链核心是每节点的"处理 + 放行"决定权,HandlerInterceptor 与 Netty pipeline 是标准实现。
- 模板方法 = final 骨架 + 子类步骤 + 钩子控制可选流程;与策略的区别见面试题。
- 状态与策略结构相似:状态类知道"下一步切到哪",策略彼此无感知。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch05',
        title: '模式在 Spring 与 JDK 源码中的应用(IoC=工厂、AOP=动态代理、监听器=观察者、迭代器、装饰器流)',
        minutes: 30,
        points: ['IoC=工厂', 'AOP=代理', '事件=观察者', 'IO=装饰器', '源码话术'],
        content: `
> [!interview] 章节定位
> "Spring 里用到了哪些设计模式?"是 Spring 题的压轴常客,答得越多越具体越加分。本章把 Spring 与 JDK 源码里的模式**对着代码**过一遍,让你每报一个模式,都能跟一句"它在哪、长什么样"。

> [!info] 本章导读 · 面试官问"Spring 用了哪些设计模式",你能报出几个?
> 背出十个模式名不难,难的是每个都能指到源码里的类。本章把 Spring 与 JDK 里的模式对着代码过一遍,让答案从"我背过"变成"我读过"。
> - 读完本章你将能:把 IoC 讲成工厂加单例注册表
> - 说清 AOP 是动态代理与责任链的组合
> - 每个模式配一个 JDK 源码例子

> [!tip] 日常电脑现场 · 源码里的老朋友
> 第一次翻 Spring 源码,你会发现 BeanFactory 干的事和课上讲的工厂几乎一样,只是名字更长、包装更多。JDK 的 IO 流一层套一层,new 一个带缓冲的读对象,正是装饰器在起作用。就像回老家翻到小学作业本,字迹变了,题目还是那道,模式在框架里从不改名,只是穿得更正式。

## IoC 容器 = 工厂 + 单例注册表

\`\`\`java
// Spring 环境:AppConfig 是配置类,UserService 是普通 Bean
org.springframework.context.ApplicationContext ctx =
        new org.springframework.context.annotation.AnnotationConfigApplicationContext(AppConfig.class);

UserService svc = ctx.getBean(UserService.class);      // 工厂方法:按类型获取
UserService again = ctx.getBean(UserService.class);
System.out.println("同一实例吗: " + (svc == again));    // 默认 scope=singleton
\`\`\`

\`\`\`output
同一实例吗: true
\`\`\`

对照模式:

- **工厂 + 单例注册表**:DefaultListableBeanFactory 按定义造对象;所有单例放进 ==singletonObjects== 这个 ConcurrentHashMap(注册表),getBean 直接查表。
- **依赖倒置**:业务代码依赖接口,具体实现由容器注入 —— DIP 的工业化落地。

## AOP = 动态代理的工业化

\`\`\`text
Spring AOP 底层选择:
目标类实现了接口  → JdkDynamicAopProxy(Proxy.newProxyInstance)
目标类没有接口    → CglibAopProxy(Enhancer 生成子类)
Spring Boot 2.x+ 默认 proxyTargetClass=true → 全部走 CGLIB
\`\`\`

上一章手写的 InvocationHandler 里"前置开事务、后置提交"的逻辑,在 Spring 里就是 @Around 通知;多个通知按顺序执行(每层调用 proceed() 放行到下一层)就是责任链 + 递归。

> [!pitfall] 自调用失效:代理模式的经典坑
> 同类中 methodA() 内部调 this.methodB(),走的是 **this 原始对象**,不经过代理 → B 上的 @Transactional/@Async 全部失效。解法:注入自身代理(self 字段)、AopContext.currentProxy(),或把 B 挪到另一个 Bean。"为什么事务失效"十有八九能追到这一条。

## 事件监听 = 观察者

\`\`\`java
// 定义事件、监听事件(Spring 环境)
public class OrderPaidEvent {
    private final Long orderId;
    public OrderPaidEvent(Long orderId) { this.orderId = orderId; }
    public Long getOrderId() { return orderId; }
}

@Component
public class OrderListeners {
    @EventListener                        // 观察者:容器启动时扫描收集所有监听器
    public void onPaid(OrderPaidEvent event) {
        System.out.println("收到支付事件: " + event.getOrderId());
    }
}

// 业务代码任意位置发布(publisher 是 ApplicationEventPublisher):
// publisher.publishEvent(new OrderPaidEvent(1001L));   // 同步回调所有监听器
\`\`\`

publishEvent 底层就是遍历监听器列表逐个回调 —— 与观察者模式代码同构;加 @Async 或改发 MQ 就变成异步发布订阅。

## 一次请求穿过的一整套模式

| 组件 | 模式 | 说明 |
| --- | --- | --- |
| DispatcherServlet | 外观(前端控制器) | 统一入口,协调所有组件 |
| HandlerMapping | 策略 | 不同映射策略(URL/注解) |
| HandlerAdapter | 适配器 | 让各种 Handler 适配统一调用 |
| HandlerInterceptor | 责任链 | preHandle 逐环放行 |
| HandlerMethodArgumentResolver | 策略 | 参数解析器各管一种类型 |
| 单例 Bean 缓存 | 单例/享元 | singletonObjects 注册表 |

> [!best] 面试满分话术
> "Spring 本质是一堆模式的工业化组装:==IoC = 工厂 + 单例注册表,AOP = 动态代理 + 责任链,事件 = 观察者,MVC 入口 = 外观,拦截器 = 责任链==。我不是背的,是排查事务自调用失效时读过 AopUtils 和 CglibAopProxy 的源码。"

## JDK 源码里的模式(信手拈来的加分点)

| 模式 | JDK 中的实现 |
| --- | --- |
| 装饰器 | java.io 流体系:BufferedInputStream 包装 FileInputStream |
| 适配器 | Arrays.asList(数组→List)、InputStreamReader(字节→字符) |
| 迭代器 | 所有集合的 iterator() / 增强 for |
| 单例 | Runtime.getRuntime()(饿汉) |
| 享元 | Integer.valueOf(-128~127) 缓存、String 常量池 |
| 工厂 | Executors.newFixedThreadPool 等静态工厂 |
| 代理 | java.lang.reflect.Proxy |
| 模板方法 | AbstractList 留白抽象方法,子类填 get/size |
| 责任链 | ClassLoader 双亲委派链、Logger 的父子层级 |

ClassLoader 的双亲委派本身就是一条**责任链**:请求沿 parent 链向上传递,直到有人能处理 —— 用 JVM 知识反哺模式答案,一鱼两吃。

\`\`\`java
import java.io.BufferedInputStream;
import java.io.ByteArrayInputStream;
import java.io.InputStream;

public class JdkPatternsDemo {
    public static void main(String[] args) throws Exception {
        // 装饰器(流)+ 享元(Integer 缓存)+ 工厂(List.of)
        InputStream in = new BufferedInputStream(new ByteArrayInputStream("AB".getBytes()));
        System.out.println(in.read());

        Integer a = 127, b = 127;
        Integer c = 128, d = 128;
        System.out.println("127 缓存命中: " + (a == b));
        System.out.println("128 超出缓存: " + (c == d));
    }
}
\`\`\`

\`\`\`output
65
127 缓存命中: true
128 超出缓存: false
\`\`\`

> [!tip] 用源码例子反哺模式答题
> 面试官问"说说享元",你答 ==Integer.valueOf== 缓存 -128~127 并现场手写装箱比较;问"装饰器",你报 IO 流四层包装。**每个模式配一个 JDK 源码例子**,是区分"背过"与"用过"的关键。

## 面试速记

- Spring 三大件对号:Ioc = 工厂 + 单例注册表、AOP = 动态代理、事件 = 观察者。
- SpringBoot 2.x 起默认 CGLIB 代理;事务自调用失效源于绕过了代理对象。
- 请求链路模式串:外观(DispatcherServlet)→ 策略(HandlerMapping)→ 适配器(HandlerAdapter)→ 责任链(Interceptor)。
- JDK 例证:IO 流 = 装饰器、Arrays.asList = 适配器、Integer 缓存 = 享元、Runtime = 单例、ClassLoader 链 = 责任链。
- 答模式的加分公式:模式名 + 在哪个源码/组件里 + 我排查过什么相关 bug。
`,
      },
    ],
    interview: [
      { q: '单例有几种写法?各自的优缺点?', a: '四种主流:**饿汉式**(类加载时创建,线程安全但不懒加载);**双检锁 DCL**(懒加载 + volatile 防重排,面试主秀,要会手写);**静态内部类**(首次 getInstance 才加载 Holder 类,借 JVM <clinit> 的锁,懒加载 + 无锁,优雅);**枚举**(JVM 层面防反射、防序列化,最安全,Effective Java 推荐)。生产选型:无状态工具类用枚举或饿汉;初始化贵、想懒加载用静态内部类。' },
      { q: '双检锁为什么必须加 volatile?', a: 'new Singleton() 分三步:① 分配内存 → ② 初始化对象 → ③ 引用指向内存。②③ 可能被**重排为 ①③②**:线程 A 执行到 ①③ 的瞬间,线程 B 第一次判空看到 instance != null,直接返回**半成品对象**。volatile 两重作用:禁止 ②③ 重排 + 保证写可见。只答"可见性"不得分,核心是**指令重排**。' },
      { q: '单例会被哪些方式破坏?怎么防?', a: '① **反射**:setAccessible 调私有构造器 → 构造器里判"已存在即抛异常";② **序列化**:readObject 会新造对象 → 加 ==readResolve()== 返回 INSTANCE;③ **克隆**:不实现 Cloneable 或 clone() 返回 getInstance()。枚举天然免疫三种:JVM 禁止反射创建枚举对象(直接抛 IllegalArgumentException),枚举的序列化由 JVM 特殊保证。这就是"枚举单例最安全"的论证链。' },
      { q: '工厂方法和抽象工厂的区别?', a: '工厂方法:**一个产品**的等级结构,每类产品配一个工厂子类,加产品 = 加一对类,符合开闭;抽象工厂:**一族产品**(多维度绑定,如 Mac 主题的按钮 + 输入框),工厂接口一次造一族。关键在扩展方向:抽象工厂加"新家族"容易(新增工厂类),加"新品种"难(所有工厂接口都要改);工厂方法加产品容易但管不了产品族。产品维度单一用工厂方法,产品成族用抽象工厂。' },
      { q: 'JDK 动态代理和 CGLIB 的区别?', a: 'JDK 代理:反射生成实现同接口的 $Proxy0 类,**继承了 Proxy**(单继承限制)→ 只能代理接口,调用走 Method.invoke。CGLIB:字节码技术生成**目标类的子类**,重写方法织入逻辑 → 不要求接口,但 **final 类/方法不可代理**(子类无法重写),private 也拦截不到。Spring AOP:有接口默认 JDK 代理;SpringBoot 2.x 起默认全 CGLIB(proxyTargetClass=true)。另注意 JDK17 模块化后 CGLIB 需要 --add-opens,Spring 6 已改用内建类生成器。' },
      { q: 'Spring 用到了哪些设计模式?', a: '报这套:**工厂 + 单例注册表**(BeanFactory / DefaultSingletonBeanRegistry 的 singletonObjects)、**代理**(AOP 的 JdkDynamicAopProxy / CglibAopProxy)、**责任链**(HandlerInterceptor、AOP 通知链)、**观察者**(ApplicationEvent / ApplicationListener)、**策略**(HandlerMapping、Resource)、**适配器**(HandlerAdapter、AdvisorAdapter)、**外观**(DispatcherServlet)、**模板方法**(JdbcTemplate、AbstractApplicationContext.refresh)、**建造者**(BeanDefinitionBuilder)。每个再补一句对应源码类名更稳。' },
      { q: '什么是开闭原则?实际开发怎么落地?', a: '**对扩展开放、对修改关闭**:新需求靠新增代码而非改老代码。落地手段:① 面向接口编程,实现类可替换;② 策略模式 + Map 路由替代 if-else;③ Spring 的 Bean 注入天然支持"换实现不改调用方";④ 事件/观察者解耦主流程;⑤ SPI/插件机制。注意 OCP 是方向不是铁律,盲目抽象造成的过度设计同样违反工程判断 —— 敢说"原则指导取舍"是加分项。' },
      { q: '策略模式怎么消除 if-else?', a: '三步:① 每个分支抽成策略(类/枚举/Lambda);② 建"条件 → 策略"路由表(Map 或枚举);③ 主干只查表执行。Spring 进阶:@Autowired Map<String, Discount> 按 Bean 名自动收集所有策略,新增策略零改动主干。适用判断:分支之间是"同一件事的不同做法"才用策略;分支结构差异大时硬套策略反而更绕。' },
      { q: '责任链模式在拦截器/网关里怎么应用?', a: 'Spring MVC 的 HandlerInterceptor:preHandle 按注册顺序逐个执行,返回 true 放行给下一环 + Controller,返回 false 直接终止 —— 每个拦截器只管自己的横切逻辑(登录、权限、限流、日志)。Netty pipeline、Servlet Filter、Gateway GlobalFilter 同构。好处:节点可插拔、顺序可编排、Controller 零感知。细节:preHandle 顺序执行、afterCompletion 逆序执行,谁先返回 false 谁之后的前置都不执行。' },
      { q: '观察者模式和发布订阅模式的区别?', a: '观察者:Subject **直接持有** Observer 列表并逐个回调,两者互相知道存在,进程内同步调用。发布订阅:中间加**事件通道/调度中心**(MQ、EventBus),发布者与订阅者互不相识,天然支持异步、跨进程、削峰填谷。一句话:**发布订阅 = 观察者 + 中间的调度中心**。Spring 的 ApplicationEvent 是进程内观察者;消息换成 RocketMQ 后就是发布订阅。' },
      { q: '装饰器和代理的区别?', a: '结构一模一样(同接口、持有目标、方法前后插逻辑),**意图与契约不同**:装饰器目的是**增强功能**,客户端主动层层包装、知道包了几层(IO 流 BufferedInputStream 包 FileInputStream);代理目的是**控制访问**,对客户端透明,增强逻辑(事务、日志、鉴权)属于横切关注点。一句话:装饰器管加料,代理管把关;装饰器组合自由,代理关系固定。' },
      { q: '模板方法和策略模式都是封装算法,区别在哪?', a: '模板方法:**继承**实现,父类 final 定骨架、子类填步骤,编译期确定,改变的是"步骤细节",适合流程固定、局部变化(JdbcTemplate)。策略:**组合**实现,整个算法可整体替换,运行期可切换,适合"同一问题多种解法"(支付渠道、折扣方案)。优先级:组合优于继承 → 能用策略优先策略;但流程骨架复用是模板方法的强项。两者可叠加:模板的某个步骤用策略注入。' },
      { q: '什么是设计模式?为什么不能为了用模式而用模式?说说你理解的“过度设计”。', a: '① 设计模式是特定场景下、针对反复出现的设计问题、被反复验证过的解决方案模板,四要素是**场景、问题、解法、代价**。② 为模式而模式的典型表现:接口只有一个实现还硬抽一层、为“以后可能扩展”提前加抽象、包装完反而更难读。③ 过度设计的本质是**为想象中的变化支付真实的维护成本**;判断标准看变化是否已发生、重复是否已出现,先用最直白的代码跑通,同一变化点重复出现再重构。' },
      { q: 'UML 类图中聚合和组合有什么区别?', a: '两者都是整体-部分,区别在**生命周期与所有权**。**聚合**(空心菱形):部分由外部创建、可独立存在,整体销毁部分仍在,代码中表现为整体管理部分引用，但仅有构造器或 setter 注入还不足以证明聚合关系,如部门与员工。**组合**(实心菱形):部分在整体内部创建、与整体同生共死,必须结合整体对部分的独占所有权和生命周期理解，不能只凭构造器里 new 判断,如人与心脏。判断标准:整体没了,部分还有没有意义?有 = 聚合,没有 = 组合。强度上组合强于聚合,都强于关联;菱形永远画在整体一端。' },
      { q: '单例如何防止反射与序列化破坏?枚举为什么天然免疫?', a: '**反射**:setAccessible(true) 能绕过 private,防御是在构造器里判断“实例已存在就抛异常”;饿汉式判 INSTANCE 非空,懒加载式用静态标志并放在实例字段之前声明。**序列化**:readObject 不走构造器会新造对象,防御是加 private Object readResolve() 返回 INSTANCE,反序列化返回前用返回值替换新对象。**枚举**:Constructor.newInstance 源码对 ENUM 直接抛 IllegalArgumentException(“Cannot reflectively create enum objects”);枚举序列化只写 name,反序列化走 Enum.valueOf 返回已有常量。两条路都被 JVM 堵死,所以枚举单例最安全,代价是不能懒加载。' }
    ]
  };

  /* ═══════════════════════════════════════════════════
     装配:星级化重写的创建型/结构型/行为型章节
     结构 = 入门 → 六原则 → 创建型 → 结构型 → 行为型(上/下) → 源码应用
     ═══════════════════════════════════════════════════ */
  (function () {
    var M = window.CONTENT.patterns;
    if (!M) return;
    var EX = window.PATTERNS_EXTRA || {};
    var base = {};
    M.chapters.forEach(function (c) { base[c.id] = c; });
    var staged = [base['ch00'], base['ch01'], EX['p02'], EX['p03'], EX['p04'], EX['p05'], base['ch05']].filter(Boolean);
    staged.forEach(function (c, i) { c.id = 'pat' + (i + 1); });
    M.chapters = staged;
    if (window.PATTERNS_IQ && window.PATTERNS_IQ.length) {
      M.interview = (M.interview || []).concat(window.PATTERNS_IQ);
    }
    M.minutes = '≈ 22 小时';
    M.description = '像《大话设计模式》一样讲模式:每个模式都从生活/业务场景引出,先看"不用模式的痛",再一步步演进到模式代码,最后给取舍与面试追问。23 种模式按 ⭐⭐⭐/⭐⭐/⭐ 分级,重要的手把手,冷门的点到为止。';
  })();
})();