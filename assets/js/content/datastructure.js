/* ═══════════════════════════════════════════════════════════
   模块:数据结构与算法(5 章)
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.CONTENT = window.CONTENT || {};

  window.CONTENT.datastructure = {
    id: 'datastructure',
    title: '数据结构与算法',
    en: 'DATA STRUCTURE & ALGORITHM',
    icon: 'spark',
    color: '#22d3ee',
    tagline: '手撕题背后的底层逻辑',
    minutes: '≈ 14 小时',
    description: '从复杂度分析讲起:数组链表栈队列、哈希与树、图、排序与动态规划。每个结构都配可运行 Java 代码与真实输出,面试手撕题按“思路→代码→复杂度”三步讲透。',
    chapters: [
      /* ─────────────────────────────────────────── */
      {
        id: 'ch01',
        title: '入门:程序 = 数据结构 + 算法',
        minutes: 45,
        points: ['大 O 表示法', '复杂度增长', '均摊分析', '数组 vs 链表'],
        content: `
> [!info] 本章导读 · 同样是查一个数,为什么有人 1 秒有人 1 分钟?
> 100 万条有序数据里找一个数:从头扫,平均要看 50 万次;二分查找,最多 20 次。同一台电脑、同一门语言,差距 2.5 万倍 —— 这就是数据结构与算法存在的意义。它不是面试八股,而是你写下的每一行循环到底要跑多久的底层解释。
> - 读完本章你将能:用大 O 一眼判断代码能不能扛住数据量
> - 分清最好、最坏、平均、均摊四种复杂度,不再被“ArrayList 插入是 O(1)”绕晕
> - 在数组与链表之间,给出有依据的选型而不是背结论
> - 知道面试官手撕题时到底在给你打什么分

> [!tip] 日常电脑现场 · 搜索框为什么秒出
> 在文件管理器搜索框敲两个字,几万个文件里结果几乎是跳出来的;可手机相册一路往下滑,越滑越卡,缩略图要等半秒才补上。同一台设备、同样的数据量,差别只在数据有没有按顺序摆好、每次要找多少遍。

## 先分清两个词:数据结构与算法

去图书馆找一本书,有两件事同时决定你快不快:**书怎么摆**,以及**你怎么找**。书按编号排成一排,你能直接走到第 3 排第 5 格;书用绳子串成一串,你只能从绳头一本本摸过去。摆法就是**数据结构(Data Structure)**,找法就是**算法(Algorithm)**。摆得好,笨办法也快;摆得差,聪明办法也白搭。

计算机世界同理:

- **数据结构** 研究“数据怎么组织、怎么存”:数组用连续内存,链表用指针串联,哈希表按 key 分桶,树按大小分层。它决定了“访问一个元素要走几步”。
- **算法** 研究“问题怎么一步步解决”:二分、排序、BFS、动态规划。它决定了“这些步怎么组合最省”。
- 1976 年 Niklaus Wirth 给出那个著名等式:**程序 = 数据结构 + 算法**。框架和语法会过时,这两样不会。

| 现实场景 | 对应的数据结构 | 对应的算法 |
| --- | --- | --- |
| 书按编号排成一排,直接抽第 5 本 | 数组 | 随机访问 O(1) |
| 书用绳子串起来,只能顺着摸 | 链表 | 顺序遍历、反转 |
| 书按首字母分到 26 个格子 | 哈希表 | 哈希定位 O(1) |
| 书按分类做成树状目录 | 树 | 中序遍历、二分查找 |
| 城市与道路组成路网 | 图 | BFS / Dijkstra |

> [!tip] 选型先问三句话
> ① 数据量会不会涨到十万级以上?② 更常做“按位置取”还是“中间插删”?③ 要不要有序、要不要去重?三句话答完,80% 的结构选型就定了。剩下的 20% 靠复杂度算账。

## 大 O:只保留增长最快的项

大 O 表示法(Big O Notation)描述的**不是具体耗时**,而是“数据量 n 变大时,耗时按什么形状增长”。推导只有三步:

1. 写出基本操作的执行次数 T(n),比如 T(n) = 3n² + 5n + 7;
2. **只保留最高阶项** → 3n²;
3. **去掉常数系数** → O(n²)。

因为 n 足够大时,3n² 会把 5n + 7 碾成渣,系数 3 也不改变曲线形状。常见复杂度从快到慢:

\`\`\`text
// O(n):两个独立循环,相加
for (int i = 0; i < n; i++) sum += a[i];
for (int i = 0; i < n; i++) max = Math.max(max, a[i]);

// O(n²):嵌套循环,相乘
for (int i = 0; i < n; i++)
    for (int j = 0; j < n; j++)
        check(a[i], a[j]);
\`\`\`

==O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ) < O(n!)==

| 复杂度 | n=1,000 | n=1,000,000 | 典型操作 | 1 秒内大约能处理 |
| --- | --- | --- | --- | --- |
| O(1) | 1 | 1 | 数组下标、哈希取值 | 任意规模 |
| O(log n) | 10 | 20 | 二分查找、平衡树 | 任意规模 |
| O(n) | 1,000 | 1,000,000 | 一次遍历、求和 | 千万级 |
| O(n log n) | 10,000 | 19,931,568 | 归并/快排/堆排 | 百万级 |
| O(n²) | 1,000,000 | 1,000,000,000,000 | 双重循环、冒泡 | 五千级 |
| O(2ⁿ) | 天文数字 | 天文数字 | 朴素递归求子集 | 25 级以内 |

把这张表背下来的价值:看到 n = 10⁵,你就知道 O(n²) 的写法必超时,必须换 O(n log n) 或 O(n)。面试里先说“n 的范围是多少”,再谈复杂度,这是专业度的第一分。

\`\`\`java Growth.java
public class Growth {
    public static void main(String[] args) {
        int[] ns = {10, 100, 1000, 10000, 100000};
        System.out.printf("%-8s %-8s %-10s %-10s %-12s %-14s%n",
                "n", "O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n^2)");
        for (int n : ns) {
            double logn = Math.log(n) / Math.log(2);
            System.out.printf("%-8d %-8d %-10.1f %-10d %-12.0f %-14.0f%n",
                    n, 1, logn, n, n * logn, (double) n * n);
        }
    }
}
\`\`\`

\`\`\`output
n        O(1)     O(log n)   O(n)       O(n log n)   O(n^2)
10       1        3.3        10         33           100
100      1        6.6        100        664          10000
1000     1        10.0       1000       9966         1000000
10000    1        13.3       10000      132877       100000000
100000   1        16.6       100000     1660964      10000000000
\`\`\`

注意 n 从 10 涨到 10 万(1 万倍):O(n) 涨 1 万倍,O(n²) 涨 1 亿倍,而 O(log n) 只从 3.3 涨到 16.6。这就是为什么“把 O(n²) 优化成 O(n log n)”在工程里值钱。

\`\`\`diagram:d-complexity
\`\`\`

上面这张图把五条曲线画在一起:O(1) 是一条水平线,O(log n) 几乎贴着地面爬,O(n) 是斜直线,O(n log n) 只是略陡,而 O(n²) 一过 n=100 就冲出画面。看图记结论:**能降到对数就别停在线性,能线性就别碰平方**。

> [!warn] 大 O 的三个易错点
> ① **并列取最大、嵌套取相乘**:两个独立 for 循环是 O(n)+O(n)=O(n),嵌套才是 O(n²)。② **log 的底数不重要**:log₂n 与 log₁₀n 只差常数倍,统一写 O(log n)。③ **空间也算**:new 了一个长度 n 的数组就是 O(n),递归深度 n 就是 O(n) 栈空间,别只盯时间。

## 最好、最坏、平均、均摊:四个“最”

同一段代码,输入不同,代价可能差很多。以“在数组里找 target”为例:

- **最好情况(Best Case)**:target 就在第一个,比较 1 次,O(1);
- **最坏情况(Worst Case)**:target 在最后一个或不存在,比较 n 次,O(n);
- **平均情况(Average Case)**:假设 target 等概率出现在每个位置,平均 n/2 次,仍记 O(n);
- **均摊情况(Amortized)**:把一串操作的总代价摊到每一次上,看长期平均。

面试默认问的是**最坏情况**,因为系统容量要按最坏设计;但“均摊”是另一个维度,专门解释“偶尔很慢、长期很便宜”的现象。

\`\`\`java SearchCompare.java
public class SearchCompare {
    static int linear(int[] a, int target) {
        int cmp = 0;
        for (int i = 0; i < a.length; i++) {
            cmp++;
            if (a[i] == target) return cmp;
        }
        return cmp;
    }

    static int binary(int[] a, int target) {
        int lo = 0, hi = a.length - 1, cmp = 0;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            cmp++;
            if (a[mid] == target) return cmp;
            if (a[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return cmp;
    }

    public static void main(String[] args) {
        int n = 1_000_000;
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = i;
        int target = 999_999;                 // 最坏位置
        System.out.println("顺序查找比较次数: " + linear(a, target));
        System.out.println("二分查找比较次数: " + binary(a, target));
    }
}
\`\`\`

\`\`\`output
顺序查找比较次数: 1000000
二分查找比较次数: 20
\`\`\`

100 万次对 20 次。二分的代价是“数组必须有序”,排序一次 O(n log n),但排完之后查一万次就回本了 —— **预处理换查询**,这是索引、缓存、字典树的共同思路。

### 均摊 O(1):ArrayList 扩容为什么不算慢

动态数组容量满了要扩容:申请更大的数组,把旧元素整体搬过去,单次 O(n)。听起来很贵,但扩容不是每次都发生。以 JDK 的 **1.5 倍扩容**模拟:

\`\`\`java DynamicArray.java
import java.util.Arrays;

public class DynamicArray {
    private int[] data = new int[10];
    private int size = 0;
    private int capacity = 10;
    private int copies = 0;

    void add(int x) {
        if (size == capacity) {
            int newCap = capacity + (capacity >> 1);      // 1.5 倍
            data = Arrays.copyOf(data, newCap);           // 整体搬运
            copies += size;
            System.out.println("扩容: " + capacity + " -> " + newCap + ", 搬运 " + size + " 个元素");
            capacity = newCap;
        }
        data[size++] = x;
    }

    public static void main(String[] args) {
        DynamicArray a = new DynamicArray();
        for (int i = 1; i <= 20; i++) a.add(i);
        System.out.println("size=" + a.size + ", capacity=" + a.capacity);
        System.out.println("20 次 add 总搬运次数 = " + a.copies);
    }
}
\`\`\`

\`\`\`output
扩容: 10 -> 15, 搬运 10 个元素
扩容: 15 -> 22, 搬运 15 个元素
size=20, capacity=22
20 次 add 总搬运次数 = 25
\`\`\`

20 次 add 总共搬了 25 个元素,平均每次 1.25 个动作 —— 常数级。数学上,按倍数扩容时总搬运量是 n + n/1.5 + n/2.25 + … < 3n,所以**均摊 O(1)**。JDK 的 ==ArrayList.grow== 就是这套逻辑:**newCap = oldCap + (oldCap >> 1)**,再 ==Arrays.copyOf== 整体搬运。注意区别:**单次最坏仍是 O(n)**(恰好触发扩容那次),“均摊 O(1)”不等于“每次都 O(1)”。这句区分是面试高频陷阱。

> [!pitfall] “ArrayList 插入是 O(1)”是半句真话
> 尾部插入均摊 O(1),中间插入要搬移后面所有元素,是 O(n)。LinkedList 中间插入看似 O(1),但**先按索引找到位置**就是 O(n),所以“LinkedList 插入快”只在“已持有节点引用”时成立。工程结论:绝大多数场景 ArrayList 更快,因为连续内存的缓存命中率能抵消搬移成本。

## 数组 vs 链表:六维对比

| 维度 | 数组 Array | 链表 Linked List |
| --- | --- | --- |
| 内存布局 | ==连续== 一整块 | 节点分散,靠指针相连 |
| 随机访问 | ==O(1)==:首地址 + i × 元素大小 | O(n):从头或尾逐个走 |
| 插入/删除 | 头部/中间 O(n);尾部均摊 O(1) | 已知位置 O(1);按索引找仍 O(n) |
| 缓存友好度 | 高:预读整块进 CPU Cache | 低:每次跳转都可能 cache miss |
| 额外内存 | 预留容量可能浪费 | 每个节点多 1~2 个指针(8/16 字节) |
| 扩容 | 需要申请新数组并整体拷贝 | 无需扩容,按需 new 节点 |

数组的随机访问来自那个公式:**address(i) = base + i × size**。一次乘加就能算出地址,CPU 直接取;链表没有这个公式,只能顺着 next 走。所以“数组查询快”不是玄学,是地址可计算。

链表真正的优势只有一条:**已知前驱节点时,插入删除不用搬移**。这也是为什么 LRU 缓存用“哈希表 + 双向链表”:哈希表 O(1) 找到节点,链表 O(1) 把它摘下来挂到头部。

## 面试怎么考:手撕题的评分点

面试官看你写代码,不是看你能不能背出原题,而是看五件事:

| 评分点 | 具体看什么 | 怎么拿分 |
| --- | --- | --- |
| 边界 | 空输入、单元素、越界、重复值、整数溢出 | 动手前先问“n 可能为 0 吗” |
| 复杂度 | 能不能说出时间/空间,能不能优化 | 写完主动报 O(?),再问“要不要更优” |
| 命名 | cur / prev / next / dummy / slow / fast | 用行业通用名,别写 a、b、tmp1 |
| 结构 | 先讲思路再写,代码分层清晰 | 三句话讲清“用什么结构、为什么、怎么走” |
| 测试 | 主动跑样例和边界 | 用嘴跑一遍:输入 [1],输出是什么 |

刷题方法,给一套能落地的:

- **按专题刷,不按题号刷**:链表一周、二叉树一周、DP 一周。同一套模板反复用,才能形成手感。
- **三遍法**:第一遍看题想 15 分钟,不会就看题解并手写;第二遍隔 3 天默写;第三遍隔 2 周只讲思路不写代码。
- **不背代码,背模板和易错点**:反转链表的三指针、二分的 while 条件、回溯的 used 数组,这些是模板;具体题目是模板的组合。
- **错题本只记一句话**:比如“快慢指针找入口:相遇后一个回 head 同速走”,不抄整段代码。

> [!interview] 面试官视角:一道反转链表能问出什么
> 先让你写迭代 —— 看基本功;再让你写递归 —— 看对调用栈的理解;追问“递归为什么空间是 O(n)”“链表长度为 1 会怎样”“能不能只反转前 k 个” —— 看边界和迁移能力。所以手撕题从来不是“写出来就行”,而是**写完之后还能接住三轮追问**。本书每道手撕题都按“思路 → 代码 → 复杂度 → 追问”四段组织,就是这个原因。

## 本章小结

- **程序 = 数据结构 + 算法**:结构决定访问成本,算法决定步骤组合。
- **大 O 看增长形状**:去常数、去低阶、并列取最大、嵌套取相乘;n 的范围决定能不能过。
- **四种复杂度各管一件事**:最坏用于容量设计,均摊用于解释“偶尔慢、长期快”。
- **数组赢在随机访问和缓存,链表赢在已知位置的增删**;选型看操作比例。

## 面试速记

- 大 O 三步:写 T(n) → 留最高阶 → 去系数;O(1) < O(log n) < O(n) < O(n log n) < O(n²)。
- 二分 O(log n) 的前提是**有序**;100 万数据最多 20 次比较。
- ArrayList 尾部 add 均摊 O(1),单次扩容 O(n),1.5 倍增长;中间插入 O(n)。
- 数组随机访问 O(1) 来自 address = base + i × size;链表只能 O(n) 走。
- 手撕评分五看:边界、复杂度、命名、结构、测试;写完主动报复杂度。
`
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch02',
        title: '线性结构:数组·链表·栈·队列',
        minutes: 50,
        points: ['单链表反转', '快慢指针', '括号匹配', '循环队列'],
        content: `
> [!info] 本章导读 · 为什么面试官总让你反转链表?
> 因为一道反转链表,能同时考出指针操作、边界处理、递归理解、空间复杂度四件事 —— 它是手撕题的“广播体操”。本章把数组、链表、栈、队列四条线性结构串起来:先讲清内存与规则,再用手撕代码把每个结构跑一遍,输出全部真实可复现。
> - 读完本章你将能:白板写出单链表反转的迭代与递归两版
> - 用快慢指针判环并找到环入口,讲清推导
> - 用栈解决括号匹配、下一个更大元素
> - 用数组手写循环队列,用两个栈实现队列

> [!tip] 日常电脑现场 · 后退键的记忆
> 在浏览器里连点三次链接,再一路按后退,页面会原样倒着退回去;点打印时五份文档不会同时出纸,而是一份一份排队吐出来。一个只记"最近一次"的栈,一个只认"先来先走"的队列,就藏在这两个日常动作里。

## 数组:连续内存带来的“超能力”

数组(Array)是一块**连续**的内存,元素类型相同、大小相同。第 i 个元素的地址不需要“找”,直接算:

\`\`\`text
address(i) = base + i × elementSize
\`\`\`

这就是随机访问 O(1) 的全部秘密。代价是“连续”很难维护:中间插入一个元素,后面所有元素都要后移;删除一个元素,后面所有元素都要前移。

\`\`\`java ArrayAddress.java
public class ArrayAddress {
    public static void main(String[] args) {
        int[] arr = new int[8];
        long base = 0x1000L;                      // 假设首元素地址
        for (int i = 0; i < arr.length; i += 2) {
            long addr = base + (long) i * Integer.BYTES;
            System.out.printf("arr[%d] 地址 = 0x%X%n", i, addr);
        }
        System.out.println("每个 int 占 " + Integer.BYTES + " 字节");
    }
}
\`\`\`

\`\`\`output
arr[0] 地址 = 0x1000
arr[2] 地址 = 0x1008
arr[4] 地址 = 0x1010
arr[6] 地址 = 0x1018
每个 int 占 4 字节
\`\`\`

数组的扩容代价在上一章已经算过:1.5 倍增长、均摊 O(1)、单次 O(n)。记住一句话:**数组擅长“读”,不擅长“在中间改”**。

## 链表:用指针把分散的节点串起来

链表(Linked List)的节点不连续,每个节点存“值 + 下一个节点的地址”。单链表只有 next,双链表还有 prev。它放弃了随机访问,换来了“改指针就能插入删除”。

| 操作 | 数组 | 单链表 | 双链表 |
| --- | --- | --- | --- |
| 按下标访问 | O(1) | O(n) | O(n) |
| 头部插入 | O(n) | O(1) | O(1) |
| 已定位节点后插入 | O(n) | O(1) | O(1) |
| 删除已定位节点 | O(n) | O(n)(要前驱) | O(1)(有 prev) |
| 每个节点额外开销 | 0 | 1 个指针 | 2 个指针 |

> [!tip] 哨兵节点(dummy)是链表题的半条命
> 头节点可能被删除、可能为空,单独判断很啰嗦。加一个 dummy 指向 head,让“删除头节点”和“删除中间节点”变成同一套逻辑,最后返回 dummy.next 即可。练链表题先写 dummy,错误率立刻下降一半。

### 手撕:反转单链表(迭代 + 递归)

\`\`\`java ReverseList.java
public class ReverseList {
    static class Node {
        int val;
        Node next;
        Node(int val) { this.val = val; }
    }

    static Node build(int... vals) {
        Node dummy = new Node(0);
        Node tail = dummy;
        for (int v : vals) {
            tail.next = new Node(v);
            tail = tail.next;
        }
        return dummy.next;
    }

    static void print(Node head) {
        StringBuilder sb = new StringBuilder();
        for (Node p = head; p != null; p = p.next) {
            sb.append(p.val).append(" -> ");
        }
        System.out.println(sb.append("null"));
    }

    // 迭代:三指针,原地反转,时间 O(n) 空间 O(1)
    static Node reverseIter(Node head) {
        Node prev = null;
        Node cur = head;
        while (cur != null) {
            Node next = cur.next;    // 先存后继,否则断链后找不到
            cur.next = prev;         // 掉头
            prev = cur;              // prev 前移
            cur = next;              // cur 前移
        }
        return prev;                 // 新头是原来的尾
    }

    // 递归:先反转后面,再把自己接到末尾,时间 O(n) 空间 O(n)
    static Node reverseRec(Node head) {
        if (head == null || head.next == null) return head;
        Node newHead = reverseRec(head.next);
        head.next.next = head;       // 后继指回自己
        head.next = null;            // 自己变成新尾
        return newHead;
    }

    public static void main(String[] args) {
        System.out.print("原链表: ");
        print(build(1, 2, 3, 4, 5));
        System.out.print("迭代反转: ");
        print(reverseIter(build(1, 2, 3, 4, 5)));
        System.out.print("递归反转: ");
        print(reverseRec(build(1, 2, 3, 4, 5)));
        System.out.print("单节点: ");
        print(reverseIter(build(1)));
        System.out.print("空链表: ");
        print(reverseIter(null));
    }
}
\`\`\`

\`\`\`output
原链表: 1 -> 2 -> 3 -> 4 -> 5 -> null
迭代反转: 5 -> 4 -> 3 -> 2 -> 1 -> null
递归反转: 5 -> 4 -> 3 -> 2 -> 1 -> null
单节点: 1 -> null
空链表: null
\`\`\`

**思路拆解**:反转的本质是“把每个节点的 next 从指向后一个,改成指向前一个”。迭代法用 prev/cur 两个指针维护“已反转部分”和“待反转部分”,next 只是临时保存,防止断链。递归法假设“head.next 之后已经反转好”,剩下的事只有两件:让后继指回自己、自己指向 null。

> [!pitfall] 反转链表的三个送命点
> ① 循环条件写成 **cur.next != null**,最后一个节点没处理;② 忘了先存 ==next==,执行 cur.next = prev 后整条后半链丢失;③ 递归版忘了 **head.next = null**,原头节点还指着第二个节点,形成环,打印时死循环。

### 快慢指针:判环与找环入口

\`\`\`java CycleDetect.java
public class CycleDetect {
    static class Node {
        int val;
        Node next;
        Node(int val) { this.val = val; }
    }

    static Node detectCycle(Node head) {
        Node slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;                 // 慢指针一步
            fast = fast.next.next;            // 快指针两步
            if (slow == fast) {               // 相遇,有环
                Node p = head;
                while (p != slow) {           // 同速走,再遇即入口
                    p = p.next;
                    slow = slow.next;
                }
                return p;
            }
        }
        return null;                          // fast 走到头,无环
    }

    public static void main(String[] args) {
        Node n1 = new Node(1), n2 = new Node(2), n3 = new Node(3);
        Node n4 = new Node(4), n5 = new Node(5), n6 = new Node(6);
        n1.next = n2; n2.next = n3; n3.next = n4;
        n4.next = n5; n5.next = n6; n6.next = n4;   // 6 指回 4

        Node entry = detectCycle(n1);
        System.out.println("有环: " + (entry != null));
        System.out.println("环入口: " + (entry == null ? -1 : entry.val));

        n6.next = null;                              // 断开环
        System.out.println("断开后有环: " + (detectCycle(n1) != null));
    }
}
\`\`\`

\`\`\`output
有环: true
环入口: 4
断开后有环: false
\`\`\`

**为什么相遇后能找入口**:设头到入口距离 a,入口到相遇点距离 b,环长 L。相遇时慢指针走了 a+b,快指针走了 a+b+kL,而快是慢的两倍,所以 2(a+b) = a+b+kL,得 a = kL - b = (k-1)L + (L-b)。也就是说:**从头走 a 步,和从相遇点走 L-b 步,会同时到达入口**。所以一个指针回 head,两个同速走,再相遇就是入口。

> [!interview] 高频追问:为什么快指针走两步,不走三步?
> 走两步一定能追上:慢指针进环后,快指针每轮追一步,环长有限,最多 L 轮必相遇。走三步不一定:步长差为 2 时,如果环长是偶数,可能每轮都“跨过”慢指针,永远不相等。判环还有哈希表法(记录访问过的节点,O(n) 空间),但快慢指针 O(1) 空间,是标准答案。

## 栈:后进先出,专治“最近的未完成”

栈(Stack)只有两个动作:push 压入、pop 弹出,规则是 **LIFO(Last In First Out)**。生活里是一摞盘子,程序里是函数调用栈、浏览器后退、编辑器撤销。栈的迷人之处在于:**它天然记得“最近一个还没配对的家伙”**。

### 手撕:括号匹配

\`\`\`java BracketMatch.java
import java.util.ArrayDeque;
import java.util.Deque;

public class BracketMatch {
    public static boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();
        for (char c : s.toCharArray()) {
            if (c == '(') stack.push(')');
            else if (c == '[') stack.push(']');
            else if (c == '{') stack.push('}');
            else if (stack.isEmpty() || stack.pop() != c) return false;
        }
        return stack.isEmpty();
    }

    public static void main(String[] args) {
        String[] tests = {"()[]{}", "([)]", "{[]}", "(("};
        for (String t : tests) {
            System.out.println(t + " -> " + isValid(t));
        }
    }
}
\`\`\`

\`\`\`output
()[]{} -> true
([)] -> false
{[]} -> true
(( -> false
\`\`\`

**思路**:遇到左括号,把“它期待的右括号”压栈;遇到右括号,栈顶必须和它相同,否则不匹配;扫描结束栈必须为空。时间 O(n),空间 O(n)。这个“压期待值”的技巧比“压左括号再判断类型”少一层 if,也更不容易错。

### 单调栈:下一个更大元素

\`\`\`java NextGreater.java
import java.util.ArrayDeque;
import java.util.Arrays;
import java.util.Deque;

public class NextGreater {
    public static int[] nextGreater(int[] nums) {
        int n = nums.length;
        int[] res = new int[n];
        Arrays.fill(res, -1);
        Deque<Integer> stack = new ArrayDeque<>();   // 存下标,对应值单调不增
        for (int i = 0; i < n; i++) {
            while (!stack.isEmpty() && nums[i] > nums[stack.peek()]) {
                res[stack.pop()] = nums[i];          // 当前数是它的下一个更大值
            }
            stack.push(i);
        }
        return res;
    }

    public static void main(String[] args) {
        int[] nums = {2, 1, 2, 4, 3};
        System.out.println("原数组: " + Arrays.toString(nums));
        System.out.println("下一个更大: " + Arrays.toString(nextGreater(nums)));
    }
}
\`\`\`

\`\`\`output
原数组: [2, 1, 2, 4, 3]
下一个更大: [4, 2, 4, -1, -1]
\`\`\`

**思路**:维护一个“还没找到更大值”的下标栈,栈内对应的值从底到顶单调不增。新元素来时,把所有比它小的栈顶弹掉,这些元素的下一个更大值就是它;然后自己入栈。每个元素最多进栈一次、出栈一次,总时间 **O(n)**,不是 O(n²)。单调栈是“下一个更大/更小、接雨水、柱状图最大矩形”这一族的通用钥匙。

## 队列:先进先出,专治“按顺序排队”

队列(Queue)是 **FIFO(First In First Out)**:队尾入、队头出。BFS、任务调度、消息队列、线程池都在用它。用普通数组实现队列有个尴尬:队头出队后前面空出位置,后面却可能满了。**循环队列**用取模把数组“首尾相接”解决这个问题。

\`\`\`java CircularQueue.java
public class CircularQueue {
    private final int[] data;
    private int head = 0, tail = 0, size = 0;

    public CircularQueue(int capacity) {
        data = new int[capacity];
    }

    public boolean enQueue(int x) {
        if (size == data.length) return false;    // 队满
        data[tail] = x;
        tail = (tail + 1) % data.length;          // 取模绕回
        size++;
        return true;
    }

    public int deQueue() {
        if (size == 0) throw new IllegalStateException("queue is empty");
        int v = data[head];
        head = (head + 1) % data.length;
        size--;
        return v;
    }

    public void print() {
        for (int i = 0; i < size; i++) {
            System.out.print(data[(head + i) % data.length] + (i == size - 1 ? "" : " "));
        }
        System.out.println();
    }

    public static void main(String[] args) {
        CircularQueue q = new CircularQueue(3);
        System.out.println("入队 1/2/3: " + q.enQueue(1) + " " + q.enQueue(2) + " " + q.enQueue(3));
        System.out.println("入队 4(满): " + q.enQueue(4));
        System.out.println("出队: " + q.deQueue());
        System.out.println("再入队 4: " + q.enQueue(4));
        System.out.print("队列内容: ");
        q.print();
        System.out.println("出队: " + q.deQueue() + " " + q.deQueue() + " " + q.deQueue());
        try {
            q.deQueue();
        } catch (IllegalStateException e) {
            System.out.println("空队列再出队: " + e.getMessage());
        }
    }
}
\`\`\`

\`\`\`output
入队 1/2/3: true true true
入队 4(满): false
出队: 1
再入队 4: true
队列内容: 2 3 4
出队: 2 3 4
空队列再出队: queue is empty
\`\`\`

关键设计是**用 size 区分队空和队满**,而不是留一个空位或靠 head 与 tail 相同来判断 —— 后者在“满”和“空”时条件相同,是循环队列最经典的坑。Java 里直接用 ==ArrayDeque== 即可,它底层是环形数组,比 ==LinkedList== 实现的 Queue 更快。

**双端队列(Deque)** 两端都能进出,==offerFirst / offerLast / pollFirst / pollLast== 四个方法就是它的全部;ArrayDeque 同时实现了 Deque,所以既能当栈也能当队列。**优先队列(PriorityQueue)** 不看入队顺序,每次出队的是优先级最高(或最低)的元素,底层是二叉堆 —— 它属于下一章的“树”,这里先记住结论:**普通排队用 Queue,按优先级出队用 PriorityQueue**。

### 手撕:用两个栈实现队列

\`\`\`java TwoStackQueue.java
import java.util.ArrayDeque;
import java.util.Deque;

public class TwoStackQueue {
    private final Deque<Integer> in = new ArrayDeque<>();    // 只负责入队
    private final Deque<Integer> out = new ArrayDeque<>();   // 只负责出队

    public void offer(int x) {
        in.push(x);
    }

    public int poll() {
        if (out.isEmpty()) {
            while (!in.isEmpty()) {
                out.push(in.pop());      // 顺序反转回正
            }
        }
        if (out.isEmpty()) throw new IllegalStateException("queue is empty");
        return out.pop();
    }

    public static void main(String[] args) {
        TwoStackQueue q = new TwoStackQueue();
        q.offer(1);
        q.offer(2);
        q.offer(3);
        System.out.println("poll: " + q.poll());
        q.offer(4);
        System.out.println("poll: " + q.poll() + " " + q.poll() + " " + q.poll());
    }
}
\`\`\`

\`\`\`output
poll: 1
poll: 2 3 4
\`\`\`

**为什么对**:push 到 in 的顺序是 1、2、3,全部倒入 out 后栈顶是 1,正好先出;之后 out 里还有 2、3,新来的 4 进入 in,必须等 out 空了再倒,否则顺序会乱。每个元素最多被搬运一次,**均摊 O(1)**,最坏单次 O(n),空间 O(n)。

> [!warn] 循环队列的“假满”
> 如果只靠 **head 与 tail 相同** 判空判满,队满和队空的条件完全一样,程序无法区分。三种正解:① 额外维护 size(本章写法);② 浪费一个槽位,**(tail + 1) % cap 等于 head** 为满;③ 维护一个 flag 标记最后一次是入队还是出队。面试写第一种最稳。

## 四种线性结构一张表

| 结构 | 规则 | 核心操作 | 典型场景 | Java 首选 |
| --- | --- | --- | --- | --- |
| 数组 | 连续、下标访问 | 随机读 O(1),中间增删 O(n) | 查多改少、需要缓存友好 | int[] / ArrayList |
| 链表 | 指针串联 | 已知位置增删 O(1),查找 O(n) | LRU、频繁头尾增删 | LinkedList(实际少用) |
| 栈 | LIFO | push / pop / peek | 括号、表达式、DFS、撤销 | ArrayDeque |
| 队列 | FIFO | offer / poll / peek | BFS、任务调度、缓冲 | ArrayDeque |

## 本章小结

- **数组赢在地址可计算**,链表赢在改指针;两者的选择本质是“读多还是改多”。
- **反转链表**记住三指针顺序:存 next → 改指向 → 双指针前移;递归版注意尾节点指向 null。
- **快慢指针**判环 O(1) 空间,相遇后一个回 head 同速走即入口。
- **栈记“最近未完成”,队列记“先来先服务”**;单调栈把 O(n²) 的“找下一个更大”压成 O(n)。
- **循环队列用 size 或空槽区分空满**,两个栈实现队列只在 out 为空时搬运。

## 面试速记

- 反转链表:迭代 O(n)/O(1),递归 O(n)/O(n);循环条件是 cur != null。
- 判环:slow 一步、fast 两步;相遇后 slow 回 head 同速走,再遇即入口。
- 括号匹配:压“期待的右括号”,扫描完栈必须为空。
- 下一个更大:单调栈存下标,每个元素进出各一次,总 O(n)。
- 循环队列判满条件为 (tail + 1) % cap 等于 head,或维护 size;两个栈实现队列只在 out 为空时搬运,均摊 O(1)。
`
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch03',
        title: '哈希与树:从 O(1) 到 O(log n)',
        minutes: 55,
        points: ['哈希冲突', 'HashMap 结构', '二叉树遍历', '红黑树与堆'],
        content: `
> [!info] 本章导读 · HashMap 为什么能做到 O(1)?树又为什么是 O(log n)?
> 哈希表用“算地址”代替“找位置”,所以平均 O(1);树用“每次砍掉一半”缩小范围,所以 O(log n)。两者看似无关,其实都在回答同一个问题:**怎样用最少的比较定位一个元素**。本章从哈希函数讲到冲突处理,从二叉树遍历讲到红黑树与堆,把 Java 里最常用的几个结构一次打通。
> - 读完本章你将能:说清 HashMap 的数组 + 链表 + 红黑树到底怎么工作
> - 手写前中后序与层序遍历,递归和迭代都能写
> - 讲清 BST 删除的三种情况与退化问题
> - 用堆解决堆排序与 TopK,知道 PriorityQueue 怎么用

> [!tip] 日常电脑现场 · 通讯录首字母直达
> 手机通讯录右侧那排字母,点一下 B 就跳到姓"白"的联系人,不用从头翻;而文件管理器里一层层文件夹展开,是另一种定位方式。前者靠算地址,后者靠逐级比较,本章讲的就是这两条路的分岔。

## 哈希表:用“算”代替“找”

哈希表(Hash Table)的核心思想只有一句话:**把 key 交给哈希函数,直接算出它该待的桶(bucket)下标**,然后去那个桶里取。数组按下标访问是 O(1),哈希表把“按 key 访问”也变成了“按下标访问”。

\`\`\`text
key = "apple"
hash("apple") = 2031744
2031744 % 16 = 0        → 放进 buckets[0]
\`\`\`

理想情况下每个 key 一个桶,查找 O(1)。但桶的数量有限,不同的 key 算到同一个下标是必然的 —— 这叫**哈希冲突(Collision)**。鸽巢原理摆在那:输入无限,桶有限,冲突不可能消除,只能处理。

| 维度 | 链地址法(Chaining) | 开放寻址法(Open Addressing) |
| --- | --- | --- |
| 冲突怎么处理 | 同一桶挂链表,Java 8 起过长转红黑树 | 按探测序列找下一个空槽 |
| 删除 | 直接摘链,干净 | 不能直接删,要留“墓碑”标记 |
| 负载因子 | 可以超过 1 | 必须小于 1,通常 0.5~0.7 |
| 缓存友好度 | 指针跳转,较差 | 连续探测,较好 |
| 聚集问题 | 无 | 线性探测会产生“一次聚集” |
| 代表实现 | Java HashMap | Java ThreadLocalMap、Python dict |

开放寻址有三种常见探测:==线性探测==(i+1, i+2, … 简单但容易扎堆)、==二次探测==(i+1², i+2², … 跳跃式但可能探不到)、==双重哈希==(再用一个哈希函数算步长,分布最均匀)。链地址法实现简单、容忍高负载,是工程主流。

### 负载因子与扩容

**负载因子(Load Factor)= 元素个数 / 桶数量**。它衡量“表有多满”:太低浪费空间,太高冲突激增、查询退化。Java HashMap 默认 **0.75**,容量按 **2 倍**扩容。为什么是 0.75?官方注释给了泊松分布推算:负载 0.75 时,一个桶里放 8 个元素的概率约为 0.00000006 —— 既不会频繁扩容,又让树化几乎不发生。这是空间与时间的折中,不是拍脑袋。

\`\`\`java ChainedHashTable.java
public class ChainedHashTable {
    private static class Node {
        int key, value;
        Node next;
        Node(int key, int value, Node next) {
            this.key = key;
            this.value = value;
            this.next = next;
        }
    }

    private Node[] buckets;
    private int size;
    private static final double LOAD_FACTOR = 0.75;

    public ChainedHashTable(int capacity) {
        buckets = new Node[capacity];
    }

    public void put(int key, int value) {
        int idx = hash(key);
        for (Node p = buckets[idx]; p != null; p = p.next) {
            if (p.key == key) {           // key 已存在,覆盖
                p.value = value;
                return;
            }
        }
        buckets[idx] = new Node(key, value, buckets[idx]);   // 头插
        size++;
        if (size > buckets.length * LOAD_FACTOR) resize();
    }

    public int get(int key) {
        for (Node p = buckets[hash(key)]; p != null; p = p.next) {
            if (p.key == key) return p.value;
        }
        return -1;
    }

    private int hash(int key) {
        return (key ^ (key >>> 16)) & (buckets.length - 1);   // 扰动 + 取模
    }

    private void resize() {
        Node[] old = buckets;
        buckets = new Node[old.length << 1];                  // 容量翻倍
        size = 0;
        for (Node head : old) {
            for (Node p = head; p != null; ) {
                Node next = p.next;
                p.next = null;
                put(p.key, p.value);                          // 重新散列
                p = next;
            }
        }
    }

    private void print() {
        for (int i = 0; i < buckets.length; i++) {
            if (buckets[i] == null) continue;
            System.out.print("buckets[" + i + "]: ");
            for (Node p = buckets[i]; p != null; p = p.next) {
                System.out.print(p.key + (p.next == null ? "" : " -> "));
            }
            System.out.println();
        }
    }

    public static void main(String[] args) {
        ChainedHashTable t = new ChainedHashTable(4);    // 故意用小容量制造冲突
        t.put(1, 100);
        t.put(5, 500);
        t.put(9, 900);
        System.out.println("容量 4, 依次 put 1, 5, 9");
        t.print();
        System.out.println("get(5) = " + t.get(5));

        t.put(13, 1300);                                 // 第 4 个,触发扩容
        System.out.println("put(13) 后触发扩容, size=" + t.size + ", capacity=" + t.buckets.length);
        t.print();
    }
}
\`\`\`

\`\`\`output
容量 4, 依次 put 1, 5, 9
buckets[1]: 9 -> 5 -> 1
get(5) = 500
put(13) 后触发扩容, size=4, capacity=8
buckets[1]: 1 -> 9
buckets[5]: 5 -> 13
\`\`\`

1、5、9 对 4 取模都等于 1,于是形成一条链;扩容到 8 后,1 和 9 仍落在 1 号桶,5 和 13 落在 5 号桶,链变短了。**扩容的本质是重新散列**:桶多了,冲突概率下降,但扩容本身要遍历所有元素,单次 O(n)。所以能预估大小时,直接 ==new HashMap<>(capacity)== 最省事。

> [!pitfall] HashMap 的三个源码级结论
> ① 下标不是 ==hash % n==,而是 ==(n - 1) & hash== —— 容量必须是 2 的幂,位运算才等价于取模,且更快;② key 的 hashCode 会先做扰动 ==h ^ (h >>> 16)==,把高 16 位混进低位,减少低位相同的冲突;③ JDK 8 起,链表长度 ≥ **8** 且容量 ≥ **64** 才树化,否则先扩容;红黑树节点数降到 **6** 退化为链表。这三个数字是面试的“源码分”。

> [!tip] 为什么 HashMap 用红黑树而不是链表到底
> 链表查询 O(n),恶意构造大量同桶 key 时(哈希碰撞攻击)能把 HashMap 打成 O(n²)。树化后单桶查询 O(log n),这是**防御性设计**,不是日常路径。正常负载下桶里平均不到 1 个元素,链表足够,树化极少发生 —— 这也是 0.75 负载因子的意义。

## 二叉树:遍历是万物之基

二叉树(Binary Tree)每个节点最多两个子节点。几个必须分清的概念:

- **深度(Depth)**:从根往下数,根深度为 0(有的教材从 1 开始,答题时说清);
- **高度(Height)**:从叶子往上数,空树高度 0,叶子高度 1;
- **满二叉树**:每层都满;**完全二叉树**:除最后一层外都满,最后一层靠左连续。

遍历有四种:前序(根左右)、中序(左根右)、后序(左右根)、层序(逐层)。前序适合复制/打印结构,中序在 BST 上得到有序序列,后序适合释放树/算高度,层序就是 BFS。

\`\`\`text
        1
      /   \\
     2     3
    / \\   / \\
   4   5 6   7
\`\`\`

\`\`\`java TreeTraversal.java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;

public class TreeTraversal {
    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }

    static TreeNode build() {
        TreeNode n1 = new TreeNode(1), n2 = new TreeNode(2), n3 = new TreeNode(3);
        TreeNode n4 = new TreeNode(4), n5 = new TreeNode(5);
        TreeNode n6 = new TreeNode(6), n7 = new TreeNode(7);
        n1.left = n2; n1.right = n3;
        n2.left = n4; n2.right = n5;
        n3.left = n6; n3.right = n7;
        return n1;
    }

    static void pre(TreeNode root, List<Integer> out) {
        if (root == null) return;
        out.add(root.val);
        pre(root.left, out);
        pre(root.right, out);
    }

    static void in(TreeNode root, List<Integer> out) {
        if (root == null) return;
        in(root.left, out);
        out.add(root.val);
        in(root.right, out);
    }

    static void post(TreeNode root, List<Integer> out) {
        if (root == null) return;
        post(root.left, out);
        post(root.right, out);
        out.add(root.val);
    }

    static List<Integer> preIter(TreeNode root) {
        List<Integer> out = new ArrayList<>();
        if (root == null) return out;
        Deque<TreeNode> stack = new ArrayDeque<>();
        stack.push(root);
        while (!stack.isEmpty()) {
            TreeNode cur = stack.pop();
            out.add(cur.val);
            if (cur.right != null) stack.push(cur.right);   // 先压右,后压左
            if (cur.left != null) stack.push(cur.left);
        }
        return out;
    }

    static List<Integer> inIter(TreeNode root) {
        List<Integer> out = new ArrayList<>();
        Deque<TreeNode> stack = new ArrayDeque<>();
        TreeNode cur = root;
        while (cur != null || !stack.isEmpty()) {
            while (cur != null) {          // 一路向左
                stack.push(cur);
                cur = cur.left;
            }
            cur = stack.pop();
            out.add(cur.val);
            cur = cur.right;               // 转向右子树
        }
        return out;
    }

    static List<Integer> level(TreeNode root) {
        List<Integer> out = new ArrayList<>();
        if (root == null) return out;
        Queue<TreeNode> queue = new LinkedList<>();
        queue.offer(root);
        while (!queue.isEmpty()) {
            TreeNode cur = queue.poll();
            out.add(cur.val);
            if (cur.left != null) queue.offer(cur.left);
            if (cur.right != null) queue.offer(cur.right);
        }
        return out;
    }

    public static void main(String[] args) {
        TreeNode root = build();
        List<Integer> a = new ArrayList<>(), b = new ArrayList<>(), c = new ArrayList<>();
        pre(root, a);
        in(root, b);
        post(root, c);
        System.out.println("前序(递归): " + a);
        System.out.println("中序(递归): " + b);
        System.out.println("后序(递归): " + c);
        System.out.println("层序(BFS): " + level(root));
        System.out.println("前序(迭代): " + preIter(root));
        System.out.println("中序(迭代): " + inIter(root));
    }
}
\`\`\`

\`\`\`output
前序(递归): [1, 2, 4, 5, 3, 6, 7]
中序(递归): [4, 2, 5, 1, 6, 3, 7]
后序(递归): [4, 5, 2, 6, 7, 3, 1]
层序(BFS): [1, 2, 3, 4, 5, 6, 7]
前序(迭代): [1, 2, 4, 5, 3, 6, 7]
中序(迭代): [4, 2, 5, 1, 6, 3, 7]
\`\`\`

**迭代写法的记忆钩子**:前序用栈,“根先出、右先压左后压”保证左子树先处理;中序用栈模拟递归的“一路向左到底,弹出即访问,再转右”;后序最省事的是“根右左”前序再整体反转。层序用队列,弹出谁就把孩子入队。

> [!warn] 递归三问,写完必答
> ① **终止条件**是什么?(root 为 null)② **本层做什么**?(加入结果 / 交换 / 比较)③ **返回值怎么给上层**?(高度、新根、布尔)。三问答不清,递归一定写乱。二叉树的递归空间是 O(h),h 为树高;完全二叉树 O(log n),退化成链表 O(n)。

## 二叉搜索树:有序的艺术

二叉搜索树(BST, Binary Search Tree)加了一条规则:**左子树所有节点 < 根 < 右子树所有节点**。于是查找像二分:每次比较都能砍掉一半。中序遍历 BST,得到的序列天然递增。

| 操作 | 平均 | 最坏(退化成链) |
| --- | --- | --- |
| 查找 | O(log n) | O(n) |
| 插入 | O(log n) | O(n) |
| 删除 | O(log n) | O(n) |
| 中序遍历 | O(n) | O(n) |

删除是 BST 里唯一需要分情况的操作,共三种:

1. **叶子节点**:直接删,父节点对应指针置 null;
2. **只有一个孩子**:用孩子顶替自己;
3. **有两个孩子**:找**右子树的最小节点**(中序后继)或左子树最大节点,把值覆盖到当前节点,再去右子树删除那个后继 —— 后继最多只有一个右孩子,退化成情况 2。

\`\`\`java BstDemo.java
import java.util.ArrayList;
import java.util.List;

public class BstDemo {
    static class Node {
        int val;
        Node left, right;
        Node(int val) { this.val = val; }
    }

    static Node insert(Node root, int val) {
        if (root == null) return new Node(val);
        if (val < root.val) root.left = insert(root.left, val);
        else if (val > root.val) root.right = insert(root.right, val);
        return root;                     // 相等不重复插入
    }

    static Node search(Node root, int val) {
        while (root != null && root.val != val) {
            root = val < root.val ? root.left : root.right;
        }
        return root;
    }

    static Node delete(Node root, int val) {
        if (root == null) return null;
        if (val < root.val) {
            root.left = delete(root.left, val);
        } else if (val > root.val) {
            root.right = delete(root.right, val);
        } else {
            if (root.left == null) return root.right;        // 情况 1/2
            if (root.right == null) return root.left;        // 情况 2
            Node successor = root.right;                     // 情况 3:后继
            while (successor.left != null) successor = successor.left;
            root.val = successor.val;
            root.right = delete(root.right, successor.val);
        }
        return root;
    }

    static void inorder(Node root, List<Integer> out) {
        if (root == null) return;
        inorder(root.left, out);
        out.add(root.val);
        inorder(root.right, out);
    }

    static int height(Node root) {
        if (root == null) return 0;
        return 1 + Math.max(height(root.left), height(root.right));
    }

    public static void main(String[] args) {
        int[] vals = {50, 30, 70, 20, 40, 60, 80};
        Node root = null;
        for (int v : vals) root = insert(root, v);

        List<Integer> out = new ArrayList<>();
        inorder(root, out);
        System.out.println("初始中序: " + out + ", 高度=" + height(root));
        System.out.println("查找 40: " + (search(root, 40) != null));
        System.out.println("查找 45: " + (search(root, 45) != null));

        root = delete(root, 20);
        out.clear(); inorder(root, out);
        System.out.println("删除叶子 20: " + out);

        root = delete(root, 30);
        out.clear(); inorder(root, out);
        System.out.println("删除单孩子 30: " + out);

        root = delete(root, 50);
        out.clear(); inorder(root, out);
        System.out.println("删除双孩子 50: " + out);

        Node skew = null;
        for (int i = 1; i <= 7; i++) skew = insert(skew, i);
        System.out.println("有序插入 1..7 的高度: " + height(skew));
    }
}
\`\`\`

\`\`\`output
初始中序: [20, 30, 40, 50, 60, 70, 80], 高度=3
查找 40: true
查找 45: false
删除叶子 20: [30, 40, 50, 60, 70, 80]
删除单孩子 30: [40, 50, 60, 70, 80]
删除双孩子 50: [40, 60, 70, 80]
有序插入 1..7 的高度: 7
\`\`\`

最后一行暴露了 BST 的致命伤:**按 1、2、3… 有序插入,树退化成一根斜链**,高度 7,查找从 O(log n) 变成 O(n)。真实数据往往接近有序(自增 id、时间戳),所以工程里不会直接用裸 BST,而是用**平衡树**把高度压回 O(log n)。

\`\`\`demo:bst-visual
\`\`\`

上面的演示可以手动插入/删除节点,观察中序序列始终有序、以及不同插入顺序如何改变树形。自己多试几组:**同样的 7 个数,先插中间值得到矮树,先插最小值得到斜链** —— 这就是“平衡”二字的直观含义。

## 平衡树:AVL 与红黑树

**AVL 树**是最早的自平衡 BST:任何节点左右子树高度差(平衡因子)不超过 1。插入/删除后若失衡,通过四种旋转修复:**LL 右旋、RR 左旋、LR 先左后右、RL 先右后左**。AVL 查询极快,但插入删除可能一路旋转到根,写多场景成本高。

**红黑树(Red-Black Tree)** 放弃严格平衡,用颜色约束把最长路径控制在最短路径的 2 倍以内。五条性质必须背:

| 编号 | 性质 | 一句话理解 |
| --- | --- | --- |
| 1 | 每个节点非红即黑 | 颜色是平衡信息 |
| 2 | 根节点是黑色 | 入口统一 |
| 3 | 每个叶子节点(NIL)是黑色 | 空指针也算黑,黑高才定义完整 |
| 4 | 红节点的两个子节点必须是黑色 | 不能“红红相连” |
| 5 | 任一节点到其所有叶子的路径上黑节点数相同 | 黑高相等 |

由 4、5 可推出:最长路径(红黑交替)不超过最短路径(全黑)的 2 倍,树高 ≤ 2log₂(n+1),所有操作最坏 O(log n)。插入删除的修复最多 **3 次旋转**(AVL 可能 O(log n) 次),所以工程实现偏爱红黑树:TreeMap、TreeSet、HashMap 的树化桶、Linux 的 CFS 调度、epoll 就绪队列,用的都是它。

> [!interview] 为什么工程用红黑树,不用 AVL?
> 一句话:**红黑树用“近似平衡”换“更少的旋转”**。AVL 平衡因子严格 ≤1,查询略快,但插入删除经常连锁旋转;红黑树允许局部高度差,插入删除修复代价常数级,综合读写性能更稳。绝大多数业务是读写混合,所以选红黑树。面试若追问“红黑树查询比 AVL 慢多少”,答“同阶 O(log n),常数略大,差距远小于旋转带来的写入收益”。

## 堆:完全二叉树的数组魔法

堆(Heap)是一棵**完全二叉树**,并且满足堆序:大顶堆父 ≥ 子,小顶堆父 ≤ 子。因为它“完全”,可以直接用数组存,不需要指针:

\`\`\`text
下标 i 的节点:
  父节点    (i - 1) / 2
  左孩子    2 * i + 1
  右孩子    2 * i + 2
\`\`\`

\`\`\`diagram:d-tree-heap
\`\`\`

图上左边是树形,右边是同一个堆的数组表示:根在 0,孩子按层序排。因为完全二叉树没有空洞,数组空间零浪费,而且父子下标能用算式直接互推 —— 这就是堆比普通二叉树“快而省”的原因。

堆的两个核心动作:**上浮(sift up)** 用于插入,新元素放末尾,不断和父比较、比父优先就交换,直到合适;**下沉(sift down)** 用于删除堆顶,把末尾元素换到根,再和孩子中更优先的那个交换,直到合适。两者都是 O(log n)。建堆从最后一个非叶子 ==n/2 - 1== 倒序下沉,总代价 O(n),不是 O(n log n)。

\`\`\`java HeapDemo.java
import java.util.Arrays;
import java.util.PriorityQueue;

public class HeapDemo {
    static void siftDown(int[] a, int i, int size) {
        while (true) {
            int left = i * 2 + 1, right = left + 1, largest = i;
            if (left < size && a[left] > a[largest]) largest = left;
            if (right < size && a[right] > a[largest]) largest = right;
            if (largest == i) break;
            int t = a[i]; a[i] = a[largest]; a[largest] = t;
            i = largest;
        }
    }

    static void heapSort(int[] a) {
        int n = a.length;
        for (int i = n / 2 - 1; i >= 0; i--) siftDown(a, i, n);   // O(n) 建堆
        for (int end = n - 1; end > 0; end--) {
            int t = a[0]; a[0] = a[end]; a[end] = t;             // 堆顶换到末尾
            siftDown(a, 0, end);
        }
    }

    static int[] topK(int[] nums, int k) {
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();   // 小顶堆存最大的 k 个
        for (int x : nums) {
            minHeap.offer(x);
            if (minHeap.size() > k) minHeap.poll();               // 弹掉当前最小的
        }
        int[] res = new int[k];
        for (int i = 0; i < k; i++) res[i] = minHeap.poll();
        return res;
    }

    public static void main(String[] args) {
        int[] a = {4, 1, 7, 3, 9, 2, 8};
        heapSort(a);
        System.out.println("堆排结果: " + Arrays.toString(a));
        System.out.println("Top-3: " + Arrays.toString(topK(a, 3)));

        PriorityQueue<Integer> pq = new PriorityQueue<>((x, y) -> y - x);  // 大顶堆
        for (int x : a) pq.offer(x);
        System.out.println("大顶堆堆顶: " + pq.peek());
    }
}
\`\`\`

\`\`\`output
堆排结果: [1, 2, 3, 4, 7, 8, 9]
Top-3: [7, 8, 9]
大顶堆堆顶: 9
\`\`\`

堆排时间 O(n log n)、空间 O(1)、**不稳定**;虽然渐进复杂度和快排一样,但常数大、缓存不友好,工程里很少手写堆排,JDK 的 ==PriorityQueue== 才是日常。**TopK 是堆的招牌场景**:求最大 K 个,用容量 K 的**小顶堆**,新元素比堆顶大才替换,时间 O(n log K),空间 O(K);数据流场景无法全排序,只有堆能做到。

## 本章小结

- **哈希表把查找变成计算**,平均 O(1);冲突用链地址或开放寻址处理,负载因子决定扩容时机。
- **HashMap = 数组 + 链表 + 红黑树**,容量 2 的幂、下标位运算、链表 8 树化/6 退化。
- **二叉树四种遍历**是递归与栈/队列的练兵场;中序在 BST 上输出有序。
- **BST 删除分三种情况**,有序插入会退化成链;平衡树用旋转把高度压回 O(log n)。
- **红黑树五条性质**推出高度 ≤ 2log(n+1),工程上以更少旋转胜出。
- **堆是完全二叉树的数组化**,建堆 O(n)、插入删除 O(log n)、堆排 O(n log n)、TopK O(n log K)。

## 面试速记

- 哈希冲突:链地址、开放寻址、再哈希;HashMap 用链地址 + 红黑树,负载因子 0.75,树化 8/退化 6/最小容量 64。
- 遍历:前序根左右、中序左根右、后序左右根、层序队列;递归空间 O(h)。
- BST 删除:叶子直删、单孩子顶替、双孩子用中序后继覆盖再删后继。
- 红黑树:非红即黑、根黑、NIL 黑、红子必黑、黑高相等;高度 ≤ 2log(n+1)。
- 堆:父 (i-1)/2,子 2i+1/2i+2;建堆 O(n);TopK 用容量 K 的反向堆。
`
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch04',
        title: '图与高级结构',
        minutes: 55,
        points: ['BFS/DFS', '拓扑排序', 'Dijkstra', '并查集'],
        content: `
> [!info] 本章导读 · 地图导航的最短路径,是怎么算出来的?
> 打开导航,输入起点终点,0.1 秒后给出“少 3 分钟”的路线。背后是图(Graph):路口是顶点,道路是带权边,算法在几百万个顶点上找一条最短路径。本章从图的两种存法讲起,依次拿下 BFS/DFS、拓扑排序、Dijkstra、并查集 —— 这四件套覆盖了面试图论的 90%。
> - 读完本章你将能:根据图的稀疏程度选邻接矩阵或邻接表
> - 手写 BFS/DFS 并统计连通分量
> - 用拓扑排序判断依赖是否成环
> - 说清 Dijkstra 为什么不能处理负权边
> - 用并查集解决连通性问题

> [!tip] 日常电脑现场 · 导航为什么不绕远
> 在导航 App 输入公司地址,它给出的既不是直线最短,也不是路况最好,而是"此刻耗时最少"的那条;地铁换乘图上数几站、在哪站换乘,其实就是在一张图上找路径。你每天都在无意识地跑图算法。

## 图的表示:矩阵还是邻接表

图由**顶点(Vertex)**和**边(Edge)**组成。边有方向叫有向图,带数值叫带权图。存图只有两种主流方式:

| 维度 | 邻接矩阵 | 邻接表 |
| --- | --- | --- |
| 空间 | O(V²),存 V×V 数组 | O(V + E),每个顶点挂邻居列表 |
| 判断 u-v 是否有边 | O(1),查 matrix[u][v] | O(degree(u)),遍历邻居 |
| 遍历某点的所有邻居 | O(V),整行扫一遍 | O(degree(u)),只扫真实邻居 |
| 适用场景 | 稠密图、需要频繁判边 | 稀疏图、遍历为主(绝大多数业务) |
| Java 实现 | int[][] / boolean[][] | List<List<Integer>> |

现实中的图几乎都是稀疏图:100 万个路口,每个路口平均连 4 条路,邻接矩阵要 10¹² 个格子,邻接表只要 400 万条边。所以**默认选邻接表**,只有 Floyd 多源最短路、或者顶点很少且边极密时才用矩阵。

\`\`\`text
无向图:0-1, 0-2, 1-3, 2-4, 3-4, 4-5, 6 孤立
邻接表:
0 -> [1, 2]
1 -> [0, 3]
2 -> [0, 4]
3 -> [1, 4]
4 -> [2, 3, 5]
5 -> [4]
6 -> []
\`\`\`

## BFS 与 DFS:两种“走遍全场”的方式

- **BFS(广度优先搜索)**:用队列,先访问距离为 1 的所有点,再访问距离为 2 的。**无权图上第一次到达某点就是最短路径**。
- **DFS(深度优先搜索)**:用栈或递归,一条路走到黑,走不通再回溯。适合枚举路径、判环、拓扑排序、连通块。

两者时间复杂度都是 **O(V + E)**(邻接表),空间 BFS 是 O(宽度),DFS 是 O(深度)。

\`\`\`java GraphTraverse.java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

public class GraphTraverse {
    static List<List<Integer>> buildGraph(int n, int[][] edges) {
        List<List<Integer>> g = new ArrayList<>();
        for (int i = 0; i < n; i++) g.add(new ArrayList<>());
        for (int[] e : edges) {
            g.get(e[0]).add(e[1]);
            g.get(e[1]).add(e[0]);          // 无向图,双向加边
        }
        return g;
    }

    static void bfs(List<List<Integer>> g, int start, boolean[] visited, List<Integer> order) {
        Deque<Integer> queue = new ArrayDeque<>();
        queue.offer(start);
        visited[start] = true;              // 入队即标记,防止重复入队
        while (!queue.isEmpty()) {
            int u = queue.poll();
            order.add(u);
            for (int v : g.get(u)) {
                if (!visited[v]) {
                    visited[v] = true;
                    queue.offer(v);
                }
            }
        }
    }

    static void dfs(List<List<Integer>> g, int u, boolean[] visited, List<Integer> order) {
        visited[u] = true;
        order.add(u);
        for (int v : g.get(u)) {
            if (!visited[v]) dfs(g, v, visited, order);
        }
    }

    public static void main(String[] args) {
        int[][] edges = {{0,1},{0,2},{1,3},{2,4},{3,4},{4,5}};
        List<List<Integer>> g = buildGraph(7, edges);   // 6 是孤立点

        List<Integer> bfsOrder = new ArrayList<>();
        bfs(g, 0, new boolean[7], bfsOrder);
        List<Integer> dfsOrder = new ArrayList<>();
        dfs(g, 0, new boolean[7], dfsOrder);
        System.out.println("BFS: " + bfsOrder);
        System.out.println("DFS: " + dfsOrder);

        boolean[] visited = new boolean[7];
        int components = 0;
        for (int i = 0; i < 7; i++) {
            if (!visited[i]) {
                components++;
                dfs(g, i, visited, new ArrayList<>());
            }
        }
        System.out.println("连通分量: " + components);
    }
}
\`\`\`

\`\`\`output
BFS: [0, 1, 2, 3, 4, 5]
DFS: [0, 1, 3, 4, 2, 5]
连通分量: 2
\`\`\`

BFS 的顺序是“按层”:0 → 1、2 → 3、4 → 5;DFS 一头扎进 0-1-3-4,在 4 发现 2 没访问,绕回去,再去 5。**连通分量**就是外层再套一个循环:每个没访问过的点启动一次遍历,启动次数就是分量数。6 号点孤立,所以是 2。

> [!pitfall] visited 标记的时机,决定 BFS 对不对
> BFS 必须在**入队时**标记 visited,不能等出队才标记。否则同一个点可能被多个邻居重复入队,队列膨胀、顺序错乱,复杂度退化。DFS 则在**进入递归时**标记。另一个坑:无向图建边要加两次,有向图只加一次,写错会导致遍历结果少一半。

## 拓扑排序:给依赖排个序

拓扑排序(Topological Sort)把有向无环图(DAG)排成线性序列,保证**每条边 u→v 中 u 都排在 v 前面**。典型场景:课程先修关系、Maven 依赖、任务调度、编译顺序。

**Kahn 算法**最好写:统计每个点的入度,入度为 0 的入队;不断弹出队头加入结果,并把它的邻居入度减 1,减到 0 就入队。最后如果结果数量小于顶点数,说明**有环**。

\`\`\`java TopoSort.java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

public class TopoSort {
    static List<Integer> topo(int n, int[][] prerequisites) {
        List<List<Integer>> g = new ArrayList<>();
        int[] indegree = new int[n];
        for (int i = 0; i < n; i++) g.add(new ArrayList<>());
        for (int[] p : prerequisites) {     // p[0] 依赖 p[1]:p[1] -> p[0]
            g.get(p[1]).add(p[0]);
            indegree[p[0]]++;
        }

        Deque<Integer> queue = new ArrayDeque<>();
        for (int i = 0; i < n; i++) {
            if (indegree[i] == 0) queue.offer(i);
        }

        List<Integer> order = new ArrayList<>();
        while (!queue.isEmpty()) {
            int u = queue.poll();
            order.add(u);
            for (int v : g.get(u)) {
                if (--indegree[v] == 0) queue.offer(v);
            }
        }
        return order.size() == n ? order : List.of();   // 空列表表示有环
    }

    public static void main(String[] args) {
        int[][] deps = {{1,0},{2,1},{3,2},{4,3},{5,4}};
        System.out.println("学习顺序: " + topo(6, deps));

        int[][] cycle = {{0,1},{1,2},{2,0}};
        System.out.println("有环课程表: " + topo(3, cycle) + "(空表示无法完成)");
    }
}
\`\`\`

\`\`\`output
学习顺序: [0, 1, 2, 3, 4, 5]
有环课程表: [](空表示无法完成)
\`\`\`

拓扑排序的结果**不唯一**:同时有多个入度为 0 的点时,谁先出队都可以。如果需要按字典序输出,把队列换成优先队列即可。判环还有 DFS 三色法:白色未访问、灰色在栈中、黑色已完成,遇到灰色节点就说明有环。

> [!interview] 高频追问:拓扑排序和 DFS 有什么关系?
> DFS 的后序结果**反转**就是一个合法拓扑序:因为一个点出栈时,它所有后继都已完成,反转后后继排在它后面。Kahn 是“正向剥入度 0 的点”,DFS 是“逆向收后序”,两者都对。面试写 Kahn 更稳(不用递归、判环直观),但要知道 DFS 版本,以及“拓扑序不唯一”这个结论。

## 最短路径:Dijkstra 的贪心

Dijkstra 解决**单源、非负权**最短路:从源点出发,每次选“当前距离最小且未确定”的点,锁定它的最短距离,再用它松弛(relax)所有邻居:**dist[v] = min(dist[v], dist[u] + w)**。贪心的正确性来自:所有边非负,所以当前最小的 dist 不可能再被别的路径变小。

\`\`\`java Dijkstra.java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.PriorityQueue;

public class Dijkstra {
    static class Edge {
        int to, w;
        Edge(int to, int w) { this.to = to; this.w = w; }
    }

    static class State implements Comparable<State> {
        int dist, node;
        State(int dist, int node) { this.dist = dist; this.node = node; }
        @Override public int compareTo(State o) { return Integer.compare(dist, o.dist); }
    }

    public static void main(String[] args) {
        int n = 5;
        List<List<Edge>> g = new ArrayList<>();
        for (int i = 0; i < n; i++) g.add(new ArrayList<>());
        int[][] edges = {{0,1,4},{0,2,1},{2,1,2},{1,3,1},{2,3,5},{3,4,3}};
        for (int[] e : edges) {
            g.get(e[0]).add(new Edge(e[1], e[2]));
            g.get(e[1]).add(new Edge(e[0], e[2]));   // 无向带权
        }

        int[] dist = new int[n];
        int[] prev = new int[n];
        Arrays.fill(dist, Integer.MAX_VALUE);
        Arrays.fill(prev, -1);
        dist[0] = 0;

        PriorityQueue<State> pq = new PriorityQueue<>();
        pq.offer(new State(0, 0));
        boolean[] done = new boolean[n];

        while (!pq.isEmpty()) {
            State s = pq.poll();
            if (done[s.node]) continue;              // 过期状态,跳过
            done[s.node] = true;
            for (Edge e : g.get(s.node)) {
                if (dist[e.to] > dist[s.node] + e.w) {
                    dist[e.to] = dist[s.node] + e.w;
                    prev[e.to] = s.node;
                    pq.offer(new State(dist[e.to], e.to));
                }
            }
        }

        System.out.println("dist = " + Arrays.toString(dist));
        StringBuilder path = new StringBuilder();
        for (int cur = 4; cur != -1; cur = prev[cur]) {
            path.insert(0, cur);
            if (prev[cur] != -1) path.insert(0, " -> ");
        }
        System.out.println("0 到 4 的最短路径: " + path + " (长度 " + dist[4] + ")");
    }
}
\`\`\`

\`\`\`output
dist = [0, 3, 1, 4, 7]
0 到 4 的最短路径: 0 -> 2 -> 1 -> 3 -> 4 (长度 7)
\`\`\`

注意 0→1 的直连边权是 4,但 0→2→1 只要 1+2=3,所以 dist[1]=3。Dijkstra 用优先队列每次取最小,松弛成功后压入新状态;出队时若该点已确定(done)就跳过,这是“懒删除”写法。邻接表 + 堆的时间复杂度 **O((V+E) log V)**。

> [!danger] 负权边会让 Dijkstra 直接失效
> Dijkstra 的前提是“已锁定的点不会再被更短的路径更新”。负权边打破了这个前提:一个点出堆时 dist=5,后面可能从另一条负权路径得到 dist=2,但它的最短距离已经被“锁定”并拿去松弛别人了,结果错误且无法回滚。**负权边用 Bellman-Ford**:对所有边做 V-1 轮松弛,O(VE),还能在第 V 轮检测负环。队列优化的 SPFA 是它的常见变体,但最坏仍是 O(VE)。

| 算法 | 适用 | 复杂度 | 负权边 |
| --- | --- | --- | --- |
| Dijkstra | 单源、非负权 | O((V+E) log V) | 不支持 |
| Bellman-Ford | 单源、可负权、判负环 | O(VE) | 支持 |
| Floyd-Warshall | 多源最短路 | O(V³) | 支持(不能有负环) |

## 并查集:只关心“是不是一伙的”

并查集(Union-Find / Disjoint Set)维护一堆不相交的集合,只支持两个操作:**find(x)** 找 x 的根(代表元),**union(a, b)** 把两个集合合并。判断两个元素是否连通,只需比较根是否相同。

两个优化让它的均摊复杂度降到 **O(α(n))**,α 是反阿克曼函数,增长极慢,实际可视为常数:

- **路径压缩(Path Compression)**:find 时把路径上所有节点直接挂到根上,下次一步到位;
- **按秩合并(Union by Rank)**:小树挂到大树下面,避免树越来越高。

\`\`\`java UnionFind.java
public class UnionFind {
    private final int[] parent;
    private final int[] rank;
    private int count;

    public UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        count = n;
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    public int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]);     // 路径压缩
        }
        return parent[x];
    }

    public boolean union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;          // 已连通
        if (rank[ra] < rank[rb]) {           // 按秩合并:小树挂大树
            int t = ra; ra = rb; rb = t;
        }
        parent[rb] = ra;
        if (rank[ra] == rank[rb]) rank[ra]++;
        count--;
        return true;
    }

    public boolean connected(int a, int b) {
        return find(a) == find(b);
    }

    public int count() {
        return count;
    }

    public static void main(String[] args) {
        UnionFind uf = new UnionFind(6);
        uf.union(0, 1);
        uf.union(1, 2);
        uf.union(4, 5);
        System.out.println("合并 (0,1) (1,2) (4,5)");
        System.out.println("find(2) = " + uf.find(2) + ", find(3) = " + uf.find(3));
        System.out.println("0 和 2 连通: " + uf.connected(0, 2));
        System.out.println("0 和 3 连通: " + uf.connected(0, 3));
        System.out.println("连通分量个数: " + uf.count());
    }
}
\`\`\`

\`\`\`output
合并 (0,1) (1,2) (4,5)
find(2) = 0, find(3) = 3
0 和 2 连通: true
0 和 3 连通: false
连通分量个数: 3
\`\`\`

并查集的经典应用:**朋友圈**(谁和谁间接认识)、**岛屿数量**(把相邻陆地 union,最后数根)、**Kruskal 最小生成树**(边按权排序,不连通的才 union)、**账户合并**。它不支持“拆分集合”,也不关心中间路径 —— 只要最终连通性,就用它。

> [!tip] 并查集写对的两个细节
> ① ==find== 必须带路径压缩,否则链式合并会退化到 O(n);② union 前必须先 ==find== 到根再比较,直接比较 parent[a] 是错的。初始化时每个元素自成一个集合,**count = n**;每成功合并一次 count 减一,最后 count 就是连通分量数。

## 跳表、线段树、前缀树:三个“知道去哪查”的结构

| 结构 | 核心思想 | 复杂度 | 典型场景 |
| --- | --- | --- | --- |
| 跳表 Skip List | 多层索引链表,上层跳跃、下层精细 | 平均 O(log n) | Redis 有序集合 ZSet、LevelDB MemTable |
| 线段树 Segment Tree | 区间二分,节点存区间聚合值 | 建 O(n)、查询/更新 O(log n) | 区间求和/最值、动态统计 |
| 前缀树 Trie | 按字符逐层分叉,共享公共前缀 | 插入/查询 O(L) | 搜索联想、IP 路由、敏感词过滤 |

它们共同的思想是**用额外的结构换取查找效率**:跳表用“多级索引”换链表只能顺序走的缺陷;线段树把区间拆成 O(log n) 个节点;Trie 把字符串的公共前缀只存一次。面试问到“Redis ZSet 为什么用跳表不用红黑树”,答三点:实现简单、范围查询天然有序、并发下锁粒度更细(红黑树旋转会锁一大片)。

## 本章小结

- **图默认用邻接表**,O(V+E) 空间;稠密图或频繁判边才用邻接矩阵。
- **BFS 用队列求无权最短路,DFS 用栈/递归求连通块与路径**;visited 标记时机决定正确性。
- **拓扑排序 Kahn**:入度 0 入队,剥完还有剩即有环;结果不唯一。
- **Dijkstra 贪心 + 优先队列**,O((V+E)log V),负权边失效;负权用 Bellman-Ford。
- **并查集**路径压缩 + 按秩合并,近似 O(1),专治连通性。
- **跳表、线段树、Trie** 各自用索引/分治/前缀共享换取查询效率。

## 面试速记

- 邻接矩阵 O(V²) 判边 O(1);邻接表 O(V+E) 遍历邻居 O(degree)。
- BFS 入队即标记;DFS 进入递归即标记;两者都是 O(V+E)。
- 拓扑排序:入度 0 入队 → 弹队头 → 邻居入度减一 → 统计数量判环。
- Dijkstra 每次取最小 dist 锁定并松弛;负权边会破坏“锁定不再变小”的前提。
- 并查集 find 路径压缩、union 按秩,count 初始 n;跳表用于 Redis ZSet,线段树做区间聚合,Trie 做前缀查询。
`
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch05',
        title: '算法思想与高频题',
        minutes: 55,
        points: ['分治与归并', '排序全景', '二分边界', '动态规划'],
        content: `
> [!info] 本章导读 · 动态规划到底怎么想到的?
> 因为 DP 不是“想”出来的,是**定义出来的**:先把“第 i 步的答案是什么”写成一个状态,再找“第 i 步从哪几步来”,最后补上初始值。本章把递归分治、排序、二分、滑动窗口、动态规划、贪心、回溯七种思想各配一道可运行代码,重点不是背题,而是掌握“看到题 → 判断用哪种思想 → 写出模板”的反应链。
> - 读完本章你将能:手写归并/快排,说清稳定性和复杂度
> - 写出二分的三种模板,不再死循环或漏边界
> - 用滑动窗口解决“最长/最短子串”一族
> - 按“状态 → 转移 → 初始化 → 顺序”四步写出爬楼梯、LIS
> - 用贪心与回溯各解决一道经典题

> [!tip] 日常电脑现场 · 查字典只翻三下
> 新华字典几千页,你查一个字从不从头翻,而是先估个大概位置再左右逼近;Excel 里点一下"按金额排序",几十万行几秒就排好;手机相册按时间倒序,最新的总在最上面。这些动作背后各是一种算法思想,本章把它们逐个拆开。

## 递归与分治:把大问题切成小问题

递归(Recursion)写对只需回答三个问题,称为**递归三要素**:

1. **终止条件**:什么时候不用再递归?比如 \`lo >= hi\`、\`root == null\`、\`n <= 2\`;
2. **本层做什么**:当前这一层要完成的最小动作;
3. **怎么缩小规模并相信递归**:把参数改成更小的子问题,并假设它返回正确结果。

**分治(Divide and Conquer)** 是递归的战术:把问题分成若干规模更小的子问题,分别求解,再合并。归并排序就是标准三段式:分(从中间切开)→ 治(递归排左右)→ 合(合并两个有序数组)。

\`\`\`java MergeSort.java
import java.util.Arrays;

public class MergeSort {
    static void sort(int[] a, int lo, int hi) {
        if (lo >= hi) return;                 // 终止:区间只剩 0/1 个元素
        int mid = lo + (hi - lo) / 2;
        sort(a, lo, mid);                     // 分
        sort(a, mid + 1, hi);
        merge(a, lo, mid, hi);                // 合
    }

    static void merge(int[] a, int lo, int mid, int hi) {
        int[] tmp = new int[hi - lo + 1];
        int i = lo, j = mid + 1, k = 0;
        while (i <= mid && j <= hi) {
            tmp[k++] = a[i] <= a[j] ? a[i++] : a[j++];   // <= 保证稳定
        }
        while (i <= mid) tmp[k++] = a[i++];
        while (j <= hi) tmp[k++] = a[j++];
        System.arraycopy(tmp, 0, a, lo, tmp.length);
    }

    public static void main(String[] args) {
        int[] a = {5, 2, 9, 1, 7, 3, 8, 4};
        System.out.println("排序前: " + Arrays.toString(a));
        sort(a, 0, a.length - 1);
        System.out.println("排序后: " + Arrays.toString(a));
    }
}
\`\`\`

\`\`\`output
排序前: [5, 2, 9, 1, 7, 3, 8, 4]
排序后: [1, 2, 3, 4, 5, 7, 8, 9]
\`\`\`

归并的递推式是 **T(n) = 2T(n/2) + O(n)**,展开得 O(n log n);合并需要额外 tmp 数组,空间 O(n)。它的价值在于**稳定**和**可预测**:不管输入长什么样,永远 O(n log n),所以 Java 对象排序(TimSort)和链表排序都用它。

> [!warn] 递归的两个工程风险
> ① **栈溢出**:递归深度过大(比如 10 万层)会抛 StackOverflowError,深图遍历要改显式栈或 BFS;② **重复计算**:朴素递归求斐波那契是 O(2ⁿ),必须加记忆化或改递推。写递归前先估深度,写完后想一遍“同一个子问题会不会被算很多次”。

## 排序全景:八种算法一张表

| 算法 | 最好 | 平均 | 最坏 | 空间 | 稳定 | 适用场景 |
| --- | --- | --- | --- | --- | --- | --- |
| 冒泡 | O(n) | O(n²) | O(n²) | O(1) | 稳定 | 教学、近乎有序(加 swapped 标志) |
| 选择 | O(n²) | O(n²) | O(n²) | O(1) | 不稳定 | 交换次数要少的场景 |
| 插入 | O(n) | O(n²) | O(n²) | O(1) | 稳定 | 小数组、近乎有序 |
| 希尔 | O(n log n) | 依赖间隔 | O(n²) | O(1) | 不稳定 | 中等规模、内存受限 |
| 归并 | O(n log n) | O(n log n) | O(n log n) | O(n) | 稳定 | 链表、外部排序、要求稳定 |
| 快排 | O(n log n) | O(n log n) | O(n²) | O(log n) | 不稳定 | 通用内存排序最快 |
| 堆排 | O(n log n) | O(n log n) | O(n log n) | O(1) | 不稳定 | TopK、最坏也要稳 |
| 计数 | O(n+k) | O(n+k) | O(n+k) | O(k) | 稳定 | 范围小的整数 |

**稳定性(Stability)** 的定义:排序后,值相等的元素保持原来的相对顺序。为什么重要?比如订单先按时间排,再按金额排,如果金额排序稳定,同金额的订单仍然按时间有序 —— 这就是“多关键字排序”的实现方式。

快排的核心是 **partition**:选一个轴(pivot),把小于它的放左边、大于它的放右边,轴归位后递归两边。

\`\`\`java QuickSort.java
import java.util.Arrays;

public class QuickSort {
    static void sort(int[] a, int lo, int hi) {
        if (lo >= hi) return;
        int p = partition(a, lo, hi);
        sort(a, lo, p - 1);
        sort(a, p + 1, hi);
    }

    static int partition(int[] a, int lo, int hi) {
        int pivot = a[hi];                 // 取最右为轴
        int i = lo;                        // i 是“小于区”的下一个空位
        for (int j = lo; j < hi; j++) {
            if (a[j] < pivot) {
                swap(a, i, j);
                i++;
            }
        }
        swap(a, i, hi);                    // 轴放到分界点
        return i;
    }

    static void swap(int[] a, int i, int j) {
        int t = a[i];
        a[i] = a[j];
        a[j] = t;
    }

    public static void main(String[] args) {
        int[] a = {5, 2, 9, 1, 7, 3, 8, 4};
        System.out.println("排序前: " + Arrays.toString(a));
        sort(a, 0, a.length - 1);
        System.out.println("排序后: " + Arrays.toString(a));
    }
}
\`\`\`

\`\`\`output
排序前: [5, 2, 9, 1, 7, 3, 8, 4]
排序后: [1, 2, 3, 4, 5, 7, 8, 9]
\`\`\`

> [!pitfall] 快排的三个坑
> ① **已排序数组取端点做轴**会退化成 O(n²),递归深度 O(n),可能栈溢出;解法是随机选轴或三数取中。② ==a[j] < pivot== 还是 ==<== 决定重复元素落在哪边,写错可能死循环;建议用“小于区 + 等于区 + 大于区”三路划分。③ 递归先处理较短的一边、长的一边改循环,可把栈深度压到 O(log n)。工程里 Java 基本类型用**双轴快排**,对象用 **TimSort**,不用自己手写。

## 二分查找:有序带来的指数级加速

二分(Binary Search)的前提是**有序**,每次比较砍掉一半,复杂度 O(log n)。它有三个模板,别混:

| 模板 | 区间 | 循环条件 | 返回 | 用途 |
| --- | --- | --- | --- | --- |
| 标准查找 | 闭区间 [lo, hi] | lo <= hi | 找到返回下标,否则 -1 | 查某个值 |
| 左边界 lowerBound | 左闭右开 [lo, hi) | lo < hi | 第一个 ≥ target 的位置 | 第一个满足条件 |
| 右边界 upperBound | 左闭右开 [lo, hi) | lo < hi | 第一个 > target 的位置 | 最后一个满足条件 |

\`\`\`java BinarySearch.java
public class BinarySearch {
    static int lowerBound(int[] a, int target) {
        int lo = 0, hi = a.length;          // 左闭右开
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (a[mid] < target) lo = mid + 1;
            else hi = mid;                   // mid 可能是答案,不能 mid-1
        }
        return lo;                           // 可能等于 a.length
    }

    static int upperBound(int[] a, int target) {
        int lo = 0, hi = a.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (a[mid] <= target) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    static int search(int[] a, int target) {
        int lo = 0, hi = a.length - 1;       // 闭区间
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (a[mid] == target) return mid;
            if (a[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return -1;
    }

    public static void main(String[] args) {
        int[] a = {1, 3, 3, 3, 5, 7};
        System.out.println("lowerBound(3) = " + lowerBound(a, 3));
        System.out.println("upperBound(3) = " + upperBound(a, 3));
        System.out.println("lowerBound(4) = " + lowerBound(a, 4));
        System.out.println("lowerBound(8) = " + lowerBound(a, 8) + " (等于长度,表示没有)");
        System.out.println("search(5) = " + search(a, 5));
        System.out.println("search(6) = " + search(a, 6));
    }
}
\`\`\`

\`\`\`output
lowerBound(3) = 1
upperBound(3) = 4
lowerBound(4) = 4
lowerBound(8) = 6 (等于长度,表示没有)
search(5) = 4
search(6) = -1
\`\`\`

**记忆法**:左闭右开时,循环条件永远是 ==lo < hi==,更新永远有一边是 ==mid + 1==、另一边是 ==mid==;闭区间时,条件 **lo <= hi**,两边都是 ==mid ± 1==。千万别混用,混用就是死循环或漏答案。

> [!tip] 二分不止用于“找数”
> 只要答案具有**单调性**,就能二分答案:求“最小的最大载重”“最少需要多少天”“第 k 小的数”。做法:把“是否可行”写成一个 check 函数,二分答案区间。看到“最大化最小值/最小化最大值”,第一反应就是二分答案 + 贪心验证。

## 双指针与滑动窗口:把 O(n²) 压成 O(n)

**双指针**用两个下标同向或相向移动,避免双重循环。**滑动窗口(Sliding Window)** 是双指针的一种:右指针负责扩张窗口,左指针负责收缩,窗口内始终维护一个合法状态。

模板四步:① 右指针右移,把新元素加入窗口;② 当窗口不合法,左指针右移直到合法;③ 用当前窗口更新答案;④ 重复直到右指针到头。

\`\`\`java LongestUnique.java
import java.util.HashMap;
import java.util.Map;

public class LongestUnique {
    public static int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> last = new HashMap<>();   // 字符 -> 最后出现下标
        int left = 0, best = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            Integer prev = last.get(c);
            if (prev != null && prev >= left) {
                left = prev + 1;               // 重复字符在窗口内,左边界跳过去
            }
            last.put(c, right);
            best = Math.max(best, right - left + 1);
        }
        return best;
    }

    public static void main(String[] args) {
        String[] tests = {"abcabcbb", "bbbbb", "pwwkew"};
        for (String t : tests) {
            System.out.println(t + " -> " + lengthOfLongestSubstring(t));
        }
    }
}
\`\`\`

\`\`\`output
abcabcbb -> 3
bbbbb -> 1
pwwkew -> 3
\`\`\`

以 \`abcabcbb\` 为例:窗口扩到 \`abc\` 长度 3;遇到第二个 \`a\`,左边界跳到第一个 \`a\` 后面,窗口变 \`bca\`;继续扩到 \`bcab\` 时又重复,左边界跳到 \`b\` 后面…… 每个字符最多进出窗口一次,时间 O(n),空间 O(字符集大小)。

> [!pitfall] 滑动窗口最常见的错:left 只加一
> 发现重复时写 ==left++== 是错的,应该写 **left = Math.max(left, prev + 1)**。因为重复字符可能早就不在当前窗口里了,直接跳到 prev+1 会把 left 拉回去,窗口长度算大。加 Math.max 是双保险;并且判断条件要带 **prev >= left**,否则历史位置会误伤。

## 动态规划:从“定义状态”开始

动态规划(Dynamic Programming)适用两个条件:**最优子结构**(大问题的最优解包含子问题的最优解)和**重叠子问题**(子问题被重复计算)。解题四步:

1. **定义状态**:dp[i] 表示什么?必须能覆盖答案,且无后效性;
2. **写转移方程**:dp[i] 从哪些更小的状态来;
3. **初始化**:dp[0]、dp[1] 等边界;
4. **确定遍历顺序**:保证用到的状态已经算好。

### 爬楼梯:最简单的 DP

\`\`\`java ClimbStairs.java
public class ClimbStairs {
    static int climb(int n) {
        if (n <= 2) return n;
        int a = 1, b = 2;                    // dp[1] = 1, dp[2] = 2
        for (int i = 3; i <= n; i++) {
            int c = a + b;                   // dp[i] = dp[i-1] + dp[i-2]
            a = b;
            b = c;
        }
        return b;
    }

    public static void main(String[] args) {
        for (int n = 1; n <= 10; n++) {
            System.out.print(n + ":" + climb(n) + (n == 10 ? "" : "  "));
        }
        System.out.println();
        System.out.println("n=10 共 " + climb(10) + " 种走法");
    }
}
\`\`\`

\`\`\`output
1:1  2:2  3:3  4:5  5:8  6:13  7:21  8:34  9:55  10:89
n=10 共 89 种走法
\`\`\`

**状态定义**:dp[i] = 爬到第 i 阶的方法数。**转移**:最后一步要么跨 1 阶(从 i-1 来),要么跨 2 阶(从 i-2 来),所以 dp[i] = dp[i-1] + dp[i-2]。**初始化**:dp[1]=1,dp[2]=2。因为只用前两项,两个变量滚动即可,空间从 O(n) 降到 O(1)。

### 0-1 背包:DP 的“二维压一维”

| 要素 | 内容 |
| --- | --- |
| 状态 | dp[j] = 容量为 j 时能装的最大价值 |
| 转移 | dp[j] = max(dp[j], dp[j - w[i]] + v[i]) |
| 初始化 | dp[0..C] 全为 0 |
| 遍历 | 外层物品,内层容量 ==倒序== |
| 答案 | dp[C] |
| 为什么倒序 | 保证每件物品只用一次;正序会变成完全背包 |

以物品 (w,v) = (1,2)、(2,3)、(3,4)、容量 4 为例,最终 dp[4]=6(选 1+3)。倒序遍历时,dp[j-w] 还是“上一轮物品”的状态,不会把当前物品重复计入;正序则会读到本轮刚更新的值,相当于物品无限件。

### 最长递增子序列:LIS

\`\`\`java Lis.java
import java.util.Arrays;

public class Lis {
    static int[] lisDp(int[] nums) {
        int n = nums.length;
        int[] dp = new int[n];
        Arrays.fill(dp, 1);                 // 每个数自身就是一个长度 1 的序列
        for (int i = 1; i < n; i++) {
            for (int j = 0; j < i; j++) {
                if (nums[j] < nums[i]) {
                    dp[i] = Math.max(dp[i], dp[j] + 1);
                }
            }
        }
        return dp;
    }

    public static void main(String[] args) {
        int[] nums = {10, 9, 2, 5, 3, 7, 101, 18};
        int[] dp = lisDp(nums);
        int best = 0;
        for (int x : dp) best = Math.max(best, x);
        System.out.println("数组: " + Arrays.toString(nums));
        System.out.println("dp: " + Arrays.toString(dp));
        System.out.println("LIS 长度: " + best);
    }
}
\`\`\`

\`\`\`output
数组: [10, 9, 2, 5, 3, 7, 101, 18]
dp: [1, 1, 1, 2, 2, 3, 4, 4]
LIS 长度: 4
\`\`\`

**状态**:dp[i] = 以 nums[i] 结尾的最长递增子序列长度。**转移**:枚举 j < i,若 nums[j] < nums[i],则 dp[i] = max(dp[i], dp[j]+1)。答案是 dp 的最大值,不是 dp[n-1]。时间复杂度 O(n²);进阶用“贪心 + 二分”维护 tails 数组,可降到 O(n log n)。

> [!interview] 面试官最爱追问:DP 和贪心、回溯怎么选?
> **DP** 要求最优子结构 + 重叠子问题,求“最值/方案数”,能空间换时间;**贪心** 每步取局部最优且能证明全局最优,通常更快但不保证正确(活动选择能贪心,0-1 背包不能);**回溯** 枚举所有可能,适合求“所有方案/排列组合”,复杂度指数级,靠剪枝优化。判断顺序:先看能不能贪心证明,不能就 DP;要求列出所有方案就回溯。

## 贪心与回溯:两种极端

**贪心(Greedy)** 每步选当前看起来最好的,不回头。活动选择问题:给定若干带起止时间的活动,求最多能参加几场。策略是**按结束时间升序**,每次选“开始时间不早于上一场结束”的活动 —— 结束越早,留给后面的时间越多。

\`\`\`java ActivitySelect.java
import java.util.Arrays;
import java.util.Comparator;

public class ActivitySelect {
    static int maxActivities(int[][] intervals) {
        Arrays.sort(intervals, Comparator.comparingInt(x -> x[1]));   // 按结束时间升序
        int count = 0;
        int end = Integer.MIN_VALUE;
        for (int[] it : intervals) {
            if (it[0] >= end) {              // 不与上一场重叠
                count++;
                end = it[1];
            }
        }
        return count;
    }

    public static void main(String[] args) {
        int[][] a = {{1,4},{3,5},{0,6},{5,7},{3,9},{5,9},{6,10},{8,11},{8,12},{2,14},{12,16}};
        System.out.println("最多参加 " + maxActivities(a) + " 场");
    }
}
\`\`\`

\`\`\`output
最多参加 4 场
\`\`\`

**回溯(Backtracking)** 是“带撤销的 DFS”:做选择 → 递归 → 撤销选择。全排列是最标准的模板,用 used 数组标记已选元素。

\`\`\`java Permute.java
import java.util.ArrayList;
import java.util.List;

public class Permute {
    static List<List<Integer>> permute(int[] nums) {
        List<List<Integer>> res = new ArrayList<>();
        backtrack(nums, new boolean[nums.length], new ArrayList<>(), res);
        return res;
    }

    static void backtrack(int[] nums, boolean[] used, List<Integer> path, List<List<Integer>> res) {
        if (path.size() == nums.length) {          // 终止:选够了
            res.add(new ArrayList<>(path));        // 必须拷贝,path 会被复用
            return;
        }
        for (int i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            used[i] = true;                        // 做选择
            path.add(nums[i]);
            backtrack(nums, used, path, res);      // 递归
            path.remove(path.size() - 1);          // 撤销
            used[i] = false;
        }
    }

    public static void main(String[] args) {
        List<List<Integer>> res = permute(new int[]{1, 2, 3});
        System.out.println("共 " + res.size() + " 种");
        System.out.println(res);
    }
}
\`\`\`

\`\`\`output
共 6 种
[[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]
\`\`\`

回溯的时间复杂度是指数级(O(n!) 或 O(2ⁿ)),空间是递归深度 O(n)。优化的三板斧:**剪枝**(提前判断不可能)、**去重**(排序后跳过同层重复)、**记忆化**(把状态存下来,本质向 DP 靠拢)。

> [!best] 手撕题的现场流程
> ① **确认边界**:输入范围、是否为空、是否有序、能否修改原数据;② **举例**:用一个 3~5 个元素的小例子手推,别急着写;③ **说思路再写码**:先讲用什么结构、几步走,面试官点头再动手;④ **写完报复杂度**:时间、空间各一句;⑤ **主动测试**:正常样例 + 边界(空、单元素、重复、极端值)。这五步做全,即使代码有小 bug,评分也不会低。

## 本章小结

- **递归三要素**:终止条件、本层逻辑、缩小规模;分治 = 分 + 递归 + 合并。
- **归并稳定 O(n log n) 但费空间,快排平均最快但最坏 O(n²) 且不稳定**;工程排序看 JDK。
- **二分三模板**:标准查找、lowerBound、upperBound;混用区间开闭必死循环。
- **滑动窗口**:右扩左缩,重复时 left 跳到 prev+1,每个元素进出一次,总 O(n)。
- **DP 四步**:状态、转移、初始化、顺序;0-1 背包内层倒序。
- **贪心求局部最优,回溯枚举所有方案**;判断顺序:贪心 → DP → 回溯。

## 面试速记

- 归并稳定 O(n log n)、空间 O(n);快排平均 O(n log n)、最坏 O(n²)(有序 + 端点轴)、空间 O(log n)、不稳定。
- 稳定性:冒泡、插入、归并、计数稳定;选择、希尔、快排、堆排不稳定。
- 二分:左闭右开 lo<hi,一边 mid+1 一边 mid;闭区间 lo<=hi,两边 mid±1。
- 滑动窗口:left = max(left, prev + 1),窗口内无重复。
- DP:爬楼梯 dp[i]=dp[i-1]+dp[i-2];0-1 背包 dp[j]=max(dp[j],dp[j-w]+v) 且 j 倒序;LIS 用 dp[i] 以 i 结尾是 O(n²),tails + 二分可到 O(n log n)。
`
      }
    ],
    interview: [
      { q: '时间复杂度的大 O 怎么分析?看到一个循环或递归,你会怎么下手?', a: '三步:**① 找基本操作** —— 最内层循环体执行了多少次,或递归调用了多少次;**② 只保留最高阶项** —— 3n²+5n+7 直接记 O(n²),常数系数全部丢掉;**③ 看 n 趋向无穷的增长趋势**。技巧:单层循环 O(n),两层嵌套 O(n²),顺序结构取最大,if/else 只算较大分支。递归用递推式或递归树,如归并 T(n)=2T(n/2)+O(n)=O(n log n)。注意大 O 是上界,说清 n 指什么,并区分时间与空间。' },
      { q: '数组和链表的区别是什么?实际开发怎么选?', a: '分四维:**内存** 数组连续,链表节点分散且每个节点多一到两个指针;**访问** 数组按下标 O(1)(base + i×size),链表 O(n);**增删** 数组中间要搬移 O(n),链表改指针 O(1),但按值找前驱仍要 O(n);**缓存** 数组连续内存命中率高,链表跳转易 cache miss。结论:绝大多数业务默认 ArrayList;只有已持有节点引用、且频繁头尾增删时才用 LinkedList,而头部操作往往 ArrayDeque 更优。' },
      { q: '反转单链表的思路?迭代和递归分别怎么写?', a: '**迭代**:prev=null、cur=head;循环里先存 next=cur.next,再 cur.next=prev,然后 prev=cur、cur=next;结束时 prev 是新头。时间 O(n)、空间 O(1)。**递归**:终止条件是 head 为 null 或 head.next 为 null;先 newHead=reverse(head.next),再让 head.next.next=head、head.next=null,返回 newHead;空间 O(n) 递归栈。易错点:循环条件用 cur!=null;递归必须断开原头,否则成环。' },
      { q: '如何判断链表有环?又怎么找到环的入口?', a: '**判环**:快慢指针,slow 走一步、fast 走两步;若相遇则有环;fast 遇到 null 则无环。**找入口**:相遇后把 slow 重置到 head,两指针同速前进,再次相遇的节点就是入口。推导:设头到入口 a、入口到相遇点 b、环长 L,相遇时 2(a+b)=a+b+kL,得 a=(k-1)L+(L-b),即从头走 a 步与从相遇点走 L-b 步同时到入口。时间 O(n)、空间 O(1)。' },
      { q: '栈和队列分别适合什么场景?', a: '**栈 LIFO**:括号匹配、表达式求值、函数调用栈、DFS、浏览器后退、编辑器撤销、单调栈求下一个更大元素。**队列 FIFO**:BFS、任务调度、线程池工作队列、消息队列、打印队列、单调队列求滑动窗口最大值。**双端队列** 两边都能进出,Java 首选 ArrayDeque:既是栈也是队列,比 Stack 和 LinkedList 都快。注意 Stack 是 1.0 遗留类,方法带 synchronized,别在新代码里用。' },
      { q: '怎么用两个栈实现一个队列?复杂度是多少?', a: '准备 in 和 out 两个栈:offer 直接把元素 push 到 in;poll 时若 out 为空,就把 in 全部 pop 并 push 到 out(顺序刚好反转),再从 out 弹出。关键点:**只有 out 为空时才搬运**,否则顺序会乱;每个元素最多搬一次。均摊 O(1),最坏单次 O(n),空间 O(n)。反过来用两个队列实现栈,通常每次 push 后把旧元素倒到新队列,复杂度 O(n);也可以用“一个队列循环挪动”的写法。' },
      { q: '哈希冲突有哪些解决办法?各自优缺点是什么?', a: '四类:**链地址法** 同桶挂链表,过长转红黑树,Java HashMap 采用,实现简单、容忍高负载,但指针跳转缓存差;**开放寻址** 线性探测(易一次聚集)、二次探测(易二次聚集)、双重哈希(分布最匀),ThreadLocalMap 用线性探测,缓存友好但删除要墓碑、负载因子必须小于 1;**再哈希** 冲突时换函数;**公共溢出区** 单独存冲突元素。工程主流是链地址法。' },
      { q: '二叉搜索树是什么?为什么会退化?平衡树怎么解决?', a: '**BST** 要求左子树全部小于根、右子树全部大于根,中序遍历得到有序序列,查找/插入/删除平均 O(log n)。**退化**:按有序序列插入时,树变成一根斜链,高度 n,操作退化为 O(n)。**平衡树** 通过旋转把树高控制在 O(log n):AVL 要求左右子树高度差不超过 1,查询快但写操作旋转多;红黑树只要求近似平衡,插入删除旋转少。工程里 TreeMap、TreeSet 用红黑树。' },
      { q: '红黑树有哪五条性质?为什么工程上选它而不是 AVL?', a: '五条:**① 节点非红即黑;② 根节点是黑;③ 每个叶子(NIL)是黑;④ 红节点的子节点必须是黑;⑤ 任一节点到其所有叶子的路径上黑节点数相同**。由 ④⑤ 推出最长路径不超过最短路径 2 倍,树高 ≤ 2log(n+1)。用途:TreeMap/TreeSet、HashMap 树化桶、Linux CFS 调度、epoll 就绪队列。选它是因为插入删除最多 3 次旋转,AVL 可能一路旋转到根,读写混合场景红黑树综合更稳。' },
      { q: '堆是什么?堆排序和 TopK 问题怎么用堆解决?', a: '堆是**完全二叉树**,用数组存:下标 i 的父为 (i-1)/2,左孩子 2i+1,右孩子 2i+2。大顶堆父大于等于子,堆顶最大。插入上浮、删除堆顶下沉,都是 O(log n);建堆从 n/2-1 倒序下沉,总代价 O(n)。**堆排序**:建大顶堆,反复把堆顶与末尾交换并缩小堆,时间 O(n log n)、空间 O(1)、不稳定。**TopK**:求最大 K 个用容量 K 的小顶堆,遍历 O(n log K),比全排序更省。' },
      { q: 'BFS 和 DFS 有什么区别?什么时候用哪个?', a: '**BFS** 用队列,一层一层扩展,无权图上第一次到达就是最短路径,空间 O(宽度),适合最短步数、层序遍历、连通块。**DFS** 用栈或递归,一条路走到黑再回溯,空间 O(深度),适合路径枚举、拓扑排序、判环、岛屿问题。两者在邻接表上都 O(V+E)。选择:**求最少步数用 BFS**,**求所有方案或需要深搜剪枝用 DFS**;图很深时递归 DFS 可能栈溢出,改显式栈或 BFS。' },
      { q: 'Dijkstra 算法的原理是什么?为什么不能有负权边?', a: '贪心 + 优先队列:dist 数组初始无穷、源点 0;每次取出未确定节点中 dist 最小的 u,锁定它,再松弛所有邻边:dist[v] > dist[u]+w 就更新并压入队列。邻接表加堆优化为 O((V+E)log V)。**负权失效** 是因为 Dijkstra 假设“已锁定的最小距离不会再变小”;负权边可能让后到的路径更短,但 u 已经拿去松弛别人,无法回退。负权用 Bellman-Ford O(VE),还能检测负环。' },
      { q: '常见排序算法怎么对比?稳定性的意义是什么?', a: '按四维背:**时间** 冒泡/选择/插入平均 O(n²),归并/快排/堆排 O(n log n),计数 O(n+k);**空间** 归并 O(n)、快排 O(log n) 栈、堆排 O(1);**稳定性** 冒泡、插入、归并、计数稳定,选择、希尔、快排、堆排不稳定;**场景** 小数组插入,通用快排,要求稳定归并/TimSort,TopK 用堆,小范围整数计数。稳定性指相等元素排序后相对顺序不变,多关键字排序时必须靠它。' },
      { q: '动态规划的解题步骤是什么?怎么判断一道题该用 DP?', a: '四步:**① 定义状态** dp[i] 表示什么,必须无后效性;**② 写转移方程** 从哪些更小状态来;**③ 初始化边界** dp[0]、dp[1];**④ 确定遍历顺序** 保证依赖先算。识别信号:求最值/方案数/可行性,且大问题能拆成重复子问题。爬楼梯 dp[i]=dp[i-1]+dp[i-2];0-1 背包 dp[j]=max(dp[j],dp[j-w]+v),内层容量倒序保证每件只用一次;完全背包则正序。' }
    ]
  };
})();
