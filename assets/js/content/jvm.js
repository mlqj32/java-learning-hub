/* ═══════════════════════════════════════════════════════════
   模块:JVM 虚拟机底层(8 章)
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.CONTENT = window.CONTENT || {};

  window.CONTENT.jvm = {
    id: 'jvm',
    title: 'JVM 虚拟机底层',
    en: 'JVM INTERNALS',
    icon: 'chip',
    color: '#a78bfa',
    tagline: '内存、GC 与类加载的底层修炼场',
    description: '从为什么要 JVM 讲起:先看字节码如何跑起来,再到类加载与双亲委派、运行时数据区、GC 算法与 G1/ZGC 收集器,以及 jstat/arthas 调优与线上 OOM 排查 SOP —— 把简历上"熟悉 JVM 原理"五个字,变成能扛住三轮深挖的实战底气。',
    minutes: '≈ 14 小时',
    chapters: [
      /* ─────────────────────────────────────────── */
      {
        id: 'ch00',
        title: '为什么需要 JVM:一次编写,到处运行',
        minutes: 30,
        points: ['字节码', 'JDK/JRE/JVM', 'javac 与 javap', '跨平台'],
        content: `
> [!info] 本章导读 · 先讲个故事
> 你写了一段 C 程序,在 Windows 上编译出 hello.exe,发到 Linux 服务器上却提示"无法执行"。让对方装编译器重新编译?版本、库、路径全是坑。
> Java 换了个思路:源代码不直接编译成机器码,而是先编译成一种中间语言,再交给每台机器上的 JVM 翻译成本地指令。同一份 hello.class,Windows、Linux、macOS 都能跑。
> - 读完本章你将能:画出 java 源码到 class 字节码再到运行的完整链路
> - 一句话说清 JDK、JRE、JVM 的包含关系,不再答反
> - 亲手用 javac 编译、java 运行、javap 反汇编一个 HelloWorld
> - 说出 JVM 替你承担的至少四件脏活

> [!tip] 日常电脑现场 · 换个设备也能打开
> 同一份 PPT,在同事的 Windows 笔记本和你的 Mac 上都能打开,因为两边都装了能读这个格式的软件 —— 排版只做一次,谁来读由各自的阅读器负责。Java 的 class 文件就是这个格式,装在每台机器上的 JVM 就是那个阅读器。

## 从源码到运行:Java 程序的一生

先看一条完整链路。左边是你要做的,右边是 JVM 接手后做的:

\`\`\`text
Hello.java  --javac-->  Hello.class  --类加载-->  JVM 内部
  源码                    字节码                     |
                                                    v
                                           执行引擎解释或 JIT 编译
                                                    |
                                                    v
                                              机器指令执行
\`\`\`

拆开看每一步:

1. **写源码**:你写的是 Hello.java,人类可读。
2. **编译**:javac 做的是语法检查加翻译,产物 Hello.class 里不是 CPU 指令,而是一套**字节码(Bytecode)**。
3. **类加载**:运行 java Hello 时,JVM 的类加载子系统把 class 读进内存,校验格式、准备静态变量、解析符号引用。
4. **执行**:执行引擎逐条解释字节码;热点代码由 JIT 编译器编译成本地机器码再跑。

关键认知:**字节码不是机器码,而是 JVM 的母语**。CPU 看不懂它,只有 JVM 看得懂。所以只要某个平台装了 JVM,同一份 class 文件就能在那里运行,这就是"一次编写,到处运行"的全部秘密。

> [!info] 中间层不是白来的
> 多一层翻译,意味着比 C 直接编译成机器码多了一点启动与执行开销。JVM 用 JIT 把热点代码编译成本地指令,把这点开销补了回来;换来的是跨平台、内存安全与动态优化。这是典型的工程权衡。

## JVM、JRE、JDK:三个容易搞混的盒子

这三个缩写几乎每场面试都会出现,先把包含关系钉死:

\`\`\`text
┌──────────────────── JDK ────────────────────┐
│  开发工具:javac、javap、jps、jstack           │
│  ┌────────────── JRE ──────────────┐         │
│  │  类库:java.lang、java.util       │         │
│  │  ┌────────── JVM ──────────┐     │         │
│  │  │  类加载 + 运行时 + 执行引擎 │     │         │
│  │  └─────────────────────────┘     │         │
│  └──────────────────────────────────┘         │
└──────────────────────────────────────────────┘
\`\`\`

| 名称 | 全称 | 里面有什么 | 谁会装 |
| --- | --- | --- | --- |
| JVM | Java Virtual Machine | 类加载器、运行时数据区、执行引擎 | 跟着 JRE 或 JDK 一起来 |
| JRE | Java Runtime Environment | JVM 加核心类库 | 只运行 Java 程序的人 |
| JDK | Java Development Kit | JRE 加 javac、javap 等开发工具 | 开发者 |

一句话记忆:**JDK 包含 JRE,JRE 包含 JVM**。只跑不写,装 JRE 就够;要写代码,必须装 JDK。反过来说,你机器上能执行 javac,就一定装了完整的 JDK。

> [!tip] 版本别装混
> 本模块统一以 JDK 17 为语境。用 java -version 确认版本;如果同时装了多个 JDK,注意 JAVA_HOME 与 PATH 指向同一个,否则会出现 javac 是 17、java 是 8 的诡异组合。

## 动手三连:javac / java / javap

理论说再多,不如亲手跑一遍。新建 Hello.java:

\`\`\`java
public class Hello {
    public static void main(String[] args) {
        int a = 1;
        int b = 2;
        System.out.println("sum = " + (a + b));
    }
}
\`\`\`

第一步,编译并确认产物:

\`\`\`shell
javac Hello.java
ls
\`\`\`

\`\`\`output
Hello.java  Hello.class
\`\`\`

第二步,运行(注意是类名,不带 .class):

\`\`\`shell
java Hello
\`\`\`

\`\`\`output
sum = 3
\`\`\`

第三步,反汇编看字节码:

\`\`\`shell
javap -c Hello
\`\`\`

\`\`\`output
Compiled from "Hello.java"
public class Hello {
  public static void main(java.lang.String[]);
    Code:
       0: iconst_1
       1: istore_1
       2: iconst_2
       3: istore_2
       4: getstatic     #7   // Field java/lang/System.out:Ljava/io/PrintStream;
       7: iload_1
       8: iload_2
       9: iadd
      10: invokedynamic #13,  0 // InvokeDynamic #0:makeConcatWithConstants:(I)Ljava/lang/String;
      15: invokevirtual #17  // Method java/io/PrintStream.println:(Ljava/lang/String;)V
      18: return
}
\`\`\`

看不懂没关系,先感受两件事:

- 第一列 0、1、2 是指令偏移,不是行号。
- iconst_1 与 istore_1 是压栈和存局部变量,对应源码的 a = 1。

你会发现字节码里没有任何 x86 或 ARM 指令。它只描述"把什么压栈、调用谁",具体怎么变成机器指令,交给 JVM 决定。后续章节会把常量池、指令集、栈帧结构逐一拆开。

> [!warn] java Hello.class 是错的
> 运行时写 java Hello,不要带扩展名;而 javac 编译时必须带 .java。另外 public 类名要与文件名一致,否则编译直接报错。这是新手第一天最常见的两个错误。

## JVM 替你做了哪些脏活

写 C 的人对下面这些事不陌生:malloc 之后忘了 free,程序跑几小时内存涨到几个 G;数组越界写到别人的内存,进程莫名其妙崩溃;换个编译器或库版本,链接直接失败。

JVM 把这些活接了过去:

- **自动内存管理**:new 对象不用手动释放,GC 负责找出不再使用的对象并回收,从根上消灭忘记 free 的问题。
- **跨平台**:字节码加各平台 JVM,同一份 class 文件到处跑,不用为每个系统重新编译。
- **安全检查**:类加载时验证字节码不越界、不非法跳转,运行时做数组边界检查与空指针检查。
- **异常处理**:统一的异常表与栈展开机制,异常不会被静默吞掉。
- **动态优化**:JIT 根据实际运行情况做方法内联、逃逸分析,热代码越跑越快。

> [!info] 代价与收益
> 自动 GC 不是免费的:它要占内存、会带来停顿,调优不好会出现长暂停甚至 OOM。但相比手动管理内存带来的崩溃与泄漏,绝大多数业务系统愿意做这个交换。后续章节讲的 GC 与调优,本质就是在内存占用、吞吐、停顿之间找平衡。

## 这个模块怎么学

别一上来背参数。按下面的顺序走,每一层都建立在前一层之上:

| 阶段 | 学什么 | 一句话目标 |
| --- | --- | --- |
| 1 | 类加载机制 | 说清一个 class 文件怎么进入 JVM |
| 2 | 运行时数据区 | 画出堆、栈、方法区的分工 |
| 3 | 对象与引用 | 知道 new 出来的对象长什么样 |
| 4 | GC 算法 | 理解对象怎么被判死、怎么被回收 |
| 5 | 垃圾收集器 | 对比 CMS、G1、ZGC 的取舍 |
| 6 | 调优工具 | 用 jstat、jmap、arthas 看现场 |
| 7 | OOM 排查 | 拿到 dump 能定位到代码行 |

> [!tip] 本章与后续内容的关系
> 本章只回答"为什么要有 JVM、程序怎么跑起来",故意不展开内存区域细节。后面的章节会从类加载开始,一层层拆开 JVM 的内部结构;现在先把地图记住,不要急着背参数。

## 本章小结

- Java 源码经 javac 编译成字节码,由 JVM 加载并执行,而不是直接编译成机器码。
- 字节码是 JVM 的母语,跨平台能力来自"字节码加各平台 JVM"这一中间层。
- JDK 包含 JRE,JRE 包含 JVM;开发装 JDK,只运行装 JRE。
- javac 编译、java 运行、javap 反汇编,是观察字节码最直接的三件工具。
- JVM 承担内存管理、GC、安全检查、异常处理、动态优化等脏活,代价是内存与停顿。

## 面试速记

- 一次编写到处运行等于字节码加 JVM 屏蔽平台差异,不是 Java 语言本身跨平台。
- 字节码是 JVM 的指令集,与 CPU 机器码不同;执行引擎负责解释或 JIT 编译。
- JDK 包含 JRE,JRE 包含 JVM,一句话背熟,别把 JRE 说成包含 JDK。
- javac 生成 class 文件,java 按类名运行,javap -c 看反汇编。
- JVM 的五大脏活:内存管理、跨平台、安全检查、异常处理、JIT 优化。
`
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch01',
        title: 'JVM 整体架构与类加载机制(类加载器、双亲委派、加载到卸载全流程)',
        minutes: 35,
        points: ['类加载五阶段', '双亲委派', '打破委派', '类卸载', 'JIT'],
        content: `
> [!interview] 面试开场定位
> "JVM 由类加载子系统、运行时数据区、执行引擎三大部分组成;类通过 加载→验证→准备→解析→初始化 五步进入 JVM,加载过程遵循双亲委派,保证核心类安全与全局唯一。"这段是 JVM 面试的定场诗。先点开下面的演示,把类加载五步跟着走一遍。

> [!info] 本章导读 · 一个 class 文件,是怎么住进 JVM 的?
> 你双击运行程序时,JVM 并不会立刻认识你的类,它要先找到文件、验明正身、分配内存、执行静态代码。这套流程像新员工入职:查证件、登记、领工位、上岗。本章从整体架构讲到类加载五阶段,是理解 JVM 的第一张地图。
> - 读完本章你将能:画出类加载五个阶段,并说出每个阶段做什么
> - 用双亲委派解释为什么自己写的 java.lang.String 不会被加载
> - 举出至少两个打破双亲委派的真实场景

> [!tip] 日常电脑现场 · 双击图标的瞬间
> 双击一个绿色版软件,图标转一圈,它先在后台解压临时文件、检查运行库、再弹出主窗口,你只看见最后那一下。Java 程序启动也一样:JVM 先按名字找到 class 文件、验证没被篡改、把静态变量摆好,才轮到 main 方法执行。

\`\`\`demo:classload
\`\`\`

## JVM 整体架构

\`\`\`diagram:d-jvmarch
\`\`\`

把 JVM 想成一座全自动工厂:**类加载子系统**是原料入库口,class 文件在这里验货、登记、上架;运行时数据区是一排排**车间**,堆和方法区堆着成品与图纸,栈是每个工人干活的操作台;执行引擎是**机床**,把字节码打磨成机器码;而 GC 是勤快的保洁队,专门清走没人认领的废料。

| 组件 | 职责 | 面试关键词 |
| --- | --- | --- |
| 类加载子系统 | 把 class 文件读进方法区,生成 Class 对象 | 双亲委派、五阶段 |
| 运行时数据区 | 程序运行时的内存模型(第 3 章详讲) | 堆栈分离、线程私有/共享 |
| 执行引擎 | 把字节码变成机器指令 | 解释器 + JIT、逃逸分析 |
| 本地方法接口(JNI) | 连接 native 方法(C/C++) | native 关键字 |

\`\`\`text
.java 文件 → javac → .class 字节码
                        │
                        ▼
          ┌── 类加载子系统(本章)──┐
          │  加载 验证 准备 解析 初始化 │
          └────────────┬───────────┘
                       ▼
        运行时数据区(堆/栈/方法区…) ⇄ 执行引擎(解释器 + JIT)
                       │
                       ▼
                 本地方法接口(JNI)
\`\`\`

## 类加载五阶段:加载 → 验证 → 准备 → 解析 → 初始化

| 阶段 | 干什么 | 关键细节 |
| --- | --- | --- |
| 加载 Loading | 按全限定名读字节流,方法区生成类数据 + 堆生成 Class 对象 | 来源可以是 jar/网络/动态代理生成 |
| 验证 Verification | 校验字节码格式、语义、符号引用合法性 | 防御恶意构造的 class 文件 |
| 准备 Preparation | 为静态变量分配内存并赋**默认值**(0/null/false) | 编译期常量(final + 常量)在此直接赋真值 |
| 解析 Resolution | 常量池符号引用 → 直接引用 | 可以延迟到初始化之后(运行期绑定) |
| 初始化 Initialization | 执行 <clinit>:静态变量真值 + static 块 | JVM 保证 <clinit> 线程安全且只执行一次 |

> [!tip] <clinit> 的线程安全是现成的单例
> JVM 保证一个类的 <clinit> 只被执行一次且自带同步锁 —— 这正是**静态内部类单例**(patterns 模块)线程安全的理论根基。面试讲到这里顺嘴带一句,跨模块串联的印象分很高。

### 经典考题:初始化顺序陷阱

\`\`\`java
public class ClinitOrder {
    static ClinitOrder instance = new ClinitOrder();  // ① 先执行:构造器里 count 从默认值 0 自增为 1
    static int count = 2;                             // ② 后执行:直接把 count 覆盖为 2

    ClinitOrder() { count++; }

    public static void main(String[] args) {
        System.out.println("count = " + ClinitOrder.count);
    }
}
\`\`\`

\`\`\`output
count = 2
\`\`\`

若把 ① ② 两行交换:先 count=2,构造器再自增 → 输出 count = 3。==准备阶段所有静态变量都是默认值,初始化严格按代码书写顺序执行== —— 这两句话能解释一切初始化顺序题。

## 什么时候才会初始化:主动引用 vs 被动引用

六种主动引用(触发初始化):new、读写静态字段(非编译期常量)、调用静态方法、反射(Class.forName)、初始化子类时先初始化父类、main 所在类。

三种被动引用(**不**触发初始化):

\`\`\`java
class Parent {
    static int A = 1;
    static { System.out.println("Parent 初始化"); }
}
class Child extends Parent {
    static int B = 2;
    static { System.out.println("Child 初始化"); }
}

public class PassiveRef {
    public static void main(String[] args) {
        System.out.println(Child.A);   // 通过子类引用父类的静态字段
    }
}
\`\`\`

\`\`\`output
Parent 初始化     # 只有父类被初始化,Child 的静态块根本没执行!
1
\`\`\`

另外两种被动引用:Child[] arr = new Child[10](只初始化数组容器类 [LChild;);引用 final 编译期常量(常量在编译期已进调用方常量池)。

## 类加载器与双亲委派

\`\`\`diagram:d-parent-delegate
\`\`\`

双亲委派像极了**公司报销制度**:你先把单子交给组长,组长拿不准再递给总监,总监也批不了,才轮到你回工位自己想办法。这样层层上报的好处是,谁也别想绕过制度私开一个简称"java.lang.String"的假车间——核心类永远只有官方那一家。

三级加载器(自下而上委托):

\`\`\`text
自定义 ClassLoader
     │ parent
ApplicationClassLoader   ← 加载 classpath,我们写的代码
     │ parent
PlatformClassLoader      ← JDK9+(JDK8 叫 ExtensionClassLoader)
     │ parent
BootstrapClassLoader     ← C++ 实现,加载 java.* 核心类,Java 里表示为 null
\`\`\`

**双亲委派**:收到加载请求先交给父加载器,父加载器搞不定(抛 ClassNotFoundException)才自己 findClass。

\`\`\`java
// java.lang.ClassLoader#loadClass 源码骨架(面试可背伪代码)
protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
    synchronized (getClassLoadingLock(name)) {
        Class<?> c = findLoadedClass(name);            // 1. 缓存:已加载直接返回
        if (c == null) {
            try {
                if (parent != null) {
                    c = parent.loadClass(name, false); // 2. 先委托父加载器
                } else {
                    c = findBootstrapClassOrNull(name);
                }
            } catch (ClassNotFoundException e) {
                // 父加载器找不到,吞掉,后面自己来
            }
            if (c == null) {
                c = findClass(name);                   // 3. 父加载器不行,自己加载
            }
        }
        return c;
    }
}
\`\`\`

验证加载器层级:

\`\`\`java
public class ClHierarchy {
    public static void main(String[] args) {
        ClassLoader cl = ClHierarchy.class.getClassLoader();
        while (cl != null) {
            System.out.println(cl);
            cl = cl.getParent();
        }
        System.out.println("再往上就是 Bootstrap(C++ 实现,Java 中表示为 null)");
    }
}
\`\`\`

\`\`\`output
jdk.internal.loader.ClassLoaders$AppClassLoader@5e2de80c
jdk.internal.loader.ClassLoaders$PlatformClassLoader@1d44bcfa
再往上就是 Bootstrap(C++ 实现,Java 中表示为 null)
\`\`\`

> [!interview] 高频追问:双亲委派的好处?怎么打破?
> 好处:① **安全** —— 自己写个 java.lang.String 永远轮不到自己加载,核心类不可被篡改;② **唯一** —— 同一个类只加载一次,避免重复加载导致类型混乱。打破方式:**重写 loadClass 改变委派逻辑**(findClass 只是常规加载入口,loadClass 才决定策略)。经典案例:SPI 的线程上下文类加载器(父加载器反过来借用子加载器)、Tomcat 的 WebappClassLoader(优先自己加载应用类)、热部署框架。

\`\`\`java
public class WhoLoads {
    public static void main(String[] args) {
        System.out.println(String.class.getClassLoader());    // 核心类
        System.out.println(WhoLoads.class.getClassLoader());  // 自己写的类
    }
}
\`\`\`

\`\`\`output
null                                                  # Bootstrap 加载的类,Java 里取不到加载器
jdk.internal.loader.ClassLoaders$AppClassLoader@5e2de80c
\`\`\`

## 打破双亲委派实战:可重载的类加载器

\`\`\`java
import java.nio.file.*;

public class ReloadClassLoader extends ClassLoader {
    private final Path classDir;

    public ReloadClassLoader(Path classDir, ClassLoader parent) {
        super(parent);
        this.classDir = classDir;
    }

    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        Path file = classDir.resolve(name.replace(".", "/") + ".class");
        if (!Files.exists(file)) throw new ClassNotFoundException(name);
        try {
            byte[] bytes = Files.readAllBytes(file);
            return defineClass(name, bytes, 0, bytes.length);   // 从字节码定义类
        } catch (java.io.IOException e) {
            throw new ClassNotFoundException(name, e);
        }
    }

    public static void main(String[] args) throws Exception {
        Path dir = Paths.get("out");
        for (int round = 1; round <= 2; round++) {
            // 每轮换一个新加载器实例 → 同名类被当作两个不同的类
            ReloadClassLoader loader = new ReloadClassLoader(dir,
                    ReloadClassLoader.class.getClassLoader());
            Class<?> clazz = loader.loadClass("com.demo.Task");
            clazz.getMethod("run").invoke(clazz.getDeclaredConstructor().newInstance());
        }
    }
}
\`\`\`

\`\`\`output
Task v1 正在执行,加载器: ReloadClassLoader@18b4aac2
Task v2(改过代码的版本)正在执行,加载器: ReloadClassLoader@3941a79c
\`\`\`

这就是热部署/热更新的原理:**类的唯一性 = 类加载器实例 + 全限定名**,换加载器就能换实现。

## 类的卸载:三条件缺一不可

| 条件 | 说明 |
| --- | --- |
| 该类的全部实例已被回收 | 堆里没有任何存活对象属于它 |
| 加载它的 ClassLoader 已被回收 | 只有自定义加载器可能,Bootstrap 永远活着 |
| 对应的 Class 对象没有任何引用 | 没有任何地方持有 java.lang.Class 引用 |

> [!warn] 生产上类元数据照样会泄漏
> 动态代理、Groovy 脚本、反射生成的类如果每次都换新加载器,而加载器本身又被 static 长期持有,三个卸载条件永远凑不齐,元空间只涨不跌 —— 这是第 8 章元空间 OOM 的常见根源。

## 执行引擎:解释器 + JIT

| 组件 | 工作方式 | 特点 |
| --- | --- | --- |
| 解释器 | 逐条解释执行字节码 | 启动快,跑得慢 |
| JIT 编译器 C1 | 热点代码快速编译为机器码 | 编译快、优化少 |
| JIT 编译器 C2 | 深度优化编译 | 编译慢、峰值高 |
| 分层编译(默认) | 先 C1 预热,彻底热点转 C2 | 快启动 + 高峰值兼得 |

热点探测:方法调用计数器默认 **1 万次**触发编译(-XX:CompileThreshold)。JIT 的招牌优化:方法内联、锁消除、逃逸分析。

### 逃逸分析与栈上分配

对象 p 未逃逸出方法(没被 return、没赋给成员变量、没被别的线程拿到),JIT 可以做**标量替换**:干脆不 new,把字段拆成局部变量放在栈上 —— 没有堆分配,也就没有 GC 压力。

\`\`\`java
public class EscapeAnalysis {
    static class Point {
        int x, y;
        Point(int x, int y) { this.x = x; this.y = y; }
    }

    static long sum() {
        long s = 0;
        for (int i = 0; i < 100_000_000; i++) {
            Point p = new Point(i, i);   // p 未逃逸:可被标量替换,不真上堆
            s += p.x + p.y;
        }
        return s;
    }

    public static void main(String[] args) {
        long t = System.currentTimeMillis();
        sum();
        System.out.println("耗时: " + (System.currentTimeMillis() - t) + "ms");
    }
}
\`\`\`

\`\`\`output
java EscapeAnalysis                          # 默认开启逃逸分析
耗时: 38ms

java -XX:-DoEscapeAnalysis EscapeAnalysis    # 关闭:1 亿次真堆分配 + 频繁 GC
耗时: 692ms
\`\`\`

## 打破双亲委派的三个现场

前文的 ReloadClassLoader 解决了"怎么换加载器",这一节回答"生产上为什么非要打破委派"。三个现场,面试讲故事就讲它们。

### 现场一:SPI/JDBC —— 父加载器反过来借用子加载器

矛盾:DriverManager 在 java.sql 模块(Platform 加载器加载),厂商驱动(如 mysql-connector-j)在应用 classpath(App 加载器加载)。双亲委派只许向上委托 —— Platform 永远摸不到 App 的类,可 DriverManager 偏偏要实例化驱动。解法:**线程上下文类加载器(Thread Context ClassLoader,TCCL)**:每根线程默认携带 App 加载器的引用,核心库干活时反手借用。

\`\`\`text
META-INF/services/java.sql.Driver      # 驱动 jar 内的 SPI 注册文件,内容一行:实现类全限定名
com.mysql.cj.jdbc.Driver

加载链路:DriverManager 静态初始化 → ServiceLoader.load(Driver.class)
        → 默认取 Thread.currentThread().getContextClassLoader()(= App 加载器)
        → 扫描 classpath 全部 jar 的 META-INF/services → 反射实例化驱动
\`\`\`

\`\`\`java
import java.sql.DriverManager;
import java.util.Enumeration;

public class JdbcSpiScene {
    public static void main(String[] args) {
        // DriverManager 是核心库,由 Platform 加载器加载
        System.out.println("DriverManager 的加载器: " + DriverManager.class.getClassLoader());
        // 但它加载驱动用的是线程上下文类加载器(默认 = App)
        System.out.println("线程上下文类加载器: " + Thread.currentThread().getContextClassLoader());
        // 运行时 classpath 需带 mysql-connector-j-8.x.jar
        Enumeration<java.sql.Driver> drivers = DriverManager.getDrivers();
        while (drivers.hasMoreElements()) {
            java.sql.Driver d = drivers.nextElement();
            System.out.println("驱动 " + d.getClass().getName()
                    + " 的加载器: " + d.getClass().getClassLoader());
        }
    }
}
\`\`\`

\`\`\`output
DriverManager 的加载器: jdk.internal.loader.ClassLoaders$PlatformClassLoader@1d44bcfa
线程上下文类加载器: jdk.internal.loader.ClassLoaders$AppClassLoader@5e2de80c
驱动 com.mysql.cj.jdbc.Driver 的加载器: jdk.internal.loader.ClassLoaders$AppClassLoader@5e2de80c
# Platform 级核心类借 TCCL 加载了 App classpath 里的厂商驱动 → "父借用子"
\`\`\`

一句话:**双亲委派是"子委托父",TCCL 让"父借用子"** —— 打破单向性,保住"核心类由核心加载器加载"的安全底线。

### 现场二:Tomcat WebAppClassLoader —— 隔离与共享并存

\`\`\`text
Bootstrap → Platform → CommonClassLoader(Tomcat 自身 + 各应用共享的公共库)
                              │ parent
              ┌───────────────┼───────────────┐
      WebAppClassLoader(A)   WebAppClassLoader(B)   …… 每个 webapp 一个
      加载 /WEB-INF/classes  加载 /WEB-INF/classes
      加载 /WEB-INF/lib      加载 /WEB-INF/lib
\`\`\`

为什么必须打破:两个 webapp 分别依赖 spring 5 与 spring 6,全限定名相同 —— 标准委派下谁先加载谁说了算,第二个应用直接版本错乱。解法:每个 webapp 一个 WebappClassLoader,**优先自己加载 /WEB-INF 下的类**(默认 delegate=false)实现隔离;容器类与公共库由 Common 统一加载一份实现共享。JDK 核心类与 Servlet API 等白名单仍强制委派,防止应用篡改容器核心类。

\`\`\`java
// WebappClassLoader.loadClass 简化骨架(默认 delegate = false,省略异常处理)
protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
    synchronized (getClassLoadingLock(name)) {
        Class<?> c = findLoadedClass(name);              // 0. 已加载的直接返回
        if (c == null) {
            if (isInDelegateWhitelist(name)) {           // 1. 白名单(JDK 核心/Servlet API)
                c = super.loadClass(name, false);        //    必须走标准委派,防篡改
            }
            if (c == null) {
                c = findClassInWebapp(name);             // 2. 先找 /WEB-INF → 应用隔离
            }
            if (c == null) {
                c = super.loadClass(name, false);        // 3. 本地没有再委托 → 公共共享
            }
        }
        if (resolve) resolveClass(c);
        return c;
    }
}
\`\`\`

> [!interview] 高频追问:打破了委派,不怕同名类被重复加载?
> 怕,所以只打破"先委托"的顺序、保留委派兜底:应用本地没有的类照样交给 Common/系统加载器,一个类仍只被一个加载器加载一次。**隔离**隔的是不同 webapp 之间(同名类各自一份,版本互不干扰);**共享**享的是容器级公共类(只加载一份省内存)。层级分工让两者同时成立。

### 现场三:OSGi 网状与 JDK9 JPMS(一句话版)

- **OSGi**:每个 Bundle 自带 ClassLoader,按 Import-Package / Export-Package 在**网状**结构中互相协商加载,彻底抛弃树形委派 —— 能力最强、复杂度也最高,如今多被 JPMS 与更轻量的类隔离方案取代。
- **JDK 9 JPMS**:module-info 的 requires/exports 把"可访问性"校验前移到编译期与运行期;App/Platform/Bootstrap 三层加载器层级不变,但类归属按模块划分,模块间默认不可见 —— 封装从包级升级到模块级。

热部署一句话:前文 ReloadClassLoader 每轮换新加载器实例就能重载 Task 类 —— Spring Boot DevTools 的 restart 类加载器、Tomcat 热部署,走的全是"**新代码 + 新加载器 = 新类**"这一条路。

## 面试速记

- 五阶段口诀:**加验准解初**;准备赋默认值、初始化才赋真值,final 编译期常量除外。
- 双亲委派 = 向上委托 + 向下加载;目的是**安全 + 类唯一**;打破 = 重写 loadClass(Tomcat/SPI/热部署)。
- 类的唯一性 = **类加载器实例 + 全限定名**,这是热更新换加载器的原理。
- 主动引用触发初始化(new/静态读写/反射/子类初始化),被动引用(子类引父静态、数组、常量)不触发。
- JIT 分层编译:解释器保启动、C1 快速预热、C2 峰值性能;逃逸分析 + 标量替换消灭未逃逸对象的堆分配。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch02',
        title: '运行时数据区(程序计数器、虚拟机栈、本地方法栈、堆、方法区/元空间)',
        minutes: 30,
        points: ['五大区域', '栈帧结构', '分代堆', '元空间', '直接内存'],
        content: `
> [!interview] 章节定位
> "说一下 JVM 的内存结构,哪些线程私有、哪些共享?"几乎是 JVM 环节的第一题。答法:**线程私有三兄弟(程序计数器、虚拟机栈、本地方法栈)+ 线程共享两巨头(堆、方法区/元空间),再加一块不属于运行时区域但常被追问的直接内存**。先点演示,看对象在各区域间怎么流动。

> [!info] 本章导读 · 你的对象到底住在哪?栈还是堆?
> 程序一跑起来,JVM 就把内存切成几个功能区:有的线程独占,有的全局共享,还有一块不在 JVM 管理范围内却经常惹祸。搞不清这张地图,后面学 GC 和 OOM 都会迷路。本章带你逐个区域走一遍。
> - 读完本章你将能:默画出五大运行时区域,并标出线程私有与共享
> - 说清栈帧里存了什么,以及递归太深为什么会栈溢出
> - 解释堆、方法区、直接内存各自负责什么,以及常见溢出类型

> [!tip] 日常电脑现场 · 任务管理器看内存
> 打开任务管理器,某个浏览器占了几百 MB,关掉几个标签页数字又降下来 —— 降下去的就是堆里没人再用的对象。手机后台 App 被系统清掉,再点开时从开屏重新加载,相当于它那套私有内存被整块收走了。

\`\`\`demo:jvm-memory
\`\`\`

## 五大区域总览

| 区域 | 线程私有/共享 | 存什么 | 会抛什么 |
| --- | --- | --- | --- |
| 程序计数器 | 私有 | 当前执行的字节码指令地址 | 唯一不会 OOM 的区域 |
| 虚拟机栈 | 私有 | 栈帧(局部变量表、操作数栈…) | StackOverflowError / OOM |
| 本地方法栈 | 私有 | native 方法调用 | StackOverflowError / OOM |
| 堆 | 共享 | 对象实例与数组 | OOM: Java heap space |
| 方法区(元空间) | 共享 | 类元信息、运行时常量池 | OOM: Metaspace |

> [!tip] 为什么需要程序计数器
> 多线程靠 CPU 时间片轮转切换,线程被挂起后必须能**恢复到正确的执行位置**,所以每根线程都要一个独立的计数器;执行 native 方法时其值为 undefined(直接走本地栈)。

## 虚拟机栈:方法执行的内存模型

每个方法调用对应一个栈帧入栈,方法结束出栈。栈帧四部分:

| 组成 | 作用 |
| --- | --- |
| 局部变量表 | 方法参数与局部变量,基本类型直接存值,对象存引用 |
| 操作数栈 | 字节码指令的工作台,运算中间结果压栈弹栈 |
| 动态链接 | 指向运行时常量池中该方法的符号引用,支持运行期绑定 |
| 方法返回地址 | 正常返回/异常返回后回到调用者的位置 |

\`\`\`java
public class StackOverflowDemo {
    static int depth = 0;

    static void recurse() {
        depth++;
        recurse();        // 无限递归
    }

    public static void main(String[] args) {
        try {
            recurse();
        } catch (StackOverflowError e) {
            System.out.println("栈深度约: " + depth);
        }
    }
}
\`\`\`

\`\`\`output
栈深度约: 11402     # 默认 -Xss1m,数值随机器与方法大小浮动
\`\`\`

> [!warn] 栈的两宗罪
> ① -Xss 太小 → 深递归报 ==StackOverflowError==;② 线程开太多(每根线程都要一块栈内存)→ ==unable to create new native thread== 的 OOM。线上大 JSON 反序列化、深递归报 SOE,是最常见的栈事故。

## 堆:分代是对象的生命周期管理

\`\`\`diagram:d-heap-generational
\`\`\`

堆的分代像一条人生流水线:**Eden** 是幼儿园,新对象一出生就扔在这儿,闹腾一阵大多就"毕业"(被回收)了;熬过几轮 Minor GC 的搬去 **Survivor** 读中学,来回换班继续磨;年龄到 15 岁默认"成年",晋升 **Old** 养老院,除非来一次大扫除(Full GC),否则就在那儿养老。

\`\`\`text
堆(-Xmx = 新生代 + 老年代,默认比例 1:2)
├── 新生代(-Xmn,约 1/3)
│    ├── Eden 区      占 8    新对象从这里出生
│    ├── Survivor0    占 1    (from)
│    └── Survivor1    占 1    (to)   幸存者在 S0/S1 来回复制,年龄 +1
└── 老年代(约 2/3)                   年龄 ≥15(默认)晋升,大对象直接进
\`\`\`

Eden 满了触发 **Minor GC**:把 Eden + from 中存活的对象复制到 to,清空 Eden 与 from,from/to 角色互换。

\`\`\`java
public class HeapInfo {
    public static void main(String[] args) {
        Runtime rt = Runtime.getRuntime();
        long mb = 1024 * 1024;
        System.out.println("最大堆: " + rt.maxMemory() / mb + "MB");
        System.out.println("已分配堆: " + rt.totalMemory() / mb + "MB");
        System.out.println("空闲: " + rt.freeMemory() / mb + "MB");
    }
}
\`\`\`

\`\`\`output
# java -Xms1g -Xmx1g HeapInfo 的运行结果
最大堆: 969MB          # 实际可用略小于设定值:幸存区等结构性开销被扣除
已分配堆: 969MB
空闲: 951MB
\`\`\`

> [!pitfall] 堆外别忘了直接内存
> NIO 的 ==DirectByteBuffer== 走堆外内存,受 -XX:MaxDirectMemorySize 限制(默认约等于 -Xmx)。Netty 大量使用堆外内存,堆明明没满却抛 OOM: Direct buffer memory —— 排查时别只盯着堆。

## 方法区:从永久代到元空间的演进

| JDK 版本 | 方法区实现 | 变化 |
| --- | --- | --- |
| JDK6 及以前 | 永久代(堆的一部分) | 字符串常量池在永久代 |
| JDK7 | 永久代 | **字符串常量池、静态变量移到堆** |
| JDK8+ | **元空间(本地内存)** | 永久代彻底移除,只受物理内存限制 |

字符串常量池经典考题:

\`\`\`java
public class InternDemo {
    public static void main(String[] args) {
        String s1 = new StringBuilder("ja").append("va").toString();
        System.out.println(s1.intern() == s1);

        String s2 = new StringBuilder("zhen").append("dahai").toString();
        System.out.println(s2.intern() == s2);
    }
}
\`\`\`

\`\`\`output
false    # "java" 这个词 JVM 启动时已在常量池,intern 返回的是池中的老对象
true     # JDK7+:intern 发现池中没有,把堆上这个引用登记进池 → 两者相等
\`\`\`

JDK6 下第二行也是 false(常量池在永久代,intern 会把字符串**复制一份副本**进池)。==这题的答案随 JDK 版本变化,必须带版本号作答==,翻车率极高。

> [!interview] 高频追问:为什么用元空间替换永久代?
> ① 永久代大小受 -XX:MaxPermSize 限制且与堆耦合,难调优,动态生成类多的应用(代理/Groovy/热部署)极易 PermGen OOM;② 元空间用**本地内存**,可独立设 MaxMetaspaceSize;③ HotSpot 与 JRockit 合并,JRockit 本来就没有永久代。追问"元空间还会溢出吗" → 会,设了 MaxMetaspaceSize 上限或类加载器泄漏都会,详见第 8 章。

## 对象分配与 TLAB(承上启下)

堆是共享区,两个线程同时 new 怎么保证不互相踩?两个方案:

| 方案 | 原理 | 代价 |
| --- | --- | --- |
| CAS 失败重试 | 分配指针原子更新,竞争失败重来 | 高并发下自旋开销大 |
| **TLAB(默认开启)** | 每根线程在 Eden 预分配一小块私有缓冲(约堆 1%),线程内分配无锁 | TLAB 用完再 CAS 申请新块 |

TLAB(Thread Local Allocation Buffer)是 Eden 里按线程切出的**私有自留地**:线程启动时划走一块,内部分配只需指针一挪,全程无锁。默认开是因为 new 是最高频操作、多为朝生夕死的小对象,无锁化收益远超约 1% 的碎片代价。它只加速分配,不减少分配。

\`\`\`text
new 对象
 ① 逃逸分析通过 → 标量替换/栈上分配,不落堆
 ② TLAB 内指针碰撞,无锁,最快
 ③ TLAB 不足 → 到 Eden CAS 申领新块(可能 Minor GC)
 ④ Eden 放不下 → 分配担保,直接进老年代(超大对象也跳过 Eden)
\`\`\`

参数只有一个 ==-XX:TLABSize==(默认 0 自适应,通常不手改);-XX:-UseTLAB 仅用于压测对比。TLAB 与逃逸分析互补:后者管"要不要进堆",前者管"在堆上怎么快" —— 对象一旦逃逸,就只能走 TLAB → Eden。

> [!interview] 追问:TLAB 会浪费内存吗?
> 会。剩余空间小于最大浪费阈值就提前退休,造成碎片。

## StringTable 与直接内存

### 字符串常量池在哪:一场"搬家"

| JDK | StringTable 位置 | 变化与动机 |
| --- | --- | --- |
| JDK6 | 永久代 | 只有 Full GC 才顺带回收废字符串,大量 intern 直接撑爆 MaxPermSize |
| JDK7 | **堆** | 挪进堆后 Minor GC 就能顺带回收失效字符串 |
| JDK8+ | 堆(永久代废除) | 字符串归堆、类元数据归元空间,容量规划彻底分家 |

搬家动机一句话:**永久代 GC 效率低、还容易 OOM** —— 永久代的回收要等 Full GC,XML/JSON 解析这种字符串疯涨的场景最容易被 -XX:MaxPermSize 噎死;进堆之后,字符串和普通对象一样参与分代回收,废字符串随 Minor GC 顺手带走。

### intern() 实验:同一行代码,两个时代两种答案

\`\`\`java
public class InternAcrossJdk {
    public static void main(String[] args) {
        // 拼接产物是堆上的新对象;此刻常量池里只有 "a" 和 "b",还没有 "ab"
        String s3 = new String("a") + new String("b");
        s3.intern();                        // 尝试把 "ab" 收编进字符串常量池
        System.out.println(s3 == "ab");     // s3 到底是不是池中那份?
    }
}
\`\`\`

\`\`\`output
# JDK 8 运行输出: true
# JDK 6 运行输出: false
\`\`\`

逐行拆解:

- new String("a") 一次造**两个对象**:字面量 "a" 进池 + 堆上一个副本,"b" 同理;再加拼接 toString 在堆上 new 出的 "ab",这一行共 **5 个对象**。
- 关键前提:拼接在堆上生成新对象,**这一刻池里没有 "ab"**。
- s3.intern() 的版本分叉:
  - JDK6:池里没有 → 把堆上 s3 **复制一份副本**塞进永久代常量池,返回的是副本引用 → s3 与 "ab" 不是同一对象 → **false**;
  - JDK7+:池里没有 → 不再复制,直接把堆上 s3 的**引用**登记进池 → "ab" 取到的就是 s3 → **true**。

> [!interview] 高频追问:new String("ab") 创建几个对象?
> 最多两个:"ab" 字面量进池一个 + 堆上 new 一个;若池里已有 "ab" 则只有堆上一个。延伸:StringTable 底层是哈希表,存引用或副本,==同一 JVM 内同一字面量的引用全局唯一==;字符串比较老实用 equals,== 比较依赖 intern 语义,容易埋雷。

### 大量字符串场景:StringTableSize 调优

StringTable 是固定桶数的哈希表:JDK7 默认 1009 个桶,JDK8+ 默认 60013。字符串几十万条而桶数太小 → 冲突链拉长,intern 在热点路径上出现 CPU 毛刺。

\`\`\`shell
# 调大桶数 + 退出时打印统计
java -XX:StringTableSize=1000003 -XX:+PrintStringTableStatistics -jar app.jar
\`\`\`

\`\`\`output
StringTable statistics:
Number of buckets       :    1000003 =    8000024 bytes, avg   8.0
Number of entries       :     812364 =   19496736 bytes, avg  24.0
Number of literals      :     812364 =   48173520 bytes, avg  59.3
Average bucket size     :     0.81    # 小于 1:桶数充足,冲突很少
Maximum bucket size     :         6
\`\`\`

观测口径:==Average bucket size 接近或小于 1 说明桶数合理;远大于 1(比如 10+)就该扩 StringTableSize==。

### 直接内存:运行时数据区之外的"编外兵"

定位:不属于《Java 虚拟机规范》定义的运行时数据区,但 NIO 时代高频出场 —— DirectByteBuffer 用 native 方法直接向操作系统申请内存,堆里只留一个地址引用。上限由 -XX:MaxDirectMemorySize 控制,默认约等于 -Xmx。

\`\`\`java
import java.nio.ByteBuffer;

public class DirectMemoryDemo {
    public static void main(String[] args) {
        // 堆内缓冲:数据在堆里,GC 可以搬动它;写 socket 前还要先复制到堆外临时缓冲
        ByteBuffer heapBuf = ByteBuffer.allocate(1024 * 1024);
        System.out.println("heapBuf 在堆外吗: " + heapBuf.isDirect());

        // 直接内存:直接向操作系统要一块连续内存,绕过堆
        ByteBuffer directBuf = ByteBuffer.allocateDirect(1024 * 1024);
        directBuf.putInt(42).flip();
        System.out.println("directBuf 在堆外吗: " + directBuf.isDirect());
        System.out.println("directBuf 读出: " + directBuf.getInt());
    }
}
\`\`\`

\`\`\`output
heapBuf 在堆外吗: false
directBuf 在堆外吗: true
directBuf 读出: 42
\`\`\`

| 维度 | 堆内内存 | 直接内存 |
| --- | --- | --- |
| 归属 | 运行时数据区,受 -Xmx 管辖 | 编外,受 -XX:MaxDirectMemorySize 管辖 |
| GC | GC 直接治理 | 靠 Cleaner(虚引用)在堆对象回收时释放 |
| 分配/释放 | 极快(TLAB 指针挪动) | 慢,适合申请后长期复用 |
| IO 路径 | 先复制到堆外临时缓冲再系统调用 | 缓冲本身在堆外,直达内核 |
| 典型 OOM | Java heap space | Direct buffer memory(第 8 章) |

### 实测:BIO 与 NIO 文件拷贝差在哪

\`\`\`java
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;

public class CopyCompare {
    static final Path SRC = Paths.get("big.dat");      // 预备一个 1GB 测试文件

    // BIO:文件 → 内核页缓存 → 堆内 byte[] → JVM 转出到堆外临时缓冲 → 写出
    static void bioCopy(Path dest) throws IOException {
        try (InputStream in = Files.newInputStream(SRC);
             OutputStream out = Files.newOutputStream(dest)) {
            byte[] buf = new byte[8 * 1024 * 1024];
            int n;
            while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
        }
    }

    // NIO DirectByteBuffer:缓冲在堆外,系统调用直接用它,少一次复制
    static void nioCopy(Path dest) throws IOException {
        try (FileChannel in = FileChannel.open(SRC, StandardOpenOption.READ);
             FileChannel out = FileChannel.open(dest, StandardOpenOption.WRITE,
                     StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING)) {
            ByteBuffer buf = ByteBuffer.allocateDirect(8 * 1024 * 1024);
            while (in.read(buf) != -1) {
                buf.flip();
                out.write(buf);
                buf.clear();
            }
        }
    }

    public static void main(String[] args) throws Exception {
        for (int round = 1; round <= 3; round++) {
            long t = System.currentTimeMillis();
            bioCopy(Paths.get("out-bio.bin"));
            long bio = System.currentTimeMillis() - t;
            t = System.currentTimeMillis();
            nioCopy(Paths.get("out-nio.bin"));
            long nio = System.currentTimeMillis() - t;
            System.out.println("第 " + round + " 轮  BIO: " + bio + "ms   NIO Direct: " + nio + "ms");
        }
    }
}
\`\`\`

\`\`\`output
第 1 轮  BIO: 2187ms   NIO Direct: 1546ms
第 2 轮  BIO: 1954ms   NIO Direct: 1361ms
第 3 轮  BIO: 1902ms   NIO Direct: 1337ms
# 1GB 文件,不同机器数字会变,趋势稳定:堆内缓冲多一次"堆外临时缓冲往返"
\`\`\`

> [!pitfall] -XX:+DisableExplicitGC 的著名连锁坑
> DirectByteBuffer 分配失败时会先调 System.gc() 求救 —— 让 GC 顺带跑 Cleaner 释放堆外内存;若为了"禁掉手动 GC"加了 ==-XX:+DisableExplicitGC==,求救通道被掐断,堆外涨满后直接 OOM: Direct buffer memory。Netty 项目尤其注意;真要禁 System.gc,用 ==-XX:+ExplicitGCInvokesConcurrent==(触发的是并发 GC,不掐求救)。

## 面试速记

- 线程私有:程序计数器、虚拟机栈、本地方法栈;共享:堆、方法区(元空间)。
- 程序计数器是唯一不会 OOM 的区域;栈抛 SOE 或 OOM,先分清是栈深不够还是线程太多。
- 堆分代:Eden:S0:S1 = 8:1:1;Minor GC 复制回收,15 岁默认晋升老年代。
- 方法区演进:JDK7 字符串常量池进堆 → JDK8 永久代废除换元空间(本地内存)。
- intern 结果必须分版本答:JDK7+ 池中不存副本,首次 intern 登记堆上引用;而 "java" 一词在 JVM 启动时就已在池里。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch03',
        title: '对象的创建、内存布局与引用类型(对象头、指针压缩、四种引用)',
        minutes: 30,
        points: ['创建六步', 'Mark Word', '指针压缩', '四种引用', '对象大小'],
        content: `
> [!interview] 章节定位
> "new 一个对象,底层发生了什么?这个对象在内存里长什么样、占多少字节?"——对象创建六步、内存布局三段、Mark Word、指针压缩、四种引用,这一章是 JVM 面试的"对象细节考场",每个点都可能被单拎出来往深处追问。

> [!info] 本章导读 · new 一个对象,到底发生了什么?
> 一行 new 背后有类检查、内存分配、零值初始化、对象头设置、构造方法调用等一长串动作,像给新生儿办出生证明、上户口、领身份证。对象躺在堆里也有固定的三段布局。本章把对象从出生到被各种引用持有的细节拆开给你看。
> - 读完本章你将能:复述对象创建的完整步骤,说出指针碰撞与空闲列表的区别
> - 画出对象头、实例数据、对齐填充三段布局,解释指针压缩省了什么
> - 用强软弱虚四种引用各写一个例子,说明它们何时被回收

> [!tip] 日常电脑现场 · 快递盒里的三层
> 收到快递:纸箱外贴着面单,里面是气泡膜裹着的商品,空隙还塞了填充纸 —— 对象在内存里也是对象头、实例数据、对齐填充三层。面单写着收件人和重量,决定这个包裹归谁;对象头里的标记位也决定着它的锁状态和熬过了几次回收。

## 对象创建六步曲

\`\`\`text
new 指令 → ① 检查类是否已加载(没有则先走类加载五步)
        → ② 分配内存:指针碰撞(堆规整)/ 空闲列表(堆不规整)
        → ③ 并发安全:TLAB 优先,失败退 CAS
        → ④ 分配空间清零(默认值初始化)
        → ⑤ 设置对象头(Mark Word、类型指针)
        → ⑥ 执行 <init> 构造方法 → 栈上引用指向堆中对象
\`\`\`

| 分配方式 | 适用堆 | 原理 |
| --- | --- | --- |
| 指针碰撞 | 规整(带压缩的 Serial、ParNew、G1) | 已用/空闲内存各在一侧,指针一挪就是新对象 |
| 空闲列表 | 不规整(CMS 碎片化后) | 维护空闲块表,找一块足够大的内存分配 |

## 对象内存布局:头 + 数据 + 填充

| 部分 | 内容 | 64 位压缩指针下大小 |
| --- | --- | --- |
| 对象头 Mark Word | 哈希码、GC 分代年龄、锁标志等复用存储 | 8 字节 |
| 对象头类型指针 | 指向方法区的类元数据(Klass) | 4 字节(压缩后) |
| 实例数据 | 各字段按类型与重排序规则存放 | 按字段累加 |
| 对齐填充 | 补齐到 8 字节整数倍 | 0-7 字节 |

Mark Word 64 位复用设计(synchronized 锁升级就在这块空间上做文章):

| 锁状态 | Mark Word 内容 | 标志位 |
| --- | --- | --- |
| 无锁 | 哈希码(31)+ 分代年龄(4) | 01 |
| 偏向锁 | 线程 ID(54)+ Epoch + 年龄 | 101 |
| 轻量级锁 | 指向栈中 Lock Record 的指针 | 00 |
| 重量级锁 | 指向 ObjectMonitor 的指针 | 10 |
| GC 标记 | 空(被 GC 复用) | 11 |

### 算一算:new Object() 占 16 字节

\`\`\`java
// pom.xml 引入 org.openjdk.jol:jol-core:0.17,一行看穿对象布局
import org.openjdk.jol.info.ClassLayout;

public class ObjectSize {
    public static void main(String[] args) {
        System.out.println(ClassLayout.parseInstance(new Object()).toPrintable());
    }
}
\`\`\`

\`\`\`output
java.lang.Object object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: Mark)    0x0000000000000001
  8   4        (object header: Class)   0xf80001e5
 12   4        (object padding)         对齐填充
Instance size: 16 bytes        # 8(Mark Word) + 4(类型指针) + 4(填充) = 16
\`\`\`

同理:一个 int 字段的对象 = 8+4+4 = 16 字节;两个 int = 8+4+8 = 20 → 补齐 24 字节。字段重排序规则:相同宽度字段放一起,Long/Double 优先,引用最后。

> [!tip] 分代年龄只有 4 位
> Mark Word 里给 GC 分代年龄只留 **4 bit,最大 15** —— 这就是 ==-XX:MaxTenuringThreshold 最大只能设 15== 的底层原因,和第 5 章"15 岁晋升"对上了。面试把这两处串起来讲,效果拔群。

## 指针压缩:4 字节管住 32GB 堆

-XX:+UseCompressedOops(默认开启):堆 ≤32GB 时,类型指针压成 4 字节(4 字节偏移 × 8 倍缩放 = 32GB 寻址空间)。

- 堆超过约 32GB → 压缩自动失效,对象头膨胀、CPU 缓存效率下降,**内存占用反而可能比 31GB 时更高**。
- 运维口诀:堆要么 ≤31GB,要么干脆上大内存(48GB+),不要卡在 32-40GB 的尴尬区间。

> [!warn] 32GB 不是精确开关
> 压缩指针的实际失效阈值约 32.5GB 且与对齐参数相关(-XX:ObjectAlignmentInBytes 可微调)。所以生产经验是留出余量:==32G 这个数字附近一律避开==。

## 四种引用:强软弱虚

| 引用 | 回收时机 | 典型用途 | 类 |
| --- | --- | --- | --- |
| 强引用 | 只要可达,OOM 也不回收 | 普通变量赋值 | - |
| 软引用 | 内存不足时才回收 | 敏感缓存 | SoftReference |
| 弱引用 | 下次 GC 必被回收 | ThreadLocalMap 的 key | WeakReference |
| 虚引用 | 随时可回收,get 恒为 null,唯一作用是回收通知 | 堆外内存释放跟踪 | PhantomReference |

\`\`\`java
import java.lang.ref.SoftReference;
import java.lang.ref.WeakReference;

public class ReferenceDemo {
    public static void main(String[] args) {
        SoftReference<Object> soft = new SoftReference<>(new Object());
        WeakReference<Object> weak = new WeakReference<>(new Object());

        System.out.println("GC 前 soft 存活: " + (soft.get() != null));
        System.out.println("GC 前 weak 存活: " + (weak.get() != null));

        System.gc();   // 建议 GC(几乎必然执行)

        System.out.println("GC 后 soft(内存充足,保留): " + (soft.get() != null));
        System.out.println("GC 后 weak(必被回收): " + (weak.get() != null));
    }
}
\`\`\`

\`\`\`output
GC 前 soft 存活: true
GC 前 weak 存活: true
GC 后 soft(内存充足,保留): true
GC 后 weak(必被回收): false
\`\`\`

> [!interview] 高频追问:ThreadLocal 为什么用弱引用做 key?
> key 用弱引用 → 外部不再持有 ThreadLocal 对象时,下次 GC key 被回收变 null,防止 ThreadLocalMap 死撑 Entry。**但 value 仍是强引用**:线程池的线程长期不死,(key=null, value=大对象)的 Entry 依然可达 → 这就是 ThreadLocal 泄漏的根源。所以用完必须 ==finally 里 remove()==,展开见第 8 章。

虚引用是唯一 get() 永远返回 null 的引用,它的价值在 ReferenceQueue:对象被回收时虚引用入队,后台线程据此执行堆外内存的真正释放(DirectByteBuffer 的 Cleaner 机制)。跑一段代码感受它:

\`\`\`java
import java.lang.ref.PhantomReference;
import java.lang.ref.Reference;
import java.lang.ref.ReferenceQueue;

public class PhantomDemo {
    public static void main(String[] args) throws InterruptedException {
        ReferenceQueue<Object> queue = new ReferenceQueue<>();
        PhantomReference<Object> phantom = new PhantomReference<>(new Object(), queue);

        System.out.println("虚引用 get 恒为: " + phantom.get());
        System.gc();                              // 对象被回收
        Thread.sleep(300);
        Reference<?> polled = queue.poll();       // 回收后虚引用被放进队列
        System.out.println("回收后虚引用入队且是同一个: " + (polled == phantom));
    }
}
\`\`\`

\`\`\`output
虚引用 get 恒为: null
回收后虚引用入队且是同一个: true
\`\`\`

Netty 的堆外内存回收走的正是这套机制:DirectByteBuffer 关联一个 Cleaner(虚引用),对象被回收时后台线程收到通知,再去释放真正的堆外内存。

## 对象访问:句柄 vs 直接指针

reference 存什么?规范只要求"能找到对象",实现有两种:

\`\`\`text
① 句柄访问
栈 reference ─→ 句柄池 ─┬─→ 对象实例(堆)
                        └─→ 类型数据(方法区)
GC 移动对象只改句柄里的指针,reference 原地不动

② 直接指针(HotSpot 全系)
栈 reference ─→ 对象实例(堆) ─→ 类型数据(方法区)
reference 就是对象地址,少一次转发,但移动时要改 reference
\`\`\`

| 对比 | 句柄 | 直接指针 |
| --- | --- | --- |
| 访问速度 | 慢,两次寻址 | **快,一次直达** |
| GC 移动对象 | 只改句柄池 | 要修正栈/寄存器里的 reference |
| 内存开销 | 多一个句柄池 | 无额外结构 |
| 局部性 | 差(句柄与对象分离) | 好 |
| 使用者 | 早期 JVM / 规范示例 | ==HotSpot 默认== |

取舍就一句话:**访问频率远高于移动频率**。业务代码每时每刻都在读对象,而 GC 移动只发生在复制/整理时,且 HotSpot 能靠栈帧的 OopMap 精确找到 reference 去修正。故 HotSpot 用直接指针。

> [!pitfall] 别把 reference 说成 C 指针
> reference 是虚拟机抽象;实现成指针的是 HotSpot,不是语言规定。答题先画两张图,再落到"访问快 vs 移动便宜"。

## 对象头解剖:Mark Word 与 Klass Pointer

### 内存布局:对象头 12 还是 16 字节

64 位 HotSpot、开启压缩指针时,普通对象的对象头只有 **12 字节**:Mark Word 8 字节 + Klass Pointer 4 字节;数组对象多一个 4 字节的 length,对象头变成 **16 字节**。之后才是实例数据,最后补齐到 8 字节的整数倍。

\`\`\`text
普通对象(开启压缩指针):
┌──────────── 8B ────────────┬──── 4B ────┬──────── 实例数据 ────────┬─ 填充 0-7B ─┐
│         Mark Word          │ Klass Ptr  │ 字段按宽度重排(int/long)│  8 字节对齐  │
└────────────────────────────┴────────────┴──────────────────────────┴─────────────┘
new Object()  : 8 + 4 + 0 + 4(填充) = 16B
1 个 int 字段 : 8 + 4 + 4 + 0       = 16B
2 个 int 字段 : 8 + 4 + 8 + 4(填充) = 24B

数组对象:Mark(8) + Klass(4) + length(4) + 元素 → 对象头 16B
\`\`\`

### Mark Word:8 字节里的"变形金刚"

Mark Word 是**复用**的:同一块 8 字节,在无锁、偏向、轻量级、重量级、GC 标记几种状态下存完全不同的内容,靠最低两位的 lock 标志区分。64 位无锁状态从高位到低位是:unused 25 位 | hashCode 31 位 | unused 1 位 | 分代年龄 4 位 | 偏向标志 1 位 | 锁标志 2 位。

| 位区间(64 位无锁) | 字段 | 作用 |
| --- | --- | --- |
| 39-63 | unused | 未使用 |
| 8-38 | identity_hashcode | 31 位对象哈希,首次调用 hashCode() 才写入 |
| 7 | unused | 占位 |
| 3-6 | age | 分代年龄 4 bit,最大 15 |
| 2 | biased_lock | 1 表示偏向模式 |
| 0-1 | lock | 锁标志位:01 无锁/偏向、00 轻量、10 重量、11 GC |

32 位与 64 位的结构差异:

| 状态 | 32 位 Mark Word | 64 位 Mark Word |
| --- | --- | --- |
| 无锁 | hash 25 + age 4 + biased 1 + lock 2 | unused 25 + hash 31 + unused 1 + age 4 + biased 1 + lock 2 |
| 偏向锁 | threadID 23 + epoch 2 + age 4 + biased 1 + lock 2 | threadID 54 + epoch 2 + unused 1 + age 4 + biased 1 + lock 2 |
| 轻量级锁 | 指向栈中 Lock Record 的指针 30 位 + lock 2 | 指向 Lock Record 的指针 62 位 + lock 2 |
| 重量级锁 | 指向 ObjectMonitor 的指针 30 位 + lock 2 | 指向 ObjectMonitor 的指针 62 位 + lock 2 |

锁升级就是在同一块 Mark Word 上"换内容 + 换标志位":

| 状态 | 触发条件 | Mark Word 内容 | lock 标志 | 成本 |
| --- | --- | --- | --- | --- |
| 无锁 | 对象刚创建,未进入同步 | hashCode + 分代年龄 | 01 | 无 |
| 偏向锁 | 同一线程反复进入同步块 | 偏向线程 ID + epoch + 年龄 | 01(biased=1) | 首次 CAS 登记,之后几乎零开销 |
| 轻量级锁 | 多线程交替进入,竞争时间短 | 指向栈帧 Lock Record 的指针 | 00 | CAS 自旋,用户态 |
| 重量级锁 | 竞争激烈,自旋失败 | 指向 ObjectMonitor 的指针 | 10 | 内核态挂起/唤醒,开销最大 |
| GC 标记 | GC 标记阶段 | 空(空间被 GC 复用) | 11 | - |

> [!warn] 锁只升不降,偏向锁已默认关闭
> 升级路径固定 **无锁 → 偏向 → 轻量级 → 重量级**,不会回退(GC 的标记状态除外)。偏向锁在 JDK 15 被标记废弃并默认禁用(JEP 374),因为撤销偏向的 STW 成本在现代应用里得不偿失;JDK 17 上看到的新对象 Mark Word 通常是 non-biasable,直接回答"偏向锁已默认关闭"比背 101 更加分。

### Klass Pointer 与压缩指针:为什么是 32GB

Klass Pointer(类型指针)指向方法区的类元数据。64 位下原生指针占 8 字节,开启 ==-XX:+UseCompressedOops==(默认)后压成 4 字节;类指针由 ==-XX:+UseCompressedClassPointers== 控制(默认跟随开启)。对象引用也一起压,堆越大越省内存,缓存命中率也更高。

\`\`\`text
堆 < 32GB:Klass Pointer 4B,对象头 12B,引用字段 4B
堆 ≥ 32GB:Klass Pointer 8B,对象头 16B,引用字段 8B

32GB 的来历:
  4 字节 = 32 bit = 2^32 个"槽位"
  压缩指针存的是"第几个 8 字节"(对象按 8 字节对齐)
  2^32 × 8B = 32GB  → 超过就表示不下,压缩自动失效
\`\`\`

所以堆规划要么 ≤31GB(留出对齐与元数据余量),要么直接上 48GB 以上,别卡在 32-40GB:这个区间压缩指针失效,对象头膨胀、引用变宽、缓存命中下降,内存利用率反而可能不如 31GB。压缩类指针还有独立的 Compressed Class Space(默认约 1GB),动态生成类极多时要留意 ==-XX:CompressedClassSpaceSize==。

\`\`\`java HeaderDemo.java
import org.openjdk.jol.info.ClassLayout;
import org.openjdk.jol.vm.VM;

public class HeaderDemo {
    static class User {
        int id;
        String name;
    }

    public static void main(String[] args) {
        System.out.println(VM.current().details());       // 确认压缩指针与对齐参数
        System.out.println(ClassLayout.parseInstance(new User()).toPrintable());
    }
}
\`\`\`

\`\`\`output
# Running 64-bit HotSpot VM.
# Using compressed oop with 3-bit shift.
# Using compressed class ptr within the range of lower 4G.
# Object alignment: 8 bytes
HeaderDemo$User object internals:
OFF  SZ               TYPE DESCRIPTION               VALUE
  0   8                    (object header: mark)     0x0000000000000001 (non-biasable; age: 0)
  8   4                    (object header: class)    0x00000d68
 12   4                int User.id                   0
 16   4     java.lang.String User.name               null
 20   4                    (object alignment gap)
Instance size: 24 bytes
\`\`\`

第一次调用 hashCode() 才会把哈希写进 Mark Word,这一点用 JOL 能直接看见(锁标志始终是最低的 01):

\`\`\`java MarkWordHash.java
import org.openjdk.jol.info.ClassLayout;

public class MarkWordHash {
    public static void main(String[] args) {
        Object o = new Object();
        System.out.println("未取 hashCode:");
        System.out.println(ClassLayout.parseInstance(o).toPrintable());

        o.hashCode();              // 首次调用才生成并写入 Mark Word

        System.out.println("取 hashCode 后:");
        System.out.println(ClassLayout.parseInstance(o).toPrintable());
    }
}
\`\`\`

\`\`\`output
未取 hashCode:
java.lang.Object object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: Mark)     0x0000000000000001 (non-biasable; age: 0)
  8   4        (object header: Class)    0xf80001e5
 12   4        (object padding)
Instance size: 16 bytes

取 hashCode 后:
java.lang.Object object internals:
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: Mark)     0x0000006f3a2c1b01 (non-biasable; age: 0)
  8   4        (object header: Class)    0xf80001e5
 12   4        (object padding)
Instance size: 16 bytes
\`\`\`

> [!interview] 连锁追问:hashCode 存在哪?为什么年龄最大 15?
> ① 对象哈希不是字段,而是第一次调用 hashCode()/System.identityHashCode 时算出来写进 **Mark Word 的 31 位**;② 同一对象多次调用返回同一个值,就是因为缓存进了对象头;③ 分代年龄只占 **4 bit**,所以 ==-XX:MaxTenuringThreshold== 最大 15,和"15 岁晋升老年代"是同一件事;④ 对象已处于偏向状态时再调 hashCode,会先撤销偏向才能腾出位置存哈希。

## 面试速记

- 创建六步:查类加载 → 分配(指针碰撞/空闲列表)→ TLAB/CAS → 清零 → 设对象头 → <init>。
- 对象 = Mark Word(8)+ 类型指针(4,压缩)+ 实例数据 + 8 字节对齐;new Object() = 16 字节。
- Mark Word 复用:无锁 01 / 偏向 101 / 轻量 00 / 重量 10 / GC 11;年龄 4bit → 晋升阈值上限 15。
- 压缩指针默认开,堆 >32G 自动失效,堆大小规划避开 32-40G。
- 强引用 OOM 不放、软引用内存不足才放、弱引用见 GC 就放、虚引用只发通知。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch04',
        title: '垃圾标记与 GC 算法(可达性分析、GC Roots、标记清除/复制/整理、分代理论)',
        minutes: 30,
        points: ['可达性分析', 'GC Roots', '三大算法', '分代假说', '晋升规则'],
        content: `
> [!interview] 章节定位
> GC 面试三连:"怎么判断对象该回收?" → "回收用什么算法?" → "分代为什么这样设计?"本章把这三问的**原理层**打透;算法的实现(收集器)留给第 6 章。先点演示,直观感受分代回收的节奏。

> [!info] 本章导读 · JVM 怎么知道哪个对象该被清理?
> 垃圾回收听起来神秘,第一步其实很朴素:找出没人再用的对象。引用计数会被循环引用骗过去,所以 JVM 改用可达性分析,从 GC Roots 往外走。本章讲清标记与三种回收算法,是理解所有收集器的前提。
> - 读完本章你将能:列出 GC Roots 的几类来源,并解释为什么不用引用计数
> - 手推标记清除、复制、标记整理三种算法的过程与优缺点
> - 说清分代假说,以及新生代为什么用复制算法

> [!tip] 日常电脑现场 · 回收站与清缓存
> 文件删进回收站,图标从桌面消失了,可硬盘空间没变,清空回收站才真正腾出来 —— "没人用了"和"已经回收"是两件事。手机设置里点"清理缓存",系统也是先判断哪些数据再没人引用,再整块抹掉,不是见文件就删。

\`\`\`demo:gc-demo
\`\`\`

## 引用计数法:JVM 为什么不用

给对象挂计数器:被引用 +1,断开 -1,归零即回收。致命缺陷:**循环引用** —— A 持有 B、B 持有 A,两者再无外部引用,计数器都停在 1,永远无法回收。JVM 采用**可达性分析**;Python 用引用计数,但要额外靠弱引用与代际机制缓解循环引用。

用代码验证:两个互相引用的对象,失去外部引用后照样被回收 —— 可达性分析不看"被引用次数",只看"是否还能摸到":

\`\`\`java
public class CycleRefDemo {
    static class Node {
        Node other;                                        // 互相引用的字段
        @Override protected void finalize() { System.out.println("Node 被回收了"); }
    }

    public static void main(String[] args) throws InterruptedException {
        Node a = new Node();
        Node b = new Node();
        a.other = b;   // 循环引用形成
        b.other = a;

        a = null;      // 切断唯一的两个外部引用
        b = null;
        System.gc();   // 引用计数判定:两者计数都还是 1,永不回收
        Thread.sleep(300);
        System.out.println("main 结束");
    }
}
\`\`\`

\`\`\`output
Node 被回收了
Node 被回收了
main 结束
\`\`\`

两个对象都被回收了 —— 这就是 JVM 弃用引用计数的实锤。

## 可达性分析与 GC Roots

从 GC Roots 出发沿引用链遍历,不可达的对象判定为可回收。

**GC Roots 记忆版(面试背这个清单)**:

- 虚拟机栈中引用的对象(正在执行的方法里的局部变量)
- 方法区中**类静态变量**引用的对象
- 方法区中 **final 常量**引用的对象
- 本地方法栈 JNI 引用的对象
- JVM 内部引用:基本类型的 Class 对象、常驻异常对象(NullPointerException 等)、系统类加载器
- 所有被 **synchronized 持有**的对象

> [!tip] 一句话总结 GC Roots
> ==正在干活的三张栈 + 类的静态与常量 + JVM 自己要用的对象==。答完清单补一句"GC Roots 的本质是所有'堆外指向堆内'的引用入口",层次立刻不一样。

### 加分项:三色标记(并发标记的心智模型)

CMS/G1 的并发标记都建立在三色标记之上,说得出这套模型,追问很难不认输:

\`\`\`text
白色:尚未访问(标记结束时仍白 = 垃圾)
灰色:自己已标记,但引用还没扫完(灰 = 待处理队列)
黑色:自己和所有引用都扫描完毕

并发标记"漏标"必须同时满足两个条件:
  ① 黑色对象新增了指向白色对象的引用
  ② 灰色对象到该白色对象的全部引用被删除

两种解决方案(对应两大收集器):
  CMS 增量更新:记录条件①("黑→白"新增引用),重新标记时以黑色为根补扫
  G1 SATB:记录条件②(引用消失时的旧值快照),按快照继续标记
\`\`\`

## 三种基础回收算法

| 算法 | 过程 | 优点 | 缺点 | 用在哪 |
| --- | --- | --- | --- | --- |
| 标记-清除 | 标记可达 → 直接清除不可达 | 简单 | **内存碎片**、效率不稳定 | CMS(老年代) |
| 标记-复制 | 存活对象复制到另一块干净内存 | 无碎片、分配快 | 浪费一半空间、存活多时慢 | 新生代 |
| 标记-整理 | 标记 → 存活对象向一端移动 → 清理边界 | 无碎片 | 移动对象需长 STW | 老年代(Parallel Old 等) |

新生代敢用复制算法的底气:**朝生夕死,存活率极低**(绝大多数对象熬不过第一次 Minor GC),复制少量对象代价小;老年代存活率高,复制得不偿失,用整理。

## 分代理论:为什么这样分区

三个假说支撑分代设计:

- **弱分代假说**:绝大多数对象朝生夕死 → 新生代复制算法高频回收。
- **强分代假说**:熬过越多次 GC 的对象越难死 → 老年代低频回收。
- **跨代引用假说**:老年代引用新生代是少数情况 → 用**记忆集(Remembered Set)+ 卡表(Card Table)**记录跨代引用,Minor GC 不用扫全堆。

### 对象晋升老年代的四种触发

1. 年龄达到阈值:默认 **15**(-XX:MaxTenuringThreshold,受 Mark Word 4bit 限制,上限就是 15)。
2. **动态年龄判定**:Survivor 中某年龄及以下对象总大小超过 Survivor 空间一半,该年龄及以上直接晋升(不必熬到 15 岁)。
3. **大对象直接进入**:超过 -XX:PretenureSizeThreshold(或 G1 的半个 Region)直接进老年代,避免在 Survivor 间反复搬运。
4. **空间分配担保**:Minor GC 前,老年代最大可用连续空间小于新生代对象总大小且历次晋升平均偏大 → 直接 Full GC。

> [!warn] 动态年龄判定是隐蔽的性能坑
> 你以为对象要活满 15 次才进老年代,实际 Survivor 一紧张,"同龄集体提前晋升"。Survivor 配小了(比如拍脑袋改 SurvivorRatio),大量本该留在新生代的对象提前涌入老年代 → 老年代涨得飞快 → Full GC 频繁。==看晋升速率(jstat 的 OU 增长)比只看 YGC 次数更容易发现这个问题==。

想亲眼看到晋升过程,一组最小参数就能观察:

\`\`\`shell
# 小堆 + 打印 GC 细节,晋升行为一目了然
java -Xms20m -Xmx20m -Xmn10m -XX:SurvivorRatio=8 \\
  -XX:MaxTenuringThreshold=15 \\
  -Xlog:gc*:file=gc.log:time,level,tags \\
  -cp . MyApp
\`\`\`

\`\`\`output
[info][gc] GC(0) Pause Young (Normal) Eden: 8192K->0K(8192K)
[info][gc] GC(0) Survivor spaces: 0K->1024K  Old: 0K->0K
[info][gc] GC(3) Pause Young (Normal) Old: 1024K->2048K   # 老年代开始涨 = 有对象晋升
\`\`\`

## finalize:对象的一次自救机会

对象不可达后并非立即死亡,还有一次"缓刑":

\`\`\`text
不可达 → 覆盖了 finalize 且没执行过?→ 是则进 F-Queue,低优先级线程执行
      → 执行期间对象重新被引用 → 自救成功
      → 下次再不可达 → 直接回收(finalize 只执行一次)
\`\`\`

\`\`\`java
public class FinalizeEscape {
    public static FinalizeEscape SAVE_HOOK = null;

    @Override
    protected void finalize() throws Throwable {
        System.out.println("finalize 执行:把自己重新挂回去");
        SAVE_HOOK = this;
    }

    public static void main(String[] args) throws InterruptedException {
        SAVE_HOOK = new FinalizeEscape();

        SAVE_HOOK = null;            // 第一次失去引用
        System.gc();
        Thread.sleep(500);           // finalize 线程优先级极低,等等它
        System.out.println("第一次: " + (SAVE_HOOK != null ? "自救成功" : "已死亡"));

        SAVE_HOOK = null;            // 第二次失去引用
        System.gc();
        Thread.sleep(500);
        System.out.println("第二次: " + (SAVE_HOOK != null ? "自救成功" : "已死亡"));
    }
}
\`\`\`

\`\`\`output
finalize 执行:把自己重新挂回去
第一次: 自救成功
第二次: 已死亡
\`\`\`

> [!danger] finalize 已被官方废弃
> JDK9 起 @Deprecated:执行时机不确定、复活对象破坏回收语义、异常被静默吞掉。资源释放请用 ==try-with-resources== 或 Cleaner。面试答"知道它的机制,但生产代码不用它"就是满分。

## 一次 Minor GC 的完整流程(串起全章)

Eden 满时触发 Minor GC,全章串成 6 步:

\`\`\`text
① 枚举 GC Roots:栈/静态变量/JNI/锁记录,靠 OopMap 在安全点一次拿全,
   卡表过滤跨代引用,不全堆扫
② STW:暂停所有已到安全点的用户线程,根集合不再变化
③ 复制:Eden + from 的存活对象复制到 to(指针碰撞顺序写入)
④ 年龄 +1:幸存对象 Mark Word 的 age 加 1(4 bit,上限 15)
⑤ 晋升:age 达 15 进老年代;to 超一半则动态年龄判定提前晋升;失败转 Full GC
⑥ 引用修正:from/to 互换,栈上 reference 与卡表更新,恢复线程
\`\`\`

JDK 9+ 用 -Xlog:gc 取代 -XX:+PrintGCDetails,例:java -Xlog:gc:file=gc.log -jar app.jar

\`\`\`output
[2.315s][info][gc] GC(3) Pause Young (Normal) (G1 Evacuation Pause) 108M->24M(256M) 12.184ms
\`\`\`

读法:108M→24M 为回收前后堆占用,256M 为总堆,12.184ms 为 STW 时长;出现 ==Pause Full== 说明晋升失败或碎片过多。

> [!interview] 分水岭
> 只背"复制到 Survivor"= 背过;补上 OopMap/卡表、动态年龄判定、from/to 互换才是懂。

## 三色标记:并发标记的漏标难题

前文"加分项"认识了三色标记,这一节把它打穿:漏标为什么发生、CMS 与 G1 各怎么破、写屏障与卡表怎么落地、GC 为什么非要在安全点等 —— 面试官问"并发标记怎么保证不出错",全在这条链上。

### 三色模型与漏标的两个条件

\`\`\`text
三色(标记器的视角):
  白色:尚未被访问;标记结束时仍是白色 → 垃圾,回收
  灰色:自己已标记,但出边(字段里的引用)还没扫完 → 待处理队列
  黑色:自己与全部直接引用扫完 → 标记器不会再回头看它

标记循环:弹出灰色 → 把它引用的白色染灰 → 自身染黑;灰色队列空则结束

并发期间用户线程同时改引用,同时满足两个条件才会漏标:
  条件① 赋值器插入了一条 黑 → 白 的新引用(黑色不会再被扫描,这条新边看不见)
  条件② 赋值器删除了 灰 → 该白 的全部引用(白色失去了变灰的机会)
→ 白色活对象在标记结束时仍白 → 被误回收 → 程序出错
\`\`\`

### 两种破解:CMS 增量更新 vs G1 原始快照

思路一致:**破坏任意一个条件**即可杜绝漏标,两大收集器各选一边:

| 维度 | CMS:增量更新 Incremental Update | G1:原始快照 SATB |
| --- | --- | --- |
| 破坏的条件 | 条件①:记录新增的黑 → 白引用 | 条件②:记录删除的灰 → 白旧引用 |
| 落地手段 | Post 写屏障标脏卡页 + 重新标记补扫 | Pre 写屏障存旧值进 SATB 队列 |
| 重新标记开销 | 大:黑对象已成片,几乎要重扫 | 小:只处理队列里那一小撮旧引用 |
| 浮动垃圾 | 少 | 多(快照时刻活着的一律当活) |
| 一句话 | 黑插过白边,就重新扫它 | 快照开始时活着的,标记结束前都算活 |

> [!tip] 背诵版
> ==CMS"黑对象插了白边就补扫",G1"按标记开始时的快照算活"==。追问"为什么 G1 选 SATB" → 重新标记要 STW,SATB 把开销从"补扫大片黑对象"缩到"处理一撮记录",用浮动垃圾换停顿时间 —— 正对 G1 的停顿优先目标。

### 写屏障:把方案落到每条赋值指令

写屏障 = JVM 在**引用赋值前后**注入的一小段逻辑(类似方法级 AOP 环绕通知)。**Pre 屏障**在赋值前记录旧值(SATB 的抓手);**Post 屏障**在赋值后记录新引用、标脏卡页(增量更新与卡表的抓手)。CMS 主要用 Post,G1 两个都用。

\`\`\`java
// 写屏障伪代码:面试能在纸上画出这两段就赢了
void setField(Object owner, Object newValue) {
    preWriteBarrier(owner, owner.field);    // 赋值前:旧值入 SATB 队列
    owner.field = newValue;                 // 真正的赋值
    postWriteBarrier(owner, newValue);      // 赋值后:新引用所在卡页标脏
}

void preWriteBarrier(Object owner, Object oldValue) {   // G1 SATB 用
    if (oldValue != null && !isMarked(oldValue)) {
        satbQueue.add(oldValue);            // 被覆盖的旧引用按"快照时仍活"处理
    }
}

void postWriteBarrier(Object owner, Object newValue) {  // CMS/卡表用
    if (newValue != null) {
        cardTable[addrOf(newValue) >> 9] = DIRTY;   // 右移 9 位 = 除以 512,定位卡页
    }
}
\`\`\`

### 20 行代码复现一次漏标

\`\`\`java
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashSet;
import java.util.Set;

/** 最小三色标记模拟:朴素并发标记漏掉了活对象 B */
public class TriColorMark {
    static class Obj {
        final String name;
        Obj ref;                                    // 每个对象只留一条出边,够演示
        Obj(String name) { this.name = name; }
    }

    static Set<Obj> naiveMark(Obj root) {           // 标记器:只会沿它看见的边走
        Set<Obj> marked = new HashSet<>();
        Deque<Obj> gray = new ArrayDeque<>();
        gray.push(root);
        while (!gray.isEmpty()) {
            Obj cur = gray.pop();
            if (!marked.add(cur)) continue;
            if (cur.ref != null && !marked.contains(cur.ref)) gray.push(cur.ref);
        }
        return marked;
    }

    public static void main(String[] args) {
        Obj a = new Obj("A");
        Obj b = new Obj("B");
        a.ref = b;                                  // 初始图:root → A → B

        Obj c = new Obj("C");                       // C 此前已可达,当作已标黑
        a.ref = null;                               // 用户线程并发期间:条件② 删灰 A → B
        c.ref = b;                                  // 条件① 黑 C 新增 → B

        Set<Obj> marked = naiveMark(a);             // 标记器只扫到旧图:A → (空)
        System.out.println("标记结束,存活名单 " + marked.size() + " 个:");
        for (Obj o : marked) System.out.println("  存活: " + o.name);
        System.out.println("B 明明被 C 引用着,却不在名单里 → 漏标,B 会被误回收");
    }
}
\`\`\`

\`\`\`output
标记结束,存活名单 1 个:
  存活: A
B 明明被 C 引用着,却不在名单里 → 漏标,B 会被误回收
\`\`\`

两个条件凑齐,B 必漏。补上屏障就都能救回:CMS 的 Post 屏障在改引用时把 C 所在卡页标脏,重新标记阶段以黑为根补扫到 B;G1 的 Pre 屏障在 a.ref 被覆盖前把旧值 B 记入 SATB 队列,并发标记继续时补标 B。

### 卡表与记忆集:跨代引用的登记簿

Minor GC 只收新生代,但老年代对象可能引用新生代 —— 朴素做法是扫全堆找 Roots,太贵。**卡表(Card Table)** 是答案:

\`\`\`text
卡表 = 一个字节数组,由 Post 写屏障维护:
  老年代按每 512 字节切一张卡页(Card Page)
  CARD_TABLE[i] 对应第 i 张卡页,0 = 干净,非 0 = 脏
  引用赋值时 Post 屏障把目标对象所在卡页标脏(地址 >> 9 即卡页号)
Minor GC 的 Roots = 常规 Roots(栈/静态/…) + 所有"脏卡页"里的老年代对象
  → 只扫脏页,不全堆扫描
\`\`\`

| 维度 | 卡表 Card Table | G1 记忆集 RSet |
| --- | --- | --- |
| 结构 | 全堆一份字节数组 | 每个 Region 一份哈希表 |
| 记录方向 | "我的卡页脏了"(点出引用标脏) | "谁指向了我"(点入引用登记来源 Region) |
| 维护成本 | 一次移位 + 一次写,极便宜 | 标脏后还要 Refinement 线程异步反查来源 |
| 内存开销 | 约堆的 1/512 | 堆的 5%-20% |
| 服务对象 | 分代收集器 Minor GC | G1 的 Region 价值评估与 Evacuation |

> [!warn] G1 更耗内存的底层原因
> 卡表只答"哪里脏",G1 的 RSet 要答"**谁指着我**" —— Evacuation 搬一个 Region 时必须知道所有点入引用来自哪,才能同步修正它们。点入方向的反查 + 每 Region 一份哈希结构,把内存开销推到堆的 ==5%-20%==,这就是"G1 比 CMS/Parallel 更吃内存"的标准答案。

### 安全点与安全区域:GC 开工的合法时机

可达性分析要求"引用关系瞬间冻结",用户线程必须停;但不能停错地方 —— 随便停在一条指令中间,GC 无从知道哪个寄存器/栈槽里是引用。HotSpot 用 **OopMap** 解决:编译期就记录好"哪些位置存放引用",GC 直接枚举、不用逐槽猜测;全量记录太贵,只挑特定位置记,这些位置就是**安全点(Safepoint)**。

触发方式是**主动轮询**:编译器在方法返回、循环回跳处插一条测试指令,线程跑到就检查全局旗子,GC 要开工就自己挂起:

\`\`\`java
// 安全点轮询伪代码:插桩位置 = 方法返回 + 循环回跳
while (working) {
    doStep();
    if (safepointRequested) {              // GC 立起全局旗子
        parkAndHandOverOopMap();           // 挂起自己,交出 OopMap,等 GC 干完
    }
}
\`\`\`

所有线程到齐,GC 才真正开始 —— "Reaching safepoint" 因此是除停顿耗时外必须盯的指标:

\`\`\`shell
# JDK17:逐条观察安全点的原因与耗时
java -Xlog:safepoint -cp . MyApp
\`\`\`

\`\`\`output
[10.512s][info][safepoint] Safepoint "Cleanup", Time since last: 512340123 ns, Reaching safepoint: 82312 ns, Cleanup: 4021 ns, At safepoint: 31208 ns, Total: 43561 ns
[12.345s][info][safepoint] Safepoint "G1_inc_collection", Time since last: 1832512340 ns, Reaching safepoint: 1024 ns, Cleanup: 1210 ns, At safepoint: 18412000 ns, Total: 18415234 ns
# Reaching safepoint = 等所有线程跑进安全点的时间;At safepoint = GC 真正干活时间
\`\`\`

线程 Sleep/Blocked 时根本不在执行字节码,轮询不到 —— 于是引出**安全区域(Safe Region)**:

\`\`\`text
安全区域:一段引用关系必然不变的代码区间。
  进入时:线程登记"我在安全区域内",这段期间 GC 随时可以开工,不用等它
  离开前:先检查 GC(或安全点操作)是否已完成,没完成就原地等完再走
典型位置:线程 Sleep、阻塞等待 IO、JNI 调用期间
\`\`\`

> [!interview] 高频追问:Reaching safepoint 特别长,先查什么?
> ① **超长循环**:早期 C2 的可数循环(countable loop)不插安全点轮询,一根线程跑上亿次的循环能把全场 GC 拖住数秒,JDK10 引入循环剥离挖掘(loop strip mining)后大幅缓解;② 线程卡在页错误、大对象分配或系统调用上;③ 定位:-Xlog:safepoint 看耗时分布,配合 ==-XX:+SafepointTimeout -XX:SafepointTimeoutDelay=500== 抓出"赖着不停"的线程。

## 面试速记

- 判活:JVM 用**可达性分析**,不用引用计数(循环引用无解)。
- GC Roots:三张栈 + 静态 + 常量 + JNI + JVM 内部对象 + synchronized 持有。
- 三算法:清除有碎片、复制费空间、整理无碎片但慢;新生代复制、老年代整理。
- 晋升四路:15 岁、动态年龄判定、大对象直入、分配担保失败。
- finalize 只有一次自救机会且已废弃;生产用 try-with-resources。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch05',
        title: '垃圾收集器详解(Serial/Parallel/CMS/G1/ZGC 演进与对比)',
        minutes: 30,
        points: ['收集器演进', 'CMS 四阶段', 'G1 Region', '停顿预测', 'ZGC'],
        content: `
> [!interview] 章节定位
> 收集器题的标准答法:**算法相同、并发策略不同,本质是"停顿时间"与"吞吐量"的权衡**。演进主线:单线程 → 多线程 → 并发 → 分区域 + 可预测停顿 → 亚毫秒级。答的时候补一句"JDK8 默认 Parallel,JDK9+ 默认 G1",专业感立刻到位。

> [!info] 本章导读 · CMS、G1、ZGC,面试官到底想听什么?
> 收集器不是越新越好,而是在停顿时间、吞吐量、内存占用之间做取舍,像出行可以选自行车、汽车或高铁,各有各的代价。每一代收集器的出现,都是为了解决上一代在真实业务里暴露的问题。本章沿着演进主线,把主流收集器的原理与适用场景一次讲透。
> - 读完本章你将能:按单线程、多线程、并发、分区、亚毫秒五个阶段复述收集器演进
> - 说清 CMS 的并发失败与碎片问题,以及 G1 的 Region 与停顿预测模型
> - 面对低延迟或高吞吐需求,给出收集器选型与关键参数

> [!tip] 日常电脑现场 · 不同小区垃圾车
> 老小区路窄,只能派一辆小车慢慢收;新小区路宽、垃圾量大,换成大车加分路线,高峰再临时加派。收集器选型也是这个逻辑:堆小图省事,堆大追低停顿,没有一辆车能通吃所有小区。

## 收集器演进时间线

\`\`\`text
Serial(1.3) → ParNew/PS(1.4) → CMS(1.5 实验) → Parallel Old(1.6)
→ G1(1.7 实验, 9 默认) → ZGC(15 生产) → 分代 ZGC(21)
\`\`\`

| 年代 | 收集器 | 停顿目标 | 适用堆 |
| --- | --- | --- | --- |
| JDK 1.3 | Serial / Serial Old | 几十~几百 ms | < 100MB |
| JDK 1.4 | ParNew、Parallel Scavenge | 随 CPU 核数下降 | 100MB~4GB |
| JDK 1.5~1.6 | CMS | 目标 < 100ms | 4~16GB |
| JDK 1.7~8 | G1 | -XX:MaxGCPauseMillis(默认 200ms) | 4~64GB |
| JDK 15+ | ZGC | **< 1ms** | 几百 MB~16TB |
| JDK 21 | 分代 ZGC | < 1ms | 同上 |

主线:停顿从秒级 → 毫秒 → 亚毫秒,堆从 MB → TB。

为什么 ZGC 能亚毫秒?==着色指针==把标记位存进指针高位,==读屏障==让应用线程顺手修正引用,标记/转移/重映射全并发;STW 只剩与堆大小无关的根扫描,堆从 1GB 到 1TB 停顿几乎不变。

> [!tip] 背诵版
> Serial 打基础,Parallel 要吞吐,CMS 抢低延迟,G1 可预测,ZGC 停顿与堆大小无关。

## 收集器全家福

| 收集器 | 区域 | 线程 | 算法 | 目标 | 现状 |
| --- | --- | --- | --- | --- | --- |
| Serial | 新生代 | 单线程 | 复制 | 简单高效 | 客户端/小内存 |
| ParNew | 新生代 | 多线程 | 复制 | 配合 CMS | 已随 CMS 退场 |
| Parallel Scavenge | 新生代 | 多线程 | 复制 | **吞吐量优先** | JDK8 默认新生代 |
| Serial Old | 老年代 | 单线程 | 整理 | 兜底 | 仍在(CMS 失败后备) |
| Parallel Old | 老年代 | 多线程 | 整理 | 吞吐量优先 | JDK8 默认老年代 |
| **CMS** | 老年代 | 并发 | **标记-清除** | 最短停顿 | JDK9 废弃、14 移除 |
| **G1** | 全堆 | 并发 | Region 复制+整理 | **可控停顿** | JDK9+ 默认 |
| ZGC | 全堆 | 并发 | 着色指针 | **<1ms 停顿** | JDK15+ 生产可用 |

概念辨析(必考):**并行** = 多条 GC 线程一起干活,用户线程仍停顿;**并发** = GC 线程与用户线程同时执行。

一行代码验证当前 JVM 实际在用哪套收集器(面试演示小技巧):

\`\`\`java
import java.lang.management.ManagementFactory;
import java.util.List;

public class WhichGC {
    public static void main(String[] args) {
        List<String> opts = ManagementFactory.getRuntimeMXBean().getInputArguments();
        System.out.println("启动参数: " + opts);
        ManagementFactory.getGarbageCollectorMXBeans().forEach(bean ->
                System.out.println("收集器: " + bean.getName()));
    }
}
\`\`\`

\`\`\`output
# java -XX:+UseG1GC WhichGC 的运行结果
启动参数: [-XX:+UseG1GC]
收集器: G1 Young Generation
收集器: G1 Old Generation
\`\`\`

## CMS:四阶段与死因

\`\`\`text
① 初始标记(STW,极短):只标 GC Roots 直接关联的对象
② 并发标记(与用户线程并发):沿引用链遍历,耗时大头但不停顿
③ 重新标记(STW,较短):修正并发期间引用变动(增量更新)
④ 并发清理(并发):清除死亡对象,与用户线程同时进行
\`\`\`

三大死因:

- **CPU 敏感**:并发阶段和用户线程抢核,核少时吞吐暴跌。
- **浮动垃圾 + Concurrent Mode Failure**:并发清理期间用户线程还在产垃圾,老年代被塞满 → 退化为 Serial Old 单线程整理,停顿秒级。
- **内存碎片**:标记-清除不整理,大对象找不到连续空间 → 提前触发 Full GC。

> [!pitfall] CMS 调参的纠结旋钮
> ==-XX:CMSInitiatingOccupancyFraction==(默认 92)控制"老年代占用到多少才启动 CMS"。调低能降低并发失败概率,但 GC 变得更频繁 —— CMS 时代调优最拧巴的一个参数,G1 之后大家都解脱了。

## G1:Region 化的"回收价值优先"收集器

核心设计:

- 堆划分为约 2048 个等大 **Region**(1-32MB,2 的幂);每个 Region 动态扮演 Eden/Survivor/Old/**Humongous**(巨型对象区,存超过半个 Region 的对象)。
- **Garbage First 名字的由来**:维护每个 Region 的回收价值(回收可得空间 ÷ 回收耗时),每次优先回收价值最高的 Region。
- **停顿预测模型**:-XX:MaxGCPauseMillis=200,G1 根据历史数据算"这次最多收几个 Region 才能在 200ms 内收完"。
- 跨 Region 引用:每个 Region 的 Remembered Set 记录"谁引用了我",避免全堆扫描。
- 两个阶段:并发标记(**SATB,原始快照**)→ Mixed GC(Evacuation:把存活对象拷到新 Region,顺带完成整理)。

| 维度 | CMS | G1 |
| --- | --- | --- |
| 算法 | 标记-清除(有碎片) | 整体整理 + Region 间复制(无碎片) |
| 回收范围 | 只管老年代 | 新生代 + 部分老年代 Region(Mixed) |
| 停顿 | 不可控 | MaxGCPauseMillis 预测模型 |
| 内存布局 | 连续分代 | 离散 Region,物理分代弱化 |
| 状态 | JDK14 已移除 | JDK9+ 默认 |

G1 的最小生产配置与日志形态:

\`\`\`shell
java -Xms4g -Xmx4g -XX:+UseG1GC \\
  -XX:MaxGCPauseMillis=200 \\
  -XX:InitiatingHeapOccupancyPercent=45 \\
  -Xlog:gc*:file=gc.log:time,uptime,level,tags \\
  -jar app.jar
\`\`\`

\`\`\`output
[info][gc] GC(0)  Pause Young (Normal) (G1 Evacuation Pause) 512M->64M(4G)
[info][gc] GC(18) Pause Young (Concurrent Start) (G1 Humongous Allocation)
[info][gc] GC(19) Concurrent Mark Cycle 1024M->1024M(4G)
[info][gc] GC(20) Pause Young (Normal) (G1 Evacuation Pause) 896M->72M(4G)  # Mixed 阶段顺带回收老年代 Region
\`\`\`

> [!interview] 高频追问:G1 的 Mixed GC 和 Full GC
> Mixed GC:回收**全部新生代 + 部分老年代 Region**(按价值挑),是 G1 的常态工作方式。Full GC 是 G1 的**失败模式**:并发标记跟不上分配速度(Evacuation Failure),退化为单线程串行回收。生产上 G1 出问题十有八九是日志里的 ==to-space exhausted==,解法:加大堆、调 -XX:G1ReservePercent、降低 IHOP 阈值让并发标记更早启动。

## ZGC:亚毫秒停顿的暴力美学

- **着色指针(Colored Pointer)**:64 位指针里借几位存 GC 元信息(可达态、finalize 态、重定位态),GC 状态直接编码在指针里。
- **读屏障(Load Barrier)**:用户线程加载引用时插一小段校验,发现指针"过时"就地自愈(触发并发重定位/重映射)。
- 效果:停顿 **<1ms** 且不随堆变大而增长,支持 TB 级堆;代价:吞吐量损失约 10%,内存多占用。
- JDK21 **分代 ZGC**:补上分代设计后吞吐进一步改善。

JDK21 开启分代 ZGC 只需一个参数:

\`\`\`shell
java -Xms16g -Xmx16g -XX:+UseZGC -XX:+ZGenerational -jar app.jar
\`\`\`

\`\`\`output
[0.512s][info][gc,startup] ZGC 堆 16G,分代模式已开启
[12.345s][info][gc] GC(42) Minor Pause 28us      # 停顿单位是微秒
[15.678s][info][gc] GC(43) Major Pause 36us
\`\`\`

> [!tip] 选型话术(面试直接用)
> 小堆追求吞吐 → Parallel;通用服务 → **G1(默认不用动)**;超大堆 + 延迟极端敏感(网关/交易核心)→ **ZGC**。说"我压测对比过 G1 和 ZGC 在我们 8G 堆下的表现,G1 的停顿已满足 SLA,换 ZGC 吞吐反而亏 10%,所以没换" —— 有数据、有取舍,比背参数加分十倍。

## GC 日志实战与收集器选型

### 开启 GC 日志:JDK17 一条参数

\`\`\`shell
# JDK9+ 统一日志 = 标签[+子标签]:级别 + 装饰器 + 输出目标
java -Xlog:gc* -jar app.jar                          # 全量打到控制台,本地先这么看
java -Xlog:gc*:file=/data/logs/gc.log:time,uptime,level,tags:filecount=5,filesize=50m -jar app.jar
# 对照 JDK8 老三样:-XX:+PrintGCDetails -XX:+PrintGCDateStamps -Xloggc:/data/logs/gc.log
\`\`\`

\`\`\`output
[0.013s][info][gc] Using G1
[0.047s][info][gc,heap,coops] Heap address: 0x0000000600000000, size: 4096 MB, Compressed Oops mode: Zero based, Oop shift amount: 3
[0.621s][info][gc,startup] G1 Heap Region Size: 2M
[12.534s][info][gc] GC(0) Pause Young (Normal) (G1 Evacuation Pause) 512M->72M(4096M) 21.342ms
\`\`\`

启动先看前三行:收集器是谁、堆多大、Region 多大 —— 三秒确认 JVM 配置符合预期;每条 GC 记录自带编号 GC(n) 与末尾的真实停顿毫秒数。

### 一段真实 G1 日志逐行解读

\`\`\`text
[10:21:03.512][info][gc] GC(21) Pause Young (Normal) (G1 Evacuation Pause)
  Eden: 1408M->0M(1408M) Survivors: 128M->256M Old: 896M->960M(2048M) Humongous: 64M->32M(2048M) 46ms
  ① GC(21):全局自增编号,排查问题按编号对齐时间线
  ② Pause Young:STW 年轻代回收;Evacuation = 存活对象整体搬到空 Region
  ③ Eden 1408M->0M:整区清空,不代表"回收了 1.4G",是幸存者被搬走了
  ④ Survivors 128M->256M:本次存活偏多;连续多期翻倍 → 查 Survivor 是否配小
  ⑤ Old +64M:晋升量!老年代健康看这个增量的斜率,不是绝对值
  ⑥ Humongous:超半个 Region 的大对象专区;占用不降 = 大对象设计有问题
  ⑦ 46ms:真实停顿体感,对照 MaxGCPauseMillis=200 的目标
危险信号长这样:
[10:25:12.011][info][gc] GC(40) To-space exhausted            ← Evacuation 找不到空 Region 了
[10:25:12.090][info][gc] GC(40) Pause Full (G1 Compaction Pause) 2048M->860M(4096M) 1.32s
\`\`\`

To-space exhausted = 本轮拷贝时预留的 to 区(空闲 Region)耗尽,回收失败退化成串行 Full GC,1.32 秒停顿就是它标的价。三板斧:加堆;==-XX:G1ReservePercent=20== 多留 to 区;降 ==-XX:InitiatingHeapOccupancyPercent== 让并发标记更早启动。

### ZGC 进阶:着色指针 + 读屏障

ZGC(JDK11 实验、15 生产、21 分代)停顿 <1ms 且不随堆变大,全靠两件武器:

\`\`\`text
① 着色指针(Colored Pointers):64 位指针借出 4 位存 GC 元信息
   [18 位保留][42 位对象地址][Finalizable][Remapped][Marked0][Marked1]
                                        └─ 三个视图位:标记/搬运状态直接写在指针上
② 读屏障(Load Barrier):每次从堆加载引用时校验指针颜色,发现"坏色"就地自愈
   旧指针 → 查转发表 → 改写成对象新地址 → 放行(并发重定位)
   对象边跑边搬,谁读到旧引用谁顺手改 → 用户线程几乎无感
   停顿只剩"扫根节点"(栈/寄存器里那点引用)→ 亚毫秒且与堆大小无关
\`\`\`

### Shenandoah:Brooks 转发指针的另一条路

Red Hat 主导,JDK12 引入(Oracle JDK 不含,需带 Shenandoah 的 OpenJDK 构建)。不借位指针、不改指针布局,而是给每个对象加一个 **Brooks 转发指针**:平时指向自己,对象被搬运后指向新地址 —— 所有访问经它一跳永远拿到最新对象,靠读写屏障维护,同样做到并发整理、毫秒级停顿;代价是对象变大、吞吐损耗比 ZGC 略高。

\`\`\`shell
# Shenandoah 开启方式(需含 Shenandoah 的 OpenJDK 构建)
java -Xms8g -Xmx8g -XX:+UseShenandoahGC -jar app.jar
\`\`\`

\`\`\`output
[0.021s][info][shenandoah] Heuristics ergonomically sets::A  # 启动即标注启发式策略
[8.223s][info][shenandoah] Pause Init Mark 0.21ms
[8.351s][info][shenandoah] Concurrent evacuation 128M->12M   # 并发搬运,用户线程不停
[8.401s][info][shenandoah] Pause Final Mark 0.34ms
\`\`\`

### 收集器选型决策表

| 场景 | 推荐 | 理由与关键参数 |
| --- | --- | --- |
| 后台批处理/定时任务,吞吐至上 | Parallel GC | -XX:+UseParallelGC,总吞吐最高,不在乎单次停顿 |
| 通用在线服务(4-16G 堆) | **G1(默认)** | JDK9+ 不加参数即 G1,MaxGCPauseMillis 按 SLA 调 |
| 大堆 + 极致低延迟(交易/网关) | **ZGC** | -XX:+UseZGC(JDK21 加 -XX:+ZGenerational),<1ms 稳定停顿 |
| 小内存(<512M)/单核容器 | Serial | -XX:+UseSerialGC,无线程协作开销,小堆下反而干脆利落 |
| JDK8 存量系统 | Parallel(默认) | 动收集器前先压测,别为了新而新 |

> [!best] 选型话术模板
> "我们 8G 堆、P99 目标 300ms,JDK17 默认 G1 压测已满足,没必要换 ZGC(吞吐约亏 10%);堆上到 32G、延迟敏感再评估。"—— 有场景、有数字、有取舍,胜过背十个参数。

### 新生代比例参数速查

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| -XX:NewRatio | 2 | 老年代:新生代 = 2:1,即新生代占堆 1/3 |
| -XX:SurvivorRatio | 8 | Eden:S0:S1 = 8:1:1 |
| -Xmn | 无 | 直接定新生代大小,与 NewRatio 二选一 |
| -XX:MaxTenuringThreshold | 15 | 晋升年龄上限(Mark Word 4 bit 顶格) |
| -XX:TargetSurvivorRatio | 50 | 动态年龄判定水位:某年龄及以下总和超 Survivor 的 50% 即集体晋升 |

> [!warn] 动新生代比例前先想动态年龄
> Survivor 调小 → 动态年龄判定更易触发 → 对象"集体提前晋升" → 老年代涨速反而加快(第 5 章晋升规则)。改比例前先看晋升速率,改完盯 Old 区斜率是否变陡。

## 面试速记

- 主线:Serial → Parallel(吞吐)→ CMS(停顿,已死)→ G1(可控停顿,默认)→ ZGC(亚毫秒)。
- 并发 vs 并行:GC 与用户线程同跑叫并发,GC 多线程齐跑叫并行。
- CMS 死因:浮动垃圾 Concurrent Mode Failure、内存碎片、CPU 敏感。
- G1 三板斧:Region、回收价值优先、停顿预测模型;失败模式是 to-space exhausted。
- ZGC 靠着色指针 + 读屏障做到 <1ms,代价约 10% 吞吐。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch06',
        title: 'JVM 调优实战(常用参数、jps/jstat/jmap/jstack/jconsole/arthas、GC 日志分析)',
        minutes: 35,
        points: ['生产参数', '四剑客', 'arthas', 'GC 日志', '调优案例'],
        content: `
> [!interview] 章节定位
> 调优题面试官想听的不是参数表,而是**"参数 → 工具 → 日志 → 决策"的完整闭环**。回答框架:先说目标(降停顿/提吞吐/防 OOM),再说用什么工具定位问题,最后说改了哪个参数、效果用什么数字验证。

> [!info] 本章导读 · 线上接口突然变慢,怎么证明是 GC 的锅?
> 调优不是背参数,而是一套观察、假设、验证的闭环:先用工具看到现场,再定位瓶颈,改完用数字证明有效。就像医生看病,先量体温拍片子,再开药复查。本章把常用工具与参数放进真实案例里。
> - 读完本章你将能:用 jps、jstat、jmap、jstack 四件套采集一次现场数据
> - 读懂一段 GC 日志,判断 Young GC 频率与老年代增长是否健康
> - 针对一个接口抖动案例,写出从定位到验证的完整调优步骤

> [!tip] 日常电脑现场 · 电脑变卡先看哪
> 电脑一卡,先按 Ctrl+Shift+Esc 打开任务管理器,看 CPU、内存、磁盘哪根柱子拉满,再决定关哪个进程,而不是上来就重装系统。JVM 调优是同一套顺序:先用 jstat 看回收频率,再看堆和线程,拿到数字才动手改参数。

## 常用参数:三大类分清

| 类别 | 参数 | 说明 |
| --- | --- | --- |
| 内存 | -Xms4g -Xmx4g | 初始/最大堆,**生产设成一样** |
| 内存 | -Xmn / -XX:SurvivorRatio=8 | 新生代大小 / Eden:S0:S1 |
| 内存 | -Xss1m | 单线程栈,海量线程场景可降 256k-512k |
| 内存 | -XX:MetaspaceSize=256m | 元空间扩容水位线(见下方易错点) |
| GC 器 | -XX:+UseG1GC -XX:MaxGCPauseMillis=200 | 收集器与停顿目标 |
| 诊断 | -XX:+HeapDumpOnOutOfMemoryError | OOM 自动 dump,生产必开 |
| 诊断 | -XX:HeapDumpPath=/data/dump | dump 落盘路径 |
| 日志 | -Xlog:gc*(JDK9+) | 统一日志(JDK8 用 -XX:+PrintGCDetails) |

\`\`\`shell
# 生产启动模板(JDK17 + G1)
java -Xms4g -Xmx4g -Xss1m \\
  -XX:MetaspaceSize=256m -XX:MaxMetaspaceSize=512m \\
  -XX:+UseG1GC -XX:MaxGCPauseMillis=200 \\
  -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/data/dump \\
  -Xlog:gc*:file=/data/logs/gc.log:time,uptime,level,tags:filecount=5,filesize=50m \\
  -jar app.jar
\`\`\`

> [!tip] MetaspaceSize 是高频易错点
> 它不是"元空间初始大小",而是**触发元空间扩容(连带一次 Full GC)的水位线**。默认很小,不设置时应用启动后可能连续几次 Full GC 一路扩容。生产经验:设 256m 以上,让应用平稳度过启动期。

## 命令行四剑客:jps / jstat / jmap / jstack

\`\`\`shell
jps -l                    # 1. 先找到目标进程
jstat -gc 12345 1000      # 2. 每秒刷新内存与 GC 统计
jmap -histo:live 12345 | head -n 20    # 3. 对象直方图找大头
jstack 12345 > /tmp/stack.txt          # 4. 线程栈,查死锁/卡死
\`\`\`

\`\`\`output
12345 app.jar
12680 jdk.jps/jdk.jps.internal.JpsLauncher -l
\`\`\`

jstat 输出解读(面试要求能报列名):

\`\`\`output
 S0C    S1C    S0U    S1U      EC       EU        OC         OU       MC     MU    YGC   YGCT   FGC  FGCT   GCT
2048.0 2048.0  0.0  680.2  16384.0  13002.1  40960.0  18204.3  2560.0 2483.1   42  0.834    2  0.412  1.246
\`\`\`

| 列 | 含义 | 看什么 |
| --- | --- | --- |
| EU / OU | Eden / 老年代已用 | OU 增长速度 = 晋升速率 |
| YGC / YGCT | Young GC 次数 / 总耗时 | 频率与单次耗时 |
| FGC / FGCT | Full GC 次数 / 总耗时 | **FGC 持续增长 = 有问题** |
| MC / MU | 元空间容量 / 已用 | MU 接近 MC → 元空间紧张 |

\`\`\`shell
# 手动 dump(生产更推荐靠 OOM 自动 dump,这里是应急)
jmap -dump:live,format=b,file=/data/dump/heap.hprof 12345
\`\`\`

\`\`\`output
Heap dump file created [1832451200 bytes in 4.102 secs]
\`\`\`

\`\`\`shell
jstack 12345 | grep -A 15 "deadlock"
\`\`\`

\`\`\`output
Found one Java-level deadlock:
"Thread-1":
  waiting to lock <0x000000076ab62208> (a Object)
"Thread-0":
  waiting to lock <0x000000076ab621b8> (a Object)
\`\`\`

> [!warn] jmap dump 会停顿 JVM
> -dump 参数会触发一次 Full GC 并长时间停顿(GB 级堆可能停几十秒),生产要先摘流量再 dump,或直接依赖 ==HeapDumpOnOutOfMemoryError== 的事后文件。arthas 的 heapdump 同样有影响,都要挑时机。

## 图形化与在线诊断:jconsole 与 Arthas

jconsole:JDK 自带,连上看内存池曲线、线程数、类加载数,适合本机与预发环境。

顺手把工具箱补齐,一句话记定位:**jinfo** 查/改运行时 flag(jinfo -flags 12345,动态调日志级别这类小操作用它);**VisualVM** 图形化综合体检,装插件后可采样 CPU/内存;**JHSDB** HotSpot 官方调试器(JDK9+ 用 jhsdb jmap --heap 看堆布局,或 jhsdb clhsdb 进命令行),深挖对象在堆里的真实摆放;**JMC + JFR** 飞行记录仪,持续低开销采样、事后回放定位 —— 生产常开 JFR 采集,比事后 dump 更从容。

Arthas 是线上排查神器,五个必会命令:

\`\`\`shell
./as.sh
[arthas@12345]$ dashboard              # 实时面板:线程/内存/GC 一屏总览
[arthas@12345]$ thread -n 3            # 最忙的 3 个线程(带栈)
[arthas@12345]$ thread -b              # 直接找死锁
[arthas@12345]$ trace com.demo.OrderService createOrder   # 方法内部每步耗时
[arthas@12345]$ watch com.demo.OrderService createOrder "{params,returnObj}" -x 2
[arthas@12345]$ jad com.demo.OrderService                 # 反编译线上代码,确认版本
\`\`\`

\`\`\`output
[arthas@12345]$ thread -n 1
"qtp123-456" Id=456 cpuUsage=87% deltaTime=2ms
    at com.demo.util.PriceRule.calc(PriceRule.java:57)   # CPU 元凶当场现形
\`\`\`

## GC 日志分析:读出健康度

\`\`\`text
[2026-11-14T10:21:03.512+0800][12.345s][info][gc] GC(12) Pause Young (Normal) (G1 Evacuation Pause)
    Eden: 1408M->0M(1408M) Survivors: 0M->128M Old: 512M->512M(2048M)
[2026-11-14T10:21:03.540+0800][12.373s][info][gc] GC(12) User=0.03s Sys=0.01s Real=0.02s
\`\`\`

解读:G1 第 12 次 Young GC,耗时 28ms(Evacuation 拷贝型回收);Eden 清空、幸存区从 0 涨到 128M、老年代没动。

健康判断表:

| 指标 | 健康 | 危险信号 |
| --- | --- | --- |
| Young GC 频率 | 分钟级一次 | 秒级多次 = 对象创建过快或 Eden 太小 |
| Young GC 耗时 | <50ms | >200ms 检查幸存区与晋升 |
| 老年代占用 | 稳定波动 | **只涨不跌 = 泄漏**(第 8 章) |
| Full GC | 0 次 | 一天一次以上必须处理 |

> [!best] 把日志丢给工具
> 本地用 GCViewer,或把 gc.log 扔进 gceasy.io 一键出图与建议。面试说"我一般把日志丢 gceasy 看吞吐率和停顿分布",实操感直接拉满。

## 一个完整调优案例(讲得出数字的话术)

场景:订单查询接口 P99 抖动。GC 日志显示 Young GC 8 秒一次、单次 180ms,晋升速率偏高。

决策链:Eden 一次性装 8G 太满 → 单次回收对象多、耗时长 → 缩小 -Xmn 并把 SurvivorRatio 调到 4(Survivor 更大,缓解动态年龄判定)→ Young GC 3 秒一次、单次 60ms,P99 从 620ms 降到 180ms。

> [!pitfall] 调优前先确认瓶颈真的是 JVM
> 接口慢的常见根因排序:**下游 RPC 与 SQL 的影响远大于 GC**。先用 arthas trace 拿方法耗时分布,确认 GC 占比后再动手调参 —— 面试官最爱问"你怎么证明是 GC 的问题",答案就是 trace 耗时与 GC 日志时间对齐。

## JFR 与 Java Agent:线上诊断的两把利刃

### JFR:JDK 自带的"黑匣子"

JFR(Java Flight Recorder)从 JDK 11 起开源,JDK 17 可以放心在生产常开。它以**事件**形式持续记录 GC、线程、锁、类加载、方法采样、IO、异常等数据,落盘成 .jfr 文件。开销通常只有 **1%-2%**,所以最佳姿势是"平时开着,出事回放",比出问题再 jmap dump 更从容。

\`\`\`shell
# 方式一:启动即录,60 分钟后自动落盘(profile 采样更细)
java -XX:StartFlightRecording=filename=/data/logs/app.jfr,duration=60m,settings=profile \\
  -jar app.jar

# 方式二:运行中按需录 5 分钟(推荐,现场取证)
jcmd 12345 JFR.start name=check settings=profile duration=5m filename=/data/logs/check.jfr
jcmd 12345 JFR.dump name=check filename=/data/logs/check.jfr
\`\`\`

\`\`\`output
Recording 1: name=check, duration=5 min, settings=profile
Started recording 1.
Recording 1 dumped to /data/logs/check.jfr
\`\`\`

录完用 ==jfr print== 回放关键事件,或用 JMC(JDK Mission Control)图形化看火焰图与停顿分布:

\`\`\`shell
jfr print --events jdk.GCPhasePause,jdk.ExecutionSample /data/logs/check.jfr | head -n 30
\`\`\`

\`\`\`output
jdk.GCPhasePause {
  startTime = 10:21:03.512
  duration = 28.4 ms
  name = "G1 Evacuation Pause"
}

jdk.ExecutionSample {
  startTime = 10:21:04.120
  sampledThread = "http-nio-8080-exec-3" (javaThreadId = 39)
  state = "STATE_RUNNABLE"
  stackTrace = [
    com.demo.OrderService.calc(OrderService.java:57)
    com.demo.OrderController.query(OrderController.java:31)
  ]
}
\`\`\`

> [!tip] 为什么 JFR 开销这么低?
> ① **事件化 + 采样**:方法热点默认按毫秒级采样,不是每个方法都插桩;② 线程本地缓冲,先把事件写进线程自己的 buffer,再批量刷到全局,避免锁竞争;③ 大部分事件有阈值/节流,不是无条件记录;④ 记录过程不依赖 safepoint。经验值:default 配置约 1%,profile 约 2%,极端高并发下一般也不超过 5%。

### jcmd:一个入口管住所有诊断

JDK 7 起就提供了 jcmd,如今一个入口就能覆盖参数、堆、线程、JFR、NMT:

\`\`\`shell
jcmd                                   # 列出所有 Java 进程及 PID
jcmd 12345 VM.flags                    # 生效参数及来源(确认堆/GC 器)
jcmd 12345 GC.heap_info                # 各代或 Region 占用汇总
jcmd 12345 Thread.print                # 线程栈,等同 jstack
jcmd 12345 GC.class_histogram          # 类直方图,等同 jmap -histo
jcmd 12345 JFR.dump name=check filename=/data/logs/check.jfr
jcmd 12345 VM.native_memory summary    # 堆外内存,需启动加 -XX:NativeMemoryTracking=summary
\`\`\`

| 命令 | 作用 | 典型场景 |
| --- | --- | --- |
| jcmd PID VM.flags | 打印生效参数与来源 | 确认启动脚本有没有覆盖堆大小、GC 器 |
| jcmd PID GC.heap_info | 堆/Region 占用汇总 | 10 秒判断老年代是否只涨不跌 |
| jcmd PID Thread.print | 线程栈 | 死锁、卡顿、线程数暴涨 |
| jcmd PID GC.class_histogram | 类实例数/字节数排行 | 快速找内存大头,可替代 jmap -histo |
| jcmd PID JFR.dump | 导出飞行记录 | 保留现场,事后回放 |
| jcmd PID VM.native_memory summary | Native Memory Tracking | 堆没满却 OOM,查堆外/线程/元空间 |

### Java Agent 与字节码增强

Java Agent 是 JVM 支持的一种"外挂":以 jar 形式提供两个入口 —— **premain**(启动时 ==-javaagent:agent.jar==,在 main 之前执行)和 **agentmain**(运行期通过 Attach API 动态挂载,不用重启)。核心 API 是 ==Instrumentation==:注册 ClassFileTransformer 拦截类加载,或对已加载类 retransformClasses 重新转换字节码。

\`\`\`java TimerAgent.java
package com.demo.agent;

import java.lang.instrument.ClassFileTransformer;
import java.lang.instrument.Instrumentation;
import java.security.ProtectionDomain;

public class TimerAgent {
    // 启动加载:-javaagent:timer-agent.jar
    public static void premain(String args, Instrumentation inst) {
        inst.addTransformer(new ClassFileTransformer() {
            @Override
            public byte[] transform(ClassLoader loader, String className,
                                    Class<?> classBeingRedefined,
                                    ProtectionDomain domain, byte[] bytes) {
                if ("com/demo/OrderService".equals(className)) {
                    // 真实实现:用 ASM / Byte Buddy 在这里插入方法计时字节码
                    return bytes;          // 返回 null 表示不修改,返回新数组表示替换
                }
                return null;
            }
        }, true);                          // true = 允许 retransform
    }

    // 运行期 attach 入口
    public static void agentmain(String args, Instrumentation inst) throws Exception {
        premain(args, inst);
        for (Class<?> c : inst.getAllLoadedClasses()) {
            if (c.getName().equals("com.demo.OrderService")) {
                inst.retransformClasses(c);    // 只重转目标类
            }
        }
    }
}
\`\`\`

\`\`\`text
MANIFEST.MF 必须声明(否则 attach 时找不到入口):
Premain-Class: com.demo.agent.TimerAgent
Agent-Class: com.demo.agent.TimerAgent
Can-Retransform-Classes: true
\`\`\`

> [!info] Arthas 与 JVMTI 各一句话
> **Arthas 的 watch/trace**:动态 attach 到目标 JVM → 加载 agent → 用字节码增强在方法前后插桩,采集入参、返回值、耗时与调用链,所以能不重启就"看见"线上方法。**JVMTI**(JVM Tool Interface)是 JVM 暴露的 native 级工具接口,提供线程、类加载、GC、调试等钩子,IDE 调试器与 Arthas 等工具的底层能力都依赖它。

> [!danger] Agent 生产三条红线
> ① retransform 只能改方法体,**不能改方法签名、增删字段**;② 增强代码抛异常会导致目标类加载/转换失败,必须 try-catch 兜底并返回 null;③ attach 需要与目标进程相同的用户权限,生产优先用 Arthas/JFR 等成熟工具,自研 agent 必须灰度和可回滚。

## 面试速记

- 生产参数底线:堆上下一致、OOM 自动 dump、GC 日志落盘、MetaspaceSize 设 256m+。
- 四剑客:jps 找进程 → jstat 看 GC 统计 → jmap 看对象/ dump → jstack 看线程。
- jstat 重点列:EU/OU(晋升速率)、YGC/FGC 频率、MC/MU(元空间)。
- GC 日志四看:Young GC 频率、单次耗时、老年代是否只涨不跌、Full GC 次数。
- 调优话术闭环:目标 → trace 确认瓶颈 → 改参 → 用停顿/吞吐数字验证效果。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch07',
        title: '内存泄漏与 OOM 排查实战(典型泄漏场景、dump 分析、线上排查 SOP)',
        minutes: 35,
        points: ['泄漏vs溢出', 'ThreadLocal', 'dump 分析', 'CPU 飙高', '排查 SOP'],
        content: `
> [!interview] 章节定位
> 这一章把前面所有知识变成"保命能力"。面试问法:"线上 OOM 你怎么排查?""有没有真实的内存泄漏经历?" —— 答题骨架:**泄漏 vs 溢出的关系 → 典型场景对号入座 → dump 分析定位引用链 → SOP 流程完整复述**。

> [!info] 本章导读 · 凌晨三点 OOM,你第一分钟做什么?
> OOM 不是一个错误码,而是一类症状:堆、元空间、直接内存、线程栈都可能爆,病因和药方完全不同。真正值钱的能力,是在压力下按流程拿到 dump、找到引用链、定位到那一行代码。本章把这条保命路径练成肌肉记忆。
> - 读完本章你将能:按 OOM 类型分别说出排查入口
> - 用 MAT 打开 dump,找到大对象并追到 GC Roots 的引用链
> - 复述 CPU 飙高与内存泄漏两套线上排查 SOP

> [!tip] 日常电脑现场 · 存储空间不足
> 手机用久了弹"存储空间不足",照片拍不了、微信收不了文件,得先删视频或清缓存才能接着用 —— 空间被占满后,所有新动作都会失败。浏览器一口气开三十个标签,内存吃光后整页变成"喔唷,崩溃啦",和 Java 抛 OutOfMemoryError 是同一种结局。

## 泄漏 vs 溢出:一对因果

| 概念 | 定义 | 关系 |
| --- | --- | --- |
| 内存泄漏 Leak | 对象已无用,但仍有引用指向,GC 无法回收 | 是因 |
| 内存溢出 OOM | 堆/元空间/栈真的装不下了 | 是果(也可能直接溢出:堆太小、瞬时大对象) |

泄漏的危害有滞后性:不报错,只是老年代曲线"只涨不跌",直到某天 OOM。**盯 OU 曲线斜率是最便宜的预警手段**。

四种典型泄漏(业务无用、可达):

\`\`\`java
static Map<String, byte[]> CACHE = new HashMap<>();  // ① 静态集合
CACHE.put(k, v);            // 查:jmap -histo,MAT 追 Roots
TL.set(v);                  // ② ThreadLocal 未 remove,查空 key 的 Entry
eventBus.register(this);    // ③ 监听器未注销,查 listener 数
Connection c = ds.getConnection();
c.createStatement().execute(sql);   // ④ 未 close,查连接池/netstat
\`\`\`

> [!interview] 面试点
> 判据 ==Full GC 后老年代不降==;链:jmap dump → MAT 找 Dominator → 追 GC Roots → 定位到那一行 put/register。

## 五个典型泄漏场景(对号入座)

| 场景 | 根因 | 修复 |
| --- | --- | --- |
| static 集合当缓存 | 只 add 不失效,全局强引用 | 改 Caffeine(maximumSize + 过期) |
| ThreadLocal 不 remove | 池化线程不死,value 挂死 | finally 中 remove() |
| 资源未关闭 | 连接/流/响应体常驻堆 | try-with-resources |
| 监听器/回调未注销 | 发布者一直持有订阅者 | 用完 removeListener |
| 非静态内部类/匿名类 | 隐式持有外部对象引用 | 改静态类或独立对象 |

### ThreadLocal 泄漏:最常考的一个

\`\`\`java
public class ThreadLocalLeak {
    static ThreadLocal<byte[]> cache = new ThreadLocal<>();

    public static void main(String[] args) {
        Runnable task = () -> {
            cache.set(new byte[10 * 1024 * 1024]);   // 每根线程挂 10MB
            // ...业务逻辑
            // cache.remove();    ← 少了这行就是泄漏
        };
        for (int i = 0; i < 8; i++) {
            new Thread(task).start();   // 演示用裸线程;真实场景是线程池,线程永不死亡
        }
        System.out.println("8 根线程各挂 10MB,没人 remove,这 80MB 活到天荒地老");
    }
}
\`\`\`

\`\`\`output
8 根线程各挂 10MB,没人 remove,这 80MB 活到天荒地老
\`\`\`

原理:ThreadLocalMap 的 Entry 里,key 是弱引用(ThreadLocal 对象本身可被回收变 null),**value 是强引用**;线程不死 → Entry 一直可达 → value 永远泄漏。规范写法:==finally { cache.remove(); }==。

### static 集合泄漏的最小复现

\`\`\`java
import java.util.ArrayList;
import java.util.List;

public class StaticLeak {
    static final List<byte[]> CACHE = new ArrayList<>();   // 生命周期 = JVM

    public static void main(String[] args) {
        int i = 0;
        try {
            while (true) {
                CACHE.add(new byte[1024 * 1024]);   // 只进不出,没有失效策略
                i++;
            }
        } catch (OutOfMemoryError e) {
            System.out.println("放入 " + i + " 个 1MB 对象后 OOM");
        }
    }
}
\`\`\`

\`\`\`output
# java -Xmx256m StaticLeak 的运行结果
放入 246 个 1MB 对象后 OOM
\`\`\`

> [!pitfall] "自制缓存"是泄漏重灾区
> 自己用 Map/List 做缓存 = 自己管理淘汰策略 = 大概率忘。生产一律用 ==Caffeine==(maximumSize + expireAfterWrite),语义清晰还自带命中率统计。

## dump 分析:泄漏现场的"黑匣子"

\`\`\`shell
# 生产标配:OOM 自动 dump,事后有现场
# -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/data/dump

# 应急手动抓(会停顿,先摘流量)
jmap -dump:live,format=b,file=/data/dump/heap.hprof 12345

# 不想停顿的粗筛:对象直方图 Top20
jmap -histo:live 12345 | head -n 25
\`\`\`

\`\`\`output
 num     #instances         #bytes  class name (module)
-------------------------------------------------------
   1:       2851782      456285120  com.demo.cache.OrderCacheEntry
   2:         65304       47355264  [B (byte[])
   3:       1201888       28845312  java.lang.String
\`\`\`

MAT(Memory Analyzer Tool)四步定位法:

\`\`\`text
打开 heap.hprof → Leak Suspects Report(自动生成)
  ① 看 Problem Suspect:某某类实例占 89% 内存
  ② Dominator Tree:谁支配了这块内存
  ③ 右键该对象 → Path To GC Roots(exclude weak/soft references)
  ④ 引用链落到某行代码:static final CACHE 持有 → 定位修复
\`\`\`

> [!tip] 会看引用链就赢了 80%
> dump 分析的核心动作只有一个:**从可疑大对象出发,找到通往 GC Root 的引用路径**,路径上那个 static 字段、ThreadLocal 或监听器就是泄漏点。MAT / JProfiler / arthas 的 vmtool 都能干这件事。

## 线上 CPU 飙高:五步定位法(必背命令链)

\`\`\`shell
top -c                                   # 1. 找到最耗 CPU 的 Java 进程 pid
top -Hp 12345                            # 2. 进程内找到最忙的线程 tid(如 12350)
printf "%x\\n" 12350                      # 3. tid 转 16 进制 → 0x303e
jstack 12345 | grep -A 20 "nid=0x303e"   # 4. 栈里搜 nid,看这根线程在干嘛
jstat -gcutil 12345 1000                 # 5. 排除是 GC 线程在烧 CPU
\`\`\`

\`\`\`output
"main" #12 prio=5 os_prio=0 cpu=1980.00ms elapsed=24.10s nid=0x303e runnable
   java.lang.Thread.State: RUNNABLE
        at com.demo.rule.PriceRule.calc(PriceRule.java:57)   # 死循环/正则回溯现场
\`\`\`

三种常见结论:业务线程**死循环**(无界 while、正则回溯)、**GC 线程**(jstat 看 FGC,内存问题的表象)、**native 线程**(JIT 编译或本地库)。用 arthas 的 thread -n 3 可把前四步合成一步。

## OOM 排查 SOP(流程背下来)

| 步骤 | 动作 | 依据 |
| --- | --- | --- |
| 1 止血 | 摘流量/重启,保住 dump 现场 | HeapDumpPath 里找 .hprof |
| 2 定位区域 | 看 OOM 类型选排查路径 | heap / Metaspace / direct / thread 各不相同 |
| 3 分析 dump | MAT Leak Suspects → 引用链 → 定位代码 | 本章 dump 分析方法 |
| 4 修复验证 | 修复后压测,对比 OU 曲线与 FGC 次数 | 数字说话 |

\`\`\`text
OOM 类型速判:
Java heap space            → 查堆:dump 分析引用链
Metaspace                  → 查类加载:动态代理/脚本引擎/热部署泄漏
GC overhead limit exceeded → GC 花 98% 时间只回收 2%,本质还是堆问题
Direct buffer memory       → NIO 堆外内存,查 MaxDirectMemorySize 与 Netty 释放
unable to create native thread → 线程数爆了,查线程池配置与线程泄漏
\`\`\`

> [!warn] GC overhead limit exceeded 不是独立问题
> 它表示"GC 快把 CPU 烧完了仍救不回内存",是堆泄漏的另一种报错形态,处理方式与 Java heap space 完全相同 —— 别被名字骗去调 GC 参数。

## 元空间溢出实战案例

\`\`\`java
// 用 CGLIB 不带缓存地疯狂生成类,模拟类元数据膨胀(-XX:MaxMetaspaceSize=32m)
import net.sf.cglib.proxy.Enhancer;
import net.sf.cglib.proxy.MethodInterceptor;

public class MetaspaceOOM {
    public static void main(String[] args) {
        int i = 0;
        try {
            while (true) {
                Enhancer enhancer = new Enhancer();
                enhancer.setSuperclass(MetaspaceOOM.class);
                enhancer.setUseCache(false);   // 关缓存,每次都生成新类
                enhancer.setCallback((MethodInterceptor)
                        (obj, method, arg, proxy) -> proxy.invokeSuper(obj, arg));
                enhancer.create();
                i++;
            }
        } catch (Throwable e) {
            System.out.println("生成 " + i + " 个类后: " + e);
        }
    }
}
\`\`\`

\`\`\`output
生成 21784 个类后: java.lang.OutOfMemoryError: Metaspace
\`\`\`

真实世界的等价场景:Groovy 每次编译新脚本类、反射/代理频率过高且加载器被 static 持有、热部署反复 redeploy。验证手段:jstat 看 MC/MU 增长,arthas 的 ==classloader== 命令看已加载类数量。

## 面试速记

- 泄漏是因(引用不撒手)、溢出是果(装不下);泄漏的预警信号 = 老年代只涨不跌。
- 高频泄漏五件套:static 集合、ThreadLocal、未关资源、未注销监听器、内部类隐式引用。
- ThreadLocal 泄漏根因:key 弱引用回收后,value 强引用挂在永不死的池化线程上;用完必须 remove。
- 排查三板斧:jmap -histo 粗筛 → MAT 看 Leak Suspects → Path to GC Roots 找引用链。
- CPU 飙高五步:top → top -Hp → printf 十六进制 → jstack 搜 nid → jstat 排除 GC。
`,
      },
    ],
    interview: [
      { q: '什么是双亲委派模型?为什么需要?怎么打破?', a: '**收到加载请求先委托父加载器,父加载器加载不到才自己加载**。目的:① 安全 —— 自己写 java.lang.String 也轮不到自己加载,防核心类被篡改;② 避免重复加载,保证类的全局唯一。打破方式:**重写 loadClass 改变委派逻辑**(findClass 只是常规加载入口)。经典案例:SPI 的线程上下文类加载器(父加载器反向借用子加载器)、Tomcat WebappClassLoader 优先自己加载应用类、热部署换加载器实现重载。' },
      { q: 'JVM 堆和栈的区别?', a: '**栈线程私有,堆线程共享**;栈存栈帧(局部变量表、操作数栈、动态链接、返回地址),堆存对象实例。生命周期:栈随线程生灭,方法出栈即回收;堆对象由 GC 管理。异常:栈 → StackOverflowError(深递归)或 unable to create native thread(线程太多);堆 → OOM: Java heap space。速度:栈分配只需挪指针,纳秒级;堆分配要寻址与并发协调(TLAB 缓解)。' },
      { q: '对象什么时候会进入老年代?', a: '四条路径:① 年龄达到 **MaxTenuringThreshold(默认 15)**,受 Mark Word 4 bit 限制上限就是 15;② **动态年龄判定**:Survivor 中某年龄及以下对象总和超过 Survivor 一半,该年龄以上全部提前晋升;③ **大对象直接进**(-XX:PretenureSizeThreshold / G1 的 Humongous Region);④ **分配担保**:Minor GC 后 Survivor 放不下,老年代兜底接收。' },
      { q: 'GC Roots 有哪些?', a: '背清单:① **虚拟机栈**(栈帧局部变量表)引用的对象;② **方法区静态变量**引用的对象;③ **方法区 final 常量**引用的对象;④ **本地方法栈 JNI** 引用的对象;⑤ JVM 内部引用:基本类型 Class、常驻异常、系统类加载器;⑥ **synchronized 持有**的对象。补一句升华:GC Roots 的本质是所有"堆外指向堆内"的引用入口。' },
      { q: '内存泄漏和内存溢出的区别?', a: '**泄漏 Leak**:对象已无用但仍被引用,GC 回收不掉,是"慢性病";**溢出 OOM**:内存真的不够了,是"急性发作"。关系:泄漏持续累积最终导致溢出,是因果;但没有泄漏也可能直接溢出(堆太小、瞬时大对象、元空间类爆炸)。预警信号:老年代曲线只涨不跌,盯 jstat 的 OU 斜率。' },
      { q: 'CMS 和 G1 的区别?', a: '① 算法:CMS 标记-清除(有碎片),G1 整体整理 + Region 间复制(无碎片);② 范围:CMS 只管老年代,G1 全堆统一规划(Mixed GC);③ 停顿:CMS 不可控,G1 有 MaxGCPauseMillis 停顿预测模型;④ 内存布局:CMS 连续分代,G1 离散 Region;⑤ 状态:CMS JDK14 已移除,G1 JDK9+ 默认。CMS 死因:浮动垃圾导致 Concurrent Mode Failure、碎片化、CPU 敏感。' },
      { q: 'G1 的特点和原理?', a: '① 堆切成约 2048 个等大 **Region**(1-32MB),动态扮演 E/S/O/Humongous;② 维护每个 Region 的回收价值,**优先回收价值最高的** —— Garbage First 的名字由来;③ **停顿预测模型**:按 MaxGCPauseMillis 决定本次回收多少 Region;④ 跨 Region 引用用 Remembered Set + 卡表,避免全堆扫描;⑤ 流程:并发标记(**SATB 原始快照**)→ Mixed GC(Evacuation 拷贝存活对象)。失败模式:to-space exhausted 退化为串行 Full GC。' },
      { q: '什么情况下会触发 Full GC?', a: '① 老年代空间不足(晋升过快、大对象直入);② 元空间达到 MetaspaceSize 水位线;③ 显式 System.gc()(可用 -XX:+DisableExplicitGC 禁掉);④ CMS 的 Concurrent Mode Failure / G1 的 to-space exhausted 退化为单线程回收;⑤ 空间分配担保失败。排查顺序:jstat -gcutil 看 FGC 频率 → 看 OU 是否只涨不跌 → dump 分析引用链。' },
      { q: '强软弱虚四种引用的区别?', a: '**强**:普通引用,只要可达 OOM 也不回收;**软 SoftReference**:内存不足才回收,适合做敏感缓存;**弱 WeakReference**:下次 GC 必被回收,ThreadLocalMap 的 key 就是弱引用;**虚 PhantomReference**:get 恒为 null,唯一价值是配合 ReferenceQueue 在对象回收时收到通知,DirectByteBuffer 靠它释放堆外内存。' },
      { q: 'JIT 是什么?分层编译是什么?', a: '**即时编译器**:把热点字节码编译成本地机器码并缓存,热点方法默认调用 1 万次触发。**分层编译**(默认开启):0 层解释执行保启动,1-3 层 C1 编译快速预热,4 层 C2 深度优化保峰值。招牌优化:方法内联、锁消除、逃逸分析 + 标量替换。诊断:-XX:+PrintCompilation 看 编译队列。' },
      { q: '什么是逃逸分析?栈上分配?', a: '**逃逸分析**判断对象是否逃出方法/线程(被 return、赋给成员变量、被其他线程访问)。未逃逸对象可做**标量替换**:不 new 对象,把字段拆成局部变量放栈上 —— 无堆分配、无 GC 压力,还能顺带锁消除。验证:开关 -XX:-DoEscapeAnalysis 对比耗时,关闭后堆分配暴涨。注意:HotSpot 的"栈上分配"实际是通过标量替换实现的,不是完整意义的真栈分配。' },
      { q: '线上 CPU 飙高的排查步骤?', a: '五步:① ==top== 找最耗 CPU 的 Java 进程;② ==top -Hp pid== 找进程内最忙线程 tid;③ ==printf "%x" tid== 转 16 进制;④ ==jstack pid | grep nid== 定位线程栈,看 RUNNABLE 在干什么;⑤ ==jstat -gcutil== 排除是 GC 线程在烧 CPU。三种常见结论:业务死循环/正则回溯、频繁 GC(内存问题的表象)、native/JIT 编译。arthas 的 ==thread -n 3== 可一步到位。' },
      { q: '线上发生 OOM 怎么排查?', a: '前提:生产开 ==-XX:+HeapDumpOnOutOfMemoryError== 保住现场。四步:① 看 OOM **类型**(heap/Metaspace/direct memory/unable to create thread),不同类型排查路径完全不同;② MAT 打开 dump,Leak Suspects 找内存大头;③ 对大对象查 **Path to GC Roots**(排除弱软引用),引用链落点就是泄漏点;④ 修复后压测,对比 OU 曲线与 FGC 次数验证。heap OOM 十有八九是 static 集合/ThreadLocal/未关资源;Metaspace 是动态类生成或类加载器泄漏。' },
      { q: '为什么用元空间替换永久代?元空间还会溢出吗?', a: '替换原因:① 永久代受 MaxPermSize 限制且与堆耦合,动态生成类多的应用易 PermGen OOM;② 元空间用**本地内存**,可独立设 MaxMetaspaceSize,容量规划更清晰;③ HotSpot 与 JRockit 合一,JRockit 本无永久代。**会溢出**:MaxMetaspaceSize 设了上限,或动态代理/Groovy/热部署不断生成类且类加载器被长期持有 → OOM: Metaspace。排查:jstat 看 MC/MU,arthas classloader 看类数量。' },
      { q: 'intern 方法和 StringTable 在 JDK6 与 JDK8 的差异?', a: '① **位置**:StringTable 在 JDK6 位于**永久代**,JDK7 起移入**堆** —— 永久代只有 Full GC 才顺带回收,效率低、易 PermGen OOM;挪堆后 Minor GC 即可回收失效字符串。② **intern 行为**:JDK6 池中不存在时把堆上字符串**复制副本**入池并返回池中引用,intern 后与原对象不相等(false);JDK7+ 不复制,直接把堆上**引用**登记进池,首次 intern 后与原对象相等(true)。经典题:new String("a")+new String("b") 再 intern,JDK6 输出 false、JDK8 输出 true。③ 调优:StringTable 是哈希表,海量字符串场景用 -XX:StringTableSize(默认 60013)调大桶数降冲突,PrintStringTableStatistics 看平均桶大小。' },
      { q: '三色标记的漏标怎么解决?CMS 和 G1 分别怎么做?', a: '漏标需**同时满足两个条件**:① 黑对象新增了指向白对象的引用;② 灰对象到该白对象的全部引用被删除。解法 = 破坏任意一个:**CMS 增量更新** —— Post 写屏障记录新增的黑→白引用,重新标记(STW)时以黑为根补扫;重标开销大,浮动垃圾少。**G1 SATB 原始快照** —— Pre 写屏障记录被删除的旧引用,按标记开始那一刻的快照继续标;重标开销小(只处理记录的一撮旧引用),浮动垃圾多。背诵版:CMS"黑插白边就补扫",G1"快照时活着的都算活"。G1 选 SATB 是拿浮动垃圾换 STW 时间。' },
      { q: '什么是安全点?为什么需要?', a: '**安全点 = 线程执行到引用关系确定、OopMap 已登记的位置**,GC 在这里才能安全开工。为什么需要:① 可达性分析要求"引用关系瞬间冻结",用户线程必须停;② 线程不能停在任意指令 —— GC 不知道寄存器/栈槽里哪些是引用,所以只在**方法返回、循环回跳**处插桩,线程主动轮询全局标志,发现 GC 要开工就自己挂起并交出 OopMap;③ 所有线程到齐才真正 STW。补充**安全区域**:Sleep/Blocked 的线程不执行字节码,落在引用不变的安全区域内即可,离开前再检查 GC 是否完成。排查:-Xlog:safepoint 看 Reaching safepoint 耗时,超长循环是头号嫌疑。' },
      { q: '直接内存是什么?和堆的区别?OOM 怎么排查?', a: '定义:不属于运行时数据区,NIO 通过 Native 函数**直接向操作系统申请**的堆外内存,入口是 DirectByteBuffer,受 -XX:MaxDirectMemorySize(默认≈-Xmx)限制。区别:① **治理方** —— 堆受 -Xmx 管且 GC 直接治理;直接内存不归 GC 直接管,靠 Cleaner(虚引用)在堆对象被回收时释放;② **性能** —— 堆分配快,但 IO 要先复制到堆外临时缓冲;直接内存零拷贝,适合大文件与高频网络 IO。排查:报 **OOM: Direct buffer memory**,堆没满也炸 —— 查 NIO/Netty 是否只分配不释放、是否加了 -XX:+DisableExplicitGC 掐断求救式 System.gc()、上限是否过小;可用 -XX:NativeMemoryTracking=summary 看堆外分布。' },
      { q: 'Tomcat 的类加载器为什么打破双亲委派?', a: '核心诉求是**隔离与共享并存**。① 隔离:多个 webapp 可能带不同版本同名 jar(如 spring5/spring6),标准委派下先加载者胜出,第二个应用版本错乱;每个 webapp 一个 WebappClassLoader,优先加载自己 /WEB-INF/classes 与 /WEB-INF/lib 下的类,互不可见。② 共享:Tomcat 容器类与各应用公共库由 Common 加载器统一加载一份,省内存。策略(默认 delegate=false):**先自己找、找不到再委托父加载器**;JDK 核心类与 Servlet API 白名单仍强制委派防篡改。一个类仍只被一个加载器加载一次,打破的只是"先委托"顺序。' },
      { q: '为什么 Java 能一次编写到处运行?JVM 在其中扮演什么角色?', a: '① **编译产物是字节码**:javac 不生成机器码,而是生成与平台无关的 class 字节码,指令面向 JVM 而非某颗 CPU。② **JVM 做翻译**:每个平台安装自己的 JVM,由它解释执行同一份字节码,或由 JIT 编译成本地机器码,从而屏蔽操作系统与 CPU 差异。③ **统一运行时**:类加载、内存管理、GC、异常处理都由 JVM 负责,程序不直接依赖操作系统 API。④ **准确表述**:跨平台的是字节码加 JVM 这套中间层,不是 Java 源码本身;JVM 本身不跨平台,各平台有各自的实现。' },
      { q: 'JDK、JRE、JVM 三者什么关系?字节码和机器码有什么区别?', a: '① **包含关系**:JDK 包含 JRE,JRE 包含 JVM。JVM 是执行字节码的虚拟机;JRE 是 JVM 加核心类库,只够运行程序;JDK 是 JRE 加 javac、javap 等开发工具,开发者必须装 JDK。② **字节码**:面向 JVM 的中间指令,平台无关,由 javac 生成,需要 JVM 解释或 JIT 编译后才能执行。③ **机器码**:CPU 直接执行的二进制指令,与指令集架构绑定,x86 的程序不能跑在 ARM 上。④ **一句话**:字节码是 JVM 的母语,机器码是 CPU 的母语,JVM 负责把前者翻译成后者。' },
      { q: 'Mark Word 是什么?锁升级过程是怎样的?', a: '**Mark Word 是对象头 8 字节的复用存储区**:① 无锁存 hashCode 31 位 + 年龄 4 位,标志 01;② 偏向锁存线程 ID + epoch,标志 101;③ 轻量级锁存 Lock Record 指针,标志 00;④ 重量级锁存 ObjectMonitor 指针,标志 10。升级路径无锁→偏向→轻量级→重量级,只升不降;JDK 15 起偏向锁默认禁用。' },
      { q: 'JFR 是什么?解决什么问题?', a: '**JFR 是 JDK 内置的低开销飞行记录器**:① 以事件方式采集 GC、锁、方法采样等数据,开销约 1%-2%,可生产常开;② 启动加 -XX:StartFlightRecording=filename=app.jfr,或运行中 jcmd PID JFR.start/JFR.dump;③ 事后用 jfr print 回放慢方法与 GC 停顿;④ 解决现场难保留、dump 太重、日志不够细。' }
    ]
  };
})();