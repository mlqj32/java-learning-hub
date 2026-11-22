/* ═══════════════════════════════════════════════════════════
   设计模式扩展篇:创建型与结构型(教材式讲解)
   p02 创建型模式:对象怎么"造"出来
   p03 结构型模式:对象怎么"拼"起来
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.PATTERNS_EXTRA = window.PATTERNS_EXTRA || {};
  window.PATTERNS_IQ = window.PATTERNS_IQ || [];

  /* ─────────────────────────────────────────── */
  window.PATTERNS_EXTRA['p02'] = {
    id: 'p02',
    title: '创建型模式:对象怎么"造"出来',
    minutes: 70,
    points: ['单例', '工厂三兄弟', '建造者', '原型'],
    content: `
> [!info] 本章导读 · 先讲个故事
> 你辞职开了家奶茶店,第一天就撞上四件怪事。后厨只有一台封口机,三个店员各自 new 了一台,结果谁也没封上杯;顾客点“珍珠奶茶”,新店员在点单台里写 if-else,每上一款新品就要改收银机;外卖平台要一份“低糖去冰加椰果”的套餐,参数写了八行还漏了吸管;总部让你照着一份标准简历复印二十份招人,你每份都从空白 Word 重敲。
> 这四件怪事,正好对应创建型模式的四个问题:**造几次、谁来造、怎么一步步造、造得太贵怎么复制。**
> - 读完本章你将能:手写六种单例,并说清每一种的缺陷与防御
> - 用三版工厂代码讲明白简单工厂、工厂方法、抽象工厂的取舍
> - 在构造器参数爆炸时改用建造者,用原型解决昂贵对象的复制
> - 面试被追问“Spring 单例和 GoF 单例是不是一回事”时,能一句话说清边界

> [!tip] 日常现场 · 奶茶店的后厨窗口
> 你在点单台只说“一杯珍珠奶茶,少冰”,不用告诉后厨红茶泡几分钟、珍珠煮多久、封口机怎么预热。点单台和后厨之间隔着一份菜单,这份菜单就是抽象:前台不依赖具体做法,后厨换设备,前台不用重学。创建型模式干的,就是把 new 这一声“进后厨”收拢到一个固定窗口,别让每个店员都往后厨钻。

> [!tip] 日常电脑现场 · 手机是这样被"造"出来的
> 你在官网订手机,选颜色、内存、套餐,工厂按配置单组装,你不用知道屏幕哪家供货。点外卖选套餐也一样:勾好主食饮料,后厨照着配,你不关心哪口锅先开火。创建型模式就是把"造对象"的一堆选择收进配置单。

## 创建型模式到底在管什么

对象不是凭空来的,每个 new 都在回答三个问题:造几份、谁来造、造的时候要不要一步步配。创建型模式就是把这三种决定从调用方手里拿走,放到一个专门的角色身上。

| 模式 | 控制的维度 | 一句话 | 生活场景 | 典型源码 |
| --- | --- | --- | --- | --- |
| 单例 Singleton | 数量 | 全局只留一个实例 | 公司唯一的打印机 | Runtime.getRuntime() |
| 简单工厂 | 创建位置 | 一个工厂按参数造不同产品 | 总后厨按菜单出餐 | DriverManager.getConnection |
| 工厂方法 Factory Method | 创建位置 + 扩展 | 每个产品配自己的工厂 | 每个档口独立出餐 | Collection.iterator() |
| 抽象工厂 Abstract Factory | 产品族 | 一个工厂造一族配套产品 | 台式套餐、港式套餐 | DocumentBuilderFactory |
| 建造者 Builder | 组装过程 | 一步步配出复杂对象 | 麦当劳自选套餐 | StringBuilder |
| 原型 Prototype | 复制成本 | 复制现成对象,不重新造 | 复印简历 | Object.clone() |

> [!best] 一句话选型
> 只允许一个 → 单例;创建逻辑会分支 → 工厂;参数多且可选 → 建造者;已有对象复制更便宜 → 原型。==先判断变化发生在“数量、位置、过程还是成本”,再选模式,不要反过来背名字。==

## ⭐⭐⭐ 单例模式 Singleton —— 全世界只有一个它

> [!info] 先讲个场景
> 公司只有一台打印机,前台、财务、人事都要打印。前台 new 了一台,财务 new 了一台,人事又 new 了一台,代码里就有了三台“打印机”:三个打印队列、三份状态,纸盒却只有一叠。配置中心也一样,每个类都 new 一个 Config,各自缓存一份,运维改了一个,另一个还在用旧值。
> 单例要保证的只有一件事:**一个类在进程里只有一个实例,并给所有人一个统一的取用入口。**

> [!warn] 不用模式会怎样
> 每次 new 都会产生独立状态:限流器各算各的、连接池各建各的、缓存各存各的,资源翻倍还可能互相打架。更麻烦的是调用方到处 new,将来想换成“带监控的版本”,得全项目搜索 new,漏一处就是一个隐蔽的 bug。

### 角色与结构

单例的结构只有一个类,但三个部件缺一不可:

\`\`\`diagram:u-singleton
\`\`\`

三个部件各管一件事:私有构造器管“外部不能造”,静态字段管“只存一份”,静态方法管“怎么拿”。少一个都不成立:构造器公开,谁都能 new;字段不静态,每个对象一份;没有统一入口,调用方就得自己维护引用。

### 从烂代码到模式代码

先看没有单例时的真实写法:

\`\`\`java
class Printer {
    public Printer() {
        System.out.println("新打印机上线,纸盒只有一叠");
    }

    public void print(String job) {
        System.out.println("打印: " + job);
    }
}

public class BadPrinterDemo {
    public static void main(String[] args) {
        Printer frontDesk = new Printer();
        Printer finance = new Printer();
        Printer hr = new Printer();

        frontDesk.print("前台合同");
        finance.print("财务月报");
        hr.print("入职简历");
    }
}
\`\`\`

\`\`\`output
新打印机上线,纸盒只有一叠
新打印机上线,纸盒只有一叠
新打印机上线,纸盒只有一叠
打印: 前台合同
打印: 财务月报
打印: 入职简历
\`\`\`

输出看着正常,问题藏在对象身份里:三行“上线”意味着三个独立实例,真实世界只有一台机器。如果 Printer 里还有“当前纸量、任务队列、卡纸状态”,三个对象就会各说各话。下面按“为什么需要它”的顺序,把六种写法一层层演进;六段代码是同一个类的六次改写,每次替换上一版,不要放进同一个文件。

#### 写法一:饿汉式,类加载就创建

\`\`\`java
class Printer {
    // 类加载时创建,只有一份;JVM 保证 <clinit> 只执行一次
    private static final Printer INSTANCE = new Printer();

    private Printer() {
        System.out.println("打印机通电,只此一台");
    }

    public static Printer getInstance() {
        return INSTANCE;
    }

    public void print(String job) {
        System.out.println("打印: " + job);
    }
}

public class HungryDemo {
    public static void main(String[] args) {
        Printer a = Printer.getInstance();
        Printer b = Printer.getInstance();
        System.out.println("是同一台: " + (a == b));
        a.print("合同");
        b.print("报表");
    }
}
\`\`\`

\`\`\`output
打印机通电,只此一台
是同一台: true
打印: 合同
打印: 报表
\`\`\`

饿汉的优点是没有并发问题:实例在类初始化阶段就建好,JVM 用类初始化锁保证只执行一次。缺点是**不懒加载**:类一被加载就创建,如果构造器里要读配置、连数据库、加载词库,应用启动会被拖慢;如果这个单例从头到尾没被用过,这次创建就是白花钱。

#### 写法二:懒汉式,第一次用才创建

\`\`\`java
class Printer {
    private static Printer instance;   // 先不创建

    private Printer() {
        System.out.println("打印机通电,只此一台");
    }

    public static Printer getInstance() {
        if (instance == null) {
            instance = new Printer();  // 第一次调用才创建
        }
        return instance;
    }
}
\`\`\`

单线程下完全正确:第一次进 if,创建;第二次 instance 非空,直接返回。但“第一次”往往是并发最凶的时候,比如应用启动时十个线程同时初始化。两个线程可能同时判断 instance 为 null,于是各造一台:

\`\`\`java
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class LazyRaceDemo {
    static class LazyPrinter {
        private static LazyPrinter instance;
        private static final Set<Integer> IDS = ConcurrentHashMap.newKeySet();

        private LazyPrinter() {
            System.out.println(Thread.currentThread().getName() + " 造了一台打印机");
        }

        static LazyPrinter getInstance() {
            if (instance == null) {
                try { Thread.sleep(50); } catch (InterruptedException e) { } // 放大并发窗口
                instance = new LazyPrinter();
            }
            return instance;
        }
    }

    public static void main(String[] args) throws Exception {
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        for (int i = 0; i < 2; i++) {
            pool.submit(() -> {
                try {
                    start.await();
                    LazyPrinter.IDS.add(System.identityHashCode(LazyPrinter.getInstance()));
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }
        start.countDown();
        pool.shutdown();
        pool.awaitTermination(1, TimeUnit.SECONDS);
        System.out.println("不同实例个数: " + LazyPrinter.IDS.size());
    }
}
\`\`\`

\`\`\`output
pool-1-thread-1 造了一台打印机
pool-1-thread-2 造了一台打印机
[err]不同实例个数: 2[/err]
\`\`\`

两个线程都通过了 null 判断,于是都执行了 new。后一个赋值覆盖前一个,两个线程拿到的甚至可能不是同一个对象。**懒加载本身没错,错在“判断”和“创建”不是一个原子动作。**线程调度顺序每次可能不同,但在正常调度下,“不同实例个数为 2”这个结果通常都会出现。

#### 写法三:同步方法,安全但变慢

最直接的修法是给获取方法加锁:

\`\`\`java
public static synchronized Printer getInstance() {
    if (instance == null) {
        instance = new Printer();
    }
    return instance;
}
\`\`\`

这样确实只会创建一个,但代价是**每一次读取都要抢锁**:实例早就建好了,后续九十九次调用仍然在排队进 synchronized,高并发下这个单例成了整条链路的收费站。读多写少(实际上只写一次)的场景,不该为第一次创建付一辈子的锁成本。

#### 写法四:双检锁 DCL,只锁创建那一次

\`\`\`java
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

class Printer {
    private static volatile Printer instance;   // volatile 是重点

    private Printer() {
        System.out.println("打印机通电,只此一台");
    }

    public static Printer getInstance() {
        if (instance == null) {                 // 第一重:已创建就直接返回,不抢锁
            synchronized (Printer.class) {
                if (instance == null) {         // 第二重:排队进来的线程再确认一次
                    instance = new Printer();   // volatile 禁止初始化与赋值重排
                }
            }
        }
        return instance;
    }
}

public class DclDemo {
    public static void main(String[] args) throws Exception {
        Set<Integer> ids = ConcurrentHashMap.newKeySet();
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(10);
        for (int i = 0; i < 10; i++) {
            pool.submit(() -> {
                try {
                    start.await();
                    ids.add(System.identityHashCode(Printer.getInstance()));
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }
        start.countDown();
        pool.shutdown();
        pool.awaitTermination(1, TimeUnit.SECONDS);
        System.out.println("不同实例个数: " + ids.size());
    }
}
\`\`\`

\`\`\`output
打印机通电,只此一台
不同实例个数: 1
\`\`\`

两次判空不是啰嗦:第一次判空让**实例已存在时完全不进锁**,第二次判空让**排队进来的线程不会重复创建**。真正容易答错的是 volatile,后面面试追问单独拆。

#### 写法五:静态内部类,懒加载又无锁

\`\`\`java
class Printer {
    private Printer() {
        System.out.println("打印机通电,只此一台");
    }

    private static class Holder {
        private static final Printer INSTANCE = new Printer();
    }

    public static Printer getInstance() {
        return Holder.INSTANCE;   // 第一次调用才触发 Holder 初始化
    }
}

public class HolderDemo {
    public static void main(String[] args) {
        System.out.println("外部类已加载,但还没创建");
        Printer a = Printer.getInstance();
        Printer b = Printer.getInstance();
        System.out.println("是同一台: " + (a == b));
    }
}
\`\`\`

\`\`\`output
外部类已加载,但还没创建
打印机通电,只此一台
是同一台: true
\`\`\`

这里借的是 JVM 的类初始化机制:外部类加载不会初始化内部类,只有第一次访问 Holder.INSTANCE 才触发 Holder 的初始化;而 JVM 保证一个类的 \`<clinit>\` 在多线程下只执行一次,其他线程会阻塞等待。所以它同时拿到**懒加载、线程安全、无锁读取**三个好处,是最常用的生产写法。它挡不住反射,这是所有非枚举写法的共同软肋。

#### 写法六:枚举,最安全但最不灵活

\`\`\`java
enum Printer {
    INSTANCE;

    void print(String job) {
        System.out.println("打印: " + job);
    }
}

public class EnumSingletonDemo {
    public static void main(String[] args) {
        Printer a = Printer.INSTANCE;
        Printer b = Printer.INSTANCE;
        System.out.println("是同一台: " + (a == b));
        a.print("合同");
    }
}
\`\`\`

\`\`\`output
是同一台: true
打印: 合同
\`\`\`

枚举单例的写法最短,安全性却最高。JVM 在 Constructor.newInstance 里明确禁止反射创建枚举对象,枚举的序列化只写 name、反序列化走 Enum.valueOf 返回已有常量,所以**反射和序列化两条后门都被 JVM 堵死**。代价是不能懒加载(枚举常量在类初始化时创建)、不能继承(枚举已经继承了 java.lang.Enum),也不适合需要大量初始化参数的场景。

把六种写法放在一张表里,面试前扫一眼就够:

| 写法 | 懒加载 | 线程安全 | 读取性能 | 防反射/序列化 | 主要缺陷 |
| --- | --- | --- | --- | --- | --- |
| 饿汉 | 否 | 是 | 高 | 否 | 启动即创建,可能浪费 |
| 懒汉 | 是 | 否 | 高 | 否 | 并发下会造多个 |
| 同步懒汉 | 是 | 是 | 低 | 否 | 每次读取都抢锁 |
| 双检锁 DCL | 是 | 是 | 高 | 否 | 写错 volatile 就翻车 |
| 静态内部类 | 是 | 是 | 高 | 否 | 反射仍可破坏 |
| 枚举 | 否 | 是 | 高 | 是 | 不能懒加载、不能继承 |

### 反射与序列化:单例的两个后门

私有构造器只拦得住“正常写法”,拦不住反射。看这段代码:

\`\`\`java
import java.lang.reflect.Constructor;

class Config {
    private static final Config INSTANCE = new Config();

    private Config() { }   // 没有防御

    static Config getInstance() { return INSTANCE; }
}

public class ReflectBreakDemo {
    public static void main(String[] args) throws Exception {
        Config c1 = Config.getInstance();
        Constructor<Config> ctor = Config.class.getDeclaredConstructor();
        ctor.setAccessible(true);
        Config c2 = ctor.newInstance();
        System.out.println("反射绕过私有构造器: " + (c1 != c2));
    }
}
\`\`\`

\`\`\`output
[err]反射绕过私有构造器: true[/err]
\`\`\`

防御思路是在构造器里加一道“已存在就拒绝”的闸门:

\`\`\`java
private Config() {
    if (INSTANCE != null) {
        throw new IllegalStateException("单例已存在,禁止再创建");
    }
}
\`\`\`

第一次正常创建时 INSTANCE 还是 null,放行;反射第二次进来时 INSTANCE 已有值,直接抛异常。注意静态字段的声明顺序:防御判断必须能看到已经赋值的实例。

序列化是另一条路。反序列化不走构造器,ObjectInputStream 会新造一个对象:

\`\`\`java
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;

class Config implements Serializable {
    private static final long serialVersionUID = 1L;
    private static final Config INSTANCE = new Config();

    private Config() { }

    static Config getInstance() { return INSTANCE; }
}

public class SerialBreakDemo {
    public static void main(String[] args) throws Exception {
        Config c1 = Config.getInstance();
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        try (ObjectOutputStream out = new ObjectOutputStream(bytes)) {
            out.writeObject(c1);
        }
        Config c2;
        try (ObjectInputStream in =
                     new ObjectInputStream(new ByteArrayInputStream(bytes.toByteArray()))) {
            c2 = (Config) in.readObject();
        }
        System.out.println("反序列化后是同一个吗: " + (c1 == c2));
    }
}
\`\`\`

\`\`\`output
[err]反序列化后是同一个吗: false[/err]
\`\`\`

补一个 readResolve 就能把新对象换回已有实例:

\`\`\`java
private Object readResolve() {
    return INSTANCE;   // 反序列化返回前,用已有实例替换刚造出来的对象
}
\`\`\`

加上之后,反序列化结果就是 true。这条路同样有前提:INSTANCE 必须是静态可访问的。克隆则是第三条路,防御最简单:不实现 Cloneable,或者让 clone() 直接返回 getInstance()。

> [!danger] 枚举为什么最安全
> 反射创建枚举时,JDK 的 Constructor.newInstance 会直接抛 IllegalArgumentException(“Cannot reflectively create enum objects”);枚举序列化只保存常量名,反序列化由 Enum.valueOf 返回已有常量。==JVM 从源头堵死了两条路==,不需要你写 readResolve 或构造器判断。代价是不能懒加载,所以“初始化很贵且可能用不上”时,静态内部类更合适。

### Spring 单例和 GoF 单例不是一回事

面试里最容易混的一个点:Spring 的 Bean 默认 singleton,但它不是 GoF 单例。区别在“谁保证唯一”和“作用域边界”:

| 维度 | GoF 单例 | Spring 单例 Bean |
| --- | --- | --- |
| 唯一范围 | 每个类加载器一份 | 每个容器、每个 bean 名一份 |
| 谁负责创建 | 类自己(private 构造器 + 静态字段) | 容器(BeanFactory / ApplicationContext) |
| 外部能否 new | 不能,构造器私有 | 通常可以,new 出来的是容器外的另一个对象 |
| 唯一性靠什么 | 语言层面堵死构造器 | singletonObjects 缓存(DefaultSingletonBeanRegistry) |
| 线程安全 | 单例类自己保证 | 容器只保证创建一次,对象状态仍要自己保证 |

所以“Spring 单例”更准确的说法是**容器级单例**:容器保证每个 bean 名只创建一个实例并缓存,但类本身没有禁止 new,也没有禁止一个应用里存在多个容器。把有状态的成员变量塞进单例 Bean,并发请求会互相串数据,这不是 Spring 的 bug,是单例的经典坑。

> [!pitfall] 单例 Bean 注入 prototype Bean
> 单例 Bean 只在创建时注入一次依赖。如果它持有的是一个 prototype Bean,那个 prototype 会被“固化”成事实上的单例,后续不会再创建新实例。需要每次取新对象时,注入 ObjectProvider、ApplicationContext,或给 prototype Bean 加作用域代理。

### 优缺点与适用场景

| 优点 | 缺点 | 何时用 | 真实应用 |
| --- | --- | --- | --- |
| 控制实例数量,节省昂贵资源 | 本质是全局变量,依赖关系被藏起来 | 进程内确实只该有一份的资源 | 配置中心客户端、连接池、日志器 |
| 提供统一访问点,状态一致 | 单测难隔离,并发安全要自己保证 | 无状态工具类、注册表、缓存 | Runtime.getRuntime() |
| 懒加载写法可推迟初始化 | 反射/序列化/克隆都可能破坏 | 初始化很贵且可能用不上 | Spring 单例 Bean(容器级) |

### 面试追问

> [!interview] 追问:为什么双检锁必须加 volatile?
> new Printer() 在字节码层面分三步:① 分配内存,② 调用构造器初始化,③ 把引用赋给 instance。② 和 ③ 可能被重排成 ①③②:线程 A 刚执行完 ③、还没初始化完,线程 B 在第一次判空时看到 instance 非空,直接返回一个**半成品对象**。volatile 有两个作用:禁止 ②③ 重排,并保证写操作对其他线程可见。只答“可见性”不完整,核心是**指令重排**。

> [!interview] 追问:单例的构造器里加判断,能防住所有破坏吗?
> 防不住序列化:反序列化根本不走构造器,必须额外加 readResolve。也防不住克隆:clone 不调用构造器,要靠不实现 Cloneable 或重写 clone 返回 INSTANCE。==构造器判断只挡反射这一条路==,答“三种破坏、三种防御”才完整。枚举之所以被推荐,就是因为它把反射与序列化都交给了 JVM。

## ⭐⭐⭐ 工厂三兄弟 —— 点单台不管后厨怎么做

> [!info] 先讲个场景
> 奶茶店开业,顾客只有两种选择:珍珠奶茶、水果茶。你在点单台写了一段 if-else,珍珠走一个分支,水果走另一个分支,十分钟搞定。三个月后店里上了奶盖茶、烧仙草、杨枝甘露,外卖平台、小程序、门店大屏各有一套下单代码,每上一款新品,你都要把三处的 if-else 改一遍,还要担心漏掉某个渠道。
> 工厂模式要解决的就是这件事:**把“造哪种产品”的决定从调用方手里拿走,让调用方只认菜单,不认后厨。**

> [!warn] 不用模式会怎样
> 调用方直接 new 具体类,意味着它必须知道所有产品类名、构造参数和初始化顺序。新增一种产品,所有调用点都要改;想按配置切换实现,得在每个调用点写 if;想给创建过程统一加缓存、埋点、权限校验,只能复制到每个 new 旁边。**创建逻辑一散,变化就会顺着调用链到处冒头。**

### 角色与结构

三个版本的角色数量不同,但核心分工一致:

三个版本分别见下方各节的 UML：重点比较创建入口和产品契约。

| 角色 | 职责 | 奶茶店类比 |
| --- | --- | --- |
| Product(抽象产品) | 定义产品共同行为 | 菜单上的“奶茶” |
| ConcreteProduct(具体产品) | 实现某一种产品 | 珍珠奶茶、水果茶 |
| Factory(工厂) | 决定造哪种、怎么造 | 点单台 / 后厨窗口 |
| Client(调用方) | 只依赖抽象产品与工厂 | 顾客,只报口味 |

### 从烂代码到模式代码

#### 版本零:调用方自己 new

\`\`\`java
abstract class MilkTea {
    abstract void make();
}

class PearlMilkTea extends MilkTea {
    void make() { System.out.println("煮珍珠 + 泡红茶 + 加奶 = 珍珠奶茶"); }
}

class FruitTea extends MilkTea {
    void make() { System.out.println("切水果 + 泡绿茶 = 水果茶"); }
}

public class BadShop {
    public static void main(String[] args) {
        String order = "珍珠";
        MilkTea tea;
        if ("珍珠".equals(order)) {
            tea = new PearlMilkTea();
        } else if ("水果".equals(order)) {
            tea = new FruitTea();
        } else {
            throw new IllegalArgumentException("没有这个口味: " + order);
        }
        tea.make();
    }
}
\`\`\`

\`\`\`output
煮珍珠 + 泡红茶 + 加奶 = 珍珠奶茶
\`\`\`

两个分支时这样写没有问题,甚至比工厂更清楚。问题是分支会一直长:新品、促销款、季节限定,而且每个渠道都复制一份同样的 if。**当“同一段分派逻辑”出现第二份时,就该把创建收拢了。**

#### 版本一:简单工厂,把 if 搬到工厂里

\`\`\`diagram:u-simple-factory
\`\`\`

\`\`\`java
// 产品类沿用前面的 MilkTea、PearlMilkTea、FruitTea
class MilkTeaFactory {
    static MilkTea create(String type) {
        switch (type) {
            case "珍珠": return new PearlMilkTea();
            case "水果": return new FruitTea();
            default: throw new IllegalArgumentException("没有这个口味: " + type);
        }
    }
}

public class SimpleFactoryDemo {
    public static void main(String[] args) {
        MilkTea a = MilkTeaFactory.create("珍珠");
        MilkTea b = MilkTeaFactory.create("水果");
        a.make();
        b.make();
    }
}
\`\`\`

\`\`\`output
煮珍珠 + 泡红茶 + 加奶 = 珍珠奶茶
切水果 + 泡绿茶 = 水果茶
\`\`\`

调用方现在只认识 MilkTea 和 MilkTeaFactory,不再 import 具体产品。这一步的价值是**收敛**:三个渠道都调同一个工厂,新品只改工厂一处。但工厂里仍然是一个 switch,新增“奶盖茶”还是得改这个类,严格说违反了开闭原则;产品多起来,工厂会变成几百行的“上帝类”。简单工厂不在 GoF 的 23 种模式里,它是更常见的习惯写法。

#### 版本二:工厂方法,一个产品配一个工厂

\`\`\`diagram:u-factory-method
\`\`\`

\`\`\`java
// 产品类沿用前面的 MilkTea、PearlMilkTea、FruitTea
interface MilkTeaFactory {
    MilkTea create();
}

class PearlMilkTeaFactory implements MilkTeaFactory {
    public MilkTea create() { return new PearlMilkTea(); }
}

class FruitTeaFactory implements MilkTeaFactory {
    public MilkTea create() { return new FruitTea(); }
}

class Shop {
    private final MilkTeaFactory factory;

    Shop(MilkTeaFactory factory) {
        this.factory = factory;
    }

    void order() {
        MilkTea tea = factory.create();
        tea.make();
    }
}

public class FactoryMethodDemo {
    public static void main(String[] args) {
        new Shop(new PearlMilkTeaFactory()).order();
        new Shop(new FruitTeaFactory()).order();
    }
}
\`\`\`

\`\`\`output
煮珍珠 + 泡红茶 + 加奶 = 珍珠奶茶
切水果 + 泡绿茶 = 水果茶
\`\`\`

现在新增“奶盖茶”只需要加一个 MilkTea 子类和一个工厂类,Shop、旧工厂、旧产品一行不改,符合开闭。代价是类数量翻倍:每多一个产品,就多一个工厂;如果产品本身只是数据不同、做法完全一样,这些工厂类就是纯样板。

#### 版本三:抽象工厂,一个工厂造一族产品

\`\`\`diagram:u-abstract-factory
\`\`\`

奶茶店做大了,开始卖“主题套餐”:一杯饮品配一份小食,台式套餐必须是珍珠奶茶 + 盐酥鸡,港式套餐必须是丝袜奶茶 + 菠萝油。如果让客户端自己组合,很容易拼出“台式珍珠奶茶 + 港式菠萝油”这种不伦不类的套餐。抽象工厂把“同一族产品”的创建绑在一个工厂里:

\`\`\`java
interface Drink { void make(); }
interface Snack { void make(); }

class PearlMilkTea implements Drink {
    public void make() { System.out.println("台式: 珍珠奶茶"); }
}
class SaltChicken implements Snack {
    public void make() { System.out.println("台式: 盐酥鸡"); }
}
class SilkStockingTea implements Drink {
    public void make() { System.out.println("港式: 丝袜奶茶"); }
}
class PineappleBun implements Snack {
    public void make() { System.out.println("港式: 菠萝油"); }
}

interface ShopFactory {
    Drink createDrink();
    Snack createSnack();
}

class TaiwanShopFactory implements ShopFactory {
    public Drink createDrink() { return new PearlMilkTea(); }
    public Snack createSnack() { return new SaltChicken(); }
}

class HongKongShopFactory implements ShopFactory {
    public Drink createDrink() { return new SilkStockingTea(); }
    public Snack createSnack() { return new PineappleBun(); }
}

class ThemeShop {
    private final ShopFactory factory;

    ThemeShop(ShopFactory factory) {
        this.factory = factory;
    }

    void open() {
        factory.createDrink().make();
        factory.createSnack().make();
    }
}

public class AbstractFactoryDemo {
    public static void main(String[] args) {
        new ThemeShop(new TaiwanShopFactory()).open();
        System.out.println("---");
        new ThemeShop(new HongKongShopFactory()).open();
    }
}
\`\`\`

\`\`\`output
台式: 珍珠奶茶
台式: 盐酥鸡
---
港式: 丝袜奶茶
港式: 菠萝油
\`\`\`

客户端只依赖 Drink、Snack、ShopFactory 三个抽象,套餐内部的搭配由工厂保证,不会串味。新增“台式”“港式”之外的第三个主题很容易:加一个工厂类。但要在所有套餐里加一份“甜品”,就得改 ShopFactory 接口和所有实现,这是抽象工厂的固有短板。

#### 三兄弟怎么选:看“变化从哪个方向来”

| 维度 | 简单工厂 | 工厂方法 | 抽象工厂 |
| --- | --- | --- | --- |
| 产品范围 | 一个产品等级 | 一个产品等级 | 一族产品(多个等级) |
| new 写在哪 | 一个工厂的 switch | 每个具体工厂 | 每个家族工厂的多个方法 |
| 新增一个产品 | 改工厂 switch | 加产品类 + 工厂类 | 改工厂接口 + 所有实现 |
| 新增一个家族 | 改工厂 switch | 加具体工厂(产品不变) | 加一个家族工厂 |
| 是否符合开闭 | 否 | 产品方向符合 | 家族方向符合,产品方向违反 |
| 生活比喻 | 一个总后厨 | 每个档口独立出餐 | 主题套餐,主食小食必须同源 |
| 典型源码 | DriverManager.getConnection | Collection.iterator() | DocumentBuilderFactory |

把“改一个产品要动哪些类”单独拎出来,最容易记:

| 变化 | 简单工厂 | 工厂方法 | 抽象工厂 |
| --- | --- | --- | --- |
| 新增珍珠奶茶(新口味) | 改工厂 switch | 加 2 个类 | 改接口 + 所有工厂 |
| 所有饮品换低糖配方 | 改所有产品类 | 改所有产品类 | 改所有家族工厂 |
| 新增港式主题(一族) | 改 switch 多次 | 加多个工厂类 | 加 1 个家族工厂 |

> [!tip] 一句话选型
> 产品就两三个、短期不会扩 → 直接写 if 或简单工厂;产品维度单一但会持续增加 → 工厂方法;多个产品必须成套出现、按主题/平台切换 → 抽象工厂。==不要为了“符合开闭”把两个分支的代码拆成六个类。==

### Spring 里的 BeanFactory 与 FactoryBean

Spring 的两个名字长得很像,职责完全不同:

| 名字 | 是什么 | 谁调用谁 | 典型用法 |
| --- | --- | --- | --- |
| BeanFactory / ApplicationContext | 容器级大工厂,按名字或类型取对象 | 你调 getBean(),容器返回已装配的 Bean | @Autowired、getBean(OrderService.class) |
| FactoryBean | 一个“会造对象的 Bean”,实现 getObject() | 容器调你的 getObject(),把返回值当 Bean | SqlSessionFactoryBean、ProxyFactoryBean |

BeanFactory 管的是“整个应用的对象池 + 装配关系”,它内部用 singletonObjects 缓存单例 Bean,所以它同时带着工厂和单例注册表的影子;FactoryBean 管的是“某一个复杂对象怎么创建”,比如 MyBatis 的 SqlSessionFactory 需要读配置、建数据源、初始化映射器,直接 new 太复杂,就交给 SqlSessionFactoryBean 在 getObject() 里完成。取 FactoryBean 本身要在名字前加 &,这是面试常问的小细节。

### 优缺点与适用场景

| 优点 | 缺点 | 何时用 | 真实应用 |
| --- | --- | --- | --- |
| 调用方与具体类解耦,换实现不改调用方 | 类数量增加,链路多一跳 | 创建逻辑复杂或会按配置切换 | Spring BeanFactory |
| 创建逻辑集中,便于加缓存、埋点、权限 | 简单场景属于过度设计 | 同一段分派逻辑出现多处 | JDBC DriverManager |
| 工厂方法符合开闭,新增产品不动旧代码 | 抽象工厂加新产品要改所有工厂 | 产品族必须配套创建 | 跨平台 UI 组件、主题皮肤 |

### 面试追问

> [!interview] 追问:工厂方法 and 抽象工厂到底怎么区分?
> 工厂方法只解决**一个产品等级**的创建:一个抽象工厂接口里只有一个 create 方法,每个产品配一个子工厂,新增产品是加一对类。抽象工厂解决**一族产品**的创建:一个工厂接口里有多个 create 方法,一次造出互相配套的多个产品,新增家族容易、新增产品品种难。判断看产品维度:一条线用工厂方法,一个面用抽象工厂。

> [!interview] 追问:简单工厂违反开闭原则,为什么项目里还大量用?
> 因为它用最小的复杂度解决了“创建逻辑收敛”。开闭原则是方向不是铁律:产品少、变化慢时,一个 switch 比六个类更好读、更好改。真要扩展时,再把 switch 里的分支提升成工厂方法,重构成本也不高。==面试里能说出“什么时候不拆”比背“必须符合开闭”更加分。==

## ⭐⭐ 建造者模式 Builder —— 套餐要一步一步配

> [!info] 先讲个场景
> 中午去麦当劳,你点“板烧鸡腿堡套餐”:主食选板烧,小食换鸡翅,饮料要可乐去冰,再加一份甜筒。店员不会让你填一张十项的表格,而是一步一步问,选完就打单。组装电脑也一样:CPU、内存、硬盘、显卡、机箱、电源,有人要办公机,有人要游戏机,配置单不一样,但组装流程是同一套。
> 建造者模式就是把“复杂对象的组装过程”从构造器里拿出来,拆成一个个有名字的步骤,最后 build 出一个完整对象。

> [!warn] 不用模式会怎样
> 构造器参数一多,调用方就变成猜谜:\`new Computer("i7", 32, "1TB", "RTX4060", true, false, "银灰", 850)\`。每个位置是什么?顺序错了编译器不一定报错,因为类型可能刚好兼容。可选参数还会逼你写一堆重载构造器,或者退化成 setter 分步设置 —— 对象在中途处于半成品状态,谁都能改,线程安全和不可变性全没了。

### 角色与结构

\`\`\`diagram:u-builder
\`\`\`

| 角色 | 职责 | 麦当劳类比 |
| --- | --- | --- |
| Product | 最终要得到的复杂对象 | 一份套餐 |
| Builder | 定义每一步怎么配,提供链式方法 | 店员按步骤询问 |
| ConcreteBuilder | 具体配置的实现,保存中间状态 | 你这一单的具体选择 |
| Director | 封装固定组装顺序/配方 | 标准套餐的固定搭配 |

Director 不是必需的。步骤简单、调用方愿意自己链式调用时,一个静态内部类 Builder 就够了;有多个固定套餐配方时,再把配方抽成 Director。

### 从烂代码到模式代码

先看参数爆炸的构造器:

\`\`\`java
class Computer {
    private final String cpu;
    private final int ram;
    private final String disk;
    private final String gpu;
    private final boolean bluetooth;
    private final String color;

    Computer(String cpu, int ram, String disk, String gpu, boolean bluetooth, String color) {
        this.cpu = cpu;
        this.ram = ram;
        this.disk = disk;
        this.gpu = gpu;
        this.bluetooth = bluetooth;
        this.color = color;
    }

    public String toString() {
        return cpu + "/" + ram + "G/" + disk + "/" + gpu + "/蓝牙:" + bluetooth + "/" + color;
    }
}

public class BadBuilderDemo {
    public static void main(String[] args) {
        // 这行每个参数是什么?不看构造器签名根本不知道
        Computer c = new Computer("i7", 32, "1TB", "RTX4060", true, "银灰");
        System.out.println(c);
    }
}
\`\`\`

\`\`\`output
i7/32G/1TB/RTX4060/蓝牙:true/银灰
\`\`\`

这段代码能跑,但三个问题已经埋下:参数含义靠位置记忆、可选参数只能靠重载、构造完成后对象虽然 final 但组装过程不可读。下面用建造者重写:

\`\`\`java
class Computer {
    private final String cpu;
    private final int ram;
    private final String disk;
    private final String gpu;

    private Computer(Builder b) {
        this.cpu = b.cpu;
        this.ram = b.ram;
        this.disk = b.disk;
        this.gpu = b.gpu;
    }

    static class Builder {
        private String cpu = "i5";
        private int ram = 16;
        private String disk = "512GB";
        private String gpu = "集成显卡";

        Builder cpu(String cpu) { this.cpu = cpu; return this; }
        Builder ram(int ram) { this.ram = ram; return this; }
        Builder disk(String disk) { this.disk = disk; return this; }
        Builder gpu(String gpu) { this.gpu = gpu; return this; }

        Computer build() {
            if (ram < 8) {
                throw new IllegalArgumentException("内存至少 8G");
            }
            return new Computer(this);   // 校验通过后一次性构造,对象不可变
        }
    }

    public String toString() {
        return cpu + " / " + ram + "G / " + disk + " / " + gpu;
    }
}

public class BuilderDemo {
    public static void main(String[] args) {
        Computer office = new Computer.Builder().cpu("i5").ram(16).disk("512GB").build();
        Computer dev = new Computer.Builder().cpu("i7").ram(32).disk("1TB").gpu("RTX4060").build();
        System.out.println("办公机: " + office);
        System.out.println("开发机: " + dev);
        try {
            new Computer.Builder().cpu("i7").ram(4).build();
        } catch (IllegalArgumentException e) {
            System.out.println("参数校验: " + e.getMessage());
        }
    }
}
\`\`\`

\`\`\`output
办公机: i5 / 16G / 512GB / 集成显卡
开发机: i7 / 32G / 1TB / RTX4060
参数校验: 内存至少 8G
\`\`\`

对比一眼就能看出来:每个参数前面都有方法名,顺序不再重要;默认值写在 Builder 字段上,可选参数不用重载;校验集中在 build(),不会造出半成品;Computer 的字段全是 final,构造完就不可变。代价是多了一个 Builder 类和四个链式方法,代码量确实上去了。

如果有多种固定套餐,再抽一个 Director 把配方收起来:

\`\`\`java
// 沿用上面的 Computer 与 Computer.Builder
class ComputerDirector {
    static Computer office(Computer.Builder b) {
        return b.cpu("i5").ram(16).disk("512GB").build();
    }

    static Computer dev(Computer.Builder b) {
        return b.cpu("i7").ram(32).disk("1TB").gpu("RTX4060").build();
    }
}
\`\`\`

调用方就变成 \`ComputerDirector.office(new Computer.Builder())\`,套餐配方改动只动 Director。注意 Director 不该持有可变状态,否则多个请求会串配置。

> [!tip] Lombok 的 @Builder 是什么关系
> 它就是把上面这套代码在编译期生成出来:自动加静态 builder()、链式 setter 和 build()。省掉样板,但不会替你做业务校验,也不会阻止漏传关键参数;需要默认值用 @Builder.Default,build 前要校验就自己写。==会手写一遍,才知道 @Builder 生成的代码长什么样。==

### 优缺点与适用场景

| 优点 | 缺点 | 何时用 | 真实应用 |
| --- | --- | --- | --- |
| 参数有名字,调用可读,顺序无关 | 类与代码量增加 | 构造参数超过 4 个且大量可选 | StringBuilder |
| 可集中校验,避免半成品对象 | 链式调用调试栈更长 | 需要不可变对象 | Lombok @Builder |
| 组装过程可复用,配方可收进 Director | 简单对象用它是过度设计 | 组装步骤固定、配置组合多 | OkHttp Request.Builder |
| 与工厂互补:工厂管造什么,建造者管怎么配 | 产品结构变化时要改 Builder | 同一产品有大量配置组合 | Spring BeanDefinitionBuilder |

### 面试追问

> [!interview] 追问:建造者和工厂模式的区别?
> 工厂关注**造哪一种产品**:调用方给参数或选工厂,拿到一个产品,通常一步完成;建造者关注**同一个产品怎么一步步配**:调用方连续调用具名步骤,最后 build,强调组装过程与参数可读性。工厂方法返回的产品可以完全不同,建造者返回的通常是同一个复杂产品的不同配置。实际项目里两者常叠加:工厂决定用哪个 Builder,Director 决定配方。

> [!interview] 追问:有了 Lombok @Builder,还要不要手写建造者?
> 大多数业务 DTO 用 @Builder 足够,省样板。但需要强校验、步骤间有依赖、或者要控制“哪些参数必填”时,手写 build() 更稳;Lombok 默认不校验,漏传字段就是默认值,线上可能变成隐蔽错误。==工具解决重复,校验和契约仍要自己设计。==

## ⭐ 原型模式 Prototype(了解即可)—— 复印一份简历

> [!info] 先讲个场景
> HR 让你照着一份标准简历招人:模板里学校、专业、技能栈都写好了,每份只需要改姓名和电话。你不会每份都从空白 Word 重敲,而是复印一份再改。程序里也一样:一个对象已经查过库、算过积分、填了几十个字段,现在要十个只有姓名不同的副本,重新 new 再赋值既慢又容易漏。

> [!warn] 不用模式会怎样
> 如果对象创建很贵(读配置、查数据库、跑复杂计算),每次 new 都要重付一遍成本;如果字段很多,手工复制容易漏字段,漏一个就是一个数据不一致的 bug。原型模式让“复制”成为创建对象的一种正式方式:以现有对象为模板,克隆出新对象。

### 角色与结构

\`\`\`diagram:u-prototype
\`\`\`

Java 里最简单的方式是实现 Cloneable 并重写 clone()。Cloneable 是一个标记接口,不实现就调 super.clone() 会抛 CloneNotSupportedException。

### 从烂代码到模式代码

初版的做法是每份简历都从空白对象重建:new 完再把学校、专业、技能逐个抄过去,字段一多必漏。复印机版把“复制自己”交给对象本身:

\`\`\`java
import java.util.ArrayList;
import java.util.List;

class Resume implements Cloneable {
    private String name;
    private List<String> skills;

    Resume(String name, List<String> skills) {
        this.name = name;
        this.skills = skills;
    }

    @Override
    public Resume clone() {
        try {
            Resume copy = (Resume) super.clone();          // 第一步:浅拷贝
            copy.skills = new ArrayList<>(this.skills);    // 第二步:引用字段单独深拷贝
            return copy;
        } catch (CloneNotSupportedException e) {
            throw new AssertionError(e);
        }
    }

    void rename(String name) { this.name = name; }
    void addSkill(String skill) { skills.add(skill); }

    public String toString() { return name + " " + skills; }
}

public class PrototypeDemo {
    public static void main(String[] args) {
        Resume template = new Resume("张三", new ArrayList<>(List.of("Java", "MySQL")));
        Resume li = template.clone();
        li.rename("李四");
        li.addSkill("Redis");

        System.out.println("模板: " + template);
        System.out.println("复印: " + li);
    }
}
\`\`\`

\`\`\`output
模板: 张三 [Java, MySQL]
复印: 李四 [Java, MySQL, Redis]
\`\`\`

如果删掉 \`copy.skills = new ArrayList<>(this.skills)\` 这一行,两个 Resume 就会共用同一个 List,输出变成“模板: 张三 [Java, MySQL, Redis]”——你只改了复印件,模板也被污染了。**Object.clone() 是浅拷贝**:基本类型字段复制值,引用类型字段只复制地址。

深拷贝有三条常见路线:手动逐层 new(字段少时最直观)、序列化再反序列化(字段多但要求全部可序列化)、JSON 序列化(方便但有类型和性能损失)。原型模式适合“创建成本高、副本差异小、需要快照/撤销”的场景;如果对象很简单,老老实实 new 一个再赋值更清楚。

### 优缺点与适用场景

| 优点 | 缺点 | 何时用 | 真实应用 |
| --- | --- | --- | --- |
| 复制代替重建,跳过昂贵初始化 | 浅拷贝容易踩坑,深拷贝要额外处理 | 对象创建成本高、副本差异小 | 简历模板、配置快照 |
| 保留对象当前状态,便于做快照/撤销 | 引用字段共享会污染原对象 | 需要历史版本或回滚 | 编辑器撤销、游戏存档 |
| 对调用方隐藏创建细节 | 循环引用时深拷贝复杂 | 批量生成相似对象 | 测试数据构造 |

### 面试追问

> [!interview] 追问:clone() 是深拷贝还是浅拷贝?
> Object.clone() 是**浅拷贝**:新对象的引用字段仍指向原对象的同一个实例。要深拷贝必须自己处理引用字段,常用手动复制、序列化、JSON 转换。答这题的重点不是背定义,而是能说出“两个对象共用一个 List,改一个另一个也变”的具体后果,以及为什么原型模式常和深拷贝一起出现。

## 面试速记

- 单例六种写法按“懒加载 + 线程安全 + 防破坏”三维选:无状态工具用枚举或饿汉,初始化贵要懒加载用静态内部类,DCL 必须记得 volatile。
- 破坏单例三条路:反射、反序列化、克隆;防御分别是构造器判重、readResolve、不实现 Cloneable。枚举由 JVM 兜底,最安全但不能懒加载。
- 工厂三兄弟:简单工厂一个 switch(违反开闭但最简单),工厂方法一个产品一个工厂(加产品加一对类),抽象工厂一个家族一个工厂(加家族容易、加品种难)。
- 建造者解决“长参数列表 + 大量可选参数 + 分步校验”,产出不可变对象;工厂管造什么,建造者管怎么配。
- 原型用克隆代替昂贵创建,Object.clone() 是浅拷贝,引用字段必须手动或序列化深拷贝;对象简单时不要硬套。
`
  };

  /* ─────────────────────────────────────────── */
  window.PATTERNS_EXTRA['p03'] = {
    id: 'p03',
    title: '结构型模式:对象怎么"拼"起来',
    minutes: 70,
    points: ['代理', '装饰器', '适配器', '外观', '桥接/组合/享元'],
    content: `
> [!info] 本章导读 · 先讲个故事
> 你签下一位明星做品牌代言,品牌方不能直接打明星电话:先找经纪人审品牌、谈价格、排档期,明星只负责拍广告。你楼下的奶茶店,原味十二块,加珍珠两块、加椰果三块、加奶盖五块,怎么叠还是那杯奶茶。你出国旅行,国标插头插不进英标插座,加个转接头就能用。家里装了投影、幕布、功放、灯,老婆想看剧,你教了三遍“先开功放再切 HDMI”她还是记不住,最后装了一个“一键观影”。
> 这四件事对应四种结构型模式:**代理控制访问、装饰器叠加功能、适配器转换接口、外观收敛入口。**
> - 读完本章你将能:手写静态代理与 JDK 动态代理,说清 CGLIB 的边界
> - 用奶茶加料讲透装饰器,并和代理划清界限
> - 在“老接口接不上新系统”时想到适配器,在“子系统太多”时想到外观
> - 桥接、组合、享元至少能各说出一个真实场景

> [!tip] 日常现场 · 手机壳、转接头与插线板
> 手机壳不改变手机的功能,只是套在外面,该打电话还是打电话;转接头不改变电脑的插头,只是让国标插头能插进英标插座;插线板把台灯、充电器、电饭煲的开关收到一个总控上,你不用逐个拔插。结构型模式的共同点是:**不改造对象本身,而是改它和外界连接的那一层。**

> [!tip] 日常电脑现场 · 手机壳与转接头
> 手机套个壳就多了防摔功能,没拆机也没改系统;Type-C 转接头让老耳机继续用;屏幕共享是"代理"替你显示。结构型模式就是这些壳、转接头和代理:不动原对象,靠"套一层"改变能力与连接方式。

## 结构型模式:不改对象,改“连接方式”

对象本身写完以后,很多需求并不需要动它的业务逻辑,而是要在外面加一层控制、加一层功能、换一个接口,或者把一堆对象收进一个入口。结构型模式就是这几种“连接方式”的命名。

| 模式 | 一句话 | 解决的问题 | 生活场景 |
| --- | --- | --- | --- |
| 代理 Proxy | 找一个替身控制访问 | 不能或不想直接访问目标 | 明星经纪人 |
| 装饰器 Decorator | 套一层增强功能 | 功能要任意组合 | 奶茶加料 |
| 适配器 Adapter | 加一个转接口 | 新旧接口不兼容 | 电源转接头 |
| 外观 Facade | 提供一个总开关 | 子系统太多、调用顺序复杂 | 家庭影院一键观影 |
| 桥接 Bridge | 拆开两个变化维度 | 继承层数爆炸 | 遥控器 × 电视品牌 |
| 组合 Composite | 树形结构统一对待 | 部分与整体要一样处理 | 文件夹与文件 |
| 享元 Flyweight | 共享不变的部分 | 大量重复对象吃内存 | 围棋黑白棋子 |

> [!best] 先记意图,再记类图
> 代理和装饰器的类图几乎一样,适配器和装饰器都持有目标,外观和代理都可能包一层。==区分它们从来不看结构,只看意图==:控制访问是代理,增强功能是装饰,转换接口是适配,简化入口是外观。面试答出意图,比画对箭头更重要。

## ⭐⭐⭐ 代理模式 Proxy —— 有事找经纪人,别直接找明星

> [!info] 先讲个场景
> 品牌方想请明星代言,直接打明星电话不现实:他要先过经纪人这一关。经纪人对外仍然是“接代言”这个接口,但会先审品牌资质、谈代言费、排档期,确认没问题才让明星本人拍广告,拍完再负责收款开票。品牌方感觉自己是在和明星合作,实际上每一步都经过了经纪人。
> 代理模式就是这样:代理类和目标类实现同一个接口,客户端面向接口调用,代理在转发前后插入控制逻辑。

> [!warn] 不用模式会怎样
> 品牌方直接持有明星对象,审品牌、谈价格、排档期、收款这些事就会散落在每个品牌方的代码里。十个品牌十套流程,规则一改全都要改;更糟的是,任何调用方都能绕过审核直接找明星,权限和档期根本控不住。代理把这些横切逻辑收到一个地方,调用方只认接口,不认具体目标。

### 角色与结构

\`\`\`diagram:u-proxy
\`\`\`

| 角色 | 职责 | 经纪人类比 |
| --- | --- | --- |
| Subject(抽象主题) | 定义目标与代理共同的接口 | “接代言”这件事 |
| RealSubject(真实主题) | 真正的业务实现 | 明星本人 |
| Proxy(代理) | 持有真实主题,在转发前后加控制逻辑 | 经纪人 |
| Client(客户端) | 面向 Subject 编程,不知道也不关心背后是谁 | 品牌方 |

### 从烂代码到模式代码

初版是品牌方直接 new RealStar():审品牌、谈价格、收款全散在每个品牌方的代码里,谁都能绕过流程。先加一个手写的经纪人,把控制逻辑收进去:

#### 第一步:静态代理,手写一个经纪人

\`\`\`java
interface Star {
    void endorse(String brand);
}

class RealStar implements Star {
    public void endorse(String brand) {
        System.out.println("明星本人拍摄 " + brand + " 广告");
    }
}

class Agent implements Star {
    private final Star star;

    Agent(Star star) {
        this.star = star;
    }

    public void endorse(String brand) {
        System.out.println("经纪人:先审品牌资质 -> " + brand);
        star.endorse(brand);
        System.out.println("经纪人:谈代言费与档期");
    }
}

public class StaticProxyDemo {
    public static void main(String[] args) {
        Star star = new Agent(new RealStar());
        star.endorse("奶茶");
    }
}
\`\`\`

\`\`\`output
经纪人:先审品牌资质 -> 奶茶
明星本人拍摄 奶茶 广告
经纪人:谈代言费与档期
\`\`\`

静态代理的优点是直观:代理类就是普通 Java 类,逻辑看得见,调试也方便。缺点是**每个接口都要手写一个代理**:明星有代言接口,歌手有演出接口,演员有片约接口,每个都要写一遍审品牌、排档期;接口加一个方法,所有代理类都要跟着实现。横切逻辑重复,维护成本随接口数量线性上涨。

#### 第二步:JDK 动态代理,运行期生成代理类

\`\`\`java
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

interface Star {
    void endorse(String brand);
    String sign(String brand, int years);
}

class RealStar implements Star {
    public void endorse(String brand) {
        System.out.println("明星本人拍摄 " + brand + " 广告");
    }

    public String sign(String brand, int years) {
        return brand + " 代言 " + years + " 年";
    }
}

class AgentHandler implements InvocationHandler {
    private final Object target;

    AgentHandler(Object target) {
        this.target = target;
    }

    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        System.out.println("经纪人:审品牌 / 排档期 -> " + method.getName());
        Object result = method.invoke(target, args);
        System.out.println("经纪人:收款与开票");
        return result;
    }
}

public class JdkProxyDemo {
    public static void main(String[] args) {
        Star target = new RealStar();
        Star proxy = (Star) Proxy.newProxyInstance(
                target.getClass().getClassLoader(),
                target.getClass().getInterfaces(),
                new AgentHandler(target));

        proxy.endorse("奶茶");
        System.out.println("签约结果: " + proxy.sign("奶茶", 2));
        System.out.println("代理类: " + proxy.getClass().getName());
    }
}
\`\`\`

\`\`\`output
经纪人:审品牌 / 排档期 -> endorse
明星本人拍摄 奶茶 广告
经纪人:收款与开票
经纪人:审品牌 / 排档期 -> sign
经纪人:收款与开票
签约结果: 奶茶 代言 2 年
代理类: $Proxy0
\`\`\`

动态代理把“审品牌、收款”只写一次,放进 InvocationHandler,任何接口都能复用。Proxy.newProxyInstance 在运行期生成一个实现指定接口的代理类,所有方法调用都转发到 invoke,再由 method.invoke 反射调用真实目标。代理类不是明星,但它实现了 Star 接口,所以客户端可以把它当明星用。代理类的名字会随 JDK 版本和包结构变化(这份代码在 JDK 17 默认包下是 $Proxy0),名字不重要,重要的是它实现了 Star。

#### 第三步:CGLIB,没有接口也能代理

JDK 动态代理要求目标必须实现接口,因为生成的代理类已经 extends Proxy,Java 单继承,没法再继承目标类。CGLIB 换了一条路:用字节码技术在运行期生成**目标类的子类**,重写方法并织入逻辑。所以它不需要接口,但 final 类、final 方法、private 方法都代理不了,因为子类无法重写。

| 维度 | 静态代理 | JDK 动态代理 | CGLIB |
| --- | --- | --- | --- |
| 是否要接口 | 要,和目标实现同一接口 | 必须,否则无法生成 | 不要,继承目标类 |
| 代理类何时生成 | 手写,编译期就有 | 运行期反射生成 | 运行期 ASM 生成子类 |
| 方法限制 | 无 | 只能代理接口中声明的方法 | final/private 方法代理不了 |
| 调用开销 | 直接调用,最低 | 反射 invoke,略高 | 子类直接调用,较快 |
| 依赖 | JDK | JDK 自带 | 第三方字节码库 |
| 典型场景 | 简单包装、教学 | Spring AOP 有接口时、MyBatis Mapper | Spring AOP 无接口、强制 proxyTargetClass |

> [!info] Spring AOP 用的是哪一种
> Spring AOP 是运行期代理:目标实现了接口,默认用 JDK 动态代理;没有接口时用 CGLIB。Spring Boot 2.x 起默认 proxyTargetClass=true,也就是优先 CGLIB,避免“同一个 Bean 有时是代理类、有时是原类”的 injection 问题。Spring 6 已经内置类生成器,不再强依赖外部 CGLIB,但“子类代理”的边界没变。

> [!pitfall] @Transactional 自调用为什么会失效
> 事务逻辑织在代理对象的方法上。类内部 this.methodB() 调用的是**原始对象自己的方法**,不经过代理,自然没有事务增强。要让自调用生效,得注入自身代理、拆到另一个 Bean,或用 AopContext.currentProxy()。==记住一句话:代理增强只发生在“从代理对象进来的调用”上。==

### 优缺点与适用场景

| 优点 | 缺点 | 何时用 | 真实应用 |
| --- | --- | --- | --- |
| 控制访问,客户端与目标解耦 | 多一层转发,调用链变长 | 权限、审计、限流、懒加载 | Spring AOP、网关鉴权 |
| 横切逻辑集中,可复用 | 动态代理有反射/字节码开销 | 事务、日志、监控等横切关注点 | @Transactional、@Cacheable |
| 客户端无感知,符合开闭 | 调试要穿透代理,栈更深 | 远程调用、RPC 客户端 | MyBatis Mapper、Feign |

### 面试追问

> [!interview] 追问:JDK 动态代理为什么必须基于接口?
> 生成的代理类已经 extends java.lang.reflect.Proxy,Java 单继承,它无法再继承目标类,只能通过 implements 目标接口来获得方法签名。Proxy 需要根据接口列表生成方法,调用时统一转发到 InvocationHandler.invoke,再用 Method.invoke 调目标。没有接口就不知道该生成哪些方法,所以必须用 CGLIB 这种“继承目标类、重写方法”的方案。

## ⭐⭐⭐ 装饰器模式 Decorator —— 奶茶加料,一层一层叠

> [!info] 先讲个场景
> 奶茶店菜单:原味奶茶 12 元,加珍珠 +2,加椰果 +3,加奶盖 +5。你可以只点原味,也可以珍珠加椰果再加奶盖,组合完全自由,加完之后还是同一杯奶茶,只是价格和口感变了。装饰器模式就是这杯奶茶:所有加料都实现同一个接口,内部持有一个“被装饰的奶茶”,调用时先转发再补上自己的价格和描述。

> [!warn] 不用模式会怎样
> 用继承穷举组合会爆炸:三种小料就有“珍珠”“椰果”“奶盖”“珍珠椰果”“珍珠奶盖”“椰果奶盖”“珍珠椰果奶盖”七个类,十种小料就是 1023 个类。更麻烦的是,每种组合的价格计算都散在自己的类里,新增一种小料要动所有组合。装饰器把“加一种料”变成一个可以随时套上去的类,组合数量从指数级降回线性级。

### 角色与结构

\`\`\`diagram:u-decorator
\`\`\`

| 角色 | 职责 | 奶茶店类比 |
| --- | --- | --- |
| Component | 定义被装饰者和装饰者的共同接口 | “一杯奶茶” |
| ConcreteComponent | 最基础的对象 | 原味奶茶 |
| Decorator | 持有 Component,实现同一接口 | 加料的抽象基类 |
| ConcreteDecorator | 在转发前后加自己的功能 | 珍珠、椰果、奶盖 |

### 从烂代码到模式代码

先看继承版的价格表:

\`\`\`java
abstract class MilkTea {
    abstract int cost();
}

class PlainTea extends MilkTea { int cost() { return 12; } }
class PearlTea extends MilkTea { int cost() { return 14; } }
class PearlCoconutTea extends MilkTea { int cost() { return 17; } }
// 再加奶盖?又要一个类;三种料 7 个类,十种料 1023 个类
\`\`\`

每加一种小料,都要为所有已有组合补一个新子类,类名越来越长,价格逻辑重复。换成装饰器:

\`\`\`java
interface MilkTea {
    int cost();
    String desc();
}

class BaseMilkTea implements MilkTea {
    public int cost() { return 12; }
    public String desc() { return "原味奶茶"; }
}

abstract class Topping implements MilkTea {
    protected final MilkTea inner;

    Topping(MilkTea inner) {
        this.inner = inner;
    }
}

class Pearl extends Topping {
    Pearl(MilkTea inner) { super(inner); }
    public int cost() { return inner.cost() + 2; }
    public String desc() { return inner.desc() + " + 珍珠"; }
}

class Coconut extends Topping {
    Coconut(MilkTea inner) { super(inner); }
    public int cost() { return inner.cost() + 3; }
    public String desc() { return inner.desc() + " + 椰果"; }
}

class CheeseFoam extends Topping {
    CheeseFoam(MilkTea inner) { super(inner); }
    public int cost() { return inner.cost() + 5; }
    public String desc() { return inner.desc() + " + 奶盖"; }
}

public class DecoratorDemo {
    public static void main(String[] args) {
        MilkTea tea = new BaseMilkTea();
        tea = new Pearl(tea);
        tea = new Coconut(tea);
        tea = new CheeseFoam(tea);
        System.out.println(tea.desc() + " = " + tea.cost() + " 元");
    }
}
\`\`\`

\`\`\`output
原味奶茶 + 珍珠 + 椰果 + 奶盖 = 22 元
\`\`\`

新增“布丁”只需要加一个类,任何已有组合都能直接套,原有代码一行不改。调用方可以自由决定套几层、按什么顺序套;价格是逐层累加的,每一层只关心自己那部分。

> [!pitfall] 装饰顺序会影响结果
> 价格是加法时顺序不影响总额,但描述、日志、压缩/加密这类操作顺序会改变结果:先压缩再加密,和先加密再压缩,产物完全不同。装饰器不是“随便套”,调用方要理解每一层的语义。排查问题时也要从最外层往里剥,别把装饰层当成业务类。

### JDK 里的装饰器:IO 流

\`\`\`java
import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.InputStreamReader;

public class IoDecoratorDemo {
    public static void main(String[] args) throws Exception {
        InputStream raw = new ByteArrayInputStream("奶茶".getBytes("UTF-8"));
        InputStream buffered = new BufferedInputStream(raw);              // 加缓冲
        BufferedReader reader =
                new BufferedReader(new InputStreamReader(buffered, "UTF-8")); // 字节转字符 + 按行读

        System.out.println(reader.readLine());
    }
}
\`\`\`

\`\`\`output
奶茶
\`\`\`

四个角色对得很整齐:ByteArrayInputStream 是 ConcreteComponent(数据源),BufferedInputStream 是 ConcreteDecorator(加缓冲),InputStreamReader 是从字节到字符的**适配器**,BufferedReader 再加一层按行读取的装饰。它们都继承 InputStream / Reader 这条抽象线,所以可以一层层套,客户端只认最外层。

### 装饰器与代理:结构像,意图不同

| 维度 | 装饰器 Decorator | 代理 Proxy |
| --- | --- | --- |
| 意图 | 增强功能,给对象加料 | 控制访问,替对象把关 |
| 客户端是否知道 | 知道,主动层层包装 | 通常不知道,只拿到代理 |
| 对象关系 | 可任意嵌套,同接口 | 代理与目标固定,通常一层 |
| 创建时机 | 调用方按需组合 | 框架注入或工厂创建 |
| 典型例子 | IO 流、HttpServletRequestWrapper | Spring AOP、MyBatis Mapper |
| 一句话 | 加料 | 把关 |

### 优缺点与适用场景

| 优点 | 缺点 | 何时用 | 真实应用 |
| --- | --- | --- | --- |
| 组合优于继承,功能任意叠加 | 小类变多,排查要剥洋葱 | 功能可自由组合、不能改原类 | java.io 流体系 |
| 符合开闭,新增装饰不改旧代码 | 装饰顺序有语义,调用方要理解 | 需要动态增强而非编译期绑定 | Servlet RequestWrapper |
| 每层职责单一,便于复用 | 多层包装有少量性能开销 | 横切功能要按需组合 | 压缩/加密/缓冲管道 |

### 面试追问

> [!interview] 追问:装饰器和代理到底怎么选?
> 看客户端要不要“主动加料”。客户端明确知道自己在原有对象上叠加功能、还可能叠加多层,选装饰器,比如读文件时先缓冲再按行读;客户端只想调用同一个接口、不关心背后是谁,增强逻辑由框架统一织入,选代理,比如 @Transactional。==装饰器是“我知道我包了你”,代理是“你不用知道我包了你”。==

## ⭐⭐ 适配器模式 Adapter —— 插头不合,加个转接头

> [!info] 先讲个场景
> 你去英国旅行,带去的国标插头插不进墙上的英标插座。你不需要拆墙、也不需要换电脑,只要买一个转接头:一头插国标,一头插英标,中间把形状转换一下。系统集成里天天发生同样的事:老支付系统只有 payByCent(int cents),新平台要求 PaymentProcessor.process(double yuan),两边都不想改,中间加一个适配器。

> [!warn] 不用模式会怎样
> 直接改老接口,所有老调用方都要跟着改,回归范围不可控;直接改新平台,等于把第三方 SDK 的契约绑进自己的业务。最后往往是复制一份老代码改改,或者在新代码里到处写“元转分”的换算,换算逻辑散落各处,精度和四舍五入各写各的。

### 角色与结构

\`\`\`diagram:u-adapter
\`\`\`

| 角色 | 职责 | 转接头类比 |
| --- | --- | --- |
| Target | 客户端期望的新接口 | 英标插座 |
| Adaptee | 已存在但不兼容的老接口 | 国标插头 |
| Adapter | 实现 Target,内部调用 Adaptee | 转接头 |
| Client | 只依赖 Target | 你的电脑 |

### 从烂代码到模式代码

初版没有适配器:新平台的每个调用点都自己 new 老接口、自己把元换算成分,换算规则一改就要全城搜索。下面看对象适配器(组合),它是工程上的首选:

\`\`\`java
// 老系统:只认“分”
class LegacyPay {
    public void payByCent(int cents) {
        System.out.println("老系统扣款 " + cents + " 分");
    }
}

// 新平台:只认“元”
interface PaymentProcessor {
    void process(double yuan);
}

// 适配器:实现新接口,持有老对象,做单位换算
class LegacyPayAdapter implements PaymentProcessor {
    private final LegacyPay legacy;

    LegacyPayAdapter(LegacyPay legacy) {
        this.legacy = legacy;
    }

    public void process(double yuan) {
        int cents = (int) Math.round(yuan * 100);
        System.out.println("适配器: " + yuan + " 元 -> " + cents + " 分");
        legacy.payByCent(cents);
    }
}

public class AdapterDemo {
    public static void main(String[] args) {
        PaymentProcessor processor = new LegacyPayAdapter(new LegacyPay());
        processor.process(19.9);
    }
}
\`\`\`

\`\`\`output
适配器: 19.9 元 -> 1990 分
老系统扣款 1990 分
\`\`\`

类适配器则用继承:

\`\`\`java
// 沿用上面的 LegacyPay 与 PaymentProcessor
class LegacyPayClassAdapter extends LegacyPay implements PaymentProcessor {
    public void process(double yuan) {
        payByCent((int) Math.round(yuan * 100));
    }
}
\`\`\`

两种写法只差“继承还是组合”,但工程上差别不小:

| 维度 | 类适配器 | 对象适配器 |
| --- | --- | --- |
| 实现方式 | extends Adaptee implements Target | implements Target,持有 Adaptee |
| 耦合程度 | 编译期绑定到具体父类 | 运行期可替换任意子类 |
| 能否适配子类 | 只能适配当前父类 | 可以传入任意子类 |
| Java 限制 | 占用唯一的继承位 | 无额外限制 |
| 推荐度 | 少用 | 首选 |

### 优缺点与适用场景

| 优点 | 缺点 | 何时用 | 真实应用 |
| --- | --- | --- | --- |
| 复用老代码,不用改双方 | 类数量增加,链路多一跳 | 接第三方 SDK、老系统 | InputStreamReader |
| 新旧接口解耦,可独立演进 | 过度适配会让调用链难懂 | 协议/单位/数据结构不一致 | Arrays.asList |
| 符合开闭,新适配器不动旧代码 | 适配层可能藏逻辑,要补测试 | 需要兼容多个版本接口 | JDBC Driver、SLF4J 绑定 |

> [!info] JDK 里的适配器
> InputStreamReader 把字节流转成字符流,是“接口转换”的典型;Arrays.asList 把数组适配成 List 接口;JDBC 的 Driver 把各数据库厂商的协议适配成统一的 Connection。SLF4J 则是“门面 + 绑定”组合:业务只依赖 slf4j-api,运行时用桥接包把 logback、log4j2 接进来。

### 面试追问

> [!interview] 追问:适配器和装饰器怎么区分?
> 适配器改变**接口**:客户端要的是新接口,老对象只有旧接口,适配器负责转换,转换前后功能语义不变,典型是 InputStreamReader、电源转接头。装饰器不改变接口:装饰者和被装饰者实现同一个接口,客户端拿到的还是同一个类型,只是在转发前后叠加功能,典型是奶茶加料、BufferedInputStream。判断看“客户端拿到的类型变没变”:变了是适配器,没变是装饰器。

## ⭐⭐ 外观模式 Facade —— 一个遥控器,一键看电影

> [!info] 先讲个场景
> 家里装了投影仪、幕布、功放、音响和智能灯。看一部电影要:关灯、降幕布、开投影、开功放、切 HDMI,五个设备五个遥控器,顺序错了还没画面。你老婆只想看剧,教了三遍仍然记不住。最后你装了一个“观影模式”按钮,按一下全搞定,按“离场”再全部关掉。
> 外观模式就是这只总控按钮:它不增加新功能,只是把子系统的调用顺序和依赖收进一个简单入口。

> [!warn] 不用模式会怎样
> 每个客户端都要自己协调五个子系统,顺序、参数、异常处理各写一遍。换一台功放,所有客户端都要改;新人接手,得先读五份设备手册。系统越复杂,入口越应该收敛,否则复杂度会从子系统泄漏到每一个调用方。

### 角色与结构

\`\`\`diagram:u-facade
\`\`\`

### 从烂代码到模式代码

初版没有门面:客户端自己按顺序调五个设备,顺序错一步就没画面,换一台功放还要改所有调用点。把这段固定顺序收进一个类:

\`\`\`java
class Projector {
    void on() { System.out.println("投影仪开"); }
    void off() { System.out.println("投影仪关"); }
}

class Screen {
    void down() { System.out.println("幕布降下"); }
    void up() { System.out.println("幕布升起"); }
}

class Amplifier {
    void on() { System.out.println("功放开"); }
    void off() { System.out.println("功放关"); }
    void hdmi() { System.out.println("切换到 HDMI"); }
}

class Light {
    void off() { System.out.println("灯光关"); }
    void on() { System.out.println("灯光开"); }
}

class HomeTheaterFacade {
    private final Projector projector = new Projector();
    private final Screen screen = new Screen();
    private final Amplifier amplifier = new Amplifier();
    private final Light light = new Light();

    void watchMovie() {
        System.out.println("== 一键观影 ==");
        light.off();
        screen.down();
        projector.on();
        amplifier.on();
        amplifier.hdmi();
        System.out.println("开始播放");
    }

    void endMovie() {
        System.out.println("== 一键离场 ==");
        amplifier.off();
        projector.off();
        screen.up();
        light.on();
    }
}

public class FacadeDemo {
    public static void main(String[] args) {
        HomeTheaterFacade facade = new HomeTheaterFacade();
        facade.watchMovie();
        facade.endMovie();
    }
}
\`\`\`

\`\`\`output
== 一键观影 ==
灯光关
幕布降下
投影仪开
功放开
切换到 HDMI
开始播放
== 一键离场 ==
功放关
投影仪关
幕布升起
灯光开
\`\`\`

门面没有禁止你直接操作子系统:想单独开灯,仍然可以 new Light。它只是提供一个“常用组合”的快捷入口,把最复杂的调用顺序封装起来。这是外观和“上帝类”的分界线:门面只做协调,不写业务规则;一旦它开始算钱、查库、做权限,就该拆了。

> [!tip] SLF4J 就是日志门面
> 业务代码只依赖 slf4j-api 的 Logger,不直接依赖 logback 或 log4j2。运行时把具体实现放到类路径,SLF4J 通过绑定找到它。换日志框架,业务代码一行不改。==门面负责“统一入口”,适配器负责“接口转换”,SLF4J 的桥接包两者都沾一点。==

### 优缺点与适用场景

| 优点 | 缺点 | 何时用 | 真实应用 |
| --- | --- | --- | --- |
| 客户端只认识一个入口,复杂度下降 | 门面可能膨胀成上帝类 | 子系统多、调用顺序固定 | 家庭影院总控 |
| 子系统与客户端解耦,便于替换 | 新增子系统仍可能要改门面 | 对外提供统一 API | SLF4J |
| 分层清晰,便于团队分工 | 门面过厚会藏住必要细节 | 老系统包装成新服务 | DispatcherServlet |

### 面试追问

> [!interview] 追问:外观模式和代理模式有什么区别?
> 外观是**一对多**:一个门面协调多个子系统,目的是简化客户端调用,客户端通常知道自己在用门面。代理是**一对一**:代理和被代理对象实现同一接口,目的是控制对某一个对象的访问,客户端往往不知道背后有代理。==外观收敛入口,代理控制访问==;外观通常不实现业务接口,代理必须实现。

## ⭐ 桥接 / 组合 / 享元:面试问到能说出场景即可

这三个模式的出场频率远低于代理和装饰器,但面试官偶尔会用它们区分“背过 23 个名字”和“真的理解结构”。每个记住一句场景、一句结构、一句适用就够了。

### 桥接 Bridge —— 遥控器与电视

场景:遥控器分基础款、高级款,电视分小米、索尼。用继承写,“基础小米遥控器”“高级索尼遥控器”会有 2×2=4 个类;品牌和档位各加一种就是 9 个类,类数量是品牌数乘档位数。桥接把“遥控器”和“电视”拆成两条独立继承线,遥控器持有一个 Device 接口,运行期注入具体品牌。

\`\`\`diagram:u-bridge
\`\`\`

\`\`\`java
interface Device {
    void on();
}

class XiaomiTV implements Device {
    public void on() { System.out.println("小米电视开"); }
}

class SonyTV implements Device {
    public void on() { System.out.println("索尼电视开"); }
}

abstract class RemoteControl {
    protected final Device device;
    RemoteControl(Device device) { this.device = device; }
    abstract void on();
}

class BasicRemote extends RemoteControl {
    BasicRemote(Device device) { super(device); }
    void on() { device.on(); System.out.println("基础遥控:开机"); }
}

class AdvancedRemote extends RemoteControl {
    AdvancedRemote(Device device) { super(device); }
    void on() { device.on(); System.out.println("高级遥控:开机 + 语音"); }
}

public class BridgeDemo {
    public static void main(String[] args) {
        new BasicRemote(new XiaomiTV()).on();
        new AdvancedRemote(new SonyTV()).on();
    }
}
\`\`\`

\`\`\`output
小米电视开
基础遥控:开机
索尼电视开
高级遥控:开机 + 语音
\`\`\`

结构一句话:抽象部分持有实现部分接口,两个维度各自扩展、互不牵连,新增品牌不用动遥控器代码。适用一句话:**两个维度都会独立变化时**,用桥接替代多层继承,比如消息类型 × 发送渠道、图形 × 渲染 API。

### 组合 Composite —— 文件夹与文件

场景:文件夹里可以放文件,也可以放子文件夹;算总大小时,客户端不想区分“这是文件还是文件夹”,希望统一调 size()。如果没有组合,客户端要自己 if 判断节点类型,遇到嵌套还得手写递归,新增一种容器就要改所有遍历代码。组合模式让叶子节点和容器节点实现同一个接口,容器内部持有一个子节点列表,递归调用,客户端对整体和部分一视同仁。

\`\`\`diagram:u-composite
\`\`\`

\`\`\`java
import java.util.ArrayList;
import java.util.List;

interface Node {
    int size();
}

class FileNode implements Node {
    private final int kb;
    FileNode(int kb) { this.kb = kb; }
    public int size() { return kb; }
}

class FolderNode implements Node {
    private final List<Node> children = new ArrayList<>();

    void add(Node node) { children.add(node); }

    public int size() {
        int total = 0;
        for (Node child : children) {
            total += child.size();
        }
        return total;
    }
}

public class CompositeDemo {
    public static void main(String[] args) {
        FolderNode root = new FolderNode();
        FolderNode docs = new FolderNode();
        docs.add(new FileNode(30));
        docs.add(new FileNode(20));
        root.add(docs);
        root.add(new FileNode(50));
        System.out.println("总大小: " + root.size() + "KB");
    }
}
\`\`\`

\`\`\`output
总大小: 100KB
\`\`\`

结构一句话:统一接口 + 容器持有子节点列表 + 递归。适用一句话:**数据天然是树、客户端想统一对待整体与部分**时用,比如菜单树、组织架构、权限树。

### 享元 Flyweight —— 围棋的黑白棋子

场景:围棋棋盘三百多个交叉点,每个棋子都 new 对象还要带颜色、形状、贴图,内存会被大量重复数据吃掉;但颜色只有黑白两种。享元把不变的部分(内部状态)共享,变化的部分(外部状态)由客户端传入。结构一句话:工厂按 key 缓存共享对象。适用一句话:**大量相似对象、内存吃紧、状态能拆成内部/外部两部分**时用,如 Integer 缓存、String 常量池。享元不是缓存所有对象,而是共享可复用的不变状态;对象状态几乎都可变或数量不大时不要用,缓存和拆分反而更复杂。

\`\`\`diagram:u-flyweight
\`\`\`

\`\`\`java
import java.util.HashMap;
import java.util.Map;

class ChessPiece {
    private final String color;   // 内部状态:颜色,共享不变

    ChessPiece(String color) {
        this.color = color;
    }

    void place(int x, int y) {
        System.out.println(color + "棋落在 (" + x + "," + y + ")");
    }
}

class PieceFactory {
    private static final Map<String, ChessPiece> POOL = new HashMap<>();

    static ChessPiece get(String color) {
        return POOL.computeIfAbsent(color, ChessPiece::new);
    }
}

public class FlyweightDemo {
    public static void main(String[] args) {
        ChessPiece black1 = PieceFactory.get("黑");
        ChessPiece black2 = PieceFactory.get("黑");
        System.out.println("黑棋共享同一个对象: " + (black1 == black2));
        black1.place(3, 4);
        PieceFactory.get("白").place(5, 6);
    }
}
\`\`\`

\`\`\`output
黑棋共享同一个对象: true
黑棋落在 (3,4)
白棋落在 (5,6)
\`\`\`

> [!best] 三个“了解即可”的答题模板
> 被问到桥接,答“两个维度独立变化,用组合代替多层继承,比如遥控器 × 电视”;被问到组合,答“树形结构,叶子与容器统一接口,递归处理,比如文件夹”;被问到享元,答“共享内部状态、外部状态外传,比如围棋棋子、Integer 缓存”。==能说出场景和结构,就已经超过大多数只背名字的人。==

## 面试速记

- 结构型模式看意图:代理控制访问、装饰增强功能、适配转换接口、外观简化入口,四张类图再像也别混。
- JDK 动态代理必须接口(代理类已继承 Proxy),CGLIB 靠继承目标类、不需要接口,但 final/private 方法代理不了。
- Spring AOP = 动态代理;@Transactional 自调用失效,是因为 this 调用绕过了代理对象。
- 装饰器 = 同接口 + 持有目标 + 可多层嵌套,IO 流是标准范例;代理 = 同接口 + 控制访问,通常一层且对客户端透明。
- 适配器改接口,装饰器不改接口;外观一对多收敛入口,代理一对一控制访问;桥接拆维度、组合管树、享元共享不变部分。
`
  };

  /* ─────────────────────────────────────────── */
  window.PATTERNS_IQ.push(
    {
      q: '单例有哪六种写法?各自缺陷是什么?反射和序列化怎么破坏,又该怎么防?',
      a: '六种写法:**饿汉**(类加载即建,简单但非懒加载)、**懒汉**(懒加载但并发不安全)、**同步懒汉**(安全但每次读取抢锁)、**双检锁 DCL**(两次判空 + volatile 防重排)、**静态内部类**(借 JVM 类初始化锁,懒加载且无锁)、**枚举**(最安全)。破坏有三条路:反射 setAccessible 调私有构造器、反序列化 readObject 不走构造器、clone 复制。防御:构造器判“实例已存在就抛异常”,加 readResolve 返回 INSTANCE,不实现 Cloneable。枚举被 JVM 禁止反射创建、序列化按 name 还原,天然免疫,代价是不能懒加载。'
    },
    {
      q: '简单工厂、工厂方法、抽象工厂有什么区别?实际项目怎么选?',
      a: '**简单工厂**用一个工厂类的 if/switch 造所有产品,调用方最省事,但加产品要改工厂,适合产品少且稳定。**工厂方法**把 new 下放给每个产品自己的工厂,加产品 = 加产品类 + 工厂类,符合开闭,适合单一产品维度持续扩展。**抽象工厂**一个工厂造一族有绑定关系的产品,适合主题/平台整体切换;加家族容易,加新品种要改所有工厂接口。选型:产品少用简单工厂,单维度扩展用工厂方法,多产品族且必须配套用抽象工厂;不要为了开闭把两个分支拆成六个类。'
    },
    {
      q: '建造者模式和构造器、工厂模式分别有什么区别?什么时候该用建造者?',
      a: '构造器适合参数少且必填的对象;参数一多,长参数列表顺序难记、可选参数靠重载组合爆炸,setter 分步设置又会造出半成品对象。建造者把每个参数变成具名方法,链式调用表达意图,在 build() 里统一校验并一次构造不可变对象,适合参数超过 4 个、大量可选、组装步骤固定的场景。和工厂的区别:工厂关注**造哪一种产品**,通常一步返回;建造者关注**同一个产品怎么一步步配**,强调过程与可读性。代价是多一个 Builder 类和若干方法,Lombok @Builder 可省样板但不做业务校验。'
    },
    {
      q: '静态代理和动态代理有什么区别?JDK 动态代理和 CGLIB 怎么选?',
      a: '**静态代理**在编译期手写代理类,实现同一接口并持有目标,逻辑直观,但每个接口都要写一遍,接口加方法代理也要跟着改。**动态代理**在运行期生成代理类:JDK 靠反射生成实现接口的 $Proxy,统一走 InvocationHandler,横切逻辑写一次可复用到任意接口;CGLIB 用字节码生成目标类的子类,不需要接口。选型:目标有接口、想零依赖用 JDK;无接口或必须代理类用 CGLIB,但 final 类/方法/private 方法代理不了。Spring AOP 两种都支持,Spring Boot 2.x 起默认优先 CGLIB。'
    },
    {
      q: 'JDK 动态代理为什么必须基于接口?没有接口怎么办?',
      a: 'JDK 生成的代理类已经 **extends java.lang.reflect.Proxy**,Java 单继承,它无法再继承目标类,只能通过 implements 目标接口获得方法签名。Proxy 根据接口列表生成方法,调用时统一转发到 InvocationHandler.invoke,再用 Method.invoke 反射调用目标;没有接口就不知道该生成哪些方法,所以必须提供接口。没有接口时用 **CGLIB**:运行期生成目标类的子类并重写方法,不需要接口,但 final 类、final 方法、private 方法无法重写/拦截;Spring 6 已内置类生成器,不再强依赖外部 CGLIB。'
    },
    {
      q: '装饰器模式和代理模式结构几乎一样,区别到底在哪?',
      a: '结构确实一样:同一接口、持有目标、方法前后加逻辑。区别在**意图和透明度**。装饰器是**增强功能**,客户端主动一层层包装,知道包了几层,如 BufferedInputStream 包 FileInputStream,可以任意叠加,组合自由。代理是**控制访问**,客户端通常只拿到代理、不知道目标,代理决定能不能调、何时调,如 Spring AOP 的事务与鉴权,一般只有一层且关系固定。一句话:装饰器管加料,代理管把关;装饰器是“我知道我包了你”,代理是“你不用知道我包了你”。'
    },
    {
      q: '适配器模式和装饰器模式有什么区别?各自典型场景是什么?',
      a: '**适配器解决接口不兼容**:把老接口或第三方 SDK 转成客户端期望的新接口,重点在转换参数、单位与协议,功能语义不变,客户端拿到的类型变了,典型是 InputStreamReader 把字节流转成字符流、电源转接头。**装饰器解决功能扩展**:装饰者与被装饰者实现同一接口,客户端拿到的还是同一个类型,只是在转发前后叠加功能,典型是奶茶加珍珠再加奶盖、BufferedInputStream 加缓冲。判断标准:客户端要的还是原来那件事、只是接口对不上 → 适配器;同一件事但功能更多、可自由组合 → 装饰器。'
    },
    {
      q: '享元模式适合什么场景?内部状态和外部状态怎么划分?',
      a: '享元用于**大量相似对象把内存吃爆、且状态能拆分**的场景。**内部状态**不变、可共享,放在享元对象里,如棋子的颜色、字符的字形; **外部状态**随场景变化,由客户端每次传入,不存进对象,如棋子的坐标、字符的位置。配一个工厂缓存池按 key 复用对象,典型是围棋黑白棋子、文本编辑器的字符样式、Integer.valueOf 的 -128~127 缓存、String 常量池。不适合对象状态几乎都可变或对象数量不大的场景,否则缓存查找和状态拆分反而增加复杂度。'
    }
  );
})();
