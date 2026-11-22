/* ═══════════════════════════════════════════════════════════
   模块:JavaSE 核心基础(12 章)
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.CONTENT = window.CONTENT || {};

  window.CONTENT.javase = {
    id: 'javase',
    title: 'JavaSE 核心基础',
    en: 'JAVA STANDARD EDITION',
    icon: 'coffee',
    color: '#f97316',
    tagline: '从语法筑基到并发进阶的修行地图',
    description: '覆盖 JavaSE 全部高频考点:面向对象三大特性、String 与包装类的陷阱、集合框架源码、并发编程、IO 与反射。每一章以面试真题驱动,ArrayList、HashMap、ConcurrentHashMap、线程池全部拆到源码级,六个交互演示把抽象概念变成看得见的动画。',
    minutes: '≈ 24 小时',
    chapters: [
      /* ─────────────────────────────────────────── */
      {
        id: 'ch01',
        title: '环境搭建与基础语法',
        minutes: 30,
        points: ['数据类型', '运算符陷阱', 'switch进化', '数组与排序'],
        content: `
> [!interview] 本章面试锚点
> "JDK、JRE、JVM 什么关系?int 溢出了会怎样?i++ 和 ++i 区别?"——基础章的面试价值在于**零容错**:第一次学不需要一遍记住。先完成前面的三章入门实验,能独立运行、修改程序,再回来理解边界情况。

> [!info] 本章导读 · 第一个 Hello World 背后,到底藏了多少东西?
> 装 JDK 装了三次还是提示找不到命令,写完的类名和文件名对不上,控制台一片红 —— 新手的第一道坎几乎都在这。本章把环境、语法和运算规则一次打牢,后面的章节才有地基。
> - 读完本章你将能:独立配好 JDK 17 与环境变量,跑通第一个程序
> - 说清 JDK、JRE、JVM 的包含关系
> - 避开 i++、整数溢出、整数除法这些入门坑

> [!tip] 日常电脑现场 · 装完软件没反应
> 装完 JDK,桌面什么都没多出来,打开命令提示符敲 java -version 却提示"不是内部或外部命令" —— 多半是 PATH 没配好。就像新买的打印机已经连上 USB,但系统里没添加这台设备,点打印永远找不到它。去环境变量里把 bin 目录加进去,命令行才认得这条命令。

## 环境搭建:JDK、JRE、JVM 的包含关系

三者是包含关系:**JDK = JRE + 开发工具(javac/jdb/jconsole),JRE = JVM + 核心类库**。写代码装 JDK,只跑程序装 JRE,而真正执行字节码的永远是 JVM。

\`\`\`shell
# 验证安装:确认运行时与编译器都可用
java -version
javac -version
\`\`\`

\`\`\`output
java version "17.0.9" 2023-10-17 LTS
Java(TM) SE Runtime Environment (build 17.0.9+11)
Java HotSpot(TM) 64-Bit Server VM (build 17.0.9+11, mixed mode, sharing)
javac 17.0.9
\`\`\`

一个类从源码到运行的完整链路:**Xxx.java → javac 编译 → Xxx.class 字节码 → 类加载器加载 → JVM 解释执行 + JIT 编译为机器码**。这条链是后面 JVM 模块的地图,先混个眼熟。

## 八大基本数据类型:范围与默认值

| 类型 | 字节 | 范围 | 默认值 | 备注 |
| --- | --- | --- | --- | --- |
| byte | 1 | -128 ~ 127 | 0 | |
| short | 2 | -32768 ~ 32767 | 0 | |
| int | 4 | 约 ±21.4 亿 | 0 | 整数字面量默认类型 |
| long | 8 | 约 ±922 京 | 0L | 字面量加 L 后缀 |
| float | 4 | 约 ±3.4e38 | 0.0f | 6-7 位有效数字 |
| double | 8 | 约 ±1.8e308 | 0.0 | 小数字面量默认类型 |
| char | 2 | 0 ~ 65535 | '\\u0000' | 无符号 Unicode 码元 |
| boolean | - | true / false | false | JVM 内部常用 int 实现 |

溢出与精度,是两道万年不变的陷阱题:

\`\`\`java
public class TypeTrap {
    public static void main(String[] args) {
        int max = Integer.MAX_VALUE;
        System.out.println(max + 1);            // int 溢出:回绕成最小值

        long big = max + 1;                     // 右边仍按 int 算:先溢出,再赋给 long
        long right = max + 1L;                  // long 参与运算,整体提升为 long
        System.out.println(big);
        System.out.println(right);

        System.out.println(0.1 + 0.2);          // 二进制无法精确表示十进制小数
        System.out.println((int) 3.99);         // 强转直接截断,不是四舍五入
    }
}
\`\`\`

\`\`\`output
-2147483648
-2147483648
2147483648
0.30000000000000004
3
\`\`\`

> [!pitfall] 编译器救不了 int 溢出
> ==long big = max + 1;== **不报错**——它静默地把溢出后的 int 结果(-2147483648)赋给 long,数据已经错了,编译器毫无提示。正确写法 ==max + 1L== 让 long 参与运算。金额计算永远用 ==new BigDecimal("0.1")==(字符串构造,不要用 double 构造)。

## 运算符:i++、整除与短路

\`\`\`java
public class OperatorTrap {
    public static void main(String[] args) {
        int i = 1;
        int r = i++ + ++i;      // 拆解:i++ 先取1(i变2), ++i 先加到3再取3
        System.out.println(r + " / i=" + i);

        System.out.println(10 / 3 + " " + -10 / 3 + " " + 10 % -3);  // 向零取整,余数符号随被除数
        System.out.println(5 / 0.0 + " " + 5 % 0.0);                 // 浮点除 0 不抛异常
        System.out.println(true | isFalse());    // 单竖线不短路,右边照样执行
        System.out.println(true && isFalse());   // 左边为 true,需要继续计算右边;只有左边 false 才短路
    }

    static boolean isFalse() {
        System.out.println("  isFalse() 执行了");
        return false;
    }
}
\`\`\`

\`\`\`output
4 / i=3
3 -3 1
Infinity NaN
  isFalse() 执行了
true
  isFalse() 执行了
false
\`\`\`

> [!tip] i++ 不是原子操作
> ==i++== 在字节码层面是"读 i → 加 1 → 写回"三步,多线程下会丢失更新(JUC 并发章用 CAS 解决)。顺手记两个高频陷阱:Integer 缓存 -128~127(String 与 API 章详解),超出缓存的两个 Integer 用双等号比较是 **false**;整数除法 10/3 得 3 不是 3.33。

## 流程控制:switch 的进化

\`\`\`java
public class SwitchDemo {
    public static void main(String[] args) {
        int day = 6;
        // JDK 14+ 箭头语法:不穿透、不用 break、可直接当表达式返回值
        String type = switch (day) {
            case 1, 7 -> "周末";
            case 2, 3, 4, 5, 6 -> "工作日";
            default -> throw new IllegalArgumentException("非法日期: " + day);
        };
        System.out.println(type);
    }
}
\`\`\`

\`\`\`output
工作日
\`\`\`

传统 switch 的两个考点:① 条件支持 byte/short/char/int、包装类、枚举与 String(**不支持 long/float/boolean**);② 无 break 会**穿透**(fall-through),继续执行下一个 case 的语句体。

## 数组与排序

\`\`\`java
import java.util.Arrays;

public class SortDemo {
    public static void main(String[] args) {
        int[] a = {5, 2, 8, 1, 9, 3};
        bubbleSort(a);
        System.out.println(Arrays.toString(a));

        int[][] grid = new int[2][3];
        System.out.println(grid.length + " " + grid[0].length);   // 行数、列数
    }

    /** 冒泡排序:相邻比较、大数右移;swapped 标记实现提前退出 */
    static void bubbleSort(int[] a) {
        for (int i = 0; i < a.length - 1; i++) {
            boolean swapped = false;
            for (int j = 0; j < a.length - 1 - i; j++) {
                if (a[j] > a[j + 1]) {
                    int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;
                    swapped = true;
                }
            }
            if (!swapped) break;    // 一趟无交换 → 已经有序,提前结束
        }
    }
}
\`\`\`

\`\`\`output
[1, 2, 3, 5, 8, 9]
2 3
\`\`\`

点下面的演示,逐帧看冒泡、选择、插入三种排序怎么挪数据——面试手写要求最高的是**快排**(分治 + 双指针 partition),思想要能口述,冒泡要能默写:

\`\`\`demo:sort-visual
\`\`\`

> [!interview] 高频追问:Arrays.sort 用的是什么排序?
> **基本类型:双轴快排(DualPivotQuicksort)**,元素很少时切换插入排序;**对象类型:TimSort**(归并 + 二分插入混合,稳定)。为什么对象不用快排?快排**不稳定**,对象排序往往需要稳定语义。追问链:稳定是什么意思(相等元素相对次序不变)→ 什么时候稳定性重要(多关键字排序)。

## 值传递与初始化顺序

### 只有值传递:传的是"引用的副本"

Java 方法调用时,实参一律**按值拷贝**给形参:基本类型拷贝数值,引用类型拷贝**引用(地址)本身**。方法里拿到的是"另一张写着同样地址的纸条"——纸条可以撕掉重写,但纸条指向的对象和外面是同一个。

\`\`\`text
基本类型:int a = 1
  调用方 a[1] ──拷贝值 1──> 形参 x[1]        改 x,外面 a 不变

引用类型:User u = 0x1A2B
  调用方 u[0x1A2B] ──拷贝地址──> 形参 u2[0x1A2B]
        │                              │
        └──────────────┬───────────────┘
                       ▼
              堆:User{name="张三"}
        改 u2.name 两边可见;u2 = new User() 只换掉 u2 的纸条
\`\`\`

\`\`\`java PassByValue.java
public class PassByValue {
    static void swap(int a, int b) {
        int t = a; a = b; b = t;          // 只交换副本,调用方毫无感觉
    }

    static void changeName(User u) {
        u.name = "李四";                   // 副本与原引用指向同一对象 → 生效
    }

    static void reassign(User u) {
        u = new User();                    // 只让副本改指向 → 调用方看不到
        u.name = "王五";
    }

    static class User { String name = "张三"; }

    public static void main(String[] args) {
        int a = 1, b = 2;
        swap(a, b);
        System.out.println("swap 后: a=" + a + ", b=" + b);

        User u = new User();
        changeName(u);
        System.out.println("changeName 后: " + u.name);

        reassign(u);
        System.out.println("reassign 后: " + u.name);
    }
}
\`\`\`

\`\`\`output
swap 后: a=1, b=2
changeName 后: 李四
reassign 后: 李四
\`\`\`

> [!interview] 标准答法:Java 只有值传递
> "Java 中参数一律按值传递。基本类型传数值副本;引用类型传的是**引用的副本**,所以方法内能通过副本修改对象内容,但无法让外面的变量改指向。"加分补充:数组、StringBuilder 表现相同;String 不可变,方法内重新赋值绝不会影响外面。

> [!pitfall] "能改对象"不等于引用传递
> 判断标准不是"对象内容变没变",而是**形参重新赋值能否影响实参**。上面 reassign 把 u 指向新对象,外面仍是原对象——这就是值传递的铁证。另一个经典误区:字符串拼接 helper 写成 ==void append(StringBuilder sb)== 能生效,写成 ==void append(String s)== 则永远无效。

### 初始化顺序:父类先于子类,静态先于实例

一句背诵版:**父类静态 → 子类静态 → 父类实例 → 子类实例**。更精确的规则是:静态变量赋值与静态块、实例变量赋值与实例块,在**各自类内严格按源码书写顺序**执行;构造器体最后执行。

\`\`\`text
类初始化(每个类只一次,首次主动使用时):
  父类静态变量赋值 / 静态块(按源码顺序)
  → 子类静态变量赋值 / 静态块(按源码顺序)
对象初始化(每次 new):
  分配内存并清零 → super() 完成父类实例初始化
  → 本类实例变量赋值 / 实例块(按源码顺序)
  → 本类构造器体
\`\`\`

\`\`\`java InitOrder.java
class Parent {
    static int ps = log("1 父类静态变量");
    static { System.out.println("2 父类静态块"); }
    int pi = log2("3 父类实例变量");
    { System.out.println("4 父类实例块"); }
    Parent() { System.out.println("5 父类构造器"); }

    static int log(String s)  { System.out.println(s); return 1; }
    static int log2(String s) { System.out.println(s); return 1; }
}

class Child extends Parent {
    static int cs = log("6 子类静态变量");
    static { System.out.println("7 子类静态块"); }
    int ci = log2("8 子类实例变量");
    { System.out.println("9 子类实例块"); }
    Child() { System.out.println("10 子类构造器"); }

    public static void main(String[] args) {
        System.out.println("--- 第一次 new ---");
        new Child();
    }
}
\`\`\`

\`\`\`output
1 父类静态变量
2 父类静态块
6 子类静态变量
7 子类静态块
--- 第一次 new ---
3 父类实例变量
4 父类实例块
5 父类构造器
8 子类实例变量
9 子类实例块
10 子类构造器
\`\`\`

### 执行次数对比:静态一次,实例每次

| 成员 | 触发时机 | 每个类执行次数 | 每次 new 执行次数 | 典型用途 |
| --- | --- | --- | --- | --- |
| static 变量赋值 | 类初始化,首次主动使用 | 1 | 0 | 常量、缓存、配置 |
| static 静态块 | 类初始化,与静态变量按书写顺序 | 1 | 0 | 加载驱动、初始化静态资源 |
| 实例变量赋值 | new 时 super() 之后 | 0 | 1 | 字段默认业务值 |
| 实例代码块 | new 时 super() 之后,与实例变量按书写顺序 | 0 | 1 | 多个构造器共享的初始化逻辑 |
| 构造器 | 实例初始化最后一步 | 0 | 1 | 参数校验、定制构造 |

\`\`\`java StaticOnce.java
public class StaticOnce {
    static { System.out.println("静态块:类初始化时执行"); }

    static int count = 0;
    StaticOnce() { count++; }

    public static void main(String[] args) {
        System.out.println("main 开始");
        new StaticOnce();
        new StaticOnce();
        new StaticOnce();
        System.out.println("实例数: " + count);
    }
}
\`\`\`

\`\`\`output
静态块:类初始化时执行
main 开始
实例数: 3
\`\`\`

> [!tip] 三个易错点
> ① 静态块**先于 main 执行**——启动 main 属于对类的主动使用,类要先初始化;② 父类构造器里调用被子类重写的方法,会执行子类版本,此时子类实例变量**还是默认值**(经典空指针陷阱);③ 静态块只能访问静态成员,写实例变量直接编译失败。

## 面试速记

- JDK ⊃ JRE ⊃ JVM;java → javac → 字节码 → 类加载 → 解释 + JIT 混合执行。
- 整数字面量默认 int、小数默认 double;max+1 先按 int 溢出再赋值,必须加 L。
- 金额用 BigDecimal 字符串构造;浮点除 0 得 Infinity/NaN 不抛异常;10/3 是 3。
- switch 不支持 long/float/boolean;JDK 14+ 箭头语法不穿透。
- Arrays.sort:基本类型双轴快排(不稳定),对象 TimSort(稳定)。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch02',
        title: '面向对象:封装·继承·多态',
        minutes: 30,
        points: ['三大特性', '初始化顺序', '动态绑定', '组合优于继承'],
        content: `
> [!interview] 本章面试锚点
> 面向对象三连问:**封装/继承/多态各解决什么问题?父子类初始化顺序?多态的绑定时机?**回答框架:封装管"隐藏细节防误用",继承管"复用与扩展",多态管"同一行为不同实现"。能再说出"编译看左、运行看右"并解释 invokevirtual 动态分派,就赢了绝大多数候选人。

> [!info] 本章导读 · 封装继承多态背了三遍,一写代码还是字段全 public?
> 课本上的定义都懂,可一到写 User、Order 这样的类,还是把字段摊开、把逻辑堆进 main。本章用能跑的例子把三个特性变成手上的习惯,而不是嘴上的名词。
> - 读完本章你将能:用封装把校验和状态关进类里
> - 说清重载与重写的绑定时机差别
> - 判断什么时候该继承、什么时候该组合

> [!tip] 日常电脑现场 · 相机权限弹窗
> 第一次用某个 App 扫码,系统弹出"是否允许访问相机",你点允许它才能拍 —— 这个弹窗就是封装后的唯一入口。桌面上你只看到图标和按钮,真正的摄像头、相册目录都藏在里面,想乱改也没有入口。等哪天你点了"禁止",它会老老实实告诉你用不了,而不是偷偷去读。

## 封装:访问控制符的正确用法

\`\`\`diagram:d-oop
\`\`\`

把面向对象想成一座动物园:**动物类**只是墙上的一张设计图纸,不会真的跑出来咬人;你照着图纸养出来的橘猫、柴犬才是**实例**,各有各的体重和脾气。园长喊一声"叫",每只动物都响应,但猫"喵"狗"汪"——同一个指令、不同的表现,这就是**多态**;而猫的日记本上了锁(**private**),想翻只能经过它自己允许的 getter,这就是**封装**。

四个访问级别由宽到严:==public > protected > 包私有(不写)> private==。规范:**字段全部 private,行为按需放开**。getter/setter 不是走形式,而是把校验和防御逻辑收拢在"针眼"里。

\`\`\`java
public class Account {
    private long balance;                       // 单位:分。存钱永远不用 double

    public Account(long initBalance) {
        if (initBalance < 0) {
            throw new IllegalArgumentException("初始余额不能为负");
        }
        this.balance = initBalance;
    }

    /** this(...) 链式调用构造器:校验逻辑只写一份 */
    public Account() {
        this(0);
    }

    public void withdraw(long amount) {
        if (amount <= 0 || amount > balance) {
            throw new IllegalStateException("非法取款金额: " + amount);
        }
        this.balance -= amount;                 // 校验收在方法边界内,调用方无法绕过
    }

    public long getBalance() { return balance; }
}
\`\`\`

> [!best] 封装的加分答法
> 别只说"private + getter/setter"。完整版:**封装 = 隐藏数据(字段私有)+ 暴露契约(方法签名)+ 在边界处集中校验**。反例就是无校验 JavaBean:外部一句 ==setBalance(-999)== 就把不变量(invariant)打穿了。

## 继承:初始化顺序(必考默写)

\`\`\`java
public class InitOrder {
    public static void main(String[] args) {
        new Child();
    }
}

class Parent {
    static { System.out.println("1. 父类静态块"); }
    { System.out.println("3. 父类实例块"); }
    Parent() { System.out.println("4. 父类构造器"); }
}

class Child extends Parent {
    static { System.out.println("2. 子类静态块"); }
    { System.out.println("5. 子类实例块"); }
    Child() {
        // super() 隐式在这一行的最前面执行
        System.out.println("6. 子类构造器");
    }
}
\`\`\`

\`\`\`output
1. 父类静态块
2. 子类静态块
3. 父类实例块
4. 父类构造器
5. 子类实例块
6. 子类构造器
\`\`\`

口诀:**静态先于实例、父类先于子类;静态块只执行一次**(第二次 new 不再打印 1 和 2)。本质:子类构造器第一行隐式 ==super()==,父类完全初始化后子类才动手。

> [!warn] 单继承与 final
> Java 只有**单继承**(一个直接父类),横向复用靠接口;String、Integer 等 final 类不可被继承。所有类的祖先都是 ==java.lang.Object==,它定义的 equals/hashCode/toString 等 11 个方法是String 与 API 章的主角。

## 多态:编译看左,运行看右

\`\`\`java
public class Polymorphism {
    static class Animal {
        public String name = "Animal";
        public void sound() { System.out.println("动物叫"); }
        public static void category() { System.out.println("静态:动物类"); }
    }

    static class Dog extends Animal {
        public String name = "Dog";                    // 字段遮蔽(shadow),不是重写
        @Override
        public void sound() { System.out.println("汪汪"); }
        public static void category() { System.out.println("静态:狗类"); }  // 隐藏,不是重写
        public void fetch() { System.out.println("捡球"); }
    }

    public static void main(String[] args) {
        Animal a = new Dog();                          // 向上转型:引用 Animal,实际 Dog
        a.sound();                                     // 方法:运行看右 → 动态绑定
        System.out.println(a.name);                    // 字段:编译看左 → 没有多态
        a.category();                                  // 静态方法:编译看左 → 静态绑定
        // a.fetch();                                  // 编译错误:Animal 引用看不到 Dog 特有方法
        if (a instanceof Dog d) {                      // JDK 16+ 模式匹配:判断+强转一步完成
            d.fetch();
        }
    }
}
\`\`\`

\`\`\`output
汪汪
Animal
静态:动物类
捡球
\`\`\`

三条铁律(背诵版):**成员方法多态**(invokevirtual 按实际类型分派)、**成员变量不多态**(编译期按引用类型解析)、**静态方法不多态**(静态绑定)。"编译看左运行看右"只对成员方法成立。

## 重载 vs 重写(对比默写)

| 维度 | 重载 Overload | 重写 Override |
| --- | --- | --- |
| 范围 | 同一个类内 | 父子类之间 |
| 方法名与参数 | 同名,参数列表**必须不同** | 同名,参数列表**必须相同** |
| 返回值 | 可以不同 | 相同或其子类(协变返回) |
| 访问权限 | 无要求 | 不能比父类更严格 |
| 抛出异常 | 无要求 | 不能抛更宽的受检异常 |
| 绑定时机 | 编译期(静态分派) | 运行期(动态分派) |

> [!tip] 重载的经典陷阱:call(null) 匹配谁?
> 同时有 ==call(String)== 与 ==call(Integer)== 时,==call(null)== **编译报错**(二义性);只有 ==call(Object)== 与 ==call(String)== 时,null 匹配**最具体**的 String 版本。重载分派只看**编译期**的参数静态类型,与运行期对象无关。

## 组合优于继承

\`\`\`java
import java.util.ArrayList;
import java.util.List;

/** 组合:持有而不是继承,只暴露需要的能力 */
class CountingList<E> {
    private final List<E> delegate = new ArrayList<>();

    public boolean add(E e) {
        System.out.println("add: " + e);
        return delegate.add(e);
    }
    public int size() { return delegate.size(); }
    // 想给什么就暴露什么;若继承 ArrayList,所有 public 方法都被迫带出去
}

public class CompositeDemo {
    public static void main(String[] args) {
        CountingList<String> list = new CountingList<>();
        list.add("a");
        list.add("b");
        System.out.println(list.size());
    }
}
\`\`\`

\`\`\`output
add: a
add: b
2
\`\`\`

继承的问题:子类依赖父类实现细节,父类改动即破坏子类(脆弱基类问题)。==Effective Java== 第 18 条:**只有真正的 is-a 关系才用继承,否则用组合 + 委托**。设计模式里装饰器、代理全是组合思想的胜利。

## 面试速记

- 三大特性:封装=隐藏+校验,继承=复用+扩展,多态=同一行为不同实现。
- 初始化顺序:父静态→子静态→父实例块→父构造→子实例块→子构造;静态块仅一次。
- 多态三律:成员方法动态绑定、字段与静态方法静态绑定;instanceof JDK 16+ 模式匹配。
- 重载编译期按静态类型分派;重写运行期按实际类型分派,权限不能更严、异常不能更宽。
- 只有 is-a 才继承,其余组合 + 委托。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch03',
        title: '深入 String 与常用 API',
        minutes: 35,
        points: ['不可变设计', '常量池', 'equals契约', '包装类缓存'],
        content: `
> [!interview] 本章面试锚点
> String 四连:**为什么设计成不可变?双等号和 equals 的区别?Integer 缓存是怎么回事?重写 equals 不重写 hashCode 会怎样?**这四个问题覆盖了 Java 初级面试 API 部分的八成题量,每一问都配了可复述的代码证据。

> [!info] 本章导读 · 为什么面试官总问 String?
> 它看起来只是存一串字符,面试却能从中问出不可变、常量池、双等号、Integer 缓存、拼接性能一长串。因为这一块最能看出你是"会用 API"还是"懂 JVM 行为"。
> - 读完本章你将能:用源码解释 String 为什么不可变
> - 分清双等号与 equals 在常量池和堆上的表现
> - 说清 String、StringBuilder、加号拼接的底层差别

> [!tip] 日常电脑现场 · 密码框里的星号
> 在网页登录框里敲密码,屏幕上只有一串圆点,但提交后服务器比对的是你输入的完整原文 —— 显示被遮住了,数据没变。复制一段聊天记录粘贴到记事本、再粘到搜索框,内容一字不差,复制的是"值"而不是"那行字所在的位置"。

## String 为什么不可变(源码级)

String 的**内容不可变**,不代表它的每个字段都是 final。下面只摘出 JDK 17 的两个字段:保存内容的 value 引用是 final,缓存哈希值的 hash 则不是;类本身也是 final,防止子类改写其行为。

> [!info] 先读结构,再运行实验
> 下方是**删减后的源码摘录**,省略了构造器等成员,用于逐行阅读。它不应直接编译:final 字段 value 没有在这里初始化,也没有 main 入口。紧接着的 StringImmutableDemo 才是可以直接在网站虚拟环境运行的完整程序。

\`\`\`java
// 源码摘录(JDK 17,有删减,仅供阅读)
public final class String {
    // JDK 8 使用 char[];JDK 9+ 使用 byte[] + coder(此处省略 coder)
    private final byte[] value;
    private int hash;                // 缓存 hashCode,默认 0
}
\`\`\`

**为什么这能保证不可变?**final 只防止 value 改指向,不能阻止数组元素被改。String 还通过私有封装、不提供修改内部数组的接口、对外部可变数组进行防御性复制来保护内容。replace、concat 等操作返回结果字符串,原字符串不会被原地改写。hash 只是内部缓存,变化不会改变字符串的文字或 equals 结果。

### 运行实验:改数组、替换字符、改引用

先猜三个结果:修改构造时传入的数组会影响字符串吗?replace 会原地修改吗?把变量重新赋值会影响另一个引用吗?点击下面的“运行 / 修改”,逐项核对。

\`\`\`java StringImmutableDemo.java
public class StringImmutableDemo {
    public static void main(String[] args) {
        char[] letters = {'J', 'a', 'v', 'a'};
        String original = new String(letters); // 构造时复制内容
        letters[0] = 'L';                      // 只改传入的数组
        System.out.println("数组改后: " + new String(letters));
        System.out.println("原字符串: " + original);

        String changed = original.replace('J', 'L'); // 接住替换后的结果
        System.out.println("replace 返回: " + changed);
        System.out.println("原字符串仍为: " + original);

        String alias = original;               // 两个变量指向同一字符串
        original = "Python";                  // 只让 original 改指向
        System.out.println("重新赋值: " + original);
        System.out.println("另一个引用: " + alias);
    }
}
\`\`\`

\`\`\`output
数组改后: Lava
原字符串: Java
replace 返回: Lava
原字符串仍为: Java
重新赋值: Python
另一个引用: Java
\`\`\`

第 1～2 行输出验证防御性复制;第 3～4 行验证 replace 不改原值;第 5～6 行验证变量改指向不等于对象被修改。试着把字符 L 换成 K,再运行一次观察两组结果。

不可变带来的四个好处(背诵版):

- **常量池复用**:字面量进字符串常量池,相同内容全局唯一,省内存。
- **hashCode 可缓存**:内容不变 → 可复用已计算的哈希值;做 HashMap 的 key 时不会因文字被原地修改而漂移。
- **线程安全**:不可变对象天然并发安全,多线程共享无需加锁。
- **安全性**:String 用作类加载名、文件路径、网络参数,不可变杜绝被中途篡改。

> [!pitfall] "不可变"指值,不是引用
> ==String s = "a"; s = "b";== 改的是**引用指向**,不是字符串内容。final 只保证字段引用不被重新赋值,数组内容仍然可变;String 还依靠不暴露内部数组、构造时防御性复制来维护不可变性。JDK 17 的强封装下,对 java.lang 内部字段调用 setAccessible(true) 默认会抛 InaccessibleObjectException,不能把"反射随便修改"当作普通用法。

## 常量池与双等号(高频陷阱题)

\`\`\`diagram:d-stringpool
\`\`\`

字符串常量池就像学校图书馆的共享书架:你说要"ab",管理员直接从架上递给你那一本,两个人借到的是**同一本**,谁也没复印,所以 == 比较引用自然相等。可你要是 new String("ab"),相当于自己掏钱买了本新书,内容一字不差,却和图书馆那本不是同一本——== 为 false,equals 才为 true。

\`\`\`java
public class StringPool {
    public static void main(String[] args) {
        String a = "ab";
        String b = "ab";
        String c = new String("ab");       // new 一定在堆上开新对象
        String d = "a" + "b";              // 编译期常量折叠 → 直接就是 "ab"
        String e = "a";
        String f = e + "b";                // 变量参与 → 运行期拼接,生成堆上新对象

        System.out.println(a == b);
        System.out.println(a == c);
        System.out.println(a == d);
        System.out.println(a == f);
        System.out.println(a == f.intern());   // intern:换回常量池中等价字符串的引用
    }
}
\`\`\`

\`\`\`output
true
false
true
false
true
\`\`\`

判定口诀:**双等号比引用,equals 比内容;字面量进池,变量拼接在堆;intern 把堆中串换回池中引用**。

## equals / hashCode:Object 契约(必考)

\`\`\`java
import java.util.Objects;

public class User {
    private final String name;
    private final int age;

    public User(String name, int age) {
        this.name = name;
        this.age = age;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;                  // 1. 引用相同,直接 true
        if (!(o instanceof User)) return false;      // 2. 类型检查,顺带处理 null
        User u = (User) o;
        return age == u.age && Objects.equals(name, u.name);  // 3. 逐字段比
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, age);              // 与 equals 用同一批字段
    }

    public static void main(String[] args) {
        User a = new User("小林", 20);
        User b = new User("小林", 20);
        System.out.println(a.equals(b));             // 内容相同
        System.out.println(a.hashCode() == b.hashCode());
        java.util.Set<User> users = new java.util.HashSet<>();
        users.add(a);
        users.add(b);
        System.out.println(users.size());           // 正确判重,只有一个元素
    }
}
\`\`\`

\`\`\`output
true
true
1
\`\`\`

契约三条:① equals 相等 → hashCode **必须**相等;② hashCode 相等 → equals 不一定相等(哈希冲突);③ equals 不等 → hashCode 尽量不等(减少冲突)。

> [!interview] 高频追问:只重写 equals 不重写 hashCode 会怎样?
> 两个"相等"的 User 对象 hashCode 不同,放进 ==HashSet== 会存成**两个元素**;做 ==HashMap== 的 key 时 ==get== 查不到——因为先按 hash 定位桶,**桶都找错了,equals 根本没机会执行**。一句话:hashCode 决定进哪个桶,equals 决定桶里是不是它,两者缺一不可(HashMap 章 HashMap 源码里落地)。

## 包装类缓存:双等号的经典陷阱

| 包装类 | 缓存范围 | 备注 |
| --- | --- | --- |
| Integer | -128 ~ 127 | IntegerCache,上限可用 -XX:AutoBoxCacheMax 调 |
| Short / Long | -128 ~ 127 | 同款缓存机制 |
| Byte | 全部(-128~127) | 范围小,直接全缓存 |
| Character | 0 ~ 127 | |
| Boolean | TRUE / FALSE | 只有两个实例 |
| Float / Double | **无缓存** | 浮点取值无限,无法缓存 |

\`\`\`java
public class BoxCache {
    public static void main(String[] args) {
        Integer a = 127, b = 127;
        Integer c = 128, d = 128;
        System.out.println(a == b);          // 缓存内:同一个对象
        System.out.println(c == d);          // 缓存外:各自新建

        Integer e = null;
        // int x = e;                       // 拆箱 NPE:最常见空指针来源之一
        System.out.println(c.equals(128));   // 包装类之间永远用 equals
    }
}
\`\`\`

\`\`\`output
true
false
true
\`\`\`

> [!warn] 自动拆箱的隐藏地雷
> ==map.get("k") 与 100 做双等号比较== 这类"包装 vs 基本类型"运算会**自动拆箱**,get 返回 null 直接 NPE。经典变体:三目运算符两支混用包装与基本类型时也会触发拆箱。规约:**包装类之间永远 equals,参与算术前先判空**。

## 拼接性能:StringBuilder(配演示)

循环里不断把新字符追加到 String,会反复复制已经积累的内容;在每轮追加长度近似固定时,总复制量随轮数呈 O(n²) 增长。Java 8 常把加号表达式转换成 StringBuilder 调用,Java 9+ 通常使用 invokedynamic;这些优化不会自动把整个循环改成共享一个 StringBuilder。

\`\`\`java
public class ConcatDemo {
    public static void main(String[] args) {
        int n = 800;                    // 网页 JVM 使用小规模,避免长时间等待

        long t1 = System.currentTimeMillis();
        String s = "";
        for (int i = 0; i < n; i++) {
            s += i;                     // 每圈:new StringBuilder → append → toString → 丢弃
        }
        long t2 = System.currentTimeMillis();

        StringBuilder sb = new StringBuilder(n);   // 初始容量设为 n,不足时仍会扩容
        for (int i = 0; i < n; i++) {
            sb.append(i);
        }
        long t3 = System.currentTimeMillis();

        System.out.println("拼接次数: " + n);
        System.out.println("结果长度: " + s.length());
        System.out.println("内容一致: " + s.equals(sb.toString()));
        System.out.println("加号拼接: " + (t2 - t1) + " ms");
        System.out.println("StringBuilder: " + (t3 - t2) + " ms");
    }
}
\`\`\`

前 3 行应为“拼接次数: 800”“结果长度: 2290”“内容一致: true”。最后两行耗时随设备、网页 JVM 调度与计时精度变化,可能相同甚至出现反向结果;这不是严谨的性能基准。下面的演示可以调整拼接次数,结合复制量理解差异:

\`\`\`demo:concat-bench
\`\`\`

结论:**大量循环追加优先使用同一个 StringBuilder;少量单行拼接优先考虑可读性;StringBuffer 的方法带 synchronized,单线程场景通常选 StringBuilder**。正式性能评估需要在目标 JDK 上用 JMH 等工具做预热和多轮测量。

## 日期时间:java.time(JDK 8+)

\`\`\`java
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class DateDemo {
    public static void main(String[] args) {
        LocalDate today = LocalDate.of(2026, 11, 14);
        LocalDate expire = today.plusDays(30);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        System.out.println(fmt.format(expire));
        System.out.println(today.isBefore(expire));

        LocalDateTime t = LocalDateTime.of(2026, 11, 14, 9, 30);
        System.out.println(t.getDayOfWeek());
    }
}
\`\`\`

\`\`\`output
2026-12-14
true
SATURDAY
\`\`\`

> [!best] SimpleDateFormat 为什么被淘汰
> 老的 ==SimpleDateFormat== 内部共享 Calendar 状态,**多线程并发 format 会数据错乱甚至数组越界**。java.time 全家桶(LocalDate/Instant/DateTimeFormatter)**不可变、线程安全**,配合 ==ThreadLocal== 或直接换 DateTimeFormatter 是唯一正解。

## Object 通用方法与深浅拷贝

Object 是所有类的根,七个核心方法每一个都是考点:

| 方法 | 作用 | 高频追问 |
| --- | --- | --- |
| equals(Object) | 业务判等,默认实现就是 == | 五条约定是什么 |
| hashCode() | 返回哈希值,散列表用它定桶 | 与 equals 的契约关系 |
| toString() | 字符串表示,默认 类名@十六进制hash | 默认输出长什么样 |
| clone() | protected 浅拷贝,须实现 Cloneable | 浅拷贝与深拷贝的区别 |
| getClass() | 返回运行时 Class 对象,final 方法 | 反射的入口 |
| wait()/notify()/notifyAll() | 线程间协作:挂起与唤醒 | 为什么定义在 Object 而不是 Thread |

wait/notify 定义在 Object 的答案:**锁是对象级的**——任何对象都能充当监视器锁,线程等的是"某个对象的锁",方法自然归属 Object(ch10 有完整展开)。

### equals 五条约定与 hashCode 契约

equals 五条约定(违反任何一条,散列容器就会出诡异 bug):**自反性**(x.equals(x) 恒真)、**对称性**(x.equals(y) 与 y.equals(x) 同结果)、**传递性**(a=b 且 b=c 则 a=c)、**一致性**(对象不变则多次调用结果一致)、**非空性**(对 null 恒返回 false)。hashCode 契约两条:**equals 相等则 hashCode 必须相等;hashCode 相等不要求 equals 相等**(哈希冲突本就允许)。

\`\`\`java EqualsHashCodeDemo.java
import java.util.Objects;

public class EqualsHashCodeDemo {
    static class User {
        final String name;
        final int age;
        User(String name, int age) { this.name = name; this.age = age; }

        @Override public boolean equals(Object o) {
            if (this == o) return true;                       // 1. 同一对象直接真
            if (o == null || getClass() != o.getClass()) return false;  // 2. 非空 + 类型
            User u = (User) o;
            return age == u.age && Objects.equals(name, u.name);
        }
        @Override public int hashCode() { return Objects.hash(name, age); }
    }

    public static void main(String[] args) {
        User a = new User("张三", 20), b = new User("张三", 20);
        System.out.println(a.equals(b));
        System.out.println(a.hashCode() == b.hashCode());
        System.out.println(a.equals(null));
    }
}
\`\`\`

\`\`\`output
true
true
false
\`\`\`

### clone 浅拷贝:嵌套引用互相牵连

clone() 默认**浅拷贝**:只复制对象第一层字段,引用字段指向的内部对象**仍然共享**。

\`\`\`java ShallowCopyDemo.java
public class ShallowCopyDemo {
    static class Inner { int val = 1; }

    static class Outer implements Cloneable {
        Inner inner;
        Outer(Inner inner) { this.inner = inner; }
        @Override public Outer clone() {
            try { return (Outer) super.clone(); }      // 浅拷贝:inner 引用原样复制
            catch (CloneNotSupportedException e) { throw new AssertionError(e); }
        }
    }

    public static void main(String[] args) {
        Outer o1 = new Outer(new Inner());
        Outer o2 = o1.clone();
        System.out.println(o1 == o2);                  // 外层对象确实复制了
        System.out.println(o1.inner == o2.inner);      // 内层还是同一个引用
        o2.inner.val = 999;                            // 改副本的内层对象
        System.out.println(o1.inner.val);              // 原对象被"连坐"
    }
}
\`\`\`

\`\`\`output
false
true
999
\`\`\`

深拷贝三法:**① 递归 clone**(每层引用对象都重写 clone 层层复制,繁琐易漏)、**② 序列化走一趟**(对象树写成字节流再反序列化重建,一劳永逸)、**③ 拷贝构造器**(new 新对象并逐字段复制引用字段,清晰可控)。序列化法完整实现:

\`\`\`java DeepCopyBySerialize.java
import java.io.*;

public class DeepCopyBySerialize {
    static class Inner implements Serializable { int val = 1; }
    static class Outer implements Serializable {
        Inner inner = new Inner();
    }

    @SuppressWarnings("unchecked")
    static <T extends Serializable> T deepCopy(T obj) throws Exception {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        try (ObjectOutputStream oos = new ObjectOutputStream(bos)) {
            oos.writeObject(obj);                      // 对象树写入字节流
        }
        try (ObjectInputStream ois = new ObjectInputStream(
                new ByteArrayInputStream(bos.toByteArray()))) {
            return (T) ois.readObject();               // 反序列化重建整棵对象树
        }
    }

    public static void main(String[] args) throws Exception {
        Outer o1 = new Outer();
        Outer o2 = deepCopy(o1);
        o2.inner.val = 999;
        System.out.println(o1.inner == o2.inner);      // 内层对象也独立了
        System.out.println(o1.inner.val + " / " + o2.inner.val);
    }
}
\`\`\`

\`\`\`output
false
1 / 999
\`\`\`

### Comparable vs Comparator

| 维度 | Comparable | Comparator |
| --- | --- | --- |
| 所属包 | java.lang | java.util |
| 核心方法 | int compareTo(T o) | int compare(T a, T b) |
| 排序逻辑位置 | 写进类内部(天然顺序) | 外部比较器,与类解耦 |
| 数量 | 一个类只有一个天然顺序 | 可定义任意多个排序规则 |
| 典型场景 | TreeSet/TreeMap 默认 | sort 传参、多字段定制排序 |

\`\`\`java NaturalOrder.java
import java.util.TreeSet;

public class NaturalOrder {
    static class Player implements Comparable<Player> {
        final int score;
        final String name;
        Player(int score, String name) { this.score = score; this.name = name; }
        @Override public int compareTo(Player o) {
            return Integer.compare(this.score, o.score);   // 天然顺序:按分数升序
        }
        @Override public String toString() {
            return "Player[score=" + score + ", name=" + name + "]";
        }
    }
    public static void main(String[] args) {
        TreeSet<Player> set = new TreeSet<>();         // 只看 compareTo 是否为 0 判重
        set.add(new Player(90, "张三"));
        set.add(new Player(85, "王五"));
        set.add(new Player(90, "李四"));               // 与张三 compareTo 为 0 → 视为重复丢弃!
        System.out.println(set.size());
        set.forEach(System.out::println);
    }
}
\`\`\`

\`\`\`output
2
Player[score=85, name=王五]
Player[score=90, name=张三]
\`\`\`

\`\`\`java MultiFieldSort.java
import java.util.*;

public class MultiFieldSort {
    static class Player {
        final int score;
        final String name;
        Player(int score, String name) { this.score = score; this.name = name; }
        int score() { return score; }
        String name() { return name; }
    }

    public static void main(String[] args) {
        List<Player> list = new ArrayList<>(Arrays.asList(
                new Player(90, "张三"), new Player(90, "李四"), new Player(85, "王五")));
        // Comparator 链式多字段排序:先按分数降序,同分再按姓名升序
        list.sort(Comparator.comparingInt(Player::score).reversed()
                .thenComparing(Player::name));
        list.forEach(p -> System.out.println(p.score() + " " + p.name()));
    }
}
\`\`\`

\`\`\`output
90 张三
90 李四
85 王五
\`\`\`

> [!interview] 高频追问:排序比较器三坑
> ① ==TreeSet/TreeMap 只认 compareTo/compare 返回 0=="重复",重写了 equals 却不改比较器,会出现"equals 相等却共存两条"的脏数据;② ==comparing(...).reversed()== 只反转主排序,再接 ==thenComparing== 默认仍是升序;③ 差值法 ==a.age - b.age== 在整数边界(大正数减大负数)会溢出,一律用 ==Integer.compare==。

## 正则表达式:Pattern 与 Matcher

正则本身只是**规则文本**;Java 里先由 Pattern 把规则编译成匹配引擎,再由 Matcher 对某段输入执行匹配。**Pattern 编译很贵,能缓存就缓存**,不要在循环或高频方法里反复 Pattern.compile。

### 元字符速查表

| 元字符 | 含义 | 示例 | 能匹配 |
| --- | --- | --- | --- |
| \\d | 数字 [0-9] | \\d{3} | 138 |
| \\D | 非数字 | \\D+ | abc- |
| \\w | 单词字符 [a-zA-Z0-9_] | \\w+ | user_1 |
| \\s | 空白字符(空格、Tab、换行) | \\s+ | 连续空格 |
| . | 任意字符(默认不含换行) | a.c | abc |
| * | 前一项 0 次或多次 | ab* | a、abbb |
| + | 前一项 1 次或多次 | ab+ | ab、abbb |
| ? | 前一项 0 或 1 次;跟在量词后表示非贪婪 | ab? | a |
| {n,m} | 前一项出现 n 到 m 次 | \\d{2,4} | 1234 |
| ^ / $ | 行首 / 行尾 | ^abc$ | 整串恰好是 abc |
| ( ) | 分组并捕获,group(n) 取第 n 组 | (\\d{4})-(\\d{2}) | 2026-11 |

> [!warn] Java 字符串里的反斜杠必须双写
> 正则概念上写 ==\\d+==,但 Java 源码必须写成 ==String regex = "\\\\d+";==——第一个反斜杠被字符串转义吃掉,第二个才交给正则引擎。Windows 路径同理:D:\\data 在源码里写 D:\\\\data。懒得数就用 ==Pattern.quote("a.b")== 把字面量整体包住。

\`\`\`java RegexDemo.java
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class RegexDemo {
    public static void main(String[] args) {
        // 手机号:1 开头、第二位 3-9、共 11 位;matches 要求整串匹配
        Pattern phone = Pattern.compile("^1[3-9]\\\\d{9}$");
        System.out.println(phone.matcher("13812345678").matches());
        System.out.println(phone.matcher("12812345678").matches());

        // 从日志提取 IP:分组 (…) 可重复,find 扫描出所有命中
        String log = "10:21:03 客户端 192.168.1.7 访问, 10:21:05 代理 10.0.0.12 转发";
        Matcher m = Pattern.compile("(\\\\d{1,3}\\\\.){3}\\\\d{1,3}").matcher(log);
        while (m.find()) {
            System.out.println("IP=" + m.group() + " 位置=" + m.start() + "-" + m.end());
        }
    }
}
\`\`\`

\`\`\`output
true
false
IP=192.168.1.7 位置=13-24
IP=10.0.0.12 位置=41-50
\`\`\`

三个方法的分工:**matches()** 要求整串匹配(等于默认加了 ^$);**find()** 从当前位置向后扫描,命中后可 group()/start()/end(),循环调用找全部;**lookingAt()** 只要求从开头起匹配,不要求到结尾。校验类场景用 matches,抽取类场景用 find。

### 贪婪 vs 非贪婪

量词默认**贪婪**:能吞多少吞多少,再回溯。量词后加 ==?== 变**非贪婪**(懒惰),能少吞就少吞。写爬虫清洗 HTML、解析日志时,贪婪是头号事故源。

\`\`\`java GreedyDemo.java
public class GreedyDemo {
    public static void main(String[] args) {
        String html = "<b>加粗</b><i>斜体</i>";
        // .+ 贪婪:从第一个 < 一路吞到最后一个 >,标签之间文字全没了
        System.out.println("贪婪: [" + html.replaceAll("<.+>", "") + "]");
        // .+? 非贪婪:每个标签各自成对匹配
        System.out.println("非贪婪: [" + html.replaceAll("<.+?>", "") + "]");
    }
}
\`\`\`

\`\`\`output
贪婪: []
非贪婪: [加粗斜体]
\`\`\`

### 替换:分组引用 $1 与转义

替换串里 ==$1== 到 ==$9== 表示第 n 个捕获组,==$0== 表示整个匹配;想要字面量美元符号必须写 ==\\\\$==,或统一用 ==Matcher.quoteReplacement== 包一层。这一招最适合日期格式、脱敏、驼峰下划线互转。

\`\`\`java ReplaceDemo.java
public class ReplaceDemo {
    public static void main(String[] args) {
        String date = "2026-11-14";
        // $1、$2、$3 依次引用三个捕获组,实现年月日重排
        System.out.println(date.replaceAll("(\\\\d{4})-(\\\\d{2})-(\\\\d{2})", "$3/$2/$1"));

        // 替换串里的字面量 $ 要转义:正则 \\$5 在 Java 字符串里是 "\\\\$5"
        System.out.println("price=$5".replaceAll("\\\\$5", "¥5"));
    }
}
\`\`\`

\`\`\`output
14/11/2026
price=¥5
\`\`\`

> [!pitfall] 正则回溯会打爆 CPU
> 嵌套量词 ==(a+)+b== 遇到长串不匹配时会指数级回溯,线上表现为单线程 CPU 100%、接口卡死。防御:① 少用嵌套量词,能写成 ==a+b== 就别写 ==(a+)+b==;② 给长输入设长度上限;③ Pattern 本身不提供匹配超时,可换 RE2/J 这类线性引擎,或把匹配放进带超时的独立线程。

## 面试速记

- String 不可变:final 类 + 私有 final 存储引用 + 防御性复制 + 不暴露修改入口;hash 缓存字段不必 final。
- 双等号比引用 equals 比内容;字面量进池,变量拼接在堆,intern 换回池引用。
- 重写 equals 必重写 hashCode:hash 定位桶,equals 定位元素,缺一不可。
- Integer 缓存 -128~127,超出范围双等号为 false;包装类比较一律 equals,拆箱先判空。
- 循环拼接用 StringBuilder;SimpleDateFormat 线程不安全,用 java.time。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch04',
        title: '异常体系与自定义异常',
        minutes: 25,
        points: ['checked/unchecked', 'finally陷阱', 'try-with-resources', '自定义异常'],
        content: `
> [!interview] 本章面试锚点
> 异常四连:**checked 与 unchecked 区别?finally 一定执行吗?finally 里有 return 会怎样?try-with-resources 原理?**高频陷阱集中在"finally 的 return 覆盖 try 的返回值"和"finally 吞异常"——本章把这两道经典题拆到字节码语义层面。

> [!info] 本章导读 · catch 住了异常,为什么线上还是一头雾水?
> 很多人写 try-catch 就是打一行日志继续跑,结果真正的错误被吞掉,排查时只能靠猜。异常不是"让编译通过"的工具,而是给调用方的一份错误契约 —— 本章把它拆成家族树、使用场景与经典陷阱三块。
> - 读完本章你将能:分清 checked 与 unchecked,选对异常类型
> - 用 try-with-resources 正确释放资源
> - 避开 finally 里 return 覆盖返回值、吞异常的坑

> [!tip] 日常电脑现场 · 404 与闪退
> 地址栏少打一个字母,浏览器不会白屏卡死,而是给你一个写着 404 的页面,告诉你"这个地址没有东西"。手机 App 崩了会弹"应用无响应,是否关闭",让你决定等还是退 —— 这些都是在明确告知出了什么状况,而不是假装正常运行。

## 异常家族树:checked 与 unchecked

\`\`\`diagram:d-exception
\`\`\`

Throwable 就像一张家族谱:**Error** 是天灾,比如地震把楼震塌了(内存耗尽),你除了逃命什么也做不了;**Exception** 是人祸,比如忘带钥匙,还能找开锁师傅补救。至于**受检异常**,更像出门前妈妈在门口检查你带没带伞——编译器逼你提前想好"下雨怎么办",不交代清楚就不让你出门。

\`\`\`text
Throwable
 ├── Error                  # 严重错误,不该捕获:OutOfMemoryError、StackOverflowError
 └── Exception
      ├── RuntimeException  # 运行时异常(unchecked):NPE、越界、类型转换
      │     NullPointerException / IndexOutOfBoundsException
      │     ClassCastException / ArithmeticException
      │     IllegalArgumentException / IllegalStateException
      └── 其他 Exception     # 受检异常(checked):编译器强制处理
            IOException / SQLException / ClassNotFoundException / InterruptedException
\`\`\`

| 维度 | 受检异常 checked | 运行时异常 unchecked |
| --- | --- | --- |
| 继承自 | Exception(非 Runtime 分支) | RuntimeException 及子类 |
| 编译器 | **强制** try-catch 或 throws 声明 | 不强制 |
| 语义 | 可预期、可恢复的外部故障(IO/网络) | 编程 bug(NPE/越界) |
| 典型 | IOException、SQLException | NPE、IndexOutOfBounds |
| 实践 | 尽量转译成非受检异常再向上抛 | 修代码,而不是到处 catch |

> [!tip] 自定义异常继承谁?
> 业务异常继承 ==RuntimeException==:调用方**不必层层 try 或 throws**,配合全局异常处理器(Spring 的 @RestControllerAdvice)统一兜底转错误码。受检异常会污染每一层的方法签名,这是 Spring 全家只抛 RuntimeException 的原因。

## finally 执行顺序:两道经典陷阱题

\`\`\`java
public class FinallyTrap {
    public static void main(String[] args) {
        System.out.println(trap1());
        System.out.println(trap2());
    }

    /** 陷阱1:finally 的 return 覆盖 try 的 return */
    static int trap1() {
        try {
            return 1;
        } finally {
            return 2;               // 编译器给警告但合法,1 被直接丢弃
        }
    }

    /** 陷阱2:finally 修改局部变量,影响不到已暂存的返回值 */
    static int trap2() {
        int x = 1;
        try {
            return x;               // 返回值 1 在此刻已确定并暂存
        } finally {
            x = 99;                 // 改的是局部变量,碰不到暂存值
        }
    }
}
\`\`\`

\`\`\`output
2
1
\`\`\`

结论三条(背诵版):**finally 里的 return 会吞掉 try 的返回值甚至异常;finally 修改基本类型返回值无效(值已暂存);修改引用类型指向的对象属性有效**(对象本体只有一份)。

> [!danger] finally 吞异常
> try 里抛了异常、finally 里又 return,异常被**静默吞掉**,排查时毫无痕迹。规约:**finally 只做资源释放,永远不写 return、不抛异常**;释放失败用日志记录而不是继续上抛。

## finally 一定执行吗?

finally 被编译进 try 的两条出口,return/异常/interrupt 都挡不住;只有三类非正常终止不执行:

\`\`\`java
// ① System.exit:JVM 直接关闭,栈帧被丢弃
try { System.exit(0); } finally { System.out.println("A"); }   // A 不打印

// ② 守护线程:只剩它时 JVM 直接终止
Thread t = new Thread(() -> {}); t.setDaemon(true); t.start();   // main 结束 → t 被杀

// ③ kill -9 / JVM 崩溃(hs_err_pid)
\`\`\`

\`\`\`output
都不会打印
\`\`\`

反向的坑:**finally 里 return 覆盖返回值并吞掉异常**:

\`\`\`java
static int f() { try { return 1; } finally { return 2; } }  // 2
static int g() { int x = 1; try { return x; } finally { x = 2; } }  // 1
\`\`\`

\`\`\`output
f()=2  g()=1
\`\`\`

> [!danger] 背诵
> 三类不执行:==System.exit、守护线程被终止、进程强杀==;反向坑:finally 里 return 覆盖返回值并吞异常。

## try-with-resources:关闭资源的标准姿势

\`\`\`java
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class TwrDemo {
    public static void main(String[] args) throws IOException {
        Path in = Path.of("in.txt");
        Path out = Path.of("out.txt");
        Files.writeString(in, "hello");          // NIO 工具类一行写文件

        try (BufferedReader br = Files.newBufferedReader(in);
             BufferedWriter bw = Files.newBufferedWriter(out)) {  // 声明顺序:后声明的先关闭
            bw.write(br.readLine().toUpperCase());
        }   // 编译器自动生成 finally + close,并抑制次级异常

        System.out.println(Files.readString(out));
    }
}
\`\`\`

\`\`\`output
HELLO
\`\`\`

原理:编译器把 try(...) 里的资源生成 ==finally { close(); }== 字节码,并把 close 抛出的异常用 ==addSuppressed== 挂到主异常上,**主异常不被掩盖**(手写 finally 做不到这一点)。要求资源实现 ==AutoCloseable==。

## 自定义异常实战

\`\`\`java
// 三个文件:BizException.java / OrderService.java / BizDemo.java

/** 业务异常:携带错误码,继承 RuntimeException 不污染调用方签名 */
public class BizException extends RuntimeException {
    private final int code;

    public BizException(int code, String message) {
        super(message);
        this.code = code;
    }

    public int getCode() { return code; }
}

/** 使用:参数校验失败直接抛,上层统一捕获转 HTTP 响应 */
class OrderService {
    public void create(int qty) {
        if (qty <= 0) {
            throw new BizException(40001, "下单数量必须大于0, 实际: " + qty);
        }
    }
}

public class BizDemo {
    public static void main(String[] args) {
        try {
            new OrderService().create(0);
        } catch (BizException e) {
            System.out.println(e.getCode() + ": " + e.getMessage());
        }
    }
}
\`\`\`

\`\`\`output
40001: 下单数量必须大于0, 实际: 0
\`\`\`

> [!warn] 异常不是流程控制
> 抛接异常的成本比 if 判断高 2~3 个数量级:==fillInStackTrace== 要抓取整个调用栈快照(可重写 ==fillInStackTrace== 返回 this 来优化纯业务异常)。**用异常处理"异常路径",不要用异常判断"业务分支"**——比如拿 NumberFormatException 判断字符串是不是数字,就是教科书级反例。

## 面试速记

- checked 编译器强制处理,语义是可恢复的外部故障;unchecked 是编程 bug,业务异常继承 RuntimeException。
- finally 只有 exit / JVM 崩溃 / 只剩守护线程才不执行;finally 的 return 吞返回值也吞异常。
- 返回值在 try 的 return 处暂存:finally 改局部变量无效,改对象属性有效。
- try-with-resources = 编译器生成 finally close + addSuppressed 保住主异常,资源后开先关。
- 异常不做流程控制;性能敏感的业务异常可重写 fillInStackTrace 免抓栈。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch05',
        title: '抽象类·接口·内部类·枚举',
        minutes: 30,
        points: ['接口vs抽象类', '模板方法', '匿名内部类', '枚举单例'],
        content: `
> [!interview] 本章面试锚点
> "接口和抽象类有什么区别?怎么选?"是 Top3 高频题。再往深挖:**匿名内部类为什么只能捕获 effectively final 变量?枚举实现单例为什么最安全?**这三问都在本章,答出"接口不能持有实例状态"这条本质分界线,直接和背词条的候选人拉开差距。

> [!info] 本章导读 · 接口和抽象类,到底该选哪个?
> 面试高频 Top3,工作中也天天纠结:想复用代码又想留扩展点,最后写出一堆空实现。本章把抽象类、接口、内部类、枚举放在一起对比,边界一次说清。
> - 读完本章你将能:用一张表说清抽象类与接口的分工
> - 用枚举替代魔法值,并写出带方法的枚举
> - 解释匿名内部类为什么只能捕获 effectively final 变量

> [!tip] 日常电脑现场 · 插头与下拉框
> 换一根充电线照样能充,因为厂商都按 USB-C 的形状和针脚来做,手机不用认识线的品牌 —— 接口就是这份形状约定,插上就能用。设置里点开"主题"下拉框,只有浅色、深色、跟随系统三项,点不出第四种,枚举就是把可选值钉死在这几个上。

## 抽象类 vs 接口(默写级对比)

| 维度 | 抽象类 abstract class | 接口 interface |
| --- | --- | --- |
| 继承 | 单继承 | 多实现(一个类可实现 N 个接口) |
| 成员变量 | 任意(可为普通实例字段) | 只能 ==public static final== 常量 |
| 方法 | 具体方法 + 抽象方法 | 抽象方法 + default/static(JDK 8+) + private(JDK 9+) |
| 构造器 | 有(供子类 super 调用) | 无 |
| 语义 | **是什么(is-a)**,模板复用 | **能做什么(can-do)**,能力契约 |
| 状态 | 可持有实例状态 | 不能持有实例状态 |

选型口诀:**有公共状态与模板逻辑要复用 → 抽象类;只定义能力、需要多继承效果 → 接口**。标准组合范本:ArrayList implements List,同时继承 AbstractList 骨架实现(Skeletal Implementation)——接口定契约,抽象类打样。

\`\`\`java
/** 接口:能力契约 + default 方法给实现者兜底 */
interface Weight {
    int grams();

    default boolean heavierThan(Weight other) {   // JDK 8 default:接口也能带实现
        return this.grams() > other.grams();
    }
}

/** 抽象类:模板方法模式 —— 流程固定,步骤留白 */
abstract class Game {
    // final 锁住流程骨架,子类只能填空,不能改流程
    public final void play() {
        initialize();
        start();
        end();
    }
    protected void initialize() { System.out.println("通用初始化"); }
    protected abstract void start();              // 留给子类的必填题
    protected void end() { System.out.println("通用结算"); }
}

class Chess extends Game implements Weight {
    @Override
    protected void start() { System.out.println("象棋:红先黑后"); }
    @Override
    public int grams() { return 800; }
}

public class TmplDemo {
    public static void main(String[] args) {
        Chess c = new Chess();
        c.play();
        System.out.println(c.heavierThan(() -> 100));   // Lambda 也能实现单方法接口
    }
}
\`\`\`

\`\`\`output
通用初始化
象棋:红先黑后
通用结算
true
\`\`\`

> [!interview] 高频追问:两个接口有同名 default 方法怎么办?
> 编译器强制你**重写冲突方法**;想复用其中某个接口的实现,用 ==接口名.super.method()== 显式指定。这是接口多实现"菱形问题"的官方解法,与 C++ 虚继承对比着说更出彩。

## 内部类四种:各藏在哪

| 类型 | 写法位置 | 能访问什么 | 典型场景 |
| --- | --- | --- | --- |
| 静态内部类 | 类里 static class | 外部类静态成员 | Builder 模式、Map.Entry |
| 成员内部类 | 类里(非 static) | 外部类**全部成员**(含私有实例字段) | 迭代器实现 |
| 局部内部类 | 方法体里 | 局部变量 + 外部成员 | 一次性辅助逻辑 |
| 匿名内部类 | new X() {...} | 同局部类;捕获 effectively final | 回调、Comparator |

\`\`\`java
import java.util.Arrays;
import java.util.Comparator;

public class InnerDemo {
    private int secret = 42;

    class Inner {                                  // 成员内部类:隐式持有外部类引用
        void peek() { System.out.println("看到外部私有字段: " + secret); }
    }

    public static void main(String[] args) {
        InnerDemo outer = new InnerDemo();
        InnerDemo.Inner in = outer.new Inner();    // 成员内部类特有的 new 语法
        in.peek();

        // 匿名内部类:一次性实现;捕获的 n 必须 effectively final
        int n = 10;
        Comparator<Integer> cmp = new Comparator<Integer>() {
            @Override
            public int compare(Integer a, Integer b) {
                return Math.abs(a - n) - Math.abs(b - n);   // 按离 n 的距离排序
            }
        };
        Integer[] arr = {3, 12, 8, 5};
        Arrays.sort(arr, cmp);
        System.out.println(Arrays.toString(arr));
    }
}
\`\`\`

\`\`\`output
看到外部私有字段: 42
[12, 8, 5, 3]
\`\`\`

> [!warn] 成员内部类 = 隐形的内存泄漏源
> 成员内部类与非静态匿名内部类**隐式持有外部类实例引用**:Android 的 Handler 泄漏、Thread 里 new 的回调拖住大对象,都是这一个原因。规则:**内部类不需要访问外部实例就声明 static**。Lambda 无捕获时不生成对外引用,比匿名类更省。

## 匿名内部类为什么只能捕获 final 变量

根子是**生命周期不一致**:局部变量活在栈帧里,方法返回即销毁;匿名类实例在堆上,可能被线程池、监听器持有很久。堆对象指不到已消失的栈帧变量,编译器只能把变量**值复制**成匿名类的隐式字段。

既然是副本,就禁止原变量再变:否则类里看到 5、外面已是 10,两处不一致。JDK 7 前强制 final,JDK 8 放宽为 ==effectively final==。

\`\`\`java
int count = 0;
Runnable bad = () -> System.out.println(count);
count++;        // 编译错误
\`\`\`

\`\`\`output
error: local variables referenced from a lambda expression must be final or effectively final
\`\`\`

\`\`\`java
final int limit = 10;
Runnable ok = () -> System.out.println(limit); // 正例:声明后不再赋值
\`\`\`

匿名类最直观:javac 生成 ==Xxx$1== 类,构造器多一个 int 参数,run() 读 ==this.val== 而非外层栈帧。可变状态用 ==AtomicInteger== 或单元素数组。

> [!interview] 速记
> ==栈帧会销毁,匿名对象还活着 → 只能复制值;复制了就必须禁止原变量再变。==

## 枚举:JVM 级单例

\`\`\`java
public enum OrderStatus {
    WAIT_PAY("待支付"),
    PAID("已支付"),
    CLOSED("已关闭");

    private final String desc;

    OrderStatus(String desc) { this.desc = desc; }   // 枚举构造器天然 private

    public String getDesc() { return desc; }
}

public class EnumDemo {
    public static void main(String[] args) {
        OrderStatus s = OrderStatus.PAID;
        System.out.println(s + " / " + s.getDesc());
        System.out.println(s.ordinal() + " " + s.name());

        // 字符串转枚举:不存在时抛 IllegalArgumentException
        System.out.println(OrderStatus.valueOf("WAIT_PAY"));

        for (OrderStatus st : OrderStatus.values()) {   // 声明顺序返回全部实例
            System.out.print(st + " ");
        }
    }
}
\`\`\`

\`\`\`output
PAID / 已支付
1 PAID
WAIT_PAY
WAIT_PAY PAID CLOSED
\`\`\`

枚举单例三重保险(背诵版):① 实例由 JVM 在类加载时创建,**天然线程安全**;② **反射无法调枚举构造器**(Constructor.newInstance 对枚举直接抛 IllegalArgumentException);③ **反序列化不走构造器也不新建对象**,readObject 按名字返回已有常量。Joshua Bloch 的结论:单元素枚举是实现单例的最佳方式。

> [!tip] 枚举也能实现接口、带抽象方法
> 枚举可以 ==implements== 接口,甚至让每个常量各自重写抽象方法(常量级多态,策略模式的极简形态)。枚举做 key 时用 ==EnumMap/EnumSet==:内部就是数组,比 HashMap 快得多也省得多。

## record:不可变数据载体(JDK 16+)

\`\`\`java
public record Point(int x, int y) {
    public Point {                     // 紧凑构造器:参数校验的正规入口
        if (x < 0 || y < 0) throw new IllegalArgumentException("坐标非负");
    }
    public double dist() { return Math.sqrt(x * x + y * y); }   // 可追加普通方法
}

public class RecordDemo {
    public static void main(String[] args) {
        Point p = new Point(3, 4);
        System.out.println(p + " dist=" + p.dist());
        System.out.println(p.x() + " " + p.equals(new Point(3, 4)));
    }
}
\`\`\`

\`\`\`output
Point[x=3, y=4] dist=5.0
3 true
\`\`\`

record 自动生成:private final 字段、全参构造器、访问器 x()/y()(**不是 getX()**)、equals/hashCode/toString。它是**隐式 final 类**,不能继承,但可实现接口——适合替换"只有数据的 JavaBean",也是网络与函数式章 Stream 样例的主角。

## 面试速记

- 接口=能力契约(can-do)多实现、无状态、有 default 方法;抽象类=模板复用(is-a)单继承、可有状态与构造器。
- 模板方法模式:父类 final 方法锁流程,子类实现抽象步骤填空。
- 匿名内部类捕获 effectively final:值拷贝,防栈帧销毁后变量失联;成员/匿名内部类隐式持外部引用,不用外部实例就 static。
- 枚举单例三重保险:类加载线程安全 + 反射禁入 + 反序列化按 name 返回。
- record 是不可变数据载体,自动生成访问器与 equals/hashCode,访问器名不带 get。

`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch06',
        title: '泛型·注解·反射(框架基石)',
        minutes: 30,
        points: ['类型擦除', 'PECS', '元注解', '反射原理'],
        content: `
> [!interview] 本章面试锚点
> "什么是类型擦除?泛型在运行期还在吗?反射为什么慢?Spring 的 @Autowired 是怎么生效的?"——本章是理解所有框架的地基:**注解是标记,反射是引擎**。能答出"擦除的是方法体内的检查,签名信息存在 class 文件的 Signature 属性里",就是源码级信号。

> [!info] 本章导读 · Spring 凭什么看一眼注解,就能帮你把对象造好?
> 你天天写 @Autowired、@RequestMapping,却说不清它们为什么能生效;泛型用了很久,一到运行期就"消失"。本章讲的是所有框架共用的底座:泛型、注解、反射。
> - 读完本章你将能:解释类型擦除以及它带来的限制
> - 自定义一个注解并用反射读取它
> - 写一个迷你对象装配器,理解框架在做什么

> [!tip] 日常电脑现场 · 万能遥控器
> 一个万能遥控器对着空调、电视、机顶盒都能按,面板还是那几个键,内部却按设备换了一套码 —— 运行时才知道对面是谁,这就是反射干的事。而遥控器背面写着"仅适配红外设备",等于泛型给的编译期限制:类型不对,当场就按不下去。

## 泛型:编译期的契约,运行期的擦除

\`\`\`java
import java.util.ArrayList;
import java.util.List;

public class ErasureDemo {
    public static void main(String[] args) {
        List<String> a = new ArrayList<>();
        List<Integer> b = new ArrayList<>();
        System.out.println(a.getClass() == b.getClass());   // 同一个 Class 对象!

        // 擦除的代价:运行期拿不到 T,以下全部编译不过
        // T t = new T();                          // 不知道 T 的构造器
        // T[] arr = new T[10];                    // 不能创建泛型数组
        // obj instanceof List<String> ls          // instanceof 不能带泛型参数
    }
}
\`\`\`

\`\`\`output
true
\`\`\`

**擦除规则**:无边界擦成 ==Object==,有边界 ==<T extends Number>== 擦成 Number;编译器在调用点自动插入 checkcast 强转。但类/方法/字段的**泛型签名保留在 class 文件的 Signature 属性**——Spring 能对 ==List<User>== 类型的字段反射出完整泛型(getGenericType),靠的就是它。**擦除 ≠ 全丢,丢的是运行期实例上的,留的是元数据里的。**

通配符与 PECS 原则:

| 写法 | 含义 | 能存 | 能取 |
| --- | --- | --- | --- |
| List<? extends Number> | Number 及子类的只读视图 | 不能 add(null 除外) | 取出当 Number 用 |
| List<? super Integer> | Integer 及父类的只写视图 | 能存 Integer 及子类 | 取出只能当 Object |

口诀 **Producer Extends, Consumer Super**:生产数据(往外读)用 extends,消费数据(往里写)用 super。==Collections.copy(List<? super T> dest, List<? extends T> src)== 是官方范例。

## 注解:贴在代码上的元数据

\`\`\`java
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)                // 保留到运行期,反射才读得到
@Target({ElementType.TYPE, ElementType.METHOD})    // 只能贴类和方法
public @interface Route {
    String path();                                 // 无默认值的必须填
    String method() default "GET";                 // 有默认值可省略
}
\`\`\`

三个元注解(注解的注解)必记:

| 元注解 | 作用 | 取值 |
| --- | --- | --- |
| @Retention | 存活周期 | SOURCE(如 @Override)→ CLASS → **RUNTIME** |
| @Target | 能贴哪里 | TYPE / METHOD / FIELD / PARAMETER 等 |
| @Inherited / @Repeatable | 子类可继承 / 可重复贴 | — |

> [!tip] 注解自己什么都不会做
> ==@Override== 是 SOURCE 级,编译完就没了,只帮编译器查错;==@Autowired== 能注入,是因为 Spring 在**运行期用反射读了它**。记住这句话:**注解是标签,反射是扫描仪,业务逻辑全在扫描仪里**——面试说这句,后面所有框架问题都有了统一坐标系。

## 反射:框架的发动机

\`\`\`java
import java.lang.reflect.Field;
import java.lang.reflect.Method;

public class ReflectDemo {
    public static void main(String[] args) throws Exception {
        // 三种拿 Class 的方式:类名.class / 对象.getClass() / Class.forName
        Class<?> c1 = String.class;
        Class<?> c2 = Class.forName("java.lang.String");
        System.out.println(c1 == c2);                       // 同一个 Class 对象

        // 1. 无参构造实例化(等价 new)
        Object emptyStr = c1.getDeclaredConstructor().newInstance();

        // 2. 暴力访问私有字段:绕过 private
        class Box { private int money = 666; }
        Object box = Box.class.getDeclaredConstructor().newInstance();
        Field f = Box.class.getDeclaredField("money");
        f.setAccessible(true);                              // 关闭访问检查
        System.out.println(f.get(box));

        // 3. 调用方法:invoke(对象, 参数)
        Method m = c1.getMethod("length");
        System.out.println(m.invoke(emptyStr));             // 空串长度 0
    }
}
\`\`\`

\`\`\`output
true
666
0
\`\`\`

反射的四大应用场景(每个都能展开一分钟):

- **Spring IoC**:扫描 @Component → 反射实例化 Bean → 反射读字段注入依赖(@Autowired 不用 new 的原因)。
- **MyBatis**:把查询结果列名映射到实体字段,反射调 setter。
- **JDBC 驱动加载**:==Class.forName("com.mysql.cj.jdbc.Driver")==。
- **动态代理**:JDK Proxy 基于反射实现 AOP 与 RPC 客户端。

> [!warn] 反射的两笔代价
> ① **性能**:方法查找、访问检查、参数装箱,比直接调用慢一个数量级;热点路径靠缓存 Method/Field 对象、MethodHandle 或字节码生成(如 CGLIB)优化;② **安全**:==setAccessible(true)== 绕过 private 破坏封装,JDK 9+ 模块系统对未开放包直接拒绝(需要 ==--add-opens== 参数)。

## 三者如何拼出一个迷你 Spring

\`\`\`text
启动扫描:  递归扫 class 文件 → 反射读注解 @Component            ← 注解提供"谁要管理"
实例化:    Class.forName → getDeclaredConstructor().newInstance() ← 反射造对象
注入:      反射遍历带 @Autowired 的字段 → setAccessible → field.set(obj, 依赖)
AOP:      JDK 动态代理/CGLIB 包一层代理对象,方法调用转发进切面    ← 反射 invoke
\`\`\`

一句话总结:**注解声明意图,反射执行意图**。理解这一句,Spring/IoC 的"魔法"就全部祛魅了——这也是它叫"框架基石"的原因。

## SPI:框架扩展的黄金机制

SPI(Service Provider Interface)是 JDK 内置的**服务发现机制**,解决"框架定义接口、第三方提供实现,框架如何在运行期找到这些实现类"的问题:实现方只需把实现类全限定名写进 ==META-INF/services/接口全限定名== 的文件,调用方用 **ServiceLoader** 一行代码即可发现并实例化全部实现——**调用方只依赖接口,不依赖任何实现类**,新增实现不用改一行调用代码。

### 完整可运行示例

\`\`\`java spi/Robot.java
package spi;

public interface Robot {
    String name();
    void hello();
}
\`\`\`

\`\`\`java spi/Arobot.java
package spi;

public class Arobot implements Robot {
    public String name() { return "Atlas"; }
    public void hello() { System.out.println("[Atlas] 机械臂, 会拧螺丝"); }
}
\`\`\`

\`\`\`java spi/Brobot.java
package spi;

public class Brobot implements Robot {
    public String name() { return "Spot"; }
    public void hello() { System.out.println("[Spot] 机器狗, 会翻跟头"); }
}
\`\`\`

注册文件:**路径与文件名是硬性约定**(resources 目录 + 接口全限定名),内容一行一个实现类:

\`\`\`text META-INF/services/spi.Robot
spi.Arobot
spi.Brobot
\`\`\`

\`\`\`java spi/SpiMain.java
package spi;

import java.util.ServiceLoader;

public class SpiMain {
    public static void main(String[] args) {
        // 扫描 classpath 下所有 META-INF/services/spi.Robot,实例化全部实现类
        ServiceLoader<Robot> loader = ServiceLoader.load(Robot.class);
        for (Robot robot : loader) {
            System.out.println("发现实现: " + robot.getClass().getName());
            robot.hello();
        }
    }
}
\`\`\`

\`\`\`output
发现实现: spi.Arobot
[Atlas] 机械臂, 会拧螺丝
发现实现: spi.Brobot
[Spot] 机器狗, 会翻跟头
\`\`\`

注意 SpiMain 里没有任何一行 import Arobot/Brobot——这就是"面向接口 + 配置发现"的解耦威力。

### JDBC 4.0 与双亲委派的关系

JDBC 4.0(JDK 6)起,把驱动 jar 放进 classpath,==DriverManager== 就自动识别所有驱动,原理正是 SPI:mysql-connector-j 的 jar 内置了下面这个文件:

\`\`\`text mysql-connector-j jar 内部
META-INF/services/java.sql.Driver
文件内容只有一行:com.mysql.cj.jdbc.Driver
\`\`\`

这里藏着一个经典矛盾:**DriverManager 由启动类加载器加载**(java.sql 是 JDK 核心模块),而驱动实现类在**应用 classpath**——按双亲委派,启动类加载器根本"看不见"应用类。JDK 的解法是 **SPI + 线程上下文类加载器(TCCL)**:ServiceLoader 默认取当前线程的上下文类加载器(默认是应用类加载器)去加载实现类,相当于"父加载器反向借子的手加载类",**破坏了双亲委派的单向性**。类加载器与 TCCL 的完整展开见 JVM 模块章节。

### Spring 自动配置就是 SPI 思想

Spring Boot 自动配置沿用同一套思路(自研加载器 ==SpringFactoriesLoader==):把"要自动注册的类"声明在约定位置的约定文件里,框架启动时批量读取并注册:

\`\`\`text Spring Boot 2.7 前后两种注册文件
# 老方式:META-INF/spring.factories(properties 格式,末行续行符)
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\\
  com.example.MyRedisAutoConfiguration,com.example.MyMqAutoConfiguration

# 新方式(3.x):META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
com.example.MyRedisAutoConfiguration
com.example.MyMqAutoConfiguration
\`\`\`

> [!info] SPI 三步背诵版
> ① 定义接口;② 实现类全限定名写入 ==META-INF/services/接口全限定名==;③ ==ServiceLoader.load(接口.class)== 遍历加载。进阶一句话:**SPI = 接口约定 + 资源文件约定 + TCCL 加载,三位一体**;JDBC 驱动、SLF4J 绑定日志实现、Spring 自动配置全是它的变体。

## 自定义注解:从定义到反射解析

### 定义:@interface 加元注解

注解(Annotation)是贴在代码上的**元数据**,本身没有业务逻辑。真正让它生效的只有三种读者:编译器(如 @Override 检查)、注解处理器(编译期生成代码)、**反射(运行期框架)**。自定义注解的骨架就是一个 ==@interface==,属性写成"无参方法 + default 值"。

\`\`\`java MyLog.java
import java.lang.annotation.*;

@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
public @interface MyLog {
    String value() default "";       // 使用时 @MyLog("下单") 可省略 value =
    int limit() default 0;
}
\`\`\`

| 元注解 | 作用 | 关键点 |
| --- | --- | --- |
| @Target | 限定能标注的位置 | TYPE/METHOD/FIELD/PARAMETER/CONSTRUCTOR/LOCAL_VARIABLE;不写则几乎处处可用 |
| @Retention | 保留到哪个阶段 | SOURCE 编译丢弃;CLASS 默认,class 文件里有但反射读不到;RUNTIME 反射可读 |
| @Documented | 纳入 javadoc | 只影响文档生成,不影响运行 |
| @Inherited | 子类继承父类的注解 | 只对**类注解**生效,方法、字段上的注解不继承 |
| @Repeatable | 同一位置可重复标注 | 必须同时提供一个容器注解(JDK 8+) |

### 运行时注解:反射读取并解析

只有 ==RetentionPolicy.RUNTIME== 的注解才会被写进 class 文件的 RuntimeVisibleAnnotations 属性,类加载后仍保留,getAnnotation 才拿得到。下面用 @MyLog 标在方法上,启动时扫描并打印:

\`\`\`java AnnotationDemo.java
import java.lang.reflect.Method;

public class AnnotationDemo {

    @MyLog(value = "创建订单", limit = 3)
    public void create(String user) { }

    public void query() { }

    public static void main(String[] args) throws Exception {
        Method create = AnnotationDemo.class.getMethod("create", String.class);
        MyLog log = create.getAnnotation(MyLog.class);          // 拿到注解代理对象
        if (log != null) {
            System.out.println("value=" + log.value() + ", limit=" + log.limit());
        }

        Method query = AnnotationDemo.class.getMethod("query");
        System.out.println("query 有注解: " + query.isAnnotationPresent(MyLog.class));
    }
}
\`\`\`

\`\`\`output
value=创建订单, limit=3
query 有注解: false
\`\`\`

\`\`\`shell
# RUNTIME 注解才会出现在 RuntimeVisibleAnnotations 属性里
javap -v -p 'target/classes/AnnotationDemo.class' | grep -A 6 Annotations
\`\`\`

### 注解的本质:接口 + 动态代理

==@interface== 编译后就是一个继承 ==java.lang.annotation.Annotation== 的接口,"属性"是接口里的抽象方法;反射调用 getAnnotation 时,JDK 用**动态代理**生成实现类,方法调用被转发到 ==AnnotationInvocationHandler==,从成员值 Map 里取值返回。所以注解属性不能有参数、不能抛异常,返回值只能是基本类型、String、Class、枚举、注解或它们的数组。

\`\`\`text
源码:  @interface MyLog { String value(); }
字节码:interface MyLog extends Annotation {
            String value();                 ← 注解"属性"= 无参抽象方法
        }
反射:  create.getAnnotation(MyLog.class)
        → 动态代理 $Proxy 实现 MyLog
        → AnnotationInvocationHandler.invoke("value")
        → 从 memberValues 这个 Map 里取出 "创建订单"

class 文件:
  @Retention(SOURCE)  → 编译后直接消失
  @Retention(CLASS)   → RuntimeInvisibleAnnotations(默认,反射不可见)
  @Retention(RUNTIME) → RuntimeVisibleAnnotations(反射可读)
\`\`\`

> [!interview] 高频追问:注解为什么能拿到值?
> ① 注解是接口,属性是抽象方法;② 编译器把 ==@MyLog(value="创建订单")== 的值写进 class 文件的注解属性;③ 类加载后 JVM 保留 RUNTIME 注解;④ 反射调用 getAnnotation 时由动态代理实现该接口,方法调用从解析好的 Map 里取值。**注解 + 反射 + 动态代理**是 Spring 声明式编程的底座。

> [!pitfall] 没写 RUNTIME,反射永远返回 null
> 不写 @Retention 时默认是 **CLASS**,注解虽然在 class 文件里,但 JVM 加载后不会保留为运行时注解,getAnnotation 返回 null。@Override 则是 **SOURCE**,编译完就丢。排查"注解不生效"先看 Retention;再看 @Target 是否标错位置;最后看类是否被代理(JDK 代理只继承接口,方法上的注解要用 AopUtils 或目标类元数据取)。

## 面试速记

- 类型擦除:泛型只在编译期做检查 + 插入 checkcast;Class 对象不区分泛型参数;Signature 元数据仍可反射解析。
- PECS:读数据 extends、写数据 super;extends 视图不能写,super 视图只能读成 Object。
- 注解本身无逻辑,必须 RUNTIME 保留 + 反射读取才生效;@Override 编译后即消失。
- 反射拿 Class 三方式;getDeclaredField + setAccessible 破 private;代价是性能与封装。
- Spring IoC 四步:扫注解 → 反射实例化 → 反射注入 → 动态代理增强。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch07',
        title: '集合框架(上):List 与 Set',
        minutes: 35,
        points: ['ArrayList扩容', 'LinkedList', 'HashSet去重', 'fail-fast'],
        content: `
> [!interview] 本章面试锚点
> "ArrayList 和 LinkedList 谁快?"——答"随机访问 ArrayList、头尾插 LinkedList"只算及格;说出**懒初始化 + 1.5 倍扩容 + copyOf 拷贝、LinkedList 的 node(index) 折半查找、缓存局部性让 ArrayList 几乎全场景胜出**,才是源码级回答。

> [!info] 本章导读 · ArrayList 和 LinkedList,到底谁快?
> 很多人背了一句"随机访问用 ArrayList、频繁插入用 LinkedList",面试官再追问一句扩容和缓存就露馅。本章从源码和内存布局出发,把 List 与 Set 的选型讲透。
> - 读完本章你将能:说清 ArrayList 的 1.5 倍扩容与拷贝成本
> - 按读写比例和有序性选对集合
> - 用迭代器安全地边遍历边删除

> [!tip] 日常电脑现场 · 待办清单与歌单
> 手机待办里加一条、划掉一条,顺序按你添加的来,想看紧急的再按截止时间重排 —— 前者是列表,后者是排序。播放列表里同一首歌不会重复出现,点过的歌还会排在队首,背后是去重又保序的集合在记着。通讯录里翻半天找不到某人,其实就是一次"有没有这个人"的判断。

## 集合家族总览

\`\`\`diagram:d-collection
\`\`\`

集合家族拍全家福,各有各的绝活:**List** 是排队买奶茶,谁先来谁在前,还允许两个一模一样的人并排站;**Set** 是班里的点名册,同一个名字写两遍会被划掉;**Map** 是本字典,不按座位号找人,而是报一个字直接翻到那一页。选集合前先问自己三件事:要顺序、要不重复、还是要按 key 秒查。

\`\`\`text
Collection                     Map
 ├── List(有序可重复)          ├── HashMap(数组+链表/红黑树, HashMap 章)
 │    ArrayList / LinkedList   │    LinkedHashMap(保插入序)/ TreeMap(排序)
 ├── Set(不重复)               └── Hashtable(1.0 遗留,别用)
 │    HashSet / LinkedHashSet / TreeSet
 └── Queue / Deque(队列双端)
\`\`\`

Vector / Hashtable 是 1.0 遗留的**全方法 synchronized** 老古董,锁粒度粗性能差,只出现在"它和 ArrayList 的区别"这类考古题里——回答时点明"现在被 ArrayList + 明确锁策略取代"即可。

## ArrayList 源码:懒初始化与 1.5 倍扩容

\`\`\`java
// 源码摘录(JDK 17,教学化简,仅供阅读)
public class ArrayList<E> {
    private static final int DEFAULT_CAPACITY = 10;
    private static final Object[] DEFAULTCAPACITY_EMPTY_ELEMENTDATA = {};  // 共享空数组
    transient Object[] elementData;      // 真正存数据的数组,transient 不参与序列化
    private int size;                    // 逻辑长度,不等于数组容量

    public ArrayList() {
        this.elementData = DEFAULTCAPACITY_EMPTY_ELEMENTDATA;  // 尚未分配独立的元素数组
    }

    private Object[] grow(int minCapacity) {
        int oldCapacity = elementData.length;
        if (oldCapacity > 0) {
            int newCapacity = Math.max(minCapacity, oldCapacity + (oldCapacity >> 1));
            return elementData = Arrays.copyOf(elementData, newCapacity); // 保留已有元素
        }
        return elementData = new Object[Math.max(DEFAULT_CAPACITY, minCapacity)];
    }
}
\`\`\`

三个必背结论:

- **new ArrayList() 会创建列表对象,但暂不分配独立的元素数组**,首次 add 时才扩到 10(懒初始化,省内存)。上方为教学化简,省略了导入、其他成员、JDK 内部容量计算与溢出检查,只能阅读。
- 扩容 ==newCap = oldCap + (oldCap >> 1)== 即 **1.5 倍**(10→15→22→33...),位运算避免浮点。
- ==Arrays.copyOf== 底层 ==System.arraycopy==(native,内存级拷贝),单次扩容 O(n),能预估就 ==new ArrayList<>(容量)==。

> [!tip] 说出扩容轨迹就是源码级
> 面试可以主动补一句:"add 20 个元素的容量轨迹是 0 → 10 → 15 → 22"。"默认 10、1.5 倍扩容"各值 1 分,**懒初始化 + 位运算 + copyOf 的拷贝代价**才是加分项,还能顺势引出"为什么频繁扩容要预估容量"。

## LinkedList:双向链表,随机访问靠折半

\`\`\`java
// 源码摘录(JDK 17,有删减)
public class LinkedList<E> {
    transient Node<E> first;             // 头指针
    transient Node<E> last;              // 尾指针:addLast O(1) 的关键
    private int size;

    private static class Node<E> {
        E item;
        Node<E> next;                    // 双向:前进后退都能走
        Node<E> prev;
    }

    Node<E> node(int index) {            // get(index) 的真实成本
        if (index < (size >> 1)) {       // 前半段:从头找
            Node<E> x = first;
            for (int i = 0; i < index; i++) x = x.next;
            return x;
        } else {                         // 后半段:从尾找——折半优化,但仍是 O(n)
            Node<E> x = last;
            for (int i = size - 1; i > index; i--) x = x.prev;
            return x;
        }
    }
}
\`\`\`

==get(i)== 不是链表的天然能力:JDK 做了**折半优化**(从较近的一端走),但渐进复杂度仍是 O(n)。所谓"LinkedList 查询慢",慢就慢在这。

## 谁快?跑个分(打破"链表插入快"的迷信)

\`\`\`java
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

public class ListBench {
    public static void main(String[] args) {
        int n = 100_000;

        List<Integer> al = new ArrayList<>();
        long t = System.nanoTime();
        for (int i = 0; i < n; i++) al.add(i);          // 尾插
        System.out.println("ArrayList 尾插: " + (System.nanoTime() - t) / 1_000_000 + " ms");

        List<Integer> ll = new LinkedList<>();
        t = System.nanoTime();
        for (int i = 0; i < n; i++) ll.add(i);
        System.out.println("LinkedList 尾插: " + (System.nanoTime() - t) / 1_000_000 + " ms");

        t = System.nanoTime();
        long sum = 0;
        for (int i = 0; i < n; i++) sum += ll.get(i);   // 随机访问
        System.out.println("LinkedList get 全量: " + (System.nanoTime() - t) / 1_000_000 + " ms");
    }
}
\`\`\`

\`\`\`output
ArrayList 尾插: 4 ms
LinkedList 尾插: 8 ms
LinkedList get 全量: 2104 ms
\`\`\`

(数字随机器波动,量级关系稳定)。**LinkedList 尾插也不占优**:每次 add 都要 new 节点分配内存,而 ArrayList 是连续内存、CPU 缓存命中率极高。真实结论:**除"头部频繁增删"外全场景默认 ArrayList**;头部增删场景也常被 ==ArrayDeque==(环形数组)碾压。

## Set 家族:HashSet 只是 HashMap 的皮

| 实现 | 底层 | 特点 |
| --- | --- | --- |
| HashSet | HashMap(dummy value) | 无序去重,近似 O(1);元素需正确实现 hashCode/equals |
| LinkedHashSet | LinkedHashMap + 双链表 | 保持**插入顺序** |
| TreeSet | 红黑树 | 自然排序或 Comparator,O(log n) |

\`\`\`java
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

public class SetDemo {
    public static void main(String[] args) {
        List<String> words = List.of("banana", "apple", "cherry", "apple", "banana");

        Set<String> hash = words.stream().collect(Collectors.toSet());
        Set<String> tree = new TreeSet<>(words);

        System.out.println(hash);
        System.out.println(tree);
    }
}
\`\`\`

\`\`\`output
[banana, apple, cherry]      # HashSet 顺序取决于哈希,本机一次输出
[apple, banana, cherry]
\`\`\`

> [!pitfall] HashSet 去重失败的真相
> ==HashSet.add== 先用 ==hashCode== 定桶,再用 ==equals== 判重。只重写 equals 不重写 hashCode(或不重写任一)→ 去重失效,这是String 与 API 章 Object 契约的落地现场。TreeSet 则不用 hashCode,靠 ==compareTo== 判重:**compareTo 返回 0 就当重复**,与 equals 不一致时会出现"对象不相等却加不进去"的诡异现象。

## fail-fast:迭代时改集合必炸

\`\`\`java
import java.util.ArrayList;
import java.util.List;

public class FailFast {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>(List.of("a", "b", "c"));

        // 错误姿势:遍历中调集合自己的 remove
        try {
            for (String s : list) {
                if ("a".equals(s)) list.remove(s);
            }
        } catch (Exception e) {
            System.out.println(e.getClass().getSimpleName());
        }

        // 正确姿势:removeIf(JDK 8+,内部用迭代器安全删除)
        List<String> safe = new ArrayList<>(List.of("a", "b", "c"));
        safe.removeIf("a"::equals);
        safe.removeIf("b"::equals);
        System.out.println(safe);
    }
}
\`\`\`

\`\`\`output
ConcurrentModificationException
[c]
\`\`\`

原理:集合维护 ==modCount==(结构性修改次数),Iterator 创建时记录 expectedModCount,**每次 next 前校验,不一致就抛 CME**。for-each 底层就是 Iterator,所以遍历中调用集合自己的 remove 必炸——著名例外:删除"倒数第二个元素"恰好不触发校验,这是经典陷阱题。多线程下 CME 只是尽力而为的检测,**不能依赖它保证线程安全**。

> [!warn] fail-fast 只是尽力而为
> Javadoc 明确写了 fail-fast 行为**无法保证**:并发修改可能不抛异常但迭代结果出错。并发场景直接上 ==CopyOnWriteArrayList==(读多写少)或显式加锁,别指望异常兜底。

## TreeMap·LinkedHashMap 与手写 LRU

| 维度 | HashMap | LinkedHashMap | TreeMap |
| --- | --- | --- | --- |
| 底层结构 | 数组 + 链表 + 红黑树 | HashMap + 双向链表串起节点 | 红黑树 |
| 遍历顺序 | 不保证 | 插入序或访问序 | 按 key 排序(自然序或 Comparator) |
| get/put | O(1) | O(1) | O(log n) |
| 额外开销 | - | 每个节点多前后两个指针 | 每次操作都要逐层比较下行 |
| 典型用途 | 通用首选 | 保序输出、LRU 缓存 | 排行榜、范围查询、有序输出 |

### TreeMap:红黑树 + Comparable

TreeMap 的 put/get 从根节点出发,用 compareTo/compare 逐层下行定位,天然**按键有序**:默认用 key 的自然顺序(Comparable),构造器传 Comparator 则按定制顺序。顺带收掉 ch03 埋的钩子:**TreeSet/TreeMap 只认比较结果是否为 0 来判重/覆盖,与 equals 无关**。

\`\`\`java TreeMapScore.java
import java.util.TreeMap;

public class TreeMapScore {
    // 返回值 <0 排左边、>0 排右边;o 在前 = 分数高者当"小节点" = 降序
    record Student(String name, int score) implements Comparable<Student> {
        @Override public int compareTo(Student o) {
            return Integer.compare(o.score, this.score);
        }
        @Override public String toString() { return name + ":" + score; }
    }

    public static void main(String[] args) {
        TreeMap<Student, Integer> rank = new TreeMap<>();   // key 自动按分数降序
        rank.put(new Student("张三", 92), 1);
        rank.put(new Student("李四", 88), 2);
        rank.put(new Student("王五", 95), 3);
        System.out.println(rank.keySet());                  // 遍历即排行榜
        System.out.println("firstKey(最高分)=" + rank.firstKey());
        System.out.println("lastKey(最低分)=" + rank.lastKey());
    }
}
\`\`\`

\`\`\`output
[王五:95, 张三:92, 李四:88]
firstKey(最高分)=王五:95
lastKey(最低分)=李四:88
\`\`\`

### LinkedHashMap:插入序 vs 访问序

LinkedHashMap = HashMap + **双向链表**(把所有节点串成一条),三参构造 ==new LinkedHashMap<>(initialCapacity, loadFactor, accessOrder)== 决定模式:

\`\`\`java LinkedHashMapOrder.java
import java.util.LinkedHashMap;

public class LinkedHashMapOrder {
    public static void main(String[] args) {
        // 模式一:accessOrder=false(默认),按插入顺序遍历,访问不改顺序
        LinkedHashMap<String, Integer> insertOrder = new LinkedHashMap<>(16, 0.75f, false);
        insertOrder.put("a", 1);
        insertOrder.put("b", 2);
        insertOrder.put("c", 3);
        insertOrder.get("a");                    // 访问 a,顺序不动
        System.out.println(insertOrder.keySet());

        // 模式二:accessOrder=true,每次访问(get/覆盖 put)把节点移到链表尾
        LinkedHashMap<String, Integer> accessOrder = new LinkedHashMap<>(16, 0.75f, true);
        accessOrder.put("a", 1);
        accessOrder.put("b", 2);
        accessOrder.put("c", 3);
        accessOrder.get("a");                    // a 变"最新",b 成"最久未访问"
        System.out.println(accessOrder.keySet());
    }
}
\`\`\`

\`\`\`output
[a, b, c]
[b, c, a]
\`\`\`

访问序就是 **LRU 的地基**:链表头=最久未访问,链表尾=最新访问,"淘汰最久未用"就是把链表头摘掉。

### 手写 LRU 缓存(大厂手撕高频题)

阿里、字节手撕代码题的常客。最优解:继承 LinkedHashMap 重写 ==removeEldestEntry==,核心不到 10 行:

\`\`\`java LRUCache.java
import java.util.LinkedHashMap;
import java.util.Map;

public class LRUCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;

    public LRUCache(int capacity) {
        super(capacity, 0.75f, true);            // accessOrder=true:按访问序
        this.capacity = capacity;
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity;                // 插入后超容量 → 淘汰链表头(最久未访问)
    }

    public static void main(String[] args) {
        LRUCache<String, Integer> cache = new LRUCache<>(3);
        cache.put("a", 1);
        cache.put("b", 2);
        cache.put("c", 3);
        System.out.println(cache + "   <- 已满");
        cache.get("a");                          // 访问 a → a 变最新,b 变最久未用
        cache.put("d", 4);                       // 装不下 → 淘汰 b
        System.out.println(cache + "   <- b 被淘汰");
    }
}
\`\`\`

\`\`\`output
{a=1, b=2, c=3}   <- 已满
{c=3, a=1, d=4}   <- b 被淘汰
\`\`\`

> [!interview] 手撕追问:不让用继承呢?
> 面试官常加一句"别用 LinkedHashMap":手写 **HashMap + 双向链表**——HashMap 的 value 直接存链表节点实现 O(1) 定位;get/put 命中就把节点摘下挂到尾部;插入后超容量删头节点并从 map 移除。再备两个细节:① ==accessOrder== 为 true 时 **put 覆盖旧 key 也算"访问"**,会刷新位置;② ==removeEldestEntry== 只在 put 之后被回调,get 不触发淘汰,过期数据的定时清理要自己做。

## 迭代器的 fail-fast·不可变集合与特殊 Map

### fail-fast:边遍历边删的爆炸现场

ArrayList、HashMap 这些普通集合都维护 ==modCount==(结构性修改计数)。迭代器创建时把当前值存进 ==expectedModCount==,每次 next()/remove() 先对一次账,不一致立刻抛 **ConcurrentModificationException(CME)**。它是"快速失败"的自检机制,**不是并发安全保证**:单线程也会触发,而且不保证每次必触发——删完元素后游标恰好等于 size 时,循环可能直接结束,连异常都没有。

\`\`\`java FailFastDemo.java
import java.util.*;

public class FailFastDemo {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>(List.of("A", "B", "C"));

        try {
            for (String s : list) {
                if ("A".equals(s)) {
                    list.remove(s);              // 结构性修改 → modCount++
                }
            }
        } catch (ConcurrentModificationException e) {
            System.out.println("捕获: " + e.getClass().getSimpleName());
        }

        // 正确姿势:迭代器自己删,会同步 expectedModCount
        Iterator<String> it = list.iterator();
        while (it.hasNext()) {
            if ("C".equals(it.next())) {
                it.remove();
            }
        }
        System.out.println("剩余: " + list);
    }
}
\`\`\`

\`\`\`output
捕获: ConcurrentModificationException
剩余: [B]
\`\`\`

对偶概念是 **fail-safe**:CopyOnWriteArrayList 在迭代器创建时拿一份**数组快照**,遍历期间原集合怎么改都不影响本次迭代,所以不抛 CME;代价是**看不到最新数据**、写操作要整体复制数组,只适合读多写极少(监听器列表、配置白名单)。

\`\`\`java CowDemo.java
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

public class CowDemo {
    public static void main(String[] args) {
        List<String> list = new CopyOnWriteArrayList<>(List.of("A", "B"));
        for (String s : list) {
            if ("A".equals(s)) {
                list.remove(s);                  // 迭代的是旧快照,不会抛 CME
            }
        }
        System.out.println("集合: " + list);
    }
}
\`\`\`

\`\`\`output
集合: [B]
\`\`\`

### 不可变集合:List.of / Map.of / toUnmodifiableList

JDK 9 起有了真正只读的工厂方法,JDK 10 补上 Collectors.toUnmodifiableList 与 List.copyOf。它们的特点是:**任何修改都抛 UnsupportedOperationException、拒绝 null、天然线程安全**。

\`\`\`java ImmutableDemo.java
import java.util.*;
import java.util.stream.Collectors;

public class ImmutableDemo {
    public static void main(String[] args) {
        List<String> list = List.of("A", "B");
        Map<String, Integer> map = Map.of("A", 1, "B", 2);
        List<String> copy = new ArrayList<>(List.of("A"))
                .stream().collect(Collectors.toUnmodifiableList());

        try {
            list.add("C");
        } catch (UnsupportedOperationException e) {
            System.out.println("List.of 不能 add: " + e.getClass().getSimpleName());
        }
        try {
            map.put("C", 3);
        } catch (UnsupportedOperationException e) {
            System.out.println("Map.of 不能 put: " + e.getClass().getSimpleName());
        }
        System.out.println(list + " size=" + map.size() + " " + copy);
    }
}
\`\`\`

\`\`\`output
List.of 不能 add: UnsupportedOperationException
Map.of 不能 put: UnsupportedOperationException
[A, B] size=2 [A]
\`\`\`

最容易混进来的是 ==Arrays.asList==:它返回的是**定长视图**,底层直接引用原数组——元素可以 set 修改,但 add/remove 一律抛异常;而且传入基本类型数组时,整个数组被当成一个元素。要只读视图用 ==Collections.unmodifiableList==,要真正不可变用 ==List.copyOf==(拷贝一份,原集合再改也不影响它)。

\`\`\`java ArraysAsListDemo.java
import java.util.*;

public class ArraysAsListDemo {
    public static void main(String[] args) {
        List<String> fixed = Arrays.asList("A", "B");
        fixed.set(0, "X");                       // 可以改元素:底层就是原数组
        System.out.println(fixed + " size=" + fixed.size());

        try {
            fixed.add("C");                       // 定长视图:add/remove 直接拒绝
        } catch (UnsupportedOperationException e) {
            System.out.println("add 失败: " + e.getClass().getSimpleName());
        }

        // 经典坑:基本类型数组被当成"一个对象"塞进 List
        System.out.println(Arrays.asList(new int[]{1, 2}).size());
    }
}
\`\`\`

\`\`\`output
[X, B] size=2
add 失败: UnsupportedOperationException
1
\`\`\`

### 特殊 Map:WeakHashMap 与 IdentityHashMap

**WeakHashMap** 的 key 是弱引用:一旦外部不再强引用这个 key,下次 GC 就会把 key 和整个 Entry 回收掉,size 归零。它天生适合做"跟着对象生命周期自动过期的附属缓存";而普通 HashMap 的 Entry 强引用 key,即使外部变量置空也不会释放。

\`\`\`java WeakMapDemo.java
import java.util.*;

public class WeakMapDemo {
    public static void main(String[] args) throws Exception {
        Map<Object, String> weak = new WeakHashMap<>();
        Map<Object, String> strong = new HashMap<>();
        Object k1 = new Object();
        Object k2 = new Object();
        weak.put(k1, "弱键");
        strong.put(k2, "强键");

        k1 = null;                               // 只剩 WeakHashMap 里的弱引用
        k2 = null;                               // HashMap 的 Entry 仍强引用 k2
        System.gc();
        Thread.sleep(200);

        System.out.println("WeakHashMap.size=" + weak.size());
        System.out.println("HashMap.size=" + strong.size());
    }
}
\`\`\`

\`\`\`output
WeakHashMap.size=0
HashMap.size=1
\`\`\`

**IdentityHashMap** 反其道而行:比较 key 用的是**双等号(引用地址)**,哈希用 System.identityHashCode,完全绕开 equals/hashCode。内容相同的两个不同对象可以共存,适合按"对象身份"建索引的框架内部(序列化、拓扑遍历、代理对象映射)。

\`\`\`java IdentityMapDemo.java
import java.util.*;

public class IdentityMapDemo {
    public static void main(String[] args) {
        Map<String, Integer> identity = new IdentityHashMap<>();
        Map<String, Integer> normal = new HashMap<>();
        String a = new String("key");
        String b = new String("key");            // 内容相同,地址不同

        identity.put(a, 1);
        identity.put(b, 2);
        normal.put(a, 1);
        normal.put(b, 2);

        System.out.println("IdentityHashMap.size=" + identity.size());
        System.out.println("HashMap.size=" + normal.size());
    }
}
\`\`\`

\`\`\`output
IdentityHashMap.size=2
HashMap.size=1
\`\`\`

| 集合 / 机制 | 判定方式 | 回收或修改行为 | 适用场景 |
| --- | --- | --- | --- |
| ArrayList 迭代器 | expectedModCount 对账 | 边遍历边改立即 CME | 单线程遍历,删除用 Iterator.remove |
| CopyOnWriteArrayList | 迭代快照 | 不抛 CME,写时复制 | 读多写极少的监听器列表 |
| List.of / Map.of | 结构不可变 | 修改抛 UnsupportedOperationException,拒绝 null | 常量配置、方法返回只读视图 |
| Arrays.asList | 定长数组视图 | set 可以,add/remove 抛异常 | 临时把数组当 List 用 |
| WeakHashMap | key 弱引用 | key 无强引用即被 GC 清 Entry | 对象附属缓存、自动过期表 |
| IdentityHashMap | 双等号比较身份 | 相同内容不同实例算两个 key | 框架按对象身份建索引 |

> [!interview] fail-fast 一句话背诵
> 集合维护 modCount,迭代器持有 expectedModCount;遍历期间发生结构性修改导致两值不等,next() 抛 ConcurrentModificationException。它是**错误检测机制**,不是线程安全机制;要并发遍历删改用 CopyOnWriteArrayList、ConcurrentHashMap 或先收集再批量删。

> [!best] 选型口诀
> 只读常量用 ==List.of==/==Map.of==(注意禁 null);需要可变再 new ArrayList;==Arrays.asList== 只当临时视图;缓存要跟对象生命周期走用 WeakHashMap;按身份区分对象用 IdentityHashMap。别拿 unmodifiableList 当并发集合——它只挡修改,读的时候底层集合仍可能被别的线程改。

## 面试速记

- ArrayList:new 时不分配,首 add 扩到 10;扩容 1.5 倍(oldCap >> 1),copyOf 整组拷贝 O(n),预估容量。
- LinkedList get(i) 折半查找仍 O(n);尾插每次 new 节点,实际不敌 ArrayList 的连续内存。
- 全场景默认 ArrayList,头尾操作用 ArrayDeque,LinkedList 只剩头插 + 迭代中删除场景。
- HashSet 去重 = hashCode 定桶 + equals 判重;TreeSet 只看 compareTo 是否为 0。
- fail-fast:modCount 校验机制,遍历中改集合抛 CME;正确姿势 Iterator.remove / removeIf。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch08',
        title: '集合框架(下):HashMap 源码与 ConcurrentHashMap',
        minutes: 40,
        points: ['put全流程', '扰动函数', '1.7/1.8对比', 'CAS+synchronized'],
        content: `
> [!interview] 本章面试锚点
> HashMap 是 Java 面试的**宇宙中心**:put 流程 → 扰动函数 → 为什么容量是 2 的幂 → 1.7 头插死循环 → 树化阈值为什么是 8 → ConcurrentHashMap 怎么加锁。这条追问链能一路问到并发与 JVM,先把动画过一遍建立直觉,再逐层拆源码。

> [!info] 本章导读 · HashMap 为什么被称为面试的"宇宙中心"?
> 一个 put 能追问到扰动函数、扩容、树化、红黑树,再顺着并发问到 ConcurrentHashMap 的分段与 CAS。这章先把动画看懂,再逐行拆源码,把追问链一次打通。
> - 读完本章你将能:背出 HashMap put 的完整流程
> - 解释容量为什么必须是 2 的幂
> - 说清 ConcurrentHashMap 在不同 JDK 版本的加锁方式

> [!tip] 日常电脑现场 · 通讯录字母索引
> 打开手机通讯录,右侧一列字母,点 M 就直接跳到姓马、姓孟的那一段,不用从 A 一路滑到底 —— 这就是用名字里的首字母算出位置、直接跳过去。查纸质字典也一样:你不会从第一页翻,而是先找 M 那一叠,再在里面顺序找。

\`\`\`demo:hashmap-put
\`\`\`

## put 全流程(1.8,背诵版)

\`\`\`diagram:d-hashmap
\`\`\`

把 HashMap 想成一排快递柜:**hash** 算出你的包裹该进第几号柜,大多数人一柜一件,取件飞快。可柜子只有那么多个,总有包裹算出同一个柜号,这时就在柜子里挂一条链,后来的往后接;链挂得太长,取件员要找半天,于是干脆把整串换成红黑树——这就是**链表树化**。

| 步骤 | 动作 | 关键源码 / 结论 |
| --- | --- | --- |
| 1 算 hash | 扰动:==(h = key.hashCode()) ^ (h >>> 16)== | 高 16 位异或低 16 位,让高位也参与定桶,减少碰撞 |
| 2 空表 | 首次 put 触发 resize() | 懒初始化,容量 16,负载因子 0.75 |
| 3 定桶 | ==i = (n - 1) & hash== | 等价取模但更快;容量必须是 2 的幂才成立 |
| 4 空桶 | 直接放入 | table[i] 为 null → 直接 newNode |
| 5 链表 | **尾插**遍历找相同 key | hash 相等且(双等号或 equals)→ 覆盖;否则尾插,长度达 8 树化 |
| 6 树化 | 链表长度 ≥ 8 且**容量 ≥ 64** | 容量不足先扩容,不是先树化 |
| 7 扩容检查 | ++size > threshold(16×0.75=12) | 超过阈值 → resize 翻倍 |

## 为什么容量必须是 2 的幂

\`\`\`java
public class PowerOfTwo {
    public static void main(String[] args) {
        // 传 10 也会被 tableSizeFor 修正:大于等于入参的最小 2 的幂
        System.out.println(tableSizeFor(10));
        System.out.println(tableSizeFor(17));

        // 与运算定桶 vs 取模:结果一致,性能差一个量级
        int hash = 0b1011_0101_1100_0011;
        System.out.println((16 - 1) & hash);
        System.out.println(hash % 16);
    }

    static int tableSizeFor(int cap) {
        int n = -1 >>> Integer.numberOfLeadingZeros(cap - 1);  // 最高位以下全填 1
        return (n < 0) ? 1 : (n >= 1 << 30) ? (1 << 30) : n + 1;
    }
}
\`\`\`

\`\`\`output
16
32
3
3
\`\`\`

三点结论:① ==hash & (n-1)== 与 ==hash % n== 结果一致,但**位运算远快于除法**;② n 是 2 的幂时 n-1 全是 1(如 15 = 1111),散列才均匀;③ 扩容翻倍时元素要么留原位 i、要么去 ==i + oldCap==——因为新增的那个 bit 只有两个取值。**1.8 的 resize 就是按这一位把链表一分为二**,免去了 1.7 逐个重新计算下标。

> [!interview] 高频追问:1.7 和 1.8 的区别?
> ① **结构**:数组+链表 → 数组+链表+**红黑树**(链表长 8 树化,查询 O(n)→O(log n));② **插入**:1.7 头插法,并发扩容迁移时链表翻转成**环,死循环**;1.8 尾插法修复;③ **扰动**:1.7 做 4 次移位 5 次异或,1.8 一次 ==h ^ (h >>> 16)==;④ **扩容迁移**:1.7 逐个重算下标,1.8 按新增 bit 位拆高低位两条链。注意:1.8 修好了死循环,但 HashMap **依然线程不安全**(覆盖写、size 不准)。

## 树化阈值为什么是 8(泊松分布)

答案在概率:桶内节点数服从**泊松分布**,λ=0.5(负载因子 0.75 下的平均桶长):

\`\`\`text
P(k) = λ^k * e^(-λ) / k!
k=6→0.00001316   k=7→0.00000094   k=8→0.00000006
\`\`\`

源码注释给的正是这张表:8 个节点只剩 ==0.00000006==,即一亿分之六。

所以 8 不是性能拐点,而是**兜底开关**:正常业务碰不到;一旦触发说明 hashCode 极差或有人**构造碰撞**(哈希洪水攻击)把 O(1) 打成 O(n)。树化把查询拉回 O(log n),代价是 TreeNode 约占普通 Node 的两倍。

\`\`\`java
/* TreeNodes are about twice the size of regular nodes ...
 * ... bins follow a Poisson distribution, parameter about 0.5 */
static final int TREEIFY_THRESHOLD = 8;
\`\`\`

退化阈值为何是 ==6== 不是 7?① 树节点两倍大,退化要果断省内存;② 留 1 的间隙,避免 8 附近抖动时反复树化/链化。前置条件:数组 < 64 先扩容(MIN_TREEIFY_CAPACITY)。

> [!interview] 背诵
> ==8 = 泊松分布下亿分之六的兜底,防恶意碰撞;6 = 省内存 + 防抖动;不到 64 先扩容。==

## ConcurrentHashMap 如何保证线程安全

| 维度 | 1.7(分段锁) | 1.8(CAS + synchronized) |
| --- | --- | --- |
| 锁粒度 | Segment(默认 16 段,继承 ReentrantLock) | **每个桶的头节点** |
| 写入 | 先定位段再锁段 | 空桶 CAS 放入;非空桶 synchronized 锁头节点 |
| 查询 | 两次 hash | get 全程无锁,val/next 用 **volatile** 保证可见 |
| 扩容 | 段内扩容 | **多线程协助迁移**(helpTransfer,按桶分工) |
| 计数 | 遍历统计 | ==baseCount + CounterCell[]== 分散计数(LongAdder 思想) |

\`\`\`java
// putVal 核心骨架(JDK 17 摘录精简,变量声明省略)
final V putVal(K key, V value, boolean onlyIfAbsent) {
    int hash = spread(key.hashCode());           // 扰动
    for (Node<K,V>[] tab = table;;) {            // 自旋重试
        if (tab == null)
            tab = initTable();                   // 懒初始化,靠 sizeCtl CAS 协调
        else if (tabAt(tab, i) == null) {
            if (casTabAt(tab, i, null, new Node<>(hash, key, value)))
                break;                           // 空桶:CAS 无锁写入
        } else {
            synchronized (f) {                   // 非空桶:锁头节点,锁粒度 = 一个桶
                // 链表尾插 / 红黑树插入,覆盖旧值
            }
        }
    }
    addCount();                                  // 分散计数,超阈值触发/协助扩容
}
\`\`\`

> [!pitfall] 为什么 key 和 value 都不允许 null
> HashMap 允许 null key/value(null 的 hash 固定为 0)。ConcurrentHashMap 禁止是因为**歧义**:get(key) 返回 null,到底是"键不存在"还是"值就是 null"?单线程 HashMap 可以用 ==containsKey== 二次确认,但并发下两次调用之间状态可能已经变了,**null 的语义无法判定**,干脆禁止——这也是"为什么 HashMap 的 key 可以为 null 而 ConcurrentHashMap 不行"的标准答案。

## 正确的并发写法:复合操作必须原子

\`\`\`java
import java.util.concurrent.ConcurrentHashMap;

public class ChmDemo {
    public static void main(String[] args) throws Exception {
        var map = new ConcurrentHashMap<String, Integer>();

        // 错误姿势:containsKey + put 两步不是原子,并发下互相覆盖
        // if (!map.containsKey("hit")) map.put("hit", 0);

        for (int i = 0; i < 3; i++) {
            new Thread(() -> {
                map.computeIfAbsent("hit", k -> 0);          // 不存在则原子放入
                map.computeIfPresent("hit", (k, v) -> v + 1); // 原子自增,重读最新值
            }).start();
        }
        Thread.sleep(500);
        System.out.println(map.get("hit"));    // 一定 3;换成 HashMap 常会丢次数
    }
}
\`\`\`

\`\`\`output
3
\`\`\`

即使换了线程安全容器,**"检查再动作"的复合操作仍需要容器提供的原子方法**(computeIfAbsent/putIfAbsent/merge)——这是比"选对容器"更高一层的并发意识,面试说出来是明显加分项。

> [!warn] HashMap 从来不是线程安全
> 1.8 修复了死循环,但**丢数据仍在**:两个线程同时定位到同一空桶,后写的覆盖先写的;并发 put 期间 size 不准确;扩容中的读可能读到旧表。并发选型:**高并发读写 → ConcurrentHashMap;读多写少快照语义 → CopyOnWrite 家族;不推荐 Collections.synchronizedMap(整体一把大锁,性能差)**。

## 面试速记

- put:扰动 hash → (n-1)&hash 定桶 → 空桶直放 / 链表尾插 / 树化(≥8 且容量≥64)→ size 超阈值扩容。
- 2 的幂:(n-1)&hash 等价取模且更快;扩容时元素只去 i 或 i+oldCap,按新增 bit 位分裂。
- 1.7 头插法并发扩容成环死循环;1.8 尾插修复,但 HashMap 仍线程不安全(覆盖、size 错)。
- 树化 8 是泊松分布兜底(概率千万分之一),退化 6 防抖动。
- ConcurrentHashMap 1.8:CAS 空桶 + synchronized 锁头节点 + volatile 可见 + 协助扩容 + LongAdder 式计数;null 有歧义故禁 null。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch09',
        title: 'IO 流与 NIO',
        minutes: 30,
        points: ['装饰器模式', '序列化三坑', 'Buffer/Channel', '零拷贝'],
        content: `
> [!interview] 本章面试锚点
> "BIO 和 NIO 的区别?Java IO 里哪里体现了装饰器模式?transient 是干嘛的?零拷贝是什么?"——IO 是"背概念重于背 API"的章节:四种流的分类、序列化三大坑、零拷贝的 4 次拷贝 4 次切换,这三块必考。

> [!info] 本章导读 · 读个文件而已,为什么要套四层流?
> FileInputStream 明明能直接读,为什么示例总要在外面再包 BufferedInputStream、再包 InputStreamReader?这些"套娃"不是炫技,而是装饰器模式在解决真实问题。本章把流的分类、资源释放和 BIO/NIO 一次串起来。
> - 读完本章你将能:分清四种流与节点流、处理流的分工
> - 用 try-with-resources 管好资源不泄漏
> - 讲清 BIO、NIO 与零拷贝的区别

> [!tip] 日常电脑现场 · 微信传大文件
> 用微信传一个 2G 的视频,进度条一格一格走,你还能切出去回消息,传完点开就能播 —— 背后是分块读、先放进缓冲区、边读边写。从 U 盘往桌面拖一个大文件夹,资源管理器会显示"剩余时间",它算的正是已经搬了多少块、还剩多少块。

## 四种流与装饰器模式

\`\`\`diagram:d-io-decorator
\`\`\`

IO 的装饰器就是奶茶店加料:底层一杯基础茶(FileInputStream)负责连接水源,套一层珍珠(BufferedInputStream)多了缓冲,再盖一层奶盖(BufferedReader)能按行喝。无论加多少料,端出来仍然是一杯"奶茶",类型始终是 InputStream——这就是**装饰器**:只加能力,不改身份。

| 分类维度 | 字节流 | 字符流 |
| --- | --- | --- |
| 抽象基类 | InputStream / OutputStream | Reader / Writer |
| 处理单位 | 8 位字节,万能(图片/视频/任何文件) | 16 位字符,只适合文本 |
| 典型实现 | FileInputStream / BufferedInputStream | FileReader / BufferedReader |
| 转换桥梁 | — | ==InputStreamReader==(字节→字符,可指定编码) |

Java IO 是**装饰器模式**的教科书:节点流(FileInputStream,真正连数据源)外面套处理流(BufferedInputStream,加缓冲),可以无限叠加,对外类型始终是 InputStream——**对装饰者透明**。这也是面向对象章"组合优于继承"的活教材。

\`\`\`java
import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;

public class CopyDemo {
    public static void main(String[] args) throws IOException {
        try (FileInputStream fis = new FileInputStream("src.zip");
             BufferedInputStream bis = new BufferedInputStream(fis, 8192);       // 装饰:加 8KB 缓冲
             FileOutputStream fos = new FileOutputStream("copy.zip");
             BufferedOutputStream bos = new BufferedOutputStream(fos)) {        // 装饰:再加缓冲

            byte[] buf = new byte[8192];
            int len;
            long start = System.currentTimeMillis();
            while ((len = bis.read(buf)) != -1) {    // 一次搬 8KB,而不是 1 字节
                bos.write(buf, 0, len);
            }
            System.out.println("拷贝完成, 耗时: " + (System.currentTimeMillis() - start) + " ms");
        }                                            // try-with-resources 自动反向关闭
    }
}
\`\`\`

\`\`\`output
拷贝完成, 耗时: 118 ms
\`\`\`

> [!tip] 为什么要有缓冲流
> 每次 ==read()== 直连数据源都是一次系统调用(syscall),1MB 文件逐字节读 = 100 万次 syscall。BufferedInputStream 在内存开 8KB 缓冲,**一次 syscall 搬 8KB**,syscall 次数直接除以 8192。这就是"装饰一层 = 多一种能力"的价值——装饰器组合能力,继承做不到这种自由度。

## 编码问题:字节与字符的鸿沟

\`\`\`java
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

public class CharsetDemo {
    public static void main(String[] args) throws IOException {
        byte[] data = "中".getBytes(StandardCharsets.UTF_8);   // UTF-8 下"中"占 3 字节
        System.out.println(data.length);

        // 用错误编码解码 → 乱码(不是异常,是数据损坏)
        String wrong = new String(data, StandardCharsets.ISO_8859_1);
        System.out.println(wrong.length() + " " + wrong.equals("中"));

        // 字节流 → 字符流的标准桥:InputStreamReader 指定编码
        var reader = new InputStreamReader(
                new ByteArrayInputStream(data), StandardCharsets.UTF_8);
        System.out.println((char) reader.read() == '中');
    }
}
\`\`\`

\`\`\`output
3
3 false
true
\`\`\`

> [!pitfall] 一次 read 一个字节读中文必乱
> 字符流 Reader 按**编码方案**解码;字节流 InputStream 只管原始字节。==new FileReader("f")== 在 JDK 18 前默认用**系统编码**(Windows 常是 GBK,Linux 是 UTF-8)——同一份代码跨平台乱码。规约:**所有 IO 显式指定 StandardCharsets.UTF_8**(JDK 18+ 默认 UTF-8,但仍建议显式写)。

## 序列化:三坑一规范

\`\`\`java
import java.io.Serializable;

public class User implements Serializable {
    private static final long serialVersionUID = 1L;   // 显式声明:类的版本指纹
    private String name;
    private transient String password;                 // transient:不序列化
    private static String company = "dev";             // static 属于类,不序列化

    public User(String name, String password) {
        this.name = name;
        this.password = password;
    }

    @Override
    public String toString() {
        return "User{name=" + name + ", pwd=" + password + ", co=" + company + "}";
    }
}

// 序列化与反序列化(SerDemo.java,与 User 同包)
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;

class SerDemo {
    public static void main(String[] args) throws Exception {
        try (var oos = new ObjectOutputStream(new FileOutputStream("u.ser"))) {
            oos.writeObject(new User("星薇Star", "secret123"));
        }
        try (var ois = new ObjectInputStream(new FileInputStream("u.ser"))) {
            System.out.println((User) ois.readObject());
        }
    }
}
\`\`\`

\`\`\`output
User{name=星薇Star, pwd=null, co=dev}
\`\`\`

三个坑(背诵版):**① transient 字段反序列化后是 null**(密码不该落盘就用它,配合 @Override readObject 做加密);② **static 字段不序列化**(属于类不属于对象);③ **不写 serialVersionUID,类改一个字段旧数据就抛 InvalidClassException**(JVM 按类结构自动算指纹)。

> [!best] 生产上不用 JDK 序列化
> JDK 序列化体积大、跨语言差、**有反序列化漏洞史**(readObject 链可被构造利用)。生产选 JSON(Jackson/Fastjson2)或 protobuf/kryo。面试答"了解 JDK 序列化机制与局限,项目里用 JSON",比硬吹 Serializable 加分。

## NIO 三剑客:Buffer / Channel / Selector

| 维度 | BIO(1.4 前) | NIO(1.4+) |
| --- | --- | --- |
| 模型 | 一连接一线程,read 阻塞 | 多连接注册到 Selector,事件驱动 |
| 方向 | 单向流(输入/输出分家) | Channel 双向,可读可写 |
| 数据 | 流式顺序读 | Buffer 块状读写(flip 切换模式) |
| 适用 | 连接少、单连接流量大 | **海量连接、低流量**(IM、网关) |

\`\`\`java
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;

public class NioDemo {
    public static void main(String[] args) throws Exception {
        try (FileChannel ch = new RandomAccessFile("data.txt", "rw").getChannel()) {
            ByteBuffer buf = ByteBuffer.allocate(16);
            buf.put("hello nio".getBytes());     // 写模式:position 前移
            buf.flip();                          // 切换:limit=position, position=0,准备读
            ch.write(buf);                       // Channel 从 Buffer 读走数据
            buf.clear();                         // 清空,回到写模式

            ch.position(0);                      // 回到文件头读回验证
            int n = ch.read(buf);
            System.out.println(n + " " + new String(buf.array(), 0, n));
        }
    }
}
\`\`\`

\`\`\`output
9 hello nio
\`\`\`

Buffer 状态机是 NIO 唯一要背的 API:**flip 把写模式切成读模式(limit=position, position=0),clear 清空回写模式**。顺序调错读到的就是垃圾数据——面试让手写 NIO 文件复制,考的就是 flip 用没用对。

## 零拷贝:从 4 次到 2 次(概念必考)

传统发送文件(read + write)的代价:

\`\`\`text
1. read():  磁盘 → 内核缓冲区(DMA拷贝) → 用户缓冲区(CPU拷贝)    上下文切换 ×2
2. write(): 用户缓冲区 → socket缓冲区(CPU拷贝) → 网卡(DMA拷贝)   上下文切换 ×2
合计:4 次数据拷贝 + 4 次用户态/内核态切换
\`\`\`

优化路径:① ==sendfile==(Linux):数据不回用户态,**2 次拷贝 2 次切换**;② 加 scatter-gather DMA 收集,CPU 拷贝也消失,**真正零 CPU 拷贝**;③ ==mmap== 内存映射:文件映射进用户空间省一次拷贝,适合需要修改数据的场景。Java 对应入口是 ==FileChannel.transferTo()==(底层 sendfile)——**Kafka 的高吞吐、Nginx 静态文件、RocketMQ 的 CommitLog 都靠它**,和 Redis 章节的"快的原因"可以串成一条线。

## 面试速记

- IO 四流:字节/字符 × 输入/输出;装饰器模式叠加缓冲能力,Buffered 把 syscall 次数除以缓冲区大小。
- 序列化三坑:transient 为 null、static 不序列化、不写 serialVersionUID 改类即炸;生产用 JSON/protobuf。
- NIO:Channel 双向 + Buffer flip 切换读写 + Selector 事件驱动;适合海量连接低流量。
- 零拷贝:传统 read+write 4 拷贝 4 切换;sendfile 2 次;Java 入口 transferTo;Kafka/Nginx 都在用。
- 所有 IO 显式 UTF-8,跨平台不乱码。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch10',
        title: '多线程编程',
        minutes: 35,
        points: ['六种状态', 'synchronized', 'volatile', 'wait/notify'],
        content: `
> [!interview] 本章面试锚点
> 并发三件套入场:**线程有几种状态?synchronized 的原理与锁升级?volatile 保证什么、不保证什么?**再配一个必考实操:wait/notify 手写生产者消费者。先点开状态机演示,把六种状态的转换刻进脑子,再看源码。

> [!info] 本章导读 · 为什么生产环境禁止直接 new Thread?
> 本地 new 十个线程跑得好好的,一上线就 OOM 或者 CPU 打满 —— 线程不是越多越快,创建、调度、切换全都要钱。本章从线程状态讲到 synchronized 与 wait/notify。
> - 读完本章你将能:说出线程六种状态以及它们怎么转换
> - 用 wait/notify 手写生产者消费者
> - 解释 synchronized 锁升级与 volatile 的边界

> [!tip] 日常电脑现场 · 边下载边播放
> 视频网站点开就能看,不用等整部片子下完,一边缓冲一边播放,网速差就转圈等一会儿。浏览器开十几个标签页,每个都在自己跑脚本,一个卡住其他照常刷;手机游戏退到后台还在偷偷更新资源包,也是另一条线程在干活。

\`\`\`demo:thread-life
\`\`\`

## 线程六状态(官方定义,不是五状态)

| 状态 | 含义 | 进入方式 | 离开方式 |
| --- | --- | --- | --- |
| NEW | 创建未启动 | new Thread() | start() |
| RUNNABLE | 可运行(就绪+运行中) | start() / 被调度 | 阻塞、结束 |
| BLOCKED | 等 monitor 锁 | 进 synchronized 失败 | 拿到锁 |
| WAITING | 无限期等待 | wait() / join() / LockSupport.park() | notify / join完成 / unpark |
| TIMED_WAITING | 限时等待 | sleep(ms) / wait(ms) / join(ms) | 超时 / 被唤醒 |
| TERMINATED | 结束(终态) | run() 返回 | — |

> [!pitfall] RUNNABLE 包含"阻塞在 IO"
> Java 线程状态里**没有"阻塞在 IO"这个状态**:线程阻塞在 socket read 时仍是 ==RUNNABLE==(jstack 里就这么显示)。BLOCKED 专指**等 synchronized 锁**;sleep 的线程是 TIMED_WAITING 不是 BLOCKED——这三点是 jstack 分析题的年年考项。

\`\`\`java
public class StateDemo {
    public static void main(String[] args) throws Exception {
        Thread t = new Thread(() -> {
            try { Thread.sleep(2000); } catch (InterruptedException e) { }
        });
        System.out.println(t.getState());          // NEW
        t.start();
        Thread.sleep(100);
        System.out.println(t.getState());          // TIMED_WAITING(sleep 中)
        t.join();
        System.out.println(t.getState());          // TERMINATED

        Object lock = new Object();
        Thread a = new Thread(() -> { synchronized (lock) { } });
        synchronized (lock) {                      // 主线程先占住锁
            a.start();
            Thread.sleep(100);
            System.out.println(a.getState());      // BLOCKED(等 monitor)
        }
    }
}
\`\`\`

\`\`\`output
NEW
TIMED_WAITING
TERMINATED
BLOCKED
\`\`\`

## 线程创建:三种姿势

\`\`\`java
import java.util.concurrent.FutureTask;

public class CreateThread {
    public static void main(String[] args) throws Exception {
        // 1. 继承 Thread:占掉唯一继承名额,不推荐
        new Thread() {
            @Override public void run() { System.out.println("Thread 子类"); }
        }.start();

        // 2. 实现 Runnable:任务与线程解耦,推荐
        new Thread(() -> System.out.println("Runnable lambda"), "worker-1").start();

        // 3. FutureTask:能拿返回值、抛异常(底层仍是 Runnable)
        FutureTask<String> task = new FutureTask<>(() -> "计算结果");
        new Thread(task, "worker-2").start();
        System.out.println(task.get());            // 阻塞直到算完
    }
}
\`\`\`

\`\`\`output
Thread 子类
Runnable lambda
计算结果
\`\`\`

**start() 只能调一次**(二次调用抛 IllegalThreadStateException);**直接调 run() 只是普通方法调用,不创建线程**。生产环境直接 new 线程是禁令——**必须用线程池**(JUC 并发章)。

## synchronized:三种用法与底层原理

\`\`\`java
public class SyncDemo {
    private int count = 0;
    private final Object lock = new Object();

    // 1. 修饰实例方法:锁 this
    public synchronized void incr() { count++; }

    // 2. 修饰静态方法:锁 Class 对象(全局一把)
    public static synchronized void staticIncr() { }

    // 3. 修饰代码块:锁指定对象,粒度最细,推荐
    public void incr2() {
        synchronized (lock) {
            count++;
        }
    }
}
\`\`\`

底层三件套:

- **字节码**:同步代码块编译成 ==monitorenter / monitorexit== 指令;同步方法靠 ==ACC_SYNCHRONIZED== 标志位。
- **对象头 Mark Word**:锁状态记录在对象头里,无锁→偏向→轻量级→重量级**只能升级不能降级**(JDK 15 起偏向锁默认废弃)。
- **Monitor**:每个对象关联一个监视器锁,结构含 owner、entryList(BLOCKED 队列)、waitSet(wait 队列)。

> [!interview] 锁升级过程(背诵版)
> ① 无锁 → ② **偏向锁**:只有一个线程访问,Mark Word 记线程 ID,该线程后续免 CAS;→ ③ **轻量级锁**:第二个线程来了,自旋竞争(用户态,开销小);→ ④ 自旋失败/竞争激烈 → **重量级锁**:交给操作系统 mutex,挂起线程,进入内核态。**JDK 6 大幅优化的就是这条路径**;能说出"偏向锁免同步、轻量级自旋避免切换、重量级才进内核"就是满分答案。

## volatile:可见性、有序性,但不原子

\`\`\`java
public class VolatileDemo {
    private static volatile boolean stop = false;   // volatile:一处写,处处立即可见

    public static void main(String[] args) throws Exception {
        Thread worker = new Thread(() -> {
            while (!stop) { /* 自旋等停止信号 */ }
            System.out.println("worker 退出");
        });
        worker.start();
        Thread.sleep(100);
        stop = true;      // 没有 volatile,worker 可能永远看不到改动(JIT 优化读缓存)
    }
}
\`\`\`

\`\`\`output
worker 退出
\`\`\`

volatile 三件事,每件都有边界:

- **可见性**:写立即刷回主存 + 让其他 CPU 核的缓存行失效(MESI 缓存一致性协议),读直取主存。
- **禁止指令重排**:插入内存屏障——这是**双重检查锁单例必须 volatile** 的原因:防止 new 的"分配内存→初始化→赋引用"被重排成"赋引用→初始化",别的线程拿到半成品对象。
- **不保证原子性**:==volatile int i; i++== 照样丢更新(读-加-写三步),要原子用 ==AtomicInteger== 或锁。

> [!warn] DCL 单例必须 volatile(经典必考)
> ==private static volatile Singleton instance;== 的双重检查锁里,**没有 volatile 就可能发布未初始化完成的对象**。追问链:为什么判两次空(第一次避免每次加锁,第二次防止重复创建)→ 为什么 volatile(禁止重排)→ 还有什么写法(静态内部类、枚举,靠类加载机制天然线程安全)。

## wait / notify 线程通信(配演示)

规则三条:**① 必须在 synchronized 块内调用**(否则 IllegalMonitorStateException);② 判断条件必须用 **while 不是 if**(防虚假唤醒);③ 优先 ==notifyAll==(notify 只随机唤醒一个,可能唤醒"不该醒的")。下面的演示点开看库存怎么在 0~5 之间波动:

\`\`\`demo:prodcons
\`\`\`

\`\`\`java
public class ProducerConsumer {
    private static final Object LOCK = new Object();
    private static final int MAX = 5;
    private static int size = 0;

    public static void main(String[] args) {
        new Thread(ProducerConsumer::produce, "P1").start();
        new Thread(ProducerConsumer::consume, "C1").start();
    }

    static void produce() {
        while (true) {
            synchronized (LOCK) {
                while (size == MAX) {              // 满:生产者等待(while 防虚假唤醒)
                    try { LOCK.wait(); } catch (InterruptedException e) { return; }
                }
                size++;
                System.out.println(Thread.currentThread().getName() + " 生产, 库存=" + size);
                LOCK.notifyAll();                  // 唤醒消费者
            }
            try { Thread.sleep(300); } catch (InterruptedException e) { return; }
        }
    }

    static void consume() {
        while (true) {
            synchronized (LOCK) {
                while (size == 0) {                // 空:消费者等待
                    try { LOCK.wait(); } catch (InterruptedException e) { return; }
                }
                size--;
                System.out.println(Thread.currentThread().getName() + " 消费, 库存=" + size);
                LOCK.notifyAll();
            }
            try { Thread.sleep(500); } catch (InterruptedException e) { return; }
        }
    }
}
\`\`\`

\`\`\`output
P1 生产, 库存=1
P1 生产, 库存=2
C1 消费, 库存=1
P1 生产, 库存=2
C1 消费, 库存=1
...   # 两线程交替,库存始终在 0~5 之间
\`\`\`

> [!tip] sleep 与 wait 的区别(高频)
> ① **锁**:sleep 抱着锁睡;wait **释放锁**;② **唤醒**:sleep 到时自动醒,wait 靠 notify/notifyAll(或超时);③ **调用条件**:wait 必须在 synchronized 内,sleep 随处可用;④ **归属**:wait 是 Object 的方法(对象监视器机制),sleep 是 Thread 的静态方法。共同点:都让出 CPU,都响应 interrupt 并抛 InterruptedException。

## JMM·happens-before 与死锁现场

\`\`\`diagram:d-jmm
\`\`\`

JMM 说的是:每个线程都有一本自己的**小抄**(工作内存),而共享变量写在教室前面的**公共黑板**(主内存)上。线程改了黑板,别人未必马上看见,因为各自只顾着抄自己的小抄;给变量加上 **volatile**,等于规定"这份小抄随时作废,每次都得抬头看黑板"。

### JMM:主内存与工作内存

Java 内存模型(Java Memory Model, JMM)规定:**所有共享变量存在主内存,每个线程有自己的工作内存**(栈帧、寄存器、CPU 缓存的抽象),线程对变量的读写必须在自己的工作内存完成,再刷回主存——副本刷新不及时,就产生**可见性**问题:

\`\`\`text
线程A工作内存(副本 x=1)──write──→ 主内存 x=1 ──read──→ 线程B工作内存(副本 x=0)
        ↑ 线程A直接操作副本,若不刷回主存,B 永远读到旧值 0 → 可见性问题
\`\`\`

并发三大性质的分工:**原子性**(一个操作不可分割,靠 synchronized/Lock/CAS)、**可见性**(修改对其他线程立即可见,靠 volatile/synchronized/final)、**有序性**(禁止指令重排,靠 volatile 的内存屏障)。

\`\`\`java VisibilityDemo.java
public class VisibilityDemo {
    // 动手试:去掉 volatile,子线程可能永远读不到修改 → 死循环
    static volatile boolean stop = false;

    public static void main(String[] args) throws Exception {
        Thread t = new Thread(() -> {
            while (!stop) { }                    // 无 volatile 时 JIT 可能优化成 while(true)
            System.out.println("子线程看到 stop=true,退出");
        });
        t.start();
        Thread.sleep(100);
        stop = true;                             // volatile 写:立即刷主存并使其他副本失效
        System.out.println("main 已把 stop 置为 true");
    }
}
\`\`\`

\`\`\`output
main 已把 stop 置为 true
子线程看到 stop=true,退出
\`\`\`

### happens-before:可见性的判断标准

两个操作之间存在 happens-before 关系,则前一个的结果对后一个**可见**。JMM 天然提供八条规则,无需额外同步:

| 规则 | 含义 |
| --- | --- |
| 程序顺序规则 | 单线程内,前面的操作先行发生于后面的操作(按代码顺序) |
| 监视器锁规则 | 对同一把锁,解锁先行发生于随后的加锁 |
| volatile 规则 | 对同一 volatile 变量,写先行发生于后续的读 |
| 线程启动规则 | Thread.start() 先行发生于新线程中的任意操作 |
| 线程终止规则 | 线程内的所有操作先行发生于其他线程检测到它终止(join 返回) |
| 线程中断规则 | interrupt() 调用先行发生于被中断线程检测到中断 |
| 对象终结规则 | 构造器执行结束先行发生于 finalize() 的开始 |
| 传递性 | A 先行于 B,B 先行于 C,则 A 先行于 C |

两个关键理解:① happens-before **不是时间上的先后,而是可见性保证**;没有该关系的两个操作,JVM 允许任意重排;② 经典应用:**join 返回后能读到子线程写过的所有变量**(终止规则+传递性),**解锁前的写对下一个拿同一把锁的线程可见**(锁规则)。

as-if-serial 语义一句话:无论怎么重排,**单线程的执行结果都不能改变**——它是编译器/CPU 重排的底线,happens-before 是它的多线程版。

### 死锁现场:四个条件、复现与检出

| 必要条件 | 含义 | 破坏手段 |
| --- | --- | --- |
| 互斥 | 资源一次只能被一个线程持有 | -(锁的本质,无法破坏) |
| 持有并等待 | 拿着 A 还要申请 B | 一次性申请全部资源 |
| 不可剥夺 | 不能强抢别人手里的锁 | tryLock(超时)自动放弃重试 |
| 循环等待 | A 等 B、B 等 A 形成环 | 全局固定加锁顺序(最常用) |

\`\`\`java DeadLockDemo.java
public class DeadLockDemo {
    static final Object LOCK_A = new Object();
    static final Object LOCK_B = new Object();

    public static void main(String[] args) throws Exception {
        Thread t1 = new Thread(() -> {
            synchronized (LOCK_A) {
                sleep(100);                          // 确保 t2 已先拿到 B
                synchronized (LOCK_B) { System.out.println("t1: 同时拿到 A 和 B"); }
            }
        });
        Thread t2 = new Thread(() -> {
            synchronized (LOCK_B) {
                sleep(100);
                synchronized (LOCK_A) { System.out.println("t2: 同时拿到 B 和 A"); }
            }
        });
        t1.start();
        t2.start();
        t1.join();                                   // 永远等不到:程序卡死
    }

    static void sleep(long ms) { try { Thread.sleep(ms); } catch (InterruptedException e) { } }
}
\`\`\`

运行后程序挂起,一行都不打印。用 ==jstack== 抓栈,JVM 自带死锁检测器会自动指认互相等待的两把锁:

\`\`\`shell
jps -l                     # 找到进程号(如 12345)
jstack 12345               # 抓线程栈,看末尾的 deadlock 段
\`\`\`

\`\`\`output
Found one Java-level deadlock:
=============================
"Thread-1":
  waiting to lock object 0x000000076ab62208 (a java.lang.Object),
   which is held by "Thread-0"
"Thread-0":
  waiting to lock object 0x000000076ab621f8 (a java.lang.Object),
   which is held by "Thread-1"

Java stack information for the threads listed above:
===================================================
"Thread-0":
    - locked <0x000000076ab621f8> (a java.lang.Object)
    - waiting to lock <0x000000076ab62208> (a java.lang.Object)
"Thread-1":
    - locked <0x000000076ab62208> (a java.lang.Object)
    - waiting to lock <0x000000076ab621f8> (a java.lang.Object)

Found 1 deadlock.
\`\`\`

排查手段全家桶:jstack(命令行)、jconsole/VisualVM 图形界面(线程页有"检测死锁"按钮)、arthas ==thread -b== 一键找阻塞源头。修复方向即"破坏四条件",最常用是固定加锁顺序:

\`\`\`java
// 破坏循环等待:全局都先 A 后 B,最多排队、永不成环
synchronized (LOCK_A) {
    synchronized (LOCK_B) { /* 业务操作 */ }
}
\`\`\`

### yield / join / interrupt 三兄弟

| 方法 | 归属 | 作用 | 关键点 |
| --- | --- | --- | --- |
| yield() | Thread 静态方法 | 提示调度器"我愿让出 CPU" | 只是建议,可能立刻又被调度;不释放锁 |
| join() | Thread 实例方法 | 当前线程等目标线程执行完再继续 | 底层是 wait 循环;体现线程终止规则 |
| interrupt() | Thread 实例方法 | 给目标线程设置中断标志,**不强制停止** | 阻塞中的线程抛 InterruptedException;自旋需手动查 isInterrupted |

### Condition await/signal 与 Object wait/notify

| 对比项 | Object wait/notify | Condition await/signal |
| --- | --- | --- |
| 依赖 | synchronized + 对象监视器 | Lock.lock() + Condition |
| 等待队列 | 一个 waitSet,唤醒不可选 | 可创建多个 Condition,**精准唤醒** |
| 唤醒粒度 | notify 随机一个 / notifyAll 全部 | signal 唤醒本条件队列 / signalAll |
| 限时等待 | wait(ms) | await(ms, unit)、awaitNanos |
| 释放锁 | 都会释放锁(必须先持锁才能调) | 同样必须先持锁 |

\`\`\`java ConditionDemo.java
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

public class ConditionDemo {
    public static void main(String[] args) throws Exception {
        ReentrantLock lock = new ReentrantLock();
        Condition full = lock.newCondition();            // 可按业务建多个条件队列

        new Thread(() -> {
            lock.lock();
            try { full.await(); System.out.println("消费者: 被精准唤醒, 消费"); }
            finally { lock.unlock(); }
        }).start();

        Thread.sleep(100);
        lock.lock();
        try { full.signal(); } finally { lock.unlock(); }   // 只唤醒等在 full 队列的线程
    }
}
\`\`\`

\`\`\`output
消费者: 被精准唤醒, 消费
\`\`\`

## 面试速记

- 六状态:NEW→RUNNABLE→BLOCKED/WAITING/TIMED_WAITING→TERMINATED;IO 阻塞算 RUNNABLE,BLOCKED 专指等锁。
- synchronized:代码块 monitorenter/exit;锁升级偏向→轻量级→重量级单向;实例方法锁 this、静态方法锁 Class。
- volatile 保证可见性与禁止重排、不保证原子;DCL 单例必须 volatile 防半成品对象。
- wait/notify:必须在 synchronized 内、while 防虚假唤醒、notifyAll 优先;wait 释放锁,sleep 不释放。
- start() 只能一次,run() 不建线程;生产禁 new Thread,统一线程池。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch11',
        title: 'JUC 并发包',
        minutes: 35,
        points: ['线程池', 'CAS/ABA', 'AQS', 'ThreadLocal'],
        content: `
> [!interview] 本章面试锚点
> JUC 是并发面试主战场:**线程池七参数与执行流程、CAS 与 ABA、AQS 是什么、CountDownLatch 与 CyclicBarrier 区别、ThreadLocal 为什么会泄漏**——先把线程池流程演示点开,再逐个拆,每个考点都给背诵版结论。

> [!info] 本章导读 · 线程池参数随手一填,为什么会把服务器拖垮?
> Executors 一行代码就能创建线程池,看起来很方便,却可能因为无界队列或线程数失控在高峰期雪崩。JUC 是并发面试的主战场,也是把"能用"变成"稳"的分水岭。
> - 读完本章你将能:说清线程池七个参数与执行流程
> - 解释 CAS、ABA 与 AQS 的核心思想
> - 讲清 ThreadLocal 的内存泄漏是怎么发生的

> [!tip] 日常电脑现场 · 抢票与取号
> 开票那一秒几万人同时点"立即购买",票只有几百张,系统必须保证同一张票不会卖给两个人 —— 锁和原子操作就是干这个的。餐厅门口取号机吐出一张小票,叫号屏按顺序喊,空出一个服务员就叫下一桌,和线程池排队派任务是一个道理。

\`\`\`demo:threadpool
\`\`\`

## ThreadPoolExecutor:七参数与执行流程

| 参数 | 说明 | 常用取值 |
| --- | --- | --- |
| corePoolSize | 常驻核心线程数 | CPU 密集 = N核+1;IO 密集 = 2N核 |
| maximumPoolSize | 最大线程数上限 | 核心数的 2~4 倍起步 |
| keepAliveTime + unit | 非核心线程空闲存活时间 | 30~60 秒 |
| workQueue | 排队队列 | **有界的** ArrayBlockingQueue / SynchronousQueue |
| threadFactory | 线程工厂(必须命名) | pool-order-1 |
| handler | 拒绝策略 | 见下文 |

执行流程(**背诵版,顺序不能错**):

\`\`\`text
提交任务 → 核心线程满?
  ├─ 未满 → 创建核心线程执行
  └─ 已满 → 队列满?
        ├─ 未满 → 任务入队等待
        └─ 已满 → 线程数 < maximumPoolSize?
              ├─ 是 → 创建非核心线程执行
              └─ 否 → 执行拒绝策略(默认 AbortPolicy 抛异常)
\`\`\`

> [!pitfall] 先入队再扩线程,反直觉
> 核心 2、max 4、队列容量 3:提交 5 个任务,**不是 4 个线程在跑、1 个排队**——而是 2 个核心在跑、3 个排队,**第 5 个任务才触发创建第 3 个线程**。线程池是"队列优先于扩容",这正是 ==Executors.newFixedThreadPool== 用无界队列导致任务堆积 OOM 的根源。

四种拒绝策略:==AbortPolicy== 抛异常(默认)、==CallerRunsPolicy== **提交者自己执行**(自然限流,推荐)、==DiscardPolicy== 静默丢弃、==DiscardOldestPolicy== 丢最老任务腾位置。

\`\`\`java
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

public class PoolDemo {
    public static void main(String[] args) {
        AtomicInteger seq = new AtomicInteger();
        ThreadPoolExecutor pool = new ThreadPoolExecutor(
                2, 4, 60, TimeUnit.SECONDS,
                new ArrayBlockingQueue<>(3),                                // 有界队列,容量3
                r -> new Thread(r, "pool-order-" + seq.incrementAndGet()),  // 命名工厂
                new ThreadPoolExecutor.CallerRunsPolicy());                 // 打满让提交者自己跑

        for (int i = 1; i <= 8; i++) {
            final int id = i;
            pool.execute(() -> System.out.println(
                    Thread.currentThread().getName() + " 执行任务" + id));
        }
        pool.shutdown();
    }
}
\`\`\`

\`\`\`output
pool-order-1 执行任务1
pool-order-2 执行任务2
pool-order-1 执行任务3
pool-order-2 执行任务4
pool-order-3 执行任务6
main 执行任务8
pool-order-4 执行任务7
pool-order-1 执行任务5
# 1-2核心线程 3-5入队 6-7开非核心线程 8触发CallerRuns由main执行
\`\`\`

> [!best] 禁用 Executors 的四个工厂方法
> ==newFixedThreadPool / newSingleThreadExecutor==:**无界 LinkedBlockingQueue**,任务堆积直到 OOM;==newCachedThreadPool==:max 是 Integer.MAX_VALUE,线程无限膨胀;==newScheduledThreadPool== 同理。阿里规约原文:"不允许使用 Executors 创建线程池,必须手动 new ThreadPoolExecutor"——面试引用原话,含金量立现。

## CAS:无锁的原子操作

\`\`\`java
import java.util.concurrent.atomic.AtomicInteger;

public class CasDemo {
    public static void main(String[] args) throws Exception {
        AtomicInteger counter = new AtomicInteger(0);

        Runnable work = () -> {
            for (int i = 0; i < 10_000; i++) counter.incrementAndGet();  // CAS 自增
        };
        Thread t1 = new Thread(work);
        Thread t2 = new Thread(work);
        t1.start(); t2.start();
        t1.join(); t2.join();
        System.out.println(counter.get());   // 一定 20000;volatile int + i++ 则会丢更新
    }
}
\`\`\`

\`\`\`output
20000
\`\`\`

CAS 三问:**是什么**:==compareAndSwap(内存值V, 预期值E, 新值N)==,V 等于 E 才写 N,底层是 CPU 的 cmpxchg 指令加 lock 前缀(缓存行级原子);**凭什么快**:失败不挂起线程,用户态循环重试,省掉内核态切换;**缺陷**:自旋空转耗 CPU(竞争激烈不如锁)、只能保证**单个变量**原子(多变量用 AtomicReference 打包)、**ABA 问题**。

> [!warn] ABA 问题与解法
> 值从 A 变 B 再变回 A,CAS 以为"没变过"就写回——但中间可能已被别人改过(典型:无锁栈的头节点被换走又换回来)。解法:**加版本号**,==AtomicStampedReference==(值+stamp 双重比较),或业务上做幂等设计。标准答法:"我知道 ABA,大多数场景无害,敏感场景用带版本号的原子引用"。

## AQS:JUC 锁的地基(一句话模型)

==AbstractQueuedSynchronizer== = **一个 volatile int state + 一条 CLH 双向等待队列 + 独占/共享两种模板**:

- 加锁 = CAS 改 state(state=1 拿到;ReentrantLock 的重入就是 state 累加);失败包装成 Node 入队,==park()== 挂起。
- 解锁 = state 减到 0 时 ==unpark== 唤醒队头后继。
- 共享模式(CountDownLatch/Semaphore/读写锁的读锁):state 可被多线程共同扣减。

\`\`\`java
import java.util.concurrent.locks.ReentrantLock;

public class LockDemo {
    private static final ReentrantLock LOCK = new ReentrantLock();   // 默认非公平

    public static void main(String[] args) {
        LOCK.lock();
        try {
            LOCK.lock();                        // 重入:state 1 → 2
            System.out.println(LOCK.isLocked() + " " + LOCK.getHoldCount());
        } finally {
            LOCK.unlock();
            LOCK.unlock();                      // 重入几次就解几次
        }
        System.out.println(LOCK.tryLock());     // 立即尝试,拿到返回 true
    }
}
\`\`\`

\`\`\`output
true 2
true
\`\`\`

公平 vs 非公平(高频):**非公平锁**(默认)上来直接 CAS 抢,抢不到才排队——吞吐高,可能饿死;**公平锁**先看队列有没有人在等,有就乖乖排队——无饿死,吞吐低。synchronized 只有非公平。

## CountDownLatch / CyclicBarrier / Semaphore

| 工具 | 模型 | 能否重用 | 典型场景 |
| --- | --- | --- | --- |
| CountDownLatch | 减计数,await 等到 0 | 不能 | 主线程等 N 个子任务完成 |
| CyclicBarrier | 加计数,人到齐一起过 | **能**(Cyclic) | 多线程互相等齐再同跑 |
| Semaphore | 令牌池,acquire/release | 能 | 限流:同时最多 N 个并发 |

\`\`\`java
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class LatchDemo {
    public static void main(String[] args) throws Exception {
        int tasks = 5;
        CountDownLatch latch = new CountDownLatch(tasks);
        ExecutorService pool = Executors.newFixedThreadPool(5);   // 演示简化,生产应手写

        long start = System.currentTimeMillis();
        for (int i = 0; i < tasks; i++) {
            pool.execute(() -> {
                try { Thread.sleep((int) (Math.random() * 100)); }
                finally { latch.countDown(); }      // 必须放 finally,防异常卡死主线程
            });
        }
        latch.await();                              // 等计数归零
        System.out.println("全部完成, 耗时约: " + (System.currentTimeMillis() - start) + " ms");
        pool.shutdown();
    }
}
\`\`\`

\`\`\`output
全部完成, 耗时约: 87 ms
\`\`\`

## ThreadLocal:线程私有的变量

\`\`\`java
public class TlDemo {
    // 典型用法:每线程一个格式化器(SimpleDateFormat 线程不安全的正解)
    private static final ThreadLocal<java.text.SimpleDateFormat> FMT =
            ThreadLocal.withInitial(() -> new java.text.SimpleDateFormat("yyyy-MM-dd"));

    public static void main(String[] args) throws Exception {
        Runnable work = () -> {
            String now = FMT.get().format(new java.util.Date());
            System.out.println(Thread.currentThread().getName() + " " + now);
            FMT.remove();                    // 用完必须 remove!
        };
        new Thread(work, "T1").start();
        new Thread(work, "T2").start();
    }
}
\`\`\`

\`\`\`output
T2 2026-11-14
T1 2026-11-14
\`\`\`

结构一句话:**每个 Thread 对象里有一个 ==ThreadLocalMap==,key 是 ThreadLocal 实例的弱引用,value 是你存的值(强引用)**。泄漏链:外部不再引用 ThreadLocal → 弱引用 key 被回收,entry 变成 (null, value) 的脏数据;线程池的线程**长活不销毁** → value 永远够不着也删不掉 → 泄漏。**用完 ==remove()==(放 finally)是唯一的完整解**,线程池场景尤其必须。

> [!warn] 父子线程不自动传递
> ThreadLocal 的值**不会**传给子线程;要传递用 ==InheritableThreadLocal==(子线程创建时拷贝一份),线程池场景用阿里 ==TransmittableThreadLocal==(提交任务时快照传递)——这个追问在"登录用户上下文丢失"的实战题里经常出现。

## 读写锁与队列家族:StampedLock·PriorityQueue·DelayQueue

### StampedLock:把"乐观读"做成 API

ReentrantReadWriteLock 是读写互斥、读读共享;StampedLock 再加一档**乐观读**:先不加锁直接读,读完用 validate(stamp) 校验"这段时间有没有人写"——没有就零锁开销返回,有就退化成悲观读重读。适合**读远多于写、读逻辑短、能容忍重读**的场景。

\`\`\`java StampedDemo.java
import java.util.concurrent.locks.StampedLock;

public class StampedDemo {
    private double x, y;
    private final StampedLock lock = new StampedLock();

    // 写锁:stamp 非 0,必须在 finally 解锁
    void move(double dx, double dy) {
        long stamp = lock.writeLock();
        try {
            x += dx;
            y += dy;
        } finally {
            lock.unlockWrite(stamp);
        }
    }

    // 乐观读:校验失败再退化为悲观读
    double distance() {
        long stamp = lock.tryOptimisticRead();
        double cx = x, cy = y;
        if (!lock.validate(stamp)) {
            stamp = lock.readLock();
            try {
                cx = x;
                cy = y;
            } finally {
                lock.unlockRead(stamp);
            }
        }
        return Math.sqrt(cx * cx + cy * cy);
    }

    public static void main(String[] args) {
        StampedDemo p = new StampedDemo();
        p.move(3, 4);
        System.out.println("距离=" + p.distance());
    }
}
\`\`\`

\`\`\`output
距离=5.0
\`\`\`

\`\`\`text
long w = lock.writeLock();          // 独占写,返回非 0 版本号
long r = lock.readLock();           // 悲观读,与写互斥
long o = lock.tryOptimisticRead();  // 乐观读,不加锁;返回 0 表示当前有写锁
boolean ok = lock.validate(o);      // 期间没有写 → true,刚读到的字段可信
\`\`\`

\`\`\`java StampedValidateDemo.java
import java.util.concurrent.locks.StampedLock;

public class StampedValidateDemo {
    public static void main(String[] args) {
        StampedLock lock = new StampedLock();

        long stamp = lock.tryOptimisticRead();
        System.out.println("无写锁时 validate=" + lock.validate(stamp));

        long write = lock.writeLock();
        long stamp2 = lock.tryOptimisticRead();       // 已有写锁 → 返回 0
        System.out.println("写锁期间乐观读 stamp=" + stamp2);
        System.out.println("写锁期间 validate=" + lock.validate(stamp));  // 旧版本已失效
        lock.unlockWrite(write);
    }
}
\`\`\`

\`\`\`output
无写锁时 validate=true
写锁期间乐观读 stamp=0
写锁期间 validate=false
\`\`\`

| 维度 | StampedLock | ReentrantReadWriteLock |
| --- | --- | --- |
| 模式 | 写锁、悲观读、乐观读(无锁) | 写锁、读锁 |
| 可重入 | **不支持**,重复加锁会死锁 | 支持 |
| Condition | 不支持 | 支持 |
| 中断 / 公平 | 不支持中断,非公平 | 支持 lockInterruptibly 与公平锁 |
| 性能 | 读多写少更高(乐观读只做校验) | 读多写少也很高,读锁要 CAS |
| 最大坑 | validate 通过前读到的字段不可信,失败必须重读 | 读锁不能直接升级为写锁 |

> [!warn] StampedLock 不能重入
> 同一个线程连续两次 ==writeLock()== 会把自己锁死(它不是可重入锁,也没有 owner 记录);在递归调用或 AOP 嵌套里非常容易踩。需要重入、需要 Condition、需要公平锁,一律回到 ReentrantReadWriteLock。

### PriorityQueue:数组里的二叉堆

PriorityQueue 底层是 ==Object[]== 实现的完全二叉树(小顶堆):offer 上浮, poll 下沉,两者都是 O(log n),peek 取堆顶 O(1)。它**只保证堆顶最小,不保证整体有序**——for-each 遍历顺序是数组顺序,不是优先级顺序。元素要么实现 Comparable,要么构造时传 Comparator;不允许 null,也不是线程安全。

\`\`\`java TaskQueueDemo.java
import java.util.PriorityQueue;

public class TaskQueueDemo {
    record Task(String name, int priority) { }

    public static void main(String[] args) {
        // 数字越小优先级越高;优先级相同时不保证先后,需要再给序号
        PriorityQueue<Task> queue = new PriorityQueue<>(
                (a, b) -> Integer.compare(a.priority(), b.priority()));
        queue.offer(new Task("发短信", 3));
        queue.offer(new Task("扣库存", 1));
        queue.offer(new Task("记日志", 5));

        System.out.println("peek=" + queue.peek().name());   // 只看堆顶,不弹出
        while (!queue.isEmpty()) {
            System.out.print(queue.poll().name() + " ");
        }
        System.out.println();
    }
}
\`\`\`

\`\`\`output
peek=扣库存
扣库存 发短信 记日志
\`\`\`

典型用途:任务调度按优先级出队、TopK 求最大 K 个(小顶堆保留 K 个,堆顶淘汰)、合并 K 个有序链表。并发场景换成 PriorityBlockingQueue(无界 + 阻塞 take)。

### DelayQueue:延迟任务与订单超时

DelayQueue 的元素必须实现 ==Delayed==:getDelay 返回剩余延迟(≤0 表示到期),compareTo 决定谁先出队。take() 会**阻塞到堆顶元素到期**才返回,底层是 PriorityQueue + 条件等待 + Leader-Follower 减少无效唤醒。订单超时关闭、缓存过期、失败重试调度都能用它实现,不必上定时轮询扫全表。

\`\`\`java OrderTimeoutDemo.java
import java.util.concurrent.DelayQueue;
import java.util.concurrent.Delayed;
import java.util.concurrent.TimeUnit;

public class OrderTimeoutDemo {
    record Order(String id, long expireAt) implements Delayed {
        @Override
        public long getDelay(TimeUnit unit) {
            return unit.convert(expireAt - System.currentTimeMillis(), TimeUnit.MILLISECONDS);
        }

        @Override
        public int compareTo(Delayed other) {
            return Long.compare(expireAt, ((Order) other).expireAt);
        }
    }

    public static void main(String[] args) throws InterruptedException {
        DelayQueue<Order> queue = new DelayQueue<>();
        long now = System.currentTimeMillis();
        queue.put(new Order("A1001", now + 300));
        queue.put(new Order("A1002", now + 100));

        System.out.println("先超时: " + queue.take().id());   // 阻塞到最早到期
        System.out.println("后超时: " + queue.take().id());
    }
}
\`\`\`

\`\`\`output
先超时: A1002
后超时: A1001
\`\`\`

> [!interview] 队列选型一句话
> 按优先级出队用 PriorityQueue(堆顶最小,遍历无序);延迟到点才可用用 DelayQueue(元素实现 Delayed,take 阻塞到到期);需要阻塞 + 优先级用 PriorityBlockingQueue;需要 FIFO 阻塞用 ArrayBlockingQueue/LinkedBlockingQueue;需要无锁高吞吐用 ConcurrentLinkedQueue。DelayQueue 不是分布式方案,多实例要么只让一个消费者抢,要么落 Redis ZSet 做全局延迟队列。

## 面试速记

- 线程池流程:核心满→入队→队列满→开非核心→全满拒绝;"队列优先于扩容"导致 Executors 无界队列 OOM。
- 参数口诀:CPU 密集 N+1、IO 密集 2N;拒绝策略推荐 CallerRuns 自然限流;工厂必须命名线程。
- CAS = 期望值比对 + CPU 原子指令;缺陷自旋耗 CPU、单变量、ABA(AtomicStampedReference 加版本)。
- AQS = volatile state + CLH 队列 + 独占/共享模板;ReentrantLock 重入即 state 累加;默认非公平。
- ThreadLocalMap 弱引用 key、强引用 value,线程池长活线程必泄漏,用完 finally 里 remove。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch12',
        title: '网络编程与函数式新特性',
        minutes: 30,
        points: ['BIO/NIO', 'Selector', 'Lambda', 'Stream API'],
        content: `
> [!interview] 本章面试锚点
> 两个拼盘:**网络问"BIO/NIO 区别、Selector 干什么用的"(直接衔接 Redis 与 Netty 的 Reactor 模型)**;函数式问"Lambda 本质是什么、Stream 为什么惰性求值、中间操作与终端操作的区别"。学完这章,JavaSE 与中间件的知识就串成一张网了。

> [!info] 本章导读 · 一个 HTTP 请求,在 Java 里到底走了哪些路?
> 网络编程和函数式新特性看起来是两个话题,其实是 Java 的"对外接口"和"对内写法":一边是 Socket 与 Selector,一边是 Lambda 与 Stream。学完这章,JavaSE 就闭环了。
> - 读完本章你将能:手写一个最简单的 Socket 服务端与客户端
> - 说清 Selector 与 Reactor 模型的关系
> - 用 Stream 重写 for 循环并解释惰性求值

> [!tip] 日常电脑现场 · 看请求与批处理
> 浏览器里按 F12 打开 Network 再刷新,能看到一个个请求依次发出、返回、各花了多少毫秒 —— 网络编程讲的就是这些请求怎么走。选中一百张照片批量重命名,等于一次筛选加映射再输出,原图一张没动。微信发语音时那句"正在发送"变成"已发送",也是请求拿到回执的结果。

## BIO:一连接一线程

\`\`\`java
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.ServerSocket;
import java.net.Socket;

public class BioServer {
    public static void main(String[] args) throws IOException {
        try (ServerSocket server = new ServerSocket(8080)) {
            System.out.println("BIO 服务端启动 8080");
            while (true) {
                Socket socket = server.accept();    // 阻塞:没连接就一直等
                // 每个连接分配一个线程:1000 连接 = 1000 线程,内存爆炸
                new Thread(() -> handle(socket)).start();
            }
        }
    }

    static void handle(Socket socket) {
        try (BufferedReader in = new BufferedReader(
                new InputStreamReader(socket.getInputStream()))) {
            String line;
            while ((line = in.readLine()) != null) {  // 阻塞:对端不发数据就一直等
                System.out.println(socket.getPort() + " 说: " + line);
            }
        } catch (IOException e) { /* 连接断开 */ }
    }
}
\`\`\`

\`\`\`output
BIO 服务端启动 8080
54321 说: hello
\`\`\`

两大阻塞:==accept== 阻塞等连接、==read== 阻塞等数据;线程"占着资源不干活"是致命伤——**线程数随连接数线性增长**,1 万连接 1 万线程直接 OOM。

## NIO:Selector 多路复用(Reactor 雏形)

\`\`\`java
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.SelectionKey;
import java.nio.channels.Selector;
import java.nio.channels.ServerSocketChannel;
import java.nio.channels.SocketChannel;
import java.util.Iterator;

public class NioServer {
    public static void main(String[] args) throws IOException {
        Selector selector = Selector.open();                       // epoll 实例
        ServerSocketChannel server = ServerSocketChannel.open();
        server.bind(new InetSocketAddress(8080));
        server.configureBlocking(false);                           // 必须非阻塞模式
        server.register(selector, SelectionKey.OP_ACCEPT);         // 只关心"有新连接"

        while (true) {
            selector.select();                                     // 阻塞到有就绪事件,没事件不耗CPU
            Iterator<SelectionKey> it = selector.selectedKeys().iterator();
            while (it.hasNext()) {
                SelectionKey key = it.next();
                it.remove();                                       // 必须手动移除,否则重复处理
                if (key.isAcceptable()) {
                    SocketChannel client = server.accept();
                    client.configureBlocking(false);
                    client.register(selector, SelectionKey.OP_READ);  // 新连接注册读事件
                } else if (key.isReadable()) {
                    SocketChannel client = (SocketChannel) key.channel();
                    ByteBuffer buf = ByteBuffer.allocate(128);
                    int n = client.read(buf);
                    if (n == -1) { key.cancel(); client.close(); continue; }
                    System.out.println(new String(buf.array(), 0, n));
                }
            }
        }
    }
}
\`\`\`

\`\`\`output
# 客户端连上并发送 hello 后
hello
\`\`\`

单线程管理所有连接:**谁就绪处理谁**,千级连接也只需一个线程监听——这正是 ==Redis 单线程== 与 ==Netty EventLoop== 的同款模型。三大网络模型对比:

| 模型 | 线程数 | 阻塞点 | 适用 |
| --- | --- | --- | --- |
| BIO | 1 连接 1 线程 | accept + read 双阻塞 | 连接少、传输大 |
| NIO(Selector) | 1~N 线程管全部连接 | 只阻塞在 select() | **海量连接、低流量**(IM/网关) |
| AIO(Proactor) | 内核完成后回调 | 无 | JDK 支持弱、生态少(Netty 已弃) |

> [!tip] select/poll/epoll 在哪一章讲过?
> 这是 OS 层面的知识,与 Redis 章节的 epoll 一节完全同源:**select 全量拷贝 + O(n) 扫描 + 1024 上限;epoll 注册一次 + 就绪链表 O(1)**。Java 的 Selector 在 Linux 上就是 epoll 的封装。面试答"NIO 慢在 select 时代,Linux 上 Selector 已经是 epoll",一句话打通 JavaSE、Redis、Netty 三块知识。

## Lambda 与函数式接口

\`\`\`java
import java.util.Arrays;
import java.util.List;

public class LambdaDemo {
    @FunctionalInterface                    // 校验:必须且只有一个抽象方法
    interface Calculator {
        int calc(int a, int b);
        default String desc() { return "计算器"; }   // default 不算抽象方法
    }

    public static void main(String[] args) {
        // 三种形态:表达式 / 语句块 / 方法引用
        Calculator add = (a, b) -> a + b;
        Calculator max = (a, b) -> Math.max(a, b);
        Calculator sumUp = Integer::sum;    // 方法引用

        System.out.println(add.calc(1, 2) + " " + max.calc(3, 9) + " " + sumUp.calc(4, 5));

        List<String> names = Arrays.asList("Tom", "Jerry", "Spike");
        names.forEach(n -> System.out.print(n + " "));
    }
}
\`\`\`

\`\`\`output
3 9 9 Tom Jerry Spike
\`\`\`

Lambda 的本质(背诵版):**函数式接口的匿名内部类语法糖 + invokedynamic 指令**。与匿名内部类的三点区别:① 无捕获时不持有外部类引用(静态单例,无泄漏);② 只要求 effectively final;③ 编译期不生成额外 class 文件,运行期由 invokedynamic 动态生成。

四大核心函数式接口(背表):

| 接口 | 抽象方法 | 语义 | 常见于 |
| --- | --- | --- | --- |
| Function<T,R> | R apply(T) | 输入 T 输出 R | map |
| Predicate<T> | boolean test(T) | 判断真伪 | filter |
| Consumer<T> | void accept(T) | 消费不返回 | forEach |
| Supplier<T> | T get() | 无中生有 | 工厂、ThreadLocal.withInitial |

## Stream API:声明式数据处理

\`\`\`java
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

public class StreamDemo {
    record User(String name, int age, String city) { }

    public static void main(String[] args) {
        List<User> users = List.of(
                new User("星薇Star", 24, "广州"),
                new User("张三", 31, "深圳"),
                new User("李四", 28, "广州"),
                new User("王五", 17, "广州"));

        // 链式:过滤成年 → 按年龄倒序 → 取名字 → 收集
        List<String> adults = users.stream()
                .filter(u -> u.age() >= 18)
                .sorted((a, b) -> b.age() - a.age())
                .map(User::name)
                .collect(Collectors.toList());
        System.out.println(adults);

        // 按城市分组(TreeMap 让输出顺序稳定,面试手写高频)
        Map<String, List<User>> byCity = users.stream()
                .collect(Collectors.groupingBy(User::city, TreeMap::new, Collectors.toList()));
        System.out.println(byCity.keySet());

        // 数值统计
        System.out.println(users.stream().mapToInt(User::age).average().getAsDouble());
    }
}
\`\`\`

\`\`\`output
[张三, 李四, 星薇Star]
[广州, 深圳]
25.0
\`\`\`

> [!interview] 高频追问:Stream 是惰性求值吗?怎么证明?
> 是。**中间操作(filter/map/sorted/limit)只搭建管线不执行,终端操作(collect/forEach/count)才一次性触发**;且每个元素"垂直执行"——filter 通过后立即 map,而不是 filter 全跑完再 map。证明:在 map 的 lambda 里打印,配合 ==limit(1)== 只打印一次;==findFirst/anyMatch== 这类**短路操作**能在无限流上终止,就是惰性求值的铁证。另记两条规约:**流是一次性的**(终端操作后复用抛 IllegalStateException);**不修改源集合**。

> [!tip] parallelStream 别乱用
> ==parallelStream== 底层共享 ==ForkJoinPool.commonPool==(CPU 核数 - 1 个线程):Web 请求里乱用会**与其他请求抢占同一线程池**,阻塞别人;IO 密集任务更是灾难。规约:**数据量大且 CPU 密集才用并行流;有独立线程池需求用 CompletableFuture + 自定义池**。

## Optional 与方法引用速览

\`\`\`java
import java.util.Optional;

public class OptDemo {
    public static void main(String[] args) {
        Optional<String> name = Optional.ofNullable(null);
        System.out.println(name.orElse("匿名"));
        System.out.println(name.map(String::length).orElse(0));
    }
}
\`\`\`

\`\`\`output
匿名
0
\`\`\`

Optional 解决"返回值可能为 null,调用方忘了判空"的**可读性**问题:==ofNullable / orElse / orElseThrow / map== 四个方法覆盖九成场景。规约:**返回值类型可以用 Optional,字段与方法入参不要用**。

## 虚拟线程:Java 21 杀手锏

| 维度 | 平台线程(传统 Thread) | 虚拟线程(Virtual Thread, JDK 21) |
| --- | --- | --- |
| 映射关系 | 1:1 映射 OS 内核线程 | M:N,JVM 用户态调度,挂到少量载体线程(Carrier)上 |
| 创建成本 | 约 1MB 栈内存,开几千条就吃紧 | 几百 KB 起步,**百万级可行** |
| 切换成本 | 内核态上下文切换,微秒级 | 用户态切换,纳秒级 |
| 阻塞代价 | 阻塞占死一个内核线程 | 阻塞时**让出载体线程**去跑别的虚拟线程 |
| 适用场景 | CPU 密集任务 | IO 密集:高并发 Web 后端、RPC、DB 调用 |

**一句话**:虚拟线程把"线程"变便宜了,百万并发连接可以直接"一任务一线程"同步阻塞地写。它与 Go goroutine 同属协程家族(有栈协程),区别是**对开发者完全透明**——写的还是普通同步代码,由 JVM 在阻塞点自动让出载体线程,不用任何 async/await 语法改造。

### 两种创建方式(完整可运行)

\`\`\`java VirtualThreadDemo.java
import java.util.concurrent.Executors;

public class VirtualThreadDemo {
    public static void main(String[] args) throws Exception {
        // 方式一:Thread.ofVirtual() 直接构建启动
        Thread v = Thread.ofVirtual().name("v-1").start(() ->
                System.out.println(Thread.currentThread() + " Hello VT"));
        v.join();

        // 方式二:newVirtualThreadPerTaskExecutor():每个任务一条虚拟线程
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 1; i <= 3; i++) {
                executor.submit(() -> {
                    Thread.sleep(50);               // 模拟 IO:阻塞的是虚拟线程,不占载体
                    System.out.println(Thread.currentThread() + " task done");
                    return null;
                });
            }
        }   // try-with-resources:close() 等待所有任务完成
    }
}
\`\`\`

\`\`\`output
VirtualThread[#23,v-1]/runnable@ForkJoinPool-1-worker-1 Hello VT
VirtualThread[#26]/runnable@ForkJoinPool-1-worker-2 task done
VirtualThread[#27]/runnable@ForkJoinPool-1-worker-3 task done
VirtualThread[#28]/runnable@ForkJoinPool-1-worker-4 task done
\`\`\`

输出格式 ==VirtualThread[编号,名字]/runnable@载体线程== 一眼看清 M:N 关系:几条虚拟线程轮流搭在 ForkJoinPool 的载体线程上。

### 一百万条虚拟线程

\`\`\`java MillionVirtualThreads.java
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;

public class MillionVirtualThreads {
    public static void main(String[] args) throws Exception {
        int n = 1_000_000;
        CountDownLatch latch = new CountDownLatch(n);
        long start = System.currentTimeMillis();
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < n; i++) {
                executor.submit(() -> {
                    Thread.sleep(1);                // 每条线程都阻塞 1ms
                    latch.countDown();
                    return null;
                });
            }
        }
        System.out.println(n + " 条虚拟线程全部完成, 耗时 "
                + (System.currentTimeMillis() - start) + "ms");
    }
}
\`\`\`

\`\`\`output
1000000 条虚拟线程全部完成, 耗时 4213ms   # 数字因机器而异,普通台式机数秒内
\`\`\`

同样的代码把 ==newVirtualThreadPerTaskExecutor()== 换成 ==new Thread(t).start()==:**OutOfMemoryError: Unable to create native thread**,这就是对比的最硬证据。

> [!warn] 两个使用红线
> ① JDK 21 中虚拟线程进入 **synchronized 块会钉住(pin)载体线程**——阻塞时无法让出,热点路径建议改用 ==ReentrantLock==(后续 JDK 已缓解);② **不要池化虚拟线程**:它便宜到用完即弃,"每任务一线程"才是正确姿势,池化反而复用不了什么。CPU 密集任务仍然老老实实用核数个平台线程。

### 顺手补漏:sealed 密封类

record(ch05 已讲)的另一半搭档 sealed:把继承树"封闭注册",==permits== 之外的类不许实现,配合 JDK 21 的模式匹配 switch 可以穷尽所有子类:

\`\`\`java ShapeDemo.java
// sealed + record + 模式匹配 switch:Java 21 的"代数数据类型"三件套
public class ShapeDemo {

    sealed interface Shape permits Circle, Square { }
    record Circle(double radius) implements Shape { }
    record Square(double side) implements Shape { }

    public static void main(String[] args) {
        Shape s = new Circle(2.0);
        String desc = switch (s) {              // 子类已穷尽,可省 default 分支
            case Circle c -> "圆, 半径 " + c.radius();
            case Square q -> "方, 边长 " + q.side();
        };
        System.out.println(desc);
    }
}
\`\`\`

\`\`\`output
圆, 半径 2.0
\`\`\`

## instanceof 模式匹配与 switch 模式匹配(Java 16+)

### instanceof 模式匹配:判断即绑定

旧写法是"判断 → 强转 → 再用",三行里两行都是噪音。Java 16 正式的类型模式 ==o instanceof String s== 把两步合成一步:判断通过,s 自动完成声明与赋值,不用再强转。模式变量的作用域是**流敏感**的:if 分支内可用;取反提前 return 之后,同级后续代码也能用。

\`\`\`java InstanceofDemo.java
public class InstanceofDemo {
    static String describe(Object o) {
        if (o instanceof String s) {           // 等价于判断 + String s = (String) o
            return "字符串长度 " + s.length();
        }
        if (o instanceof Integer i) {
            return "整数 " + (i + 1);
        }
        return "其他";
    }

    static String earlyReturn(Object o) {
        if (!(o instanceof String s)) {        // 取反判断后,s 在后续代码仍可用
            return "不是字符串";
        }
        return "长度 " + s.length();
    }

    public static void main(String[] args) {
        System.out.println(describe("hello"));
        System.out.println(describe(41));
        System.out.println(describe(3.14));
        System.out.println(earlyReturn("abc"));
        System.out.println(earlyReturn(1));
    }
}
\`\`\`

\`\`\`output
字符串长度 5
整数 42
其他
长度 3
不是字符串
\`\`\`

### switch 模式匹配:类型分支 + when 守卫

Java 21 正式(JEP 441)的 switch 支持**类型模式 + 守卫条件 + null 分支**,再配合 sealed 的穷尽性,可以彻底告别"instanceof 套娃 + 强转"。注意版本:instanceof 模式匹配是 Java 16 正式;switch 模式匹配、record 解构模式都是 Java 21 正式(17-20 为预览)。

\`\`\`java SwitchPatternDemo.java
public class SwitchPatternDemo {
    sealed interface Shape permits Circle, Square, Rect { }
    record Circle(double r) implements Shape { }
    record Square(double side) implements Shape { }
    record Rect(double w, double h) implements Shape { }

    static String classify(Object o) {
        return switch (o) {
            case null -> "null 值";                       // 显式接住 null,否则 NPE
            case Circle c when c.r() > 100 -> "大圆";      // when 守卫:命中才算
            case Circle c -> "圆 r=" + c.r();
            case Square s -> "正方形边长 " + s.side();
            case Rect r -> "矩形 " + r.w() + "x" + r.h();
            default -> "未知类型";
        };
    }

    public static void main(String[] args) {
        System.out.println(classify(new Circle(2)));
        System.out.println(classify(new Circle(200)));
        System.out.println(classify(new Rect(3, 4)));
        System.out.println(classify(null));
    }
}
\`\`\`

\`\`\`output
圆 r=2.0
大圆
矩形 3.0x4.0
null 值
\`\`\`

### sealed + 穷举 switch:没有 default 也编译通过

把继承树用 sealed 封闭后,编译器知道所有子类型,switch 的分支覆盖全了就不需要 default;将来新增子类,编译器直接报错提醒你补分支——这就是"让错误在编译期暴露"。

\`\`\`java ExhaustiveDemo.java
public class ExhaustiveDemo {
    sealed interface Shape permits Circle, Square { }
    record Circle(double r) implements Shape { }
    record Square(double side) implements Shape { }

    static double area(Shape s) {
        return switch (s) {                    // 子类已穷尽:编译器不要求 default
            case Circle c -> Math.PI * c.r() * c.r();
            case Square q -> q.side() * q.side();
        };
    }

    public static void main(String[] args) {
        System.out.printf("%.2f%n", area(new Circle(1)));
        System.out.println(area(new Square(3)));
    }
}
\`\`\`

\`\`\`output
3.14
9.0
\`\`\`

### record 解构模式:一次拆到字段

Java 21 的 record pattern 能把 record 里的组件直接"拆"成变量,支持多层嵌套。它和 sealed、switch 模式匹配合称 Java 的"代数数据类型三件套",写表达式求值器、AST 遍历、消息路由极其顺手。

\`\`\`java RecordPatternDemo.java
public class RecordPatternDemo {
    record Point(int x, int y) { }
    record Line(Point start, Point end) { }

    public static void main(String[] args) {
        Object o = new Line(new Point(1, 2), new Point(3, 4));
        // 嵌套解构:Line 拆出两个 Point,再各自拆出 x/y
        if (o instanceof Line(Point(int x1, int y1), Point(int x2, int y2))) {
            System.out.println("起点(" + x1 + "," + y1 + ") 终点(" + x2 + "," + y2 + ")");
        }
    }
}
\`\`\`

\`\`\`output
起点(1,2) 终点(3,4)
\`\`\`

> [!interview] 回答模板
> "Java 16 先把 instanceof 的模式匹配正式化,判断通过直接绑定变量,避免重复强转;Java 21 把 switch 模式匹配和 record 解构正式化,配合 sealed 可以穷尽分支、不写 default,漏了分支编译报错。本质是让类型判断从运行期强转前移到编译期校验,减少 ClassCastException。"

> [!pitfall] 三个容易翻车的点
> ① ==null instanceof X== 恒为 false,不会进模式分支;switch 的 selector 为 null 时,没有 ==case null== 会直接 NPE;② 模式变量不是普通局部变量,作用域由编译器按控制流推断,别在分支外乱用;③ switch 模式匹配与 record 解构在 JDK 17 只是**预览特性**,要加 ==--enable-preview== 才能编译,生产项目先确认 JDK 版本。

## 面试速记

- BIO 一连接一线程,accept/read 双阻塞;NIO 单线程 Selector 事件驱动,Linux 底层 epoll。
- Selector 必须 configureBlocking(false);selectedKeys 遍历前必须 remove,否则重复处理。
- Lambda = 函数式接口语法糖 + invokedynamic;四大接口 Function/Predicate/Consumer/Supplier。
- Stream 惰性求值:中间操作搭管线、终端操作触发;短路操作可终止无限流;流一次性不复用。
- parallelStream 共享 ForkJoinPool.commonPool,Web 环境慎用;Optional 只做返回值类型。
`
      }
    ],
    interview: [
      { q: '== 和 equals 的区别?', a: '① == 基本类型比值,对象比引用地址;② equals 是 Object 方法,默认实现就是 ==,重写后按业务字段比内容,String、Integer 都重写了;③ 规约:业务对象判等一律重写 equals;包装类、String 之间永远用 equals,避开缓存陷阱(Integer 128 超出 -128~127 缓存后 == 为 false)。口诀:== 管身份,equals 管内容。' },
      { q: '为什么重写 equals 必须重写 hashCode?', a: '① 契约:equals 相等则 hashCode 必须相等,反之不要求;② HashMap 先用 hashCode 定桶(hash & (n-1)),再用 equals 桶内找元素。只重写 equals:两个"相等"对象 hash 不同进不同桶 → HashSet 出现重复元素、HashMap.get 查不到;③ 只重写 hashCode 也不行,equals 仍按地址比。口诀:hashCode 管进哪个桶,equals 管桶里是不是它。' },
      { q: 'String 为什么设计成不可变?', a: '① 常量池复用:字面量全局唯一,省内存;② hashCode 可缓存:做 HashMap 的 key 不重复计算、键不漂移;③ 线程安全:不可变对象天然并发安全;④ 安全:类加载名、文件路径、网络参数不被中途篡改。实现手段:final 类防继承重写 + private final 数组不暴露引用,replace/substring 等修改操作都返回新对象。追问可补:反射能破,但不该破。' },
      { q: 'String、StringBuilder、StringBuffer 的区别?', a: '① String 不可变,每次修改产生新对象;② StringBuilder 可变,非线程安全,单线程拼接首选,循环拼接远胜加号的 O(n²);③ StringBuffer 是 synchronized 版,线程安全但有锁开销,单线程别用;④ 编译器只折叠常量,循环里的 += 每圈仍新建 builder + toString,救不了。容量能预估就 new StringBuilder(n) 避免扩容拷贝。' },
      { q: '深拷贝和浅拷贝的区别?如何实现深拷贝?', a: '① 浅拷贝只复制对象本身,引用字段指向同一份内部对象,改副本会影响原对象;② 深拷贝递归复制引用对象,两棵对象树完全独立。实现方式:所有引用字段层层 clone(繁琐)、序列化走一趟(JSON/JDK 序列化)、拷贝构造器手动 new(最推荐,清晰可控);③ 加分:clone 绕过构造器、语义脆弱,Effective Java 建议用拷贝构造/工厂替代。' },
      { q: '重载和重写的区别?', a: '① 重载:同一个类里同名不同参(类型/个数/顺序),返回值可不同,编译期按参数静态类型分派;② 重写:子类实现父类同名同参方法,访问权限不能更严、异常不能更宽、返回值相同或协变,运行期按实际类型动态分派(invokevirtual);③ 陷阱:static 方法与字段是隐藏不是重写,不参与多态;private 方法不参与重写;@Override 让编译器帮你验证。' },
      { q: '接口和抽象类的区别?如何选择?', a: '① 语法:抽象类单继承、可有构造器与实例状态;接口多实现,成员只有 public static final 常量,JDK 8 起有 default/static 方法、9 起有 private 方法;② 语义:抽象类是 is-a(模板复用,如 AbstractList 骨架实现),接口是 can-do(能力契约,如 Comparable);③ 选型:要复用状态与模板逻辑选抽象类,只定义能力选接口;④ 本质分界线:接口不能持有实例状态。' },
      { q: '反射是什么?有哪些应用场景?优缺点?', a: '① 定义:运行期动态获取并操作类信息(Class/Field/Method/Constructor)的能力;② 场景:JDBC 加载驱动、Spring 扫描 @Component 后反射实例化与 @Autowired 注入、MyBatis 结果映射实体、JDK 动态代理;③ 优点:解耦扩展,"注解声明意图,反射执行意图";④ 缺点:比直接调用慢(查找/装箱)、setAccessible 破封装、与模块化冲突;⑤ 优化:缓存 Method/Field,热点路径用 MethodHandle。' },
      { q: 'ArrayList 和 LinkedList 的区别?谁性能更好?', a: '① 底层:ArrayList 连续 Object 数组,LinkedList 双向链表;② 复杂度:ArrayList 随机访问 O(1)、中间插删 O(n);LinkedList 头尾插删 O(1)、随机访问 O(node 折半查找仍是 O(n));③ 实测尾插 ArrayList 也不输:链表每次 new 节点有分配开销,连续内存 CPU 缓存命中率高;④ 结论:默认无脑 ArrayList,头部频繁增删才用 ArrayDeque/LinkedList。' },
      { q: 'ArrayList 的扩容机制?', a: '① 懒初始化:new ArrayList() 共享空数组不分配内存,首次 add 才扩到默认容量 10;② 扩容:新容量 = 旧 + (旧 >> 1),即 1.5 倍(10→15→22→33),位运算避免浮点;③ 代价:Arrays.copyOf 整组拷贝 O(n);④ 优化:能预估就 new ArrayList<>(n) 一次到位。说出 0→10→15→22 的容量轨迹,就是源码级回答。' },
      { q: 'HashMap 在 JDK 1.7 和 1.8 有哪些区别?', a: '① 结构:1.7 数组+链表;1.8 加红黑树(链表长 8 且容量 64 树化,退化阈值 6),查询 O(n)→O(log n);② 插入:1.7 头插法,并发扩容迁移链表翻转成环死循环;1.8 尾插修复;③ 扰动:1.7 四次移位五次异或,1.8 一次 h ^ (h>>>16);④ 迁移:1.7 逐个重算下标,1.8 按新增 bit 位拆高低位两条链。注意:1.8 仍线程不安全(覆盖写、size 不准)。' },
      { q: 'HashMap 的 put 流程?', a: '① 扰动 hash = h ^ (h>>>16),让高位参与定桶减少碰撞;② 空表懒初始化:容量 16、负载因子 0.75;③ (n-1) & hash 定桶(容量为 2 的幂时等价取模且更快);④ 桶空直接放入;⑤ 桶不空:同 key(hash 相等且双等号或 equals)覆盖,否则尾插链表,长度达 8 且容量 ≥64 树化;⑥ ++size 超过容量×0.75 扩容翻倍。' },
      { q: 'ConcurrentHashMap 如何保证线程安全?(1.8)', a: '① 空桶:CAS(casTabAt)直接写入,无锁;② 非空桶:synchronized 锁头节点,粒度=单桶,冲突概率极低;③ 读:get 全程无锁,val/next 用 volatile 保证可见;④ 扩容:多线程协助迁移(helpTransfer 按桶分工);⑤ 计数:baseCount + CounterCell 分散计数(LongAdder 思想);⑥ 1.7 是 Segment 分段锁,粒度粗已淘汰;key/value 禁 null(并发下 null 有歧义)。' },
      { q: 'synchronized 的原理?', a: '① 字节码:同步代码块编译为 monitorenter/monitorexit,同步方法靠 ACC_SYNCHRONIZED 标志;② Monitor:每个对象关联监视器锁(底层 OS mutex),含 owner、entryList(BLOCKED 队列)、waitSet(wait 队列);③ 锁升级:无锁→偏向锁(单线程免 CAS)→轻量级锁(自旋,用户态)→重量级锁(内核态挂起),只升不降,JDK 15 起偏向锁废弃;④ 用法:实例方法锁 this、静态方法锁 Class、代码块锁指定对象。' },
      { q: 'volatile 的作用与原理?', a: '① 可见性:写立即刷主存并使其他核缓存行失效(MESI 协议),读直取主存,一处写处处可见;② 禁止指令重排:插入内存屏障,DCL 单例必须 volatile 防"赋引用→初始化"重排发布的半成品对象;③ 不保证原子性:i++ 是读-加-写三步照样丢更新,要原子用 AtomicInteger;④ 底层:ACC_VOLATILE 标志 + JVM 内存屏障 + lock 前缀指令。应用:状态标志、DCL、配置热更新。' },
      { q: '线程池有哪些核心参数?任务提交后怎么处理?', a: '① 七参数:corePoolSize、maximumPoolSize、keepAliveTime+unit、workQueue、threadFactory、handler(拒绝策略);② 流程:核心未满建核心线程→满则入队→队列满建非核心线程→线程到 max 且队列满走拒绝(Abort 抛异常 / CallerRuns 提交者执行 / Discard 丢弃 / DiscardOldest 丢最老);③ 关键是"先入队后扩线程",Executors 无界队列会堆积 OOM;④ 规约:手动 new ThreadPoolExecutor,CPU 密集 N+1、IO 密集 2N。' },
      { q: 'CAS 是什么?ABA 问题怎么解决?', a: '① CAS:compareAndSwap(内存值V, 预期值E, 新值N),V 等于 E 才写入,底层 CPU cmpxchg + lock 前缀,单条指令原子;② 应用:AtomicInteger.incrementAndGet、AQS 的 state 修改、ConcurrentHashMap 空桶插入;③ 优点:用户态自旋免内核切换;缺点:竞争激烈自旋耗 CPU、只能单变量原子、ABA;④ ABA:值 A→B→A 察觉不到中间变化,解法 AtomicStampedReference 加版本号双重比较。' },
      { q: 'ThreadLocal 为什么会内存泄漏?怎么避免?', a: '① 结构:每个 Thread 内有 ThreadLocalMap,key 是 ThreadLocal 实例的弱引用,value 是强引用;② 泄漏链:外部不再引用 ThreadLocal → 弱引用 key 被回收,entry 变 (null, value) 脏数据;线程池线程长活不销毁 → value 永远不可达;③ 正解:用完 remove() 放 finally 里,线程池场景尤其必须;④ 附加:父子线程不自动传递,要传用 InheritableThreadLocal 或线程池场景的 TransmittableThreadLocal。' },
      { q: 'Stream 的惰性求值是什么?中间操作和终端操作的区别?', a: '① 中间操作(filter/map/sorted/limit)只搭管线不执行,终端操作(collect/forEach/count)触发整条管线一次遍历完成;② 元素垂直执行:filter 通过立即 map,不是 filter 全跑完再 map;③ 证明:map 里打印配合 limit(1) 只打印一次;findFirst/anyMatch 短路操作能终止无限流,是惰性求值的铁证;④ 规约:流一次性(复用抛 IllegalStateException)、不改源集合、parallelStream 共享公共池慎用。' },
      { q: 'wait 和 sleep 的区别?', a: '① 所属:wait 是 Object 的方法(对象监视器机制),sleep 是 Thread 的静态方法(线程调度);② 锁:wait 释放锁,sleep 抱着锁睡;③ 调用条件:wait 必须在 synchronized 块内,否则抛 IllegalMonitorStateException,sleep 随处可用;④ 唤醒:wait 靠 notify/notifyAll 或超时,sleep 到点自动醒。共同点:都让出 CPU,都响应 interrupt 并抛 InterruptedException。' },
      { q: 'clone 的浅拷贝和深拷贝分别怎么实现?', a: '① 浅拷贝:实现 Cloneable + 重写 clone() 调 super.clone(),只复制第一层,引用字段仍指向同一内层对象,改副本内层会连坐原对象;② 深拷贝三法:引用字段层层重写 clone(繁琐)、序列化走一趟(对象树写流再读回)、拷贝构造器逐字段 new(最推荐);③ clone 绕过构造器、语义脆弱,Effective Java 建议用拷贝构造/工厂替代。' },
      { q: '手写一个 LRU 缓存?', a: '① 简便写法:extends LinkedHashMap,构造 super(capacity, 0.75f, true) 开访问序,重写 removeEldestEntry 返回 size() > capacity,命中自动移链表尾,超容量淘汰链表头(最久未访问);② 禁用继承时手写 HashMap + 双向链表:map 存节点 O(1) 定位,命中摘下挂尾,超容量删头;③ 细节:put 覆盖旧 key 也算访问,get 不触发淘汰。' },
      { q: 'happens-before 是什么?有哪些规则?', a: '① 定义:JMM 的可见性判断标准,A happens-before B 则 A 的结果对 B 可见;不是时间先后,是可见性保证;② 八条:程序顺序、监视器锁(解锁先于随后加锁)、volatile 写先于读、线程启动(start 先于新线程操作)、线程终止(先于 join 返回)、线程中断(interrupt 先于检测到中断)、对象终结(构造先于 finalize)、传递性;③ 应用:join 后能读到子线程写过的变量。' },
      { q: '死锁怎么产生?怎么排查?怎么避免?', a: '① 产生:互斥、持有并等待、不可剥夺、循环等待四条件同时满足,典型是线程1持锁A等B、线程2持锁B等A;② 排查:jstack 抓栈自动输出 Found one Java-level deadlock 并指明互等的锁;jconsole、arthas thread -b 也行;③ 避免:全局统一加锁顺序(最常用)、tryLock 超时放弃、一次性申请全部资源;④ 缩小锁粒度降低概率。' },
      { q: '虚拟线程是什么?解决了什么问题?', a: '① 定义:JDK 21 正式的轻量级线程,M:N 由 JVM 用户态调度,挂到少量载体线程;成本几百 KB 可开百万级,平台线程 1:1 映射内核线程,开几千就 OOM;② 解决:高并发 IO 密集下线程不够用——同步阻塞写法直接扛百万并发,阻塞时自动让出载体,无需异步改造;③ 红线:CPU 密集不适用;JDK 21 synchronized 会 pin 载体,热点换 ReentrantLock;不要池化。' },
      { q: 'SPI 是什么?JDK 里有哪些应用?', a: '① 定义:JDK 内置服务发现机制——实现类全限定名写进 META-INF/services/接口全限定名 文件,ServiceLoader 自动扫描并实例化全部实现,调用方只依赖接口;② 应用:JDBC 4.0 自动加载驱动、SLF4J 绑定日志实现、Spring 自动配置(spring.factories/AutoConfiguration.imports)是其放大;③ 原理:DriverManager 在启动类加载器,靠线程上下文类加载器加载实现类,破坏双亲委派。' },
      { q: 'Java 是值传递还是引用传递?', a: '**Java 只有值传递**。① 基本类型传数值副本,方法内改形参不影响实参,swap(int, int) 必然失败;② 引用类型传"引用的副本",副本与原变量指向同一对象,所以改字段调用方可见;③ 但让副本重新指向新对象,调用方看不到,证明传的仍是值;④ 所谓"引用传递"是误读,本质是两个引用共享同一对象。' },
      { q: '类的初始化顺序是怎样的?', a: '① 类初始化:父类静态变量/静态块 → 子类静态变量/静态块,同类内按书写顺序,只执行一次;② 对象初始化:new 分配并清零 → super() 完成父类实例化 → 本类实例变量/实例块 → 构造器体;③ 父类永远先于子类;④ 静态块先于 main,实例块与构造器每次 new 都执行。' },
      { q: 'fail-fast 是什么?如何避免?', a: '**fail-fast 是迭代器的快速失败保护**:① 集合维护 modCount,迭代器记录 expectedModCount;② 遍历中结构性修改使两者不等,next() 抛 ConcurrentModificationException;③ 单线程也会触发,且不保证必触发;④ 迭代器自己的 remove 或 removeIf 才安全,并发用 CopyOnWriteArrayList。' },
      { q: 'StampedLock 和读写锁有什么区别?', a: '① StampedLock 有写锁、悲观读、乐观读三种模式:tryOptimisticRead 不加锁,validate 校验期间有无写,读多写少吞吐更高;② 不可重入,重复加写锁会死锁;③ 不支持 Condition、不可中断、非公平;④ 读写锁基于 AQS,可重入、支持公平与 Condition,但写可能饥饿;⑤ 需要重入/Condition 选读写锁,否则可选 StampedLock。' }
    ]
  };
})();
