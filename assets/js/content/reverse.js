/* ═══════════════════════════════════════════════════════════
   模块:逆向工程初探(5 章)
   定位:科普向 · 安全学习 · 全程强调法律红线
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.CONTENT = window.CONTENT || {};

  window.CONTENT.reverse = {
    id: 'reverse',
    title: '逆向工程初探',
    en: 'REVERSE ENGINEERING',
    icon: 'search',
    color: '#a3e635',
    tagline: '把黑盒拆开看看 —— 从游戏数值到 APK',
    description: '用 PVZ 金币、CS 透视、APK 解包三个经典案例,讲清"程序是怎样被看穿的"。适合安全研究入门与面试加分,全程强调合法边界。',
    minutes: '≈ 8 小时',
    chapters: [
      /* ─────────────────────────────────────────── */
      {
        id: 'ch01',
        title: '逆向工程全景与法律红线',
        minutes: 25,
        points: ['静态/动态分析', '工具全景', '法律边界', '前置知识'],
        content: `
> [!danger] 先立规矩:这不是"作弊教程"
> 本章和整个模块的案例仅用于**安全研究、CTF 竞赛、自己开发的程序调试**。未经授权分析他人商业软件、破解付费功能、在线上游戏中使用修改器,违反《网络安全法》《著作权法》与游戏用户协议,轻则封号,重则承担法律责任。**技术是中性的,用在哪边由你决定。**

> [!info] 本章导读 · 一个 App 里,藏着多少你没看见的东西
> 买回一台电器,说明书只写按钮怎么按;真出了故障,维修师傅却要拆开外壳看电路板。软件也一样:你每天点的按钮背后,是一层层编译、打包、加密后的产物,源码早就不是它本来的样子。逆向工程就是那套拆外壳的手艺,只是动手之前必须先弄清哪条线不能碰。
> - 读完本章你将能:区分静态分析、动态分析、内存修改三种手段各自适合什么场景
> - 用一条命令看出文件的真实类型,不被后缀名骗过去
> - 说清哪些行为属于合法的安全研究,哪些一碰就可能违法

> [!tip] 日常电脑现场 · 你其实天天在"逆向"
> 手机装 App 弹"未知来源"、双击 exe 弹 UAC、压缩包里的文件类型图标 —— 你每天都在和二进制打交道,只是没拆开看过。逆向就是把黑盒变透明的那套方法。

## 逆向工程:把"成品"推回"图纸"

编译器做的事:源码 → 机器能跑的二进制。逆向工程(Reverse Engineering)做的事:拿二进制 → 还原出它的结构、逻辑、数据。

\`\`\`text
正向:  Hello.java ──javac──> Hello.class ──JVM──> 运行
逆向:  Hello.class ──javap──> 字节码/近似源码 ──人脑──> 理解逻辑
正向:  app.apk ──打包──> 手机安装
逆向:  app.apk ──apktool/JADX──> smali/资源/清单 ──人脑──> 理解逻辑
\`\`\`

为什么值得学(正经用途):

- **安全审计**:检查第三方 SDK 有没有偷传隐私数据、App 有没有后门。
- **漏洞挖掘**:CTF 的 pwn/re 题、厂商的漏洞赏金计划。
- **兼容与维护**:老系统源码丢失,只能从二进制反推行为(银行/工控领域常见)。
- **恶意软件分析**:杀毒引擎工程师的日常 —— 把病毒拆开看它想干嘛。
- **游戏安全**:反外挂团队必须比外挂作者更懂外挂。

\`\`\`diagram:d-reverse-overview
\`\`\`

逆向就像法医验尸:尸体(二进制)不会说话,但每一道伤口(指令)都在讲它生前发生了什么。

## 三种打开方式

| 方式 | 你做啥 | 工具代表 | 适合 |
| --- | --- | --- | --- |
| **静态分析** | 不运行程序,直接读二进制/字节码 | javap、JADX、IDA、Ghidra、strings | 看逻辑、找关键判断 |
| **动态分析** | 把程序跑起来,断点单步看现场 | x64dbg、Frida、Xposed、jdb | 看运行时数据、绕过校验 |
| **内存修改** | 直接改进程内存里的数值 | Cheat Engine、GameGuardian | 游戏数值、单机实验 |

三者是组合拳:静态找到"判断在哪",动态跟进去看"值是什么",内存直接改"结果"。

## 一个 10 秒上手的最小实验

任何文件开头都有"魔数"(Magic Number),像身份证的第一位:

\`\`\`shell
# 1. 看文件真实类型(不信后缀,信魔数)
file photo.jpg
file app.apk
file Hello.class

# 2. 用十六进制看开头几个字节
xxd -l 16 photo.jpg
xxd -l 16 app.apk

# 3. 从二进制里捞出可读字符串(找线索的第一步)
strings app.apk | grep -i "http" | head -5
\`\`\`

\`\`\`output
photo.jpg: JPEG image data, JFIF standard 1.01
app.apk:   Zip archive data, at least v2.0 to extract
Hello.class: compiled Java class data, version 61.0

00000000: ffd8 ffe0 0010 4a46 4946 0001 0100  ..........JFIF....
00000000: 504b 0304 1400 0800 0800 0000           PK..........

https://api.example.com/v1
https://cdn.example.com/assets
\`\`\`

看懂了吗:**jpg 开头是 FF D8,zip/apk 开头是 50 4B("PK"),class 开头是 CA FE BA BE("咖啡宝贝")**。这几串魔数是每个逆向人的暗号。

> [!interview] 顺手一个面试题
> "Java class 文件的魔数是什么?" → ==CAFEBABE==。JDK 源码里常量 ==0xCAFEBABE== 就叫 magic。答出来说明你真读过 class 文件结构,而不只是背八股。

## 工具全家桶(先混个脸熟)

| 工具 | 干什么 | 平台 |
| --- | --- | --- |
| **javap** | JDK 自带,看 class 字节码 | 全平台 |
| **JADX** | dex/APK → 近似 Java 源码,可搜索 | 全平台(图形化) |
| **apktool** | APK 反编译资源 + smali,可重打包 | 全平台 |
| **IDA / Ghidra** | 二进制反汇编/反编译(NSA 开源 Ghidra 免费) | Win/Mac/Linux |
| **x64dbg** | Windows 动态调试器,断点单步 | Win |
| **Cheat Engine** | 内存扫描修改器(学习神器) | Win |
| **Frida / Xposed** | 运行时 Hook(动态注入改逻辑) | 移动端 |
| **Process Monitor / Wireshark** | 看进程行为、看网络包 | Win/全平台 |

## 前置知识地图(不会这些会卡住)

- **汇编基础**:寄存器(rax/eax)、栈、mov/jmp/call 三件套 —— 不用会写,要会读。
- **进程内存布局**:代码段/数据段/堆/栈(和 JVM 章的内存模型是同一个思想)。
- **文件格式**:PE(Windows exe/dll)、ELF(Linux)、DEX(Android)、class(Java)。
- **Java 字节码**:做 Java 逆向的入场券,第 4 章专讲。
- **网络与加密常识**:很多"破解"其实是绕过校验,得先看懂校验逻辑。

> [!tip] 给你的路线建议
> 你是 Java 背景,最顺的切入点是 **Java 字节码 → APK 解包 → 内存扫描** 这条线(第 2/4/5 章),全都不需要精通汇编。真想深入二进制再补 x86 汇编和 PE 结构。

## 面试速记

- 逆向三法:静态(读)、动态(跑)、内存(改);生产上组合使用。
- 魔数:class=CAFEBABE、zip/apk=PK、jpg=FFD8、elf=7F ELF。
- 学习路径(Java 背景):javap → JADX/apktool → 内存扫描 → Frida Hook。
- 底线一句话:**只碰自己的、授权的、CTF 的**。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch02',
        title: '内存修改实战:PVZ 的金币去哪了',
        minutes: 35,
        points: ['内存扫描', '二次过滤', '多级指针', '服务端校验'],
        content: `
> [!interview] 本章你会得到什么
> 一个 20 分钟就能上手的"内存扫描"心智模型:**游戏数值 = 内存里的一个数;找到地址 → 改写 → 世界改变**。下面的演示把 Cheat Engine 的全过程压缩成小游戏,先玩再读。

\`\`\`demo:memory-scan
\`\`\`

> [!info] 本章导读 · 游戏里的金币,到底存在哪个角落
> 你在游戏里攒了 9999 金币,它既不在屏幕上,也不在存档文件名里,而是躺在游戏进程的一块内存中,以一个普普通通的整数形式存在。既然只是个数字,找到它、改掉它就只剩定位和写入两步。本章用植物大战僵尸做样本,把这两步走成一套能复用的方法论。
> - 读完本章你将能:用数值的变化把内存地址从几万个候选筛到唯一一个
> - 说清首次扫描、再次扫描、锁定数值三步各自在排除什么
> - 解释为什么游戏一重启,刚才找到的地址就失效了

> [!tip] 日常电脑现场 · 单机游戏的"作弊码"
> 小时候玩的魂斗罗 30 条命、现在单机游戏的控制台指令,本质都是往内存某个地址写一个新数字。任务管理器里看到的"内存占用",就是这些格子被占了多少。

## 游戏里的金币,在内存里长什么样

《植物大战僵尸》的单机版里,金币就是一个 **4 字节整数**(int,范围 ±21 亿)。进程内存里连续排着成千上万个这样的 4 字节格子,金币只是其中一个:

\`\`\`text
内存地址        值(4字节 int)
0x00C3A120  →  925     ← 金币(你要找的)
0x00C3A124  →  0
0x00C3A128  →  77
0x00C3A12C  →  925     ← 干扰项:恰好也是 925
...
\`\`\`

修改器(Cheat Engine / GameGuardian)干的事只有三步:

1. **扫描**:遍历目标进程所有可读内存,找出"值等于 X"的地址 → 得到候选集。
2. **过滤**:让数值变化(花点金币),用新值再扫一遍 → 候选集急剧缩小。
3. **改写**:往剩下的地址里写入你想要的值。

\`\`\`diagram:d-pvz-memory
\`\`\`

找金币就像在一栋楼里找一个住户:第一次问"谁家有 925 块钱",可能有 3 户举手;让他花掉 25 块再问"谁家有 900",只剩 1 户 —— 门牌号找到了。

## 为什么第一次扫描总是命中一堆

因为内存里"碰巧等于 925"的数字太多了:坐标、倒计时、血量、随机种子……所以**单次扫描没有意义,前后两次扫描的"交集"才是答案**。

这就是 Cheat Engine 的经典操作节奏(也是面试问"CE 原理"时的标准答案):

\`\`\`text
① 首次扫描: exact value = 925      → 命中 N 个(下图演示里是 3 个)
② 游戏内消费: 金币 925 → 900
③ 再次扫描: exact value = 900      → 命中 1 个 ✅
④ 锁定 + 改写: 900 → 9999
\`\`\`

> [!tip] 数值类型选择
> 金币通常是 4 字节整数;但游戏可能用 float(血量 98.5)、2 字节 short、甚至加密存储(值 = 真实值 × 2 + 7)。扫不到时依次尝试:byte(1) / 2 字节 / 4 字节 / 8 字节 / float / double。**"扫不到"往往不是工具问题,是类型猜错了。**

## 进阶:地址会变?多级指针来救

单机游戏里金币往往挂在某个**对象**上(Player 对象在堆里),对象地址每次启动都变 —— 直接改绝对地址,重启游戏就失效。

解决方案是**多级指针**:找到一条稳定的引用链,比如:

\`\`\`text
模块基址(game.exe + 0x2A1B40)   ← 固定不变
   └─ +0x10 → Player 对象指针    ← 每次启动变
        └─ +0x24 → 金币值        ← 你要改的
\`\`\`

这和你 Java 里的概念同构:**对象引用是堆地址,字段是相对对象头的偏移**。用 JOL(Java Object Layout)可以亲眼看到 Java 对象的字段偏移:

\`\`\`java
import org.openjdk.jol.info.ClassLayout;
import org.openjdk.jol.vm.VM;

public class Player {
    long id;        // 8 字节
    int coin;       // 4 字节 ← 金币
    int level;      // 4 字节
    String name;    // 引用 4 字节(压缩指针开启时)

    public static void main(String[] args) {
        System.out.println(VM.current().details());
        Player p = new Player();
        System.out.println(ClassLayout.parseInstance(p).toPrintable());
    }
}
\`\`\`

\`\`\`output
# Running 64-bit HotSpot VM.
# Objects are 8 bytes aligned.
# Field sizes by type: 4, 1, 1, 2, 2, 4, 4, 8, 8 [bytes]
OFF  SZ   TYPE DESCRIPTION               VALUE
  0   8        (object header: mark)     0x0000000000000001
  8   4        (object header: class)    0x00000e2c
 12   4    int Player.coin               0
 16   8   long Player.id                 0
 24   4    int Player.level              0
 28   4        (object alignment gap)
Instance size: 32 bytes
\`\`\`

看,金币字段就在对象起始地址 + 12 字节处 —— 和游戏外挂找字段偏移是**完全相同的思路**。区别只是 Java 有 JVM 保护,游戏进程靠 ReadProcessMemory 硬读。

> [!pitfall] 改完金币,为什么存档没变?
> 三个原因:① 游戏把数据**加密/校验和**存在别处,下次读档覆盖回来;② 单机版有**存档文件**(.dat 二进制),内存改了没写盘;③ **网游**服务端才是权威数据源,本地改的只是"显示数字",交易时服务端一校验就露馅 —— 这就是网游外挂只能做"显示类作弊",改不了真实资产的原因。

## 合法练习场:自己写个"内存游戏"

最安全的玩法是自己写程序给自己改:

\`\`\`java
/** 一个跑在内存里的"小游戏",用来说明数值就是内存里的一个字段 */
public class MiniGame {
    public static int coin = 925;

    public static void main(String[] args) throws Exception {
        System.out.println("初始金币: " + coin);
        // 模拟"另一个进程"(就是你)在 3 秒后改内存的效果
        new Thread(() -> {
            try { Thread.sleep(3000); } catch (InterruptedException e) {}
            coin = 9999;                      // 等价于外部写入这个字段
        }).start();
        for (int i = 0; i < 6; i++) {
            System.out.println("游戏帧 " + i + " · 金币 = " + coin);
            Thread.sleep(800);
        }
    }
}
\`\`\`

\`\`\`output
初始金币: 925
游戏帧 0 · 金币 = 925
游戏帧 1 · 金币 = 925
游戏帧 2 · 金币 = 925
游戏帧 3 · 金币 = 9999   ← 内存被改,游戏"看到"的就是新值
游戏帧 4 · 金币 = 9999
游戏帧 5 · 金币 = 9999
\`\`\`

> [!best] 一句话总结本章
> 游戏没有"金币"这个实体,只有内存里一个数字;**修改器就是寻址 + 写入**。理解这件事的工程价值在于:写业务代码时知道**数据放哪、谁有权改、如何校验**,你自然能设计出更难被篡改的系统(服务端权威、签名、幂等)。

## 面试速记

- CE 三步:扫描 → 数值变化后二次扫描 → 锁定/改写;核心是"前后交集"。
- 扫不到先想类型:1/2/4/8 字节、float/double、是否加密。
- 地址不稳定 → 多级指针(模块基址 + 偏移链);Java 对象字段也讲偏移(JOL)。
- 网游改不了真资产:**服务端权威**。这也是你做后端设计时的防篡改思路。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch03',
        title: '透视外挂原理与反作弊对抗',
        minutes: 35,
        points: ['ESP 原理', 'W2S 坐标转换', 'Overlay 绘制', '反作弊体系'],
        content: `
> [!danger] 本章姿势:站在防守方
> 下面讲的是透视类外挂的**公开原理**,目的是让你理解 FPS 反作弊在对抗什么、以及为什么它这么难做。**不要在任何线上游戏使用**,那不是技术,是破坏他人游戏体验的作弊,且通常违法违约。

\`\`\`demo:esp-principle
\`\`\`

点开演示里的"开启透视",再打开"反作弊检测",你会看到外挂从"看见墙后敌人"到"被检测封禁"的完整链路。

> [!info] 本章导读 · 隔着墙也能看见人,是魔法还是数学
> 你以为画面里那堵墙挡住了敌人,其实显卡和游戏逻辑眼里只有一堆坐标:谁在哪个位置、朝向哪边、中间有没有遮挡。透视外挂并没有真的看穿什么,它只是把本该被藏起来的那部分数据提前画了出来。本章讲原理,更讲防守:反作弊究竟在哪些环节设卡,这场对抗为什么永远打不完。
> - 读完本章你将能:说清一帧画面从内存数据变成屏幕像素要经过哪几道处理
> - 指出透视类外挂在哪个环节动了手脚,以及反作弊能在哪里拦住它
> - 用防守方视角列出三种检测思路,并说明各自的误判风险

> [!tip] 日常电脑现场 · 游戏里的诡异瞬间
> FPS 游戏里"我明明躲在墙后还是被打"、观战视角的异常提前枪、反作弊突然弹窗 —— 这些瞬间背后,就是本章要讲的读内存与覆盖绘制。

## 为什么外挂能"看见"墙后的敌人

关键认知:**游戏画面 ≠ 游戏数据**。

- 你的客户端**其实知道**所有敌人的位置(否则怎么算子弹、声音、命中判定?只是渲染器**选择不画**视野外的模型)。
- 外挂不碰渲染层,直接去**数据层**把坐标读出来,再自己画一层 —— 所以墙根本拦不住它。

\`\`\`diagram:d-esp-pipeline
\`\`\`

三步流水线:

\`\`\`java
/** 外挂核心逻辑的伪代码(Java 风格便于理解,真实工具多为 C++/C#) */
public class EspCheat {
    void frame() {
        // ① 读到游戏进程句柄与实体列表(真实工具:OpenProcess + ReadProcessMemory)
        ProcessHandle game = findProcess("cs2.exe");
        long playerBase = readPointer(game, MODULE_BASE + 0x1A2B3C);
        long entityList = readPointer(game, playerBase + 0x10);

        for (int i = 0; i < 32; i++) {
            long entity = readPointer(game, entityList + i * 0x78);
            if (entity == 0) continue;
            // ② 读世界坐标(单位:游戏内的米)
            float x = readFloat(game, entity + 0x1D0);
            float y = readFloat(game, entity + 0x1D4);
            float z = readFloat(game, entity + 0x1D8);

            // ③ 世界坐标 → 屏幕坐标(投影)
            ScreenPos sp = worldToScreen(x, y, z, viewMatrix, screenW, screenH);
            if (sp.visible) {
                // ④ 在覆盖层窗口画框(真实工具:GDI+/DirectX/ImGui)
                drawBox(sp.x - 20, sp.y - 40, 40, 80, "敌人 " + (int) distanceTo(x, y, z) + "m");
            }
        }
    }
}
\`\`\`

世界坐标转屏幕坐标(简称 W2S)的简化公式 —— 本质就是**透视投影**:

\`\`\`text
clip = viewProjectionMatrix × (x, y, z, 1)      // 4x4 矩阵乘
ndc  = clip.xyz / clip.w                          // 齐次除法,落在 [-1,1]
screenX = (ndc.x + 1) / 2 * 屏幕宽
screenY = (1 - ndc.y) / 2 * 屏幕高
\`\`\`

> [!tip] 你在 JavaSE 学的知识在这用上了
> 一个 4×4 矩阵乘一个向量、齐次坐标除以 w —— 和图形学、和 Java 的 Matrix 变换是同一套数学。区别只是游戏用 C++ 写在 GPU 前,外挂用任意语言在 CPU 后。

## 外挂的完整武器库(了解才能防)

| 类型 | 原理 | 危害 |
| --- | --- | --- |
| **ESP 透视** | 读内存坐标 + Overlay 画框 | 信息碾压,破坏公平 |
| **雷达挂** | 读实体列表画小地图 | 同上 |
| **自瞄 Aimbot** | 读敌人坐标 + 算角度差 + 模拟鼠标移动 | 命中率异常 |
| **无后坐/压枪** | 读内存中的后坐力参数并实时补偿 | 手感碾压 |
| **穿墙/飞天** | 改写碰撞检测相关内存或调用游戏函数 | 破坏物理规则 |
| **变速齿轮** | Hook 时间函数(QueryPerformanceCounter) | 快人一步 |

发现没有:绝大多数外挂不需要"破解加密",只需要**读 + 写**。所以反作弊的核心不是"藏数据",而是**检测谁在偷看**。

## 反作弊的六层防线(面试重点)

\`\`\`text
第 1 层 行为检测   : 命中率/爆头率/反应时间统计,异常值人工复核
第 2 层 进程检测   : 扫描非授权进程、已知外挂特征码、可疑模块注入
第 3 层 窗口/句柄    : 谁 OpenProcess 了我的游戏?谁在顶层建了透明 Overlay?
第 4 层 内存完整性  : 关键数据加密/校验和、代码段哈希对比、反调试
第 5 层 内核态驱动  : EAC / BattlEye / Vanguard 在内核拦截读写(权限最高,争议也最大)
第 6 层 服务端权威  : 位置/伤害由服务器校验,客户端只是表现层(从根上废掉大部分修改)
\`\`\`

> [!interview] 高频安全面试题
> "透视挂为什么难防?"标准答法:**因为它只读不写、不改代码、不注入逻辑,纯外部读取内存,单靠目标代码的完整性校验覆盖不足,还需结合多种访问与行为信号;对抗手段必须升级到句柄监控、行为分析甚至内核态。而彻底解法是把关键判定放服务端(服务端权威),客户端只做表现。**

## 为什么外挂屡禁不止

- **对抗成本不对称**:作弊者只需找到一个可读的内存地址或一个未校验的客户端参数,防守方却要堵住进程、驱动、DMA 硬件等所有路径。一次更新封掉特征码,工具作者改两行偏移就能复活,防守方还得重新验证全量机型。
- **灰产链条成熟**:从卡密销售、代练工作室、黑号交易到"内部稳定版"分销,每个环节都有人分成,作者不直接面对玩家也能赚钱。需求端是排位焦虑与账号交易,供给端是低成本高回报,封一个作者会有下一个接手。
- **内核反作弊争议大**:EAC、BattlEye、Vanguard 要在内核态拦截读写,权限最高、效果最好,但带来蓝屏、隐私采集与误封风险。厂商一旦被质疑"扫盘",舆论与合规压力就会反过来限制手段,形成"越严越挨骂、越松越失效"的循环。

> [!tip] 面试落点
> 别答"因为有人想赢"。按==成本、产业、合规==三层说,再补一句彻底解法:关键判定放服务端,客户端只做表现层 —— 这正好接上"客户端不可信"的安全模型。

> [!best] 把这段变成你的项目经历
> 面试聊到"安全/防护"时可以说:"我研究过 FPS 外挂的读内存 + 覆盖绘制原理,所以做后端时我非常重视**服务端权威**:关键数据只信服务端,客户端传参一律视为不可信输入 —— 这和防重放、防篡改是同一套威胁模型。"这比空谈"我很注重安全"有说服力得多。

## 面试速记

- 透视本质:**读数据层 + 自己画一层**,绕过渲染而非破解渲染。
- 三步:读内存坐标 → W2S 投影 → Overlay 画框。
- 反作弊六层:行为/进程/句柄窗口/内存完整性/内核驱动/服务端权威。
- 设计启示:客户端不可信,数据校验放服务端。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch04',
        title: 'Java 反编译:字节码的另一面',
        minutes: 30,
        points: ['javap', 'class 结构', '反编译工具', '混淆与加壳'],
        content: `
> [!interview] 这章是你的主场
> 你天天写 Java,但见过编译后的样子吗?本章把"源码 → 字节码 → 反编译"这条链打通,和 JVM 章的类加载、ClassLoader 知识直接咬合 —— 面试聊 JVM 时能甩出"我看过自己 class 的字节码",立刻区分度拉满。

> [!info] 本章导读 · 你写的 Java 代码,编译后到底长什么样
> 写完一个类,点下运行,中间发生的事你大概从没看过:源码先被压成一种叫字节码的中间语言,再交给虚拟机翻译执行。好处是它能跨平台跑;副作用是,别人拿到这份中间产物,几乎能把它还原回接近源码的样子。本章带你亲手拆开自己的 class 文件,看看编译这两个字到底做了什么。
> - 读完本章你将能:用 javap 反汇编自己的 class 文件,读懂常量池与方法表
> - 对比反编译结果与原源码,指出编译器悄悄改写了哪些地方
> - 说清为什么 Java 程序比原生程序更难守住代码秘密

> [!tip] 日常电脑现场 · IDEA 里双击 jar 看源码
> 在 IDEA 里展开一个 jar 能直接看到类与方法;线上事故时用反编译确认"到底跑的哪版代码"。Java 反编译不是黑客专属,是排查问题的日常工具。

## javap:JDK 自带的"透视镜"

\`\`\`java
public class Calc {
    public int add(int a, int b) {
        return a + b;
    }
}
\`\`\`

\`\`\`shell
javac Calc.java
javap -c -p Calc.class
\`\`\`

\`\`\`output
Compiled from "Calc.java"
public class Calc {
  public Calc();
    Code:
       0: aload_0
       1: invokespecial #1   // Method java/lang/Object."<init>":()V
       4: return

  public int add(int a, int b);
    Code:
       0: iload_1
       1: iload_2
       2: iadd
       3: ireturn
}
\`\`\`

看懂了什么?**JVM 是栈式虚拟机**:参数压栈(iload)→ 相加(iadd)→ 返回(ireturn)。没有寄存器,一切在操作数栈上进行 —— 这解释了为什么字节码指令都这么短。

\`\`\`demo:bytecode
\`\`\`

点上面的演示对照三段代码的字节码,顺便看一个"破解思路"的现场(把 iconst_0 改成 iconst_1 意味着什么)。

## class 文件结构(面试可背五段)

\`\`\`text
u4  magic          = 0xCAFEBABE       ← 咖啡宝贝
u2  minor_version
u2  major_version  = 61 → Java 17    ← 版本不对报 UnsupportedClassVersionError
u2  constant_pool_count
cp  constant_pool  ← 常量池:类名/方法名/字符串/数字
u2  access_flags   ← public/final/interface
...
method_info[]      ← 每个方法的字节码
\`\`\`

> [!tip] 为什么 major version 很重要
> ==UnsupportedClassVersionError: class file version 61.0== 你肯定见过 —— 用 JDK 17 编译的 class 拿到 JDK 8 的服务器上跑,就是这报错。61 对应 17。记住这个换算:\`class 版本 = Java 版本 + 44\`。

## 反编译工具链

| 工具 | 输入 | 输出 | 备注 |
| --- | --- | --- | --- |
| **javap** | class | 字节码(人读的) | 官方、绝不出错 |
| **CFR / Procyon / FernFlower** | class/jar | 近似 Java 源码 | IDEA 内置 FernFlower |
| **JD-GUI** | jar | 图形化源码浏览 | 老牌,偶尔反编译出错 |
| **JADX** | dex/apk | 近似 Java 源码 | Android 界瑞士军刀 |
| **jadx-gui 搜索** | apk | 全局搜字符串/类名 | 定位逻辑的第一步 |

日常最常用的组合:**IDEA 里双击 class 看反编译 → 关键逻辑用 javap 对字节码确认**。

\`\`\`shell
# 反编译一个 jar(CFR 示例)
java -jar cfr.jar mylib.jar --outputdir src-out
ls src-out/com/example/
\`\`\`

\`\`\`output
UserService.java
OrderController.java
CacheUtil.java
\`\`\`

## 混淆:让反编译"能看但看不懂"

企业发版必做混淆(ProGuard / R8):

\`\`\`text
未混淆:  com.example.pay.PaymentService.calculateDiscount()
混淆后:  a.a.a.b()          ← 类名方法名全变 a/b/c
\`\`\`

混淆三板斧:

- **重命名**:类/字段/方法 → a、b、c(配合 keep 规则保护反射用到的类)。
- **删除冗余**:删行号、删调试信息、删未用代码。
- **字符串加密**:常量池里的敏感字符串加密存储,运行时解密。

> [!warn] 混淆 ≠ 加密
> 混淆只增加阅读成本,不能阻止逆向。真正的保护是**加壳 + 服务端校验 + 关键逻辑放 so 库**。反过来,做安全审计时遇到混淆,常用"动态 Hook 抓明文"绕过。

## 加壳与脱壳:和 ClassLoader 的攻防

加壳(加固)的本质:**加密 class 字节码,自定义 ClassLoader 在运行时解密加载** —— 正好是你学的类加载机制:

\`\`\`java
/** 加壳器的工作原理(简化示意) */
public class ShellClassLoader extends ClassLoader {
    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        byte[] encrypted = readFromDexOrFile(name);   // 磁盘上是密文
        byte[] real = decrypt(encrypted, KEY);        // 运行时解密
        return defineClass(name, real, 0, real.length); // 交给 JVM
    }
}
\`\`\`

攻防对照(理解即可,别实操):

| 壳的手段 | 脱壳的思路 |
| --- | --- |
| 字节码加密,自定义 ClassLoader 解密 | 在 defineClass 处 Hook,拿解密后的字节 |
| 反调试 / 反注入 | Frida 反反调试、隐藏调试端口 |
| 完整性校验(改了就崩) | 动态补丁绕过校验点 |
| 把核心逻辑放 native so | 只能上 IDA/Ghidra 硬啃汇编 |

> [!interview] 为什么国内 Android 加固这么普遍?
> 因为 dex 太容易反编译:apktool + JADX 十分钟就能看到业务逻辑。加固公司(360/梆梆/腾讯乐固)通过"加密 dex + 壳 ClassLoader + native 校验"把门槛抬高。**但 Java 层永远只是提高成本,不是绝对安全** —— 这也是面试时聊"安全设计"的正确姿态:纵深防御,不追求绝对。

## 合法用途(说给面试官听)

反编译不是"破解"的同义词,工程里它有四个正当场景:

- **线上 jar 版本核对**:事故复现时本地代码明明修过,线上却仍抛旧异常 —— 反编译线上包确认方法体,五分钟排除"发错版本"。
- **依赖审计**:引入的第三方 SDK 声明"只做统计",反编译看它是否偷偷读取设备号、通讯录或上传明文,再决定是否准入。
- **找回丢失源码**:老项目只剩一个 jar、原开发者已离职,用 CFR 还原八成逻辑,再补测试与文档,比推倒重写便宜得多。
- **学习优秀实现**:读 Spring、Netty 源码时,反编译能直接看到编译器生成的内嵌类与桥接方法,理解泛型擦除、lambda 的真实形态。

> [!warn] 边界仍要划清
> 合法的是"看自己有权看的代码":自有系统、开源项目、书面授权目标。把结果用于绕过授权、复制他人商业逻辑或再分发,性质立刻改变。

向面试官表述时,重点不是"我会用工具",而是==我知道什么时候该看字节码、看完如何用于排障与审计==。

## 面试速记

- javap -c -p 看字节码;栈式虚拟机:iload/iadd/ireturn。
- class 魔数 CAFEBABE;版本号 = Java + 44。
- 混淆是重命名+删信息,反编译依然可行,只是难读。
- 加壳 = 加密字节码 + 自定义 ClassLoader 解密,与双亲委派/defineClass 直接相关。
- 安全观:提高攻击成本,而非追求绝对安全。
`,
      },
      /* ─────────────────────────────────────────── */
      {
        id: 'ch05',
        title: 'APK 解包与重打包全流程',
        minutes: 35,
        points: ['APK 结构', 'apktool', 'smali', '重签名'],
        content: `
> [!danger] 操作对象只能是自己的 App
> 下面所有命令仅用于你自己开发的 App、开源样本或 CTF 题目。修改他人应用并分发,侵犯著作权且可能违法。学习目标是:**看得懂 APK、查得出问题、做得了安全评估**。

\`\`\`demo:apk-unpack
\`\`\`

上面是完整流水线的模拟:识别 ZIP → apktool 反编译 → 定位 smali → 修改 → 重打包 → 对齐签名 → 安装。下面逐站点讲清楚。

> [!info] 本章导读 · 别人写的 App,能拆开看看吗
> 一个安装包看起来只有一个图标,实际上它是个压缩包:代码、图片、配置、签名全塞在里面,只差一把解压的钥匙。拆开它并不难,难的是拆完还能原样装回去,因为签名一变,系统就会拒绝安装。本章走一遍从解包到重签名的完整流水线,并说清每一步的法律边界。
> - 读完本章你将能:把一个 APK 拆成清单、资源、smali 三部分并读懂结构
> - 独立完成一次修改、重打包、签名、安装的全流程
> - 判断一个安装包里是否存在敏感权限或可疑 SDK

> [!tip] 日常电脑现场 · 手机安装包的那些事
> 把 .apk 改成 .zip 双击就能看到一堆文件;应用商店里"安装包解析失败"、换图标去广告,都是在这个 ZIP 里动手术。

## APK 就是个 ZIP

\`\`\`shell
unzip -l app.apk | head -12
\`\`\`

\`\`\`output
Archive:  app.apk
  Length      Date    Time    Name
---------  ---------- -----   ----
     4212  2026-11-01 10:00   AndroidManifest.xml
  2891234  2026-11-01 10:00   classes.dex
    88210  2026-11-01 10:00   resources.arsc
     1120  2026-11-01 10:00   res/layout/activity_main.xml
  8012345  2026-11-01 10:00   lib/arm64-v8a/libgame.so
     2048  2026-11-01 10:00   META-INF/CERT.RSA
\`\`\`

每个文件是什么:

| 文件 | 作用 | 逆向价值 |
| --- | --- | --- |
| **AndroidManifest.xml** | 包名、权限、四大组件声明(二进制 XML) | 看入口 Activity、权限、Service |
| **classes.dex** | Java 编译后的 Dalvik 字节码(可多个) | **核心逻辑所在**,反编译主战场 |
| **resources.arsc** | 资源索引表(字符串/颜色/尺寸) | 改文案、找硬编码配置 |
| **res/** | 图片、布局 XML | 换图、找素材 |
| **lib/*/**.so** | native 库(游戏引擎/C++ 逻辑) | 核心算法/加密常在这 |
| **META-INF/** | 签名信息 | 重打包后必须重新签 |

\`\`\`diagram:d-apk-structure
\`\`\`

APK 像一份外卖套餐:dex 是菜谱,arsc 是配料表,res 是摆盘照片,so 是独家酱料包,META-INF 是封条 —— 拆开容易,按原样封回去就要重新盖章(签名)。

## dx/dex/smali:三层关系先理清

\`\`\`text
YourActivity.java        ← 源码
  ↓ javac + d8
classes.dex              ← Dalvik 字节码(寄存器式,不是 JVM 的栈式!)
  ↓ baksmali
YourActivity.smali       ← 可读的汇编文本
\`\`\`

> [!interview] dex 和 class 的区别(加分题)
> ① class 是**栈式**虚拟机字节码,dex 是**寄存器式**(v0/v1 寄存器,指令更少);② 一个 dex 打包所有类(共享常量池),class 是一类一文件;③ dex 面向 Android ART/Dalvik,class 面向 JVM。D8/R8 负责 class → dex。

**smali 语法三分钟入门**:

\`\`\`text
.class public Lcom/game/CoinManager;     ← 类声明,L...; 是类型签名
.field private coin:I                    ← 字段:I=int, Z=boolean, Ljava/lang/String;
.method public getCoin()I                ← 方法,()I 表示返回 int
    .registers 2                         ← 用几个寄存器
    iget v0, p0, Lcom/game/CoinManager;->coin:I   ← 读字段
    return v0
.end method
\`\`\`

| smali 指令 | 含义 | Java 对应 |
| --- | --- | --- |
| const/4 v0, 0x1 | 小常量赋值 | int v0 = 1 |
| iget / iput | 读/写实例字段 | this.coin |
| invoke-virtual | 调实例方法 | obj.method() |
| if-eqz v0, :cond | 为 0 则跳转 | if (v0 == 0) |
| return / return-void | 返回 | return |

## 实操:定位"金币"逻辑(教学示例)

\`\`\`shell
# ① 全局搜索关键词(文案/字段名/接口路径)
grep -rn "coin" out/smali --include=*.smali | head -5

# ② 或用 JADX 图形化搜索(更直观)
jadx-gui app.apk   # 搜索 → 双击跳转 → 看反编译 Java
\`\`\`

\`\`\`output
out/smali/com/game/CoinManager.smali:12:.field private coin:I
out/smali/com/game/CoinManager.smali:31:    iget v0, p0, Lcom/game/CoinManager;->coin:I
out/smali/com/game/ShopActivity.smali:88:    const/4 v1, 0x0        # 0 = 未购买
\`\`\`

找到判断点后,把"读字段"改成"常量"就是经典改法:

\`\`\`text
- iget v0, p0, Lcom/game/CoinManager;->coin:I
+ const v0, 0x270F      # 0x270F = 9999
\`\`\`

> [!pitfall] 改完闪退?
> 三个高频原因:① **签名变了** —— 有签名校验的 App 会自杀式退出;② 寄存器数不对 —— smali 的 .registers 声明与指令用到的寄存器必须匹配;③ 改了资源 ID 引用 —— arsc 与 R.java 对应关系被破坏。

## 重打包三件套:build → align → sign

\`\`\`shell
# ① 重新编译(资源 + smali → apk)
apktool b out -o app_unsigned.apk

# ② 字节对齐(4 字节,否则部分 ROM 装不上,也影响加载性能)
zipalign -v 4 app_unsigned.apk app_aligned.apk

# ③ 签名(v1/v2/v3 都要,Android 7+ 优先 v2)
apksigner sign --ks my.keystore --v1-signing-enabled true \
  --v2-signing-enabled true --out app-signed.apk app_aligned.apk

# ④ 验证签名 + 安装
apksigner verify -v app-signed.apk
adb install -r app-signed.apk
\`\`\`

\`\`\`output
Verifies
Verified using v1 scheme (JAR signing): true
Verified using v2 scheme (APK Signature Scheme v2): true
Verifies
Performing Streamed Install
Success
\`\`\`

> [!interview] 签名校验怎么被绕过?反过来怎么防?
> 校验通常是:App 启动时用 PackageManager 拿当前签名,和内置的合法签名哈希比对。绕过思路是 Hook 签名获取接口(如 Frida hook getPackageInfo)返回正版签名。防守方:① 校验逻辑放 native so;② 多处冗余校验 + 结果参与解密;③ 服务端验证签名指纹。**这是一场典型的"客户端不可信"攻防,再次印证后端设计要服务端权威。**

## 加固 App 为什么拆不动

| 加固手段 | 你看到的现象 | 对抗思路(了解) |
| --- | --- | --- |
| dex 加壳 | JADX 只看到壳代码 | 脱壳工具/内存 dump |
| 资源加密 | res 里全是乱码/占位图 | 运行时 dump 解密后资源 |
| 反调试 | 一挂调试器就崩 | 反反调试、隐藏端口 |
| native 校验 | 改一处就闪退 | 定位校验调用并 patch |
| 签名校验 | 重签后启动即退 | Hook 签名接口 |

结论(和上一章呼应):**Android 客户端没有绝对安全,只有成本高低**。所以真正的敏感逻辑(支付、风控、权益判定)必须在服务端。

## 合法用途清单

- **自己的 App 安全自查**:逆向一遍看敏感信息是否硬编码(API Key!)、能否被随意重打包。
- **竞品分析**(仅公开信息):看对方的权限与组件设计。
- **CTF 移动安全题**:标准解题流程就是本章这套。
- **公司安全评估**:第三方 SDK 隐私合规检查。

> [!best] 把本章写进简历/面试
> "我做过 APK 解包与重打包的完整实验:用 apktool 反编译、JADX 定位逻辑、smali 修改、apksigner 重签。因此我清楚 Android 客户端的防护边界 —— 重要校验不能只放本地,必须服务端二次验证。" → 面试官听到的是:**你懂客户端,也懂安全设计**。

## 面试速记

- APK = ZIP;核心是 classes.dex、resources.arsc、Manifest、so、签名。
- dex 是寄存器式字节码,smali 是它的可读汇编;class 是栈式。
- 重打包三件套:apktool b → zipalign → apksigner;改包必重签。
- 加固 = 加密 + 自定义加载 + 反调试;没有绝对安全。
- 设计启示:敏感逻辑放服务端,客户端只做表现。
`,
      }
    ],
    interview: [
      { q: '逆向工程是什么?常见的三种分析方法?', a: '逆向是从成品二进制反推结构、逻辑与数据的过程。三法:**静态分析**(不运行,反汇编/反编译,IDA/Ghidra/JADX/javap)、**动态分析**(运行中调试,x64dbg/Frida/断点单步)、**内存分析**(直接扫描/改写进程内存,Cheat Engine)。生产中组合使用:静态找判断点,动态看运行值,内存做验证。' },
      { q: 'Cheat Engine 修改数值的原理?为什么第一次扫描总是一堆结果?', a: '原理三步:**枚举目标进程可读内存 → 扫描值等于 X 的地址 → 数值变化后再扫新值缩小候选 → 写入新值**。第一次命中多是因内存里碰巧存在大量相同数值(坐标/计时器/随机种子),所以必须"让值变化 → 二次扫描取交集"。扫不到时排查:数值类型(1/2/4/8 字节、float/double)、是否加密存储。' },
      { q: '为什么游戏地址重启就变?多级指针怎么理解?', a: '对象分配在堆上,堆地址每次启动都可能不同,所以"绝对地址"不可持久。多级指针保存的是**引用链**:模块基址(固定)+ 偏移 A 得到对象指针,再 + 偏移 B 得到字段 —— 这是 native 内存模型中的定位思路;Java 对象还受压缩引用、GC 移动等因素影响,不能直接等同于稳定机器地址。找指针链是修改器的进阶必修课。' },
      { q: 'FPS 透视外挂的原理?为什么它难以被检测?', a: '本质:**绕过渲染层,直接读数据层**。三步:读进程内存拿实体坐标 → 用投影矩阵做世界→屏幕坐标转换(W2S:矩阵乘 + 齐次除法)→ 在透明 Overlay 窗口上画框。难检测是因为它**部分实现主要读取状态,不直接修改目标代码**,单靠目标代码的完整性校验覆盖不足,还需结合多种访问与行为信号;对抗需要句柄监控、Overlay 窗口检测、行为统计甚至内核态驱动。彻底解法:服务端权威。' },
      { q: '反作弊体系一般包含哪些层?', a: '六层:**行为检测**(命中率/反应时间异常)、**进程与模块检测**(已知外挂特征、非法注入)、**句柄/窗口检测**(谁在读我的内存、谁建了顶层透明窗)、**内存与代码完整性**(加密、校验和、反调试)、**内核态驱动**(EAC/BattlEye/Vanguard 拦截读写)、**服务端权威**(关键判定不信客户端)。客户端安全是提高成本,不是绝对。' },
      { q: 'Java 的 class 文件里有什么?javap 能看什么?', a: '结构:魔数 **0xCAFEBABE**、版本号(现代 Java 版本通常可按版本号 + 44 对照,如 61 = Java 17;历史版本须另查)、常量池(类/方法/字符串/数字)、访问标志、字段表、方法表(含字节码)、属性表。\`javap -c -p\` 反汇编出可读字节码,能看到栈式虚拟机的执行过程(iload/iadd/ireturn)。看字节码能验证语法糖真相:如字符串拼接在 JDK 9+ 是 invokedynamic makeConcatWithConstants,而 8 是 StringBuilder。' },
      { q: 'dex 和 class 有什么区别?smali 是什么?', a: 'class 是 **JVM 栈式**字节码,exe 无关、一类一文件、共享常量池的概念不同;dex 是 **Android Dalvik 寄存器式**字节码,一个 dex 打包所有类、体积更省,由 d8/R8 从 class 转换。smali 是 dex 反汇编后的**可读汇编文本**,baksmali 生成、apktool 编译回 dex。改 smali 是 Android 逆向的基本功(改判断、改常量)。' },
      { q: '反编译遇到混淆怎么办?混淆能阻止逆向吗?', a: '混淆(ProGuard/R8)做三件事:重命名类/方法/字段、裁剪无用代码及优化;字符串加密通常需要额外保护机制,不应当作 ProGuard/R8 默认能力。它只**提高阅读成本**,不能阻止逆向:靠字符串常量、调用关系、反射 keep 规则、运行时 Hook 抓明文仍可还原逻辑。真正提高门槛的是**加壳(native 校验/反调试)+ 关键逻辑下沉服务端**。' },
      { q: 'APK 的结构?解包和重打包的完整流程?', a: 'APK 是 ZIP:AndroidManifest.xml(权限/组件)、classes.dex(核心逻辑)、resources.arsc(资源索引)、res/(图片布局)、lib/(so)、META-INF(签名)。流程:apktool d 反编译出 smali+可读资源 → JADX/搜索定位逻辑 → 修改 smali 或资源 → apktool b 重打包 → zipalign 对齐 → apksigner 签名(v1/v2/v3)→ adb install。改包后签名必变,签名校验会拦。' },
      { q: '加了壳的 App 怎么分析?为什么说客户端没有绝对安全?', a: '加壳 = 加密 dex + 自定义 ClassLoader 运行时解密 + 反调试/完整性校验。分析思路:内存 dump 解密后的 dex、Hook defineClass 拿明文、动态绕过反调试。结论:**壳只是提高攻击成本**,因为解密后的代码最终要交给系统执行。所以支付/风控/权益判定等敏感逻辑必须放服务端校验 —— 这也是"客户端不可信"原则在移动端的体现。' }
    ]
  };

  /* ═══════════════════════════════════════════════════
     全量版装配:合并扩展章节(汇编/文件格式/静态/动态/
     Android native/Hook/抓包/CTF/恶意分析)
     ═══════════════════════════════════════════════════ */
  (function () {
    var M = window.CONTENT.reverse;
    if (!M) return;
    var EX = window.REVERSE_EXTRA || {};
    var base = {};
    M.chapters.forEach(function (c) { base[c.id] = c; });

    /* 旧章节的编号引用重映射(旧:2=PVZ 3=ESP 4=Java 5=APK → 新:6/7/8/9) */
    function remap(c) {
      if (!c) return;
      c.content = c.content
        .replace(/第 ?1、2 ?章/g, '第 1、6 章')
        .replace(/第 ?2、4 ?章/g, '第 6、8 章')
        .replace(/第 ?4、5 ?章/g, '第 8、9 章')
        .replace(/第 ?2、3 ?章/g, '第 6、7 章')
        .replace(/第 ?3、4 ?章/g, '第 7、8 章')
        .replace(/第 ?2 ?章/g, '第 6 章')
        .replace(/第 ?3 ?章/g, '第 7 章')
        .replace(/第 ?4 ?章/g, '第 8 章')
        .replace(/第 ?5 ?章/g, '第 9 章');
    }
    ['ch01', 'ch02', 'ch03', 'ch04', 'ch05'].forEach(function (k) { remap(base[k]); });

    var staged = [base['ch01']];
    staged.push(EX['ch02'], EX['ch03'], EX['ch04'], EX['ch05']);
    staged.push(base['ch02'], base['ch03'], base['ch04'], base['ch05']);
    staged.push(EX['ch10'], EX['ch11'], EX['ch12'], EX['ch13'], EX['ch14'], EX['ch15']);
    staged = staged.filter(Boolean);
    staged.forEach(function (c, i) { c.id = 'r' + (i < 9 ? '0' : '') + (i + 1); });
    M.chapters = staged;

    if (window.REVERSE_EXTRA_IQ && window.REVERSE_EXTRA_IQ.length) {
      M.interview = (M.interview || []).concat(window.REVERSE_EXTRA_IQ);
    }
    M.title = '逆向工程全解';
    M.tagline = '从汇编到脱壳的完整逆向课程';
    M.minutes = '≈ 30 小时';
    M.description = '完整逆向工程课程:进制与汇编、PE/ELF/class/DEX 文件格式、静态分析(IDA/Ghidra)、动态调试(x64dbg/gdb)、内存修改与外挂原理、Java 反编译、APK 解包与重打包、Android native 与加固脱壳、Frida/Xposed Hook、抓包与协议逆向、CTF 算法还原、恶意软件分析,以及社会工程学与电信诈骗防范。全程强调法律边界。';
  })();
})();
