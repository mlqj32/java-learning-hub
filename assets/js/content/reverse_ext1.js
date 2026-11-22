/* ═══════════════════════════════════════════════════════════
   模块:逆向工程初探 · 扩展篇(一)
   章节:底层基础 / 文件格式 / 静态分析 / 动态调试
   定位:教材式讲解 · 仅限自有样本、CTF 与授权评估
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.REVERSE_EXTRA = window.REVERSE_EXTRA || {};
  window.REVERSE_EXTRA_IQ = window.REVERSE_EXTRA_IQ || [];

  window.REVERSE_EXTRA['ch02'] = {
    id: 'ch02',
    title: '底层基础:进制、字节序、内存布局与 x86 汇编入门',
    minutes: 45,
    points: ['进制与补码', '大小端', '栈帧布局', 'x86-64 指令'],
    content: `
> [!danger] 先划红线:只拆自己的程序
> 本章及后续章节的汇编阅读、断点调试、字节 patch,仅限**自己编写的样本、CTF 题目、获得书面授权的安全评估**。未经授权分析他人软件、绕过授权校验、传播补丁,可能违反《网络安全法》《著作权法》与用户协议。

> [!info] 本章导读 · 为什么 0x41414141 会变成 AAAA
> 漏洞报告里常见这一幕:程序崩溃,RIP 里躺着 0x41414141,作者淡定地说"我们控制了返回地址"。这不是魔法:0x41 是十进制 65,ASCII 里 65 就是大写 A,四个 41 41 41 41 排在一起就是 AAAA。搞懂这串换算,你同时搞懂了"内存里没有类型"和"栈溢出为什么能改执行流"。
> - 读完本章你将能:在十六进制、十进制、二进制之间心算常见值,并解释 -1 为什么是 0xFFFFFFFF
> - 说清小端字节序如何让同一块内存有两种读法,并用 Java 的 ByteBuffer 亲手验证
> - 面对一段二十行的汇编,推断出它在算什么,并说清栈帧里每一格是什么
> [!tip] 日常电脑现场 · 计算器与任务管理器
> Windows 计算器切到"程序员"模式,输入 255 看 HEX 显示 FF —— 这就是本章的进制;任务管理器里的"内存(活动专用)"就是进程地址空间的占用。

## 内存里没有数字,只有字节
你写 \`int a = 0x41\`,内存里只留下一个字节 0100 0001。把它当整数读是 65,当字符读是 'A',当指令读是 \`inc ecx\`(0x41 在 x86 里正是这条指令)。同一串字节三种解释,结果天差地别 —— 类型不是数据自带的,是读取者加上去的。

类比:同一张乐谱,小提琴手和鼓手读出来是两种声音。谱子没变,解释框架变了。逆向里大量"看不懂",本质是用错了框架:把数据当代码,或把代码当数据。
### 位、字节与字长
| 单位 | 位数 | 范围(无符号) | 备注 |
| --- | --- | --- | --- |
| bit | 1 | 0 ~ 1 | 最小单位,开关 |
| byte | 8 | 0 ~ 255 | 内存寻址的最小单位 |
| word | 16 | 0 ~ 65535 | Windows 术语;x86-64 的机器字是 64 位 |
| dword | 32 | 0 ~ 4294967295 | double word,对应 Java 的 int |
| qword | 64 | 0 ~ 1.8e19 | quad word,对应 Java 的 long |

两个十六进制字符 = 一个字节。hex dump 里 \`48 89 e5\` 就是三个字节,不用数二进制。
### 十六进制心算与补码
| 十六进制 | 十进制 | 记忆点 |
| --- | --- | --- |
| 0x41 | 65 | 大写 A |
| 0x80 | 128 | 无符号 128;有符号字节 -128 |
| 0xFF | 255 | 一字节全 1 |
| 0x1000 | 4096 | 常见内存页大小 4KB |
| 0x7FFFFFFF | 2147483647 | Integer.MAX_VALUE |
| 0x80000000 | -2147483648 | Integer.MIN_VALUE |
| 0xFFFFFFFF | -1 | 全 1 即 -1 |
补码(Two's Complement)的规则只有一条:**负数 = 取反加一**。以 -5 为例,5 是 0x00000005,取反得 0xFFFFFFFA,加一得 0xFFFFFFFB。这样减法可以直接用加法器完成,硬件成本最低。时钟类比:表针倒拨 3 小时和正拨 9 小时落在同一位置 —— 计算机的表盘只有 2 的 32 次方个刻度,所以 -3 和 +4294967293 是同一个编码。

> [!pitfall] 0x80000000 取负还是它自己
> 32 位补码里 -2147483648 没有对应的正数,所以 \`Math.abs(Integer.MIN_VALUE)\` 返回的仍是负数。业务里"取绝对值再比较"遇到这个边界会静默出错,看到 0x80 开头的 4 字节数,先怀疑符号。
## 字节序:同一块内存,两种读法
多字节数据要决定高位放前还是放后,就像日期写成 2026-11-14 还是 14-11-2026,两种都自洽,但双方必须先约定。
- **大端(Big-Endian)**:高位字节放低地址,0x12345678 在内存中是 \`12 34 56 78\`,和人手写顺序一致。
- **小端(Little-Endian)**:低位字节放低地址,同一数值是 \`78 56 34 12\`;x86/x64 用小端,所以调试时看到的内存几乎永远和人读顺序相反。
- **网络序**:TCP/IP 规定用大端;Java 的 \`DataOutputStream.writeInt\` 与 ByteBuffer 默认也是大端,因为 class 文件与网络协议都按大端定义。
\`\`\`java
import java.nio.ByteBuffer;
import java.nio.ByteOrder;

public class EndianDemo {
    public static void main(String[] args) {
        int v = 0x12345678;
        ByteBuffer be = ByteBuffer.allocate(4).order(ByteOrder.BIG_ENDIAN).putInt(v);
        ByteBuffer le = ByteBuffer.allocate(4).order(ByteOrder.LITTLE_ENDIAN).putInt(v);
        System.out.println("BE: " + hex(be.array()) + "  LE: " + hex(le.array()));
        System.out.println("native: " + ByteOrder.nativeOrder());
        ByteBuffer raw = ByteBuffer.wrap(new byte[]{0x78, 0x56, 0x34, 0x12});
        System.out.println("LE read: 0x" + Integer.toHexString(
                raw.order(ByteOrder.LITTLE_ENDIAN).getInt()));
    }
    static String hex(byte[] bs) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bs) sb.append(String.format("%02X ", b));
        return sb.toString().trim();
    }
}
\`\`\`
\`\`\`output
BE: 12 34 56 78  LE: 78 56 34 12
native: LITTLE_ENDIAN
LE read: 0x12345678
\`\`\`
## 进程内存布局:代码、数据、堆、栈各就各位
程序运行时,操作系统给它一块虚拟地址空间,按用途切块:低地址放代码和全局数据,高地址放栈,中间是堆与共享库。
\`\`\`text
高地址  0x00007ffffffff000
        ┌────────────────────────┐
        │ 栈 stack               │ 局部变量、返回地址,向低地址生长
        ├────────────────────────┤
        │ 共享库 mmap 区          │ libc.so / ntdll.dll / JVM 的 so
        ├────────────────────────┤
        │ 堆 heap                │ malloc / new,向高地址生长
        ├────────────────────────┤
        │ .data / .bss           │ 已初始化 / 未初始化全局变量
        ├────────────────────────┤
        │ .text(代码段)          │ 机器指令,一般只读可执行
低地址  0x0000000000400000  └────────────────────────┘
\`\`\`
\`\`\`diagram:d-stack-frame
\`\`\`

看懂了栈帧,你就明白了"函数调用"在内存里到底发生了什么 —— 参数、返回地址、局部变量各就各位,ret 一弹栈就回到了调用者的世界。

## 栈帧:一次函数调用的现场
函数调用时,CPU 用 \`call\` 把返回地址压栈,被调用函数再用 \`push rbp; mov rbp, rsp\` 建立自己的栈帧,于是局部变量、返回地址、参数在同一块连续内存里排好队。
\`\`\`text
高地址
        ┌──────────────────────────┐
        │ 第 7 个及以后的参数        │  x64 只有超过 6 个参数才上栈
        ├──────────────────────────┤
        │ 返回地址 return address   │  call 自动压入;ret 自动弹出
        ├──────────────────────────┤  ← rbp 指向保存的 rbp
        │ 保存的 rbp(saved rbp)     │  push rbp
        ├──────────────────────────┤
        │ 局部变量 buf[32]          │  sub rsp, 0x30 之后
        └──────────────────────────┘  ← rsp 指向栈顶
低地址
\`\`\`
1. 入口三件套:\`push rbp\`(保存旧帧)、\`mov rbp, rsp\`(立新锚点)、\`sub rsp, N\`(开局部空间);出口是 \`leave\`(等价 \`mov rsp, rbp; pop rbp\`)加 \`ret\`。
2. 局部变量用 \`[rbp-0x8]\` 这样的负偏移访问,参数用 \`[rbp+0x10]\` 这样的正偏移访问。看到 \`[rbp-0x4]\` 就知道是个 4 字节局部变量。
3. **返回地址就压在局部变量上方**。往 \`buf\` 写超长数据,越界先毁掉保存的 rbp,再往上就是返回地址 —— 这就是 AAAA 能进入 RIP 的原因。现代编译器用栈保护、NX、ASLR 拦它,但理解布局是理解这些防护的前提。
## x86-64 寄存器:16 个通用寄存器的分工
名字里的 ax/eax/rax 是同一块物理寄存器的不同宽度,低 32 位可单独访问,低 16/8 位也可以。
| 64 位 | 低 32 | 低 16 | 低 8 | 约定用途(System V) |
| --- | --- | --- | --- | --- |
| rax | eax | ax | al | 返回值;累加器 |
| rbx | ebx | bx | bl | 被调用者保存 |
| rcx | ecx | cx | cl | 第 4 个参数;移位计数 |
| rdx | edx | dx | dl | 第 3 个参数;乘除高位 |
| rsi | esi | si | sil | 第 2 个参数;源索引 |
| rdi | edi | di | dil | 第 1 个参数;目的索引 |
| rbp | ebp | bp | bpl | 帧指针,被调用者保存 |
| rsp | esp | sp | spl | 栈顶指针,不能乱改 |
| r8~r15 | r8d~r15d | r8w~r15w | r8b~r15b | r8/r9 是第 5/6 个参数,其余临时或保存 |
| rip | eip | - | - | 下一条指令地址,只能由 jmp/call/ret 改 |

条件跳转就是标志位的组合:**ZF** 在结果为 0 时置 1(\`cmp\` 后表示相等),**SF** 在结果为负时置 1,**CF** 是无符号进位/借位,**OF** 是有符号溢出。\`je\` 看 ZF,\`jl\` 看 SF 与 OF 是否不同,\`jb\` 看 CF。
## 常用指令:先认这 14 条
| 指令 | 作用 | 读法示例 |
| --- | --- | --- |
| mov dst, src | 赋值(不改标志) | \`mov rax, rdi\` → rax = rdi |
| lea dst, [addr] | 取有效地址,不访问内存 | \`lea rax, [rbp-0x10]\` → rax = rbp-0x10 |
| add / sub | 加减,改标志 | \`sub rsp, 0x20\` → 开 32 字节栈空间 |
| xor dst, src | 异或;自己异或自己得 0 | \`xor eax, eax\` → eax = 0 |
| cmp a, b | 计算 a-b,只改标志 | 后面必跟条件跳转 |
| test a, b | 计算 a&b,只改标志 | \`test eax, eax\` → 判断是否为 0 |
| jmp | 无条件跳转 | 汇编里的 goto |
| je / jne | ZF=1 / ZF=0 时跳 | 相等 / 不相等 |
| jl / jg | 有符号小于 / 大于 | 配合 cmp 使用 |
| call | 压返回地址并跳转 | 调用函数 |
| ret | 弹出返回地址并跳回 | 函数返回 |
| push / pop | 压栈 / 弹栈,同时改 rsp | 保存与恢复现场 |
| nop | 空操作,机器码 0x90 | 打补丁时占位 |
> [!tip] 读汇编的三步法
> ① 看参数从哪来(rdi/rsi/rdx 还是 [rbp+0x10]);② 找 \`cmp\`/\`test\` 与它后面的条件跳转,那就是分支;③ 看返回值在 eax/rax 里被写成什么。掌握这三步,二十行以内的函数基本能读懂。
## 调用约定:参数到底放在哪
| 约定 | 平台 | 参数位置 | 谁清栈 | 备注 |
| --- | --- | --- | --- | --- |
| cdecl | x86 32 位 | 右到左压栈 | 调用者 | 可变参数依赖它 |
| stdcall | x86 32 位 Windows API | 右到左压栈 | 被调用者 | 名字带修饰 |
| x64 System V | Linux/macOS | rdi、rsi、rdx、rcx、r8、r9 | 调用者 | 多余参数压栈,栈 16 字节对齐 |
| x64 Windows | Windows | rcx、rdx、r8、r9 | 调用者 | 调用前预留 32 字节 shadow space |

为什么要背这张表:看到 \`rcx\` 当第一个参数,就知道是 Windows x64;看到 \`rdi\` 打头,就是 Linux。C++ 成员函数的 \`this\` 也走第一个参数位(Windows 是 rcx,SysV 是 rdi),所以反编译里经常出现 \`this\` 被当成普通参数传。

x64 前四个参数放在寄存器里,栈上只能看到第 5 个以后的参数。初学者在栈窗口找不到前四个参数,误以为函数没传参 —— 正确做法是看寄存器窗口,或在函数入口下断,此时 rcx/rdx/r8/r9 就是原始参数。
## 一段 C 函数与它的反汇编
\`\`\`c
int check(int a, int b) {
    int sum = a + b;
    if (sum > 100) {
        return 1;
    }
    return 0;
}
\`\`\`
\`\`\`shell
gcc -O0 -fno-asynchronous-unwind-tables -c check.c -o check.o
objdump -d -M intel check.o
\`\`\`
\`\`\`output
0000000000000000 <check>:
   0:   55                    push   rbp
   1:   48 89 e5              mov    rbp,rsp
   4:   89 7d ec              mov    DWORD PTR [rbp-0x14],edi
   7:   89 75 e8              mov    DWORD PTR [rbp-0x18],esi
   a:   8b 45 ec              mov    eax,DWORD PTR [rbp-0x14]
   d:   03 45 e8              add    eax,DWORD PTR [rbp-0x18]
  10:   89 45 fc              mov    DWORD PTR [rbp-0x4],eax
  13:   83 7d fc 64           cmp    DWORD PTR [rbp-0x4],0x64
  17:   7e 07                 jle    20 <check+0x20>
  19:   b8 01 00 00 00        mov    eax,0x1
  1e:   eb 05                 jmp    25 <check+0x25>
  20:   b8 00 00 00 00        mov    eax,0x0
  25:   5d                    pop    rbp
  26:   c3                    ret
\`\`\`
- \`mov [rbp-0x14], edi\`:把第 1 个参数 a 从 edi 落到栈上。64 位寄存器是 rdi,低 32 位叫 edi,int 只有 32 位,所以用 edi。
- \`add eax, [rbp-0x18]\`:eax 加上 b,结果就是 sum。
- \`cmp [rbp-0x4], 0x64\`:算 sum - 100,**只改标志位,不保存结果**;0x64 就是十进制 100。
- \`jle 20\`:源码写的是 \`if (sum > 100) return 1\`,编译器却生成"小于等于就跳过"的跳转 —— 读汇编时条件经常是反的,先问"往哪跳",再问"什么时候跳";两条 return 被合并成一个出口,返回值统一放 eax。
## 小练习:两段汇编,推断功能
\`\`\`text
f1:                          ; 参数 n 在 edi,返回值在 eax
    xor    eax, eax          ; 累加器清零
    xor    ecx, ecx          ; i = 0
.loop:
    cmp    ecx, edi
    jge    .done             ; i >= n 就结束
    add    eax, ecx          ; acc += i
    inc    ecx               ; i++
    jmp    .loop
.done:
    ret

f2:                          ; 同样一个 int 参数
    mov    eax, edi
    sub    eax, 1
    and    eax, edi          ; n & (n - 1)
    sete   al                ; 结果为 0 则 al = 1
    movzx  eax, al
    ret
\`\`\`
\`\`\`output
f1(n) = 0 + 1 + ... + (n-1),即 n*(n-1)/2;n <= 0 时返回 0
f2(n) = 1 当 n 是 2 的幂或 n == 0,否则 0
\`\`\`
- f1 是标准的计数循环模板:\`xor ecx, ecx\` 初始化、\`cmp ecx, edi\` 定边界、\`inc ecx\` 步进、\`jmp\` 回跳,四个零件凑齐就是 for 循环;累加的是 ecx,所以是求和。
- f2 用经典位技巧 \`n & (n-1)\`:2 的幂二进制里只有一个 1,减一后这个 1 变 0、后面全变 1,按位与必为 0;\`sete\` 把 ZF 写进 al,\`movzx\` 零扩展到 32 位。但 n 等于 0 时 \`0 & -1\` 还是 0,函数返回 1,把 0 误判成 2 的幂 —— 汇编不会替你想边界,逆向读到的代码也常带着原作者的疏忽。
## 本章小结
进制的本质是同一串比特的多种写法;补码让减法变成加法;字节序是 CPU 与协议之间的约定;内存布局决定数据放哪、谁能改;栈帧决定调用现场长什么样;寄存器与指令决定 CPU 实际做了什么。这五件事串起来,才构成能读汇编的地基。
## 面试速记
- 0x41 = 65 = 'A';0x41414141 就是 AAAA,是栈溢出覆盖返回地址的经典标记。
- 小端 = 低位字节放低地址;x86/x64 小端,网络序与 Java ByteBuffer 默认大端。
- 负数 = 取反加一;-1 = 0xFFFFFFFF;0x80000000 取负仍是自己。
- 栈帧三件套:push rbp / mov rbp,rsp / sub rsp,N;返回地址在 rbp+8,局部变量在 rbp 负偏移。
- 分支 = cmp/test + 条件跳转;返回值在 eax/rax;x64 前四参数在 rcx/rdx/r8/r9(Windows)或 rdi/rsi/rdx/rcx(SysV)。
`,
  };

  window.REVERSE_EXTRA['ch03'] = {
    id: 'ch03',
    title: '文件格式全解:PE·ELF·class·DEX',
    minutes: 50,
    points: ['PE 结构', 'ELF 与 PLT/GOT', 'class 常量池', 'DEX 差异'],
    content: `
> [!danger] 分析对象必须是自有或授权样本
> 本章所有命令与解析代码,仅用于**自己编译的程序、开源软件、CTF 附件、获得授权的评估目标**。把他人软件拆开研究内部实现,在很多许可协议里是被禁止的;绕过技术保护措施还可能触发法律责任。

> [!info] 本章导读 · 一个 exe 里到底装了什么
> 双击一个 exe,它就开始跑;可它凭什么知道自己该从哪条指令开始?图标、版本号、依赖的 DLL 又存在哪?答案全在文件头里:可执行文件不是"一坨代码",而是一份带目录的集装箱 —— 开头是清单,后面是分门别类的货舱,操作系统照着清单把货搬进内存。
> - 读完本章你将能:说清 PE 的 DOS 头、NT 头、节表各自负责什么,并手算 RVA 到文件偏移
> - 用 readelf 读懂 ELF 的节与段,解释 .plt/.got 如何完成延迟绑定
> - 从字节层面看懂 class 常量池索引规则,理解 Java 反编译为何如此容易
> [!tip] 日常电脑现场 · 右键 exe 看"属性"
> 右键 exe → 属性 → 详细信息里的版本/公司,来自资源节;数字签名标签来自证书表;给快捷方式换图标,改的也是资源节。 文件格式就在你右键菜单里。

## 先问格式,再谈逆向
拿到一个样本,第一件事不是拖进 IDA,而是回答三个问题:什么格式?什么架构?有没有加壳?格式决定了你用哪套工具、看哪些结构、找哪些线索。

所有可执行格式都是同一个套路:**魔数 → 文件头 → 目录表 → 实际内容**。就像一本书:封面印书名(魔数),版权页写开本页数(头),目录告诉你去哪找第几章(表),正文才是内容(节/段)。
| 格式 | 开头魔数 | 使用场景 | 第一眼要看 |
| --- | --- | --- | --- |
| PE | 4D 5A "MZ",后接 PE 签名 | Windows exe/dll/sys | 节表、导入表、入口点 |
| ELF | 7F 45 4C 46 | Linux 可执行文件/so | 程序头、节头、符号表 |
| Mach-O | FE ED FA CE / CF | macOS/iOS | Load Commands、__TEXT |
| class | CA FE BA BE | JVM 字节码 | 常量池、方法表 |
| DEX | 64 65 78 0A | Android 字节码 | header、method_ids、code_item |
\`\`\`diagram:d-pe-structure
\`\`\`

一个 exe 的内部不是黑盒,而是一排有名字的抽屉。下面先看全貌,再用"PE 结构浏览器"逐个点开。

\`\`\`demo:pe-explorer
\`\`\`

## PE:Windows 可执行文件的三层套娃
PE 最迷惑人的地方是"头里面还有头"。历史原因:它要兼容 DOS,于是先放一个 DOS 头,再在 DOS 头里藏一个指针,指向真正的 Windows 头。
\`\`\`text
┌─────────────────────────────┐
│ DOS Header(64 字节)         │  开头 "MZ";偏移 0x3C 处是 e_lfanew
├─────────────────────────────┤
│ DOS Stub                    │  "This program cannot be run in DOS mode"
├─────────────────────────────┤ ← e_lfanew 指向这里
│ NT Headers                  │
│   Signature "PE\\0\\0"        │  4 字节
│   File Header(20 字节)       │  机器类型、节数量、可选头大小
│   Optional Header           │  入口点、镜像基址、对齐、数据目录
├─────────────────────────────┤
│ Section Table(每项 40 字节)  │  .text / .rdata / .data / .rsrc / .reloc
├─────────────────────────────┤
│ 各节的实际内容                │  代码、字符串、资源、重定位表
└─────────────────────────────┘
\`\`\`
| 字段 | 位置 | 含义 | 逆向价值 |
| --- | --- | --- | --- |
| e_lfanew | DOS 头 + 0x3C | NT 头的文件偏移 | 解析 PE 的第一步 |
| Machine | File Header | 0x8664 = x64,0x14C = x86 | 决定用 32 还是 64 位调试器 |
| AddressOfEntryPoint | Optional Header | 入口点 RVA | 调试的第一站 |
| ImageBase | Optional Header | 首选加载基址 | 静态地址与运行时地址的换算基准 |
| DataDirectory | Optional Header | 导入/导出/资源等 16 张表 | 定位导入表、资源表 |
### RVA 与文件偏移:PE 最常考的一道换算
**RVA** 是相对镜像基址的地址,描述"加载到内存后在哪";**文件偏移**是这个字节在磁盘文件里的位置。两者不相等,因为节在文件里按 0x200 对齐,在内存里按 0x1000 对齐。

换算公式:\`文件偏移 = 节的 PointerToRawData + (RVA - 节的 VirtualAddress)\`。举例:入口 RVA = 0x11A0,\`.text\` 的 VirtualAddress = 0x1000、PointerToRawData = 0x400,则偏移 = 0x400 + 0x1A0 = 0x5A0。
\`\`\`shell
xxd -s 0x5A0 -l 16 hello.exe
\`\`\`
\`\`\`output
000005a0: 4883 ec28 e8 57 01 00 00 48 85 c0 74 0a 48 8d  H..(.W...H..t.H.
\`\`\`
\`48 83 EC 28\` 是 \`sub rsp, 0x28\`,\`E8 57 01 00 00\` 是 \`call rel32\`,\`48 85 C0\` 是 \`test rax, rax\`,\`74 0A\` 是 \`je +0xA\`。x64 函数开头常减 0x28:Windows 约定要预留 32 字节 shadow space,再保证栈 16 字节对齐,减 0x28 正好两头都满足。
### 导入表与 IAT:程序如何调用 DLL
程序自己不会实现 \`MessageBox\`、\`CreateFile\`,它只声明"我要用 user32.dll 的 MessageBoxW"。加载器找到真实地址,写进 **IAT(Import Address Table)**;代码里调用的是 \`call [IAT 槽位]\`,间接跳过去。
\`\`\`text
你的代码:  call QWORD PTR [rip+0x2F00]   → 指向 IAT 槽位
IAT 槽位:  0x00007FFB1234ABCD          → 运行时由加载器填入真实地址
                                        → 指向 user32.dll 的 MessageBoxW
\`\`\`
这带来两个技巧:① **看导入表就能猜行为** —— 导入 ws2_32 说明要联网,导入 CryptDecrypt 说明要解密,导入 IsDebuggerPresent 说明可能带反调试;② **IAT hook 是常见攻防点** —— 把槽位改成自己的函数就能劫持调用,防守方则校验 IAT 完整性或改用直接系统调用。导出表是反方向:DLL 把哪些函数暴露给外部,往往就是它的公开 API 清单。
### 查壳与看头:三条命令
\`\`\`shell
dumpbin /headers hello.exe
diec hello.exe
\`\`\`
\`\`\`output
FILE HEADER VALUES
            8664 machine (x64)
               5 number of sections
              F0 size of optional header
OPTIONAL HEADER VALUES
             20B magic # (PE32+)
            1000 section alignment
             200 file alignment
            11A0 address of entry point
        140000000 image base
SECTION HEADER #1
   .text name
\`\`\`
\`\`\`output
PE64
    Linker: Microsoft Linker
    Compiler: Microsoft Visual C/C++
    Protection: none
\`\`\`
图形化工具更方便:**CFF Explorer** 可以树形浏览每个头和每个数据目录,**Detect It Easy(DIE)** 专门查壳与编译器指纹。加壳的典型信号:节名是 \`UPX0\`/\`UPX1\`、导入表只有寥寥几个函数、入口点落在可写可执行但没名字的节里、熵值接近 8。

后缀会骗人:\`.exe\` 可能是 .NET 程序(该用 dnSpy 而不是 IDA 主力),可能是自解压压缩包,也可能是改了后缀的 APK。**永远以魔数和 DIE 的结论为准**。
## ELF:Linux 的同款,但把段和节分开了
ELF 有两套视图:**节(Section)** 给链接器看,记录 .text/.data/.bss 这些逻辑分类;**段(Segment)** 给加载器看,描述这一块映射到什么地址、什么权限。所以 \`readelf -S\` 看节,\`readelf -l\` 看段。
\`\`\`shell
readelf -h ./crackme
readelf -S ./crackme | head -30
\`\`\`
\`\`\`output
ELF Header:
  Magic:   7f 45 4c 46 02 01 01 00 00 00 00 00 00 00 00 00
  Class:                             ELF64
  Data:                              2's complement, little endian
  Type:                              DYN (Position-Independent Executable file)
  Machine:                           Advanced Micro Devices X86-64
  Entry point address:               0x1060

Section Headers:
  [Nr] Name              Type             Address           Offset
  [12] .plt              PROGBITS         0000000000001020  00001020
  [13] .text             PROGBITS         0000000000001060  00001060
  [22] .got              PROGBITS         0000000000003fb0  00002fb0
  [23] .data             PROGBITS         0000000000004000  00003000
\`\`\`
PIE 是重点:\`Type: DYN\` 说明这是位置无关可执行文件,每次加载基址都不同(ASLR),静态看到的 0x1060 只是文件内偏移。调试时 gdb 显示真实地址,IDA 里常以 0x0 为基址,需要手动 rebase 对照。
### PLT 与 GOT:延迟绑定是怎么回事
调用外部函数时,ELF 用一个小跳板:**PLT** 是代码,**GOT** 是数据。
\`\`\`text
call strcmp@plt
        │
        ▼
strcmp@plt:  jmp QWORD PTR [strcmp@got]   ← 第一次:指向 plt+6(解析器)
             push reloc_index
             jmp plt0                      → 动态链接器解析符号
                                        ← 第二次起:GOT 已是真实地址
\`\`\`
生活类比:第一次找某公司办事,先打总机(PLT),总机问清后把分机号写进你的通讯录(GOT);以后直接拨分机。这就是**延迟绑定(Lazy Binding)** —— 启动时不必解析所有符号,只在第一次调用时付成本。攻防上 GOT 是可写数据,改写它就能劫持调用;现代系统用 RELRO 在启动后把 GOT 设为只读来对抗。

发布版 ELF 常被 \`strip\`, \`.symtab\` 删掉,只剩 \`.dynsym\`。这时 IDA 里函数全叫 \`sub_401136\`,只能靠字符串、导入表、调用关系自己命名。
## Mach-O 一句话

macOS/iOS 的可执行格式,魔数 \`FE ED FA CE\`(32 位)、\`FE ED FA CF\`(64 位),\`CA FE BA BE\` 是含多架构的 fat binary;结构为 Header + Load Commands + Segment,常见节是 \`__TEXT\`(代码)、\`__DATA\`(数据)。

| 部分 | Mach-O | PE | ELF |
| --- | --- | --- | --- |
| Header | mach_header_64(FEEDFACF) | DOS 头 + NT 头(PE\\0\\0) | ELF Header(7F 45 4C 46) |
| 加载信息 | Load Commands | Section Table | Program Header |
| 段 | __TEXT/__DATA/__LINKEDIT | .text/.data/.rdata | .text/.data/.rodata |

工具用 \`otool -l\`、\`class-dump\`、Hopper。iOS 逆向绕不开它:class-dump 与 IDA 打开的第一层就是它,重签名、注入 dylib 也要改 Load Commands。==看懂 LC_SEGMENT_64 的映射,才知道断点下在哪。==

## class 文件:Java 的主场
从**文件格式**角度看,class 是一份精心设计的自描述表结构,所有多字节字段都是大端 —— 这正是 Java 用 \`DataInputStream.readInt\` 就能解析它、而不需要手动翻转字节的原因。
\`\`\`text
ClassFile {
    u4 magic;                     // 0xCAFEBABE
    u2 minor_version;
    u2 major_version;             // 61 = Java 17
    u2 constant_pool_count;       // 真实条目数 = count - 1
    cp_info constant_pool[];      // 类名/方法名/描述符/字符串/数字
    u2 access_flags;              // public / final / interface
    u2 this_class; super_class;   // 都指向常量池
    u2 fields_count;  field_info fields[];
    u2 methods_count; method_info methods[];   // 每个方法带 Code 属性
    u2 attributes_count; attribute_info attributes[];
}
\`\`\`
用 Java 亲自读一遍文件头,比看十遍规范都管用:
\`\`\`java
import java.io.BufferedInputStream;
import java.io.DataInputStream;
import java.io.FileInputStream;

public class ClassHeader {
    public static void main(String[] args) throws Exception {
        try (DataInputStream in = new DataInputStream(
                new BufferedInputStream(new FileInputStream("Calc.class")))) {
            int magic = in.readInt();
            int minor = in.readUnsignedShort();
            int major = in.readUnsignedShort();
            int cpCount = in.readUnsignedShort();
            System.out.printf("magic   = 0x%08X%n", magic);
            System.out.printf("version = %d.%d (Java %d)%n", major, minor, major - 44);
            System.out.printf("cp_count= %d(实际条目 %d)%n", cpCount, cpCount - 1);
        }
    }
}
\`\`\`
\`\`\`output
magic   = 0xCAFEBABE
version = 61.0 (Java 17)
cp_count= 19(实际条目 18)
\`\`\`
两个容易忽略的细节:**常量池索引从 1 开始**,0 号保留表示"不引用任何常量",所以 \`constant_pool_count\` 比真实条目多 1;**long 和 double 占两个槽位**,它们用 8 字节存储却在池里占两项,第二项是无效占位。

> [!interview] 为什么反编译 Java 这么容易
> 因为 class 保留了完整的结构化元数据:类名、父类、字段名、方法名、描述符、行号表、局部变量表,还有每个方法的完整字节码。字节码是栈式指令,语义接近源码,反编译器只需把"操作数栈操作"还原成表达式树。原生二进制连函数边界都要自己猜,所以 Java 的保护只能靠混淆和加壳,而不是靠编译本身。
## DEX:Android 把常量池合并了
DEX 是 Dalvik/ART 的字节码容器,一个 APK 里可以有多个 \`classes.dex\`。它的设计目标是手机存储小、启动快,所以**把所有类塞进一个文件,并让它们共享一个常量池**。
\`\`\`text
┌────────────────────────────────────┐
│ header(112 字节)                    │ magic "dex\\n035\\0"、checksum、
│                                    │ SHA-1 签名、file_size、各表偏移
├────────────────────────────────────┤
│ string_ids[]                       │ 字符串池:偏移 + MUTF-8 内容
│ type_ids[]                         │ 类型:指向 string_ids
│ method_ids[]                       │ 方法引用(8 字节/项)
│ class_defs[]                       │ 类定义:父类、接口、数据偏移
├────────────────────────────────────┤
│ data 区:code_item / 调试信息 / 字符串 │ 真正的字节码与元数据
└────────────────────────────────────┘
\`\`\`
\`code_item\` 是方法体的核心:\`registers_size\`、\`ins_size\`、\`outs_size\`、\`debug_info_off\`、\`insns_size\`、\`insns[]\`。这里没有"操作数栈" —— Dalvik 是**寄存器式**虚拟机,指令直接操作 v0/v1/v2。
| 维度 | class | DEX |
| --- | --- | --- |
| 虚拟机模型 | JVM 栈式,操作数栈 | Dalvik/ART 寄存器式 |
| 文件粒度 | 一个类一个文件 | 一个 dex 打包所有类 |
| 常量池 | 每个类独立 | 全局共享,字符串去重 |
| 典型指令 | iload / iadd / ireturn | add-int v0, v1, v2 |
| 方法数 | 无硬限制 | 单 dex 方法引用上限 65536 |
| 反编译工具 | javap / CFR / FernFlower | dexdump / baksmali / JADX |

**multidex 是被 65536 逼出来的**:\`method_ids\` 索引是 16 位,一个 dex 最多引用 65536 个方法,依赖一多就超,于是拆成 \`classes.dex\`、\`classes2.dex\`…… 逆向时别忘了逐个看。
## 格式与逆向的对应关系
| 你要找的东西 | PE 去哪看 | ELF 去哪看 | class/DEX 去哪看 |
| --- | --- | --- | --- |
| 入口与代码 | AddressOfEntryPoint + .text | e_entry + .text | main 方法 / code_item |
| 字符串线索 | .rdata + 资源节 | .rodata + .dynstr | 常量池 / string_ids |
| 外部调用 | 导入表 + IAT | .dynsym + .plt/.got | 方法引用 method_ids |
| 是否加壳 | 节名、熵、导入表数量 | 节名、熵、段异常 | dex 魔术与壳特征 |
## 本章小结
文件格式是逆向的地图。PE 教你看懂"头套头 + 节表 + 导入表",ELF 教你看懂"节与段分离 + PLT/GOT 延迟绑定",class 教你理解"自描述元数据为什么让反编译变简单",DEX 则展示了移动端为体积和启动速度做的取舍。看到陌生样本,按"魔数 → 头 → 表 → 内容"拆,永远比直接拖进反汇编器高效。
## 面试速记
- PE 三层:DOS 头(MZ,e_lfanew 在 0x3C)→ NT 头(PE 签名 + 文件头 + 可选头)→ 节表。
- RVA 转文件偏移:节首文件偏移 + (RVA - 节首 RVA);节对齐 0x200,内存对齐 0x1000。
- 导入表告诉你程序依赖谁;IAT 是运行时填地址的跳转表,也是 hook 的常见目标。
- ELF 的节给链接器、段给加载器;.plt 是跳板,.got 存真实地址,首次调用才解析。
- class 大端、常量池索引从 1 开始、long/double 占两个槽;DEX 是寄存器式、全局常量池、方法索引 16 位。
`,
  };

  window.REVERSE_EXTRA['ch04'] = {
    id: 'ch04',
    title: '静态分析工具链:IDA·Ghidra·Radare2',
    minutes: 45,
    points: ['静态分析流程', 'IDA 交叉引用', 'Ghidra 反编译', 'radare2 命令'],
    content: `
> [!danger] 静态分析也要授权
> 本章的 CrackMe 是**为教学自建的样本**,编译命令与源码都给出。把同样手法用在他人软件上,可能违反著作权法与用户协议;涉及商业软件的安全评估必须先拿到书面授权。CTF 题目和开源项目是安全的练习场。

> [!info] 本章导读 · 不运行程序,怎么知道它在干什么
> 修车师傅有两种判断方式:一种是点火听声音、踩油门看反应;另一种是把车升起来,拿手电照着看零件。前者是动态调试,后者就是静态分析 —— 不需要发动引擎,只靠结构、连线、零件上的编号,推断这台机器怎么工作。软件也一样:反汇编器把字节还原成指令,反编译器再把指令还原成近似 C 代码,你读代码就能知道它想干什么。
> - 读完本章你将能:按标准流程拆一个陌生样本,从字符串一路定位到校验函数
> - 说清 IDA 的 F5、交叉引用、FLIRT 签名分别解决什么问题
> - 读懂一份反编译伪代码,并判断哪些结论必须回汇编确认
> - 用 radare2 命令行完成同样的定位工作,不依赖图形界面
> [!tip] 日常电脑现场 · 杀毒软件在做什么
> 杀软"扫描"文件时,大多数时候并没有运行它,而是查特征、看导入表、比对哈希 —— 这就是自动化的静态分析,和本章的 IDA/Ghidra 思路同源。

## 静态分析的标准流程
拿到样本,按固定顺序走,比随机点开窗口高效得多:
\`\`\`text
① 查壳/查格式   file、DIE、PEiD:什么架构?有没有壳?什么编译器?
② 载入          选对架构与基址;PIE 程序先确认 rebase
③ 找入口        main / WinMain / OnInit / JNI_OnLoad;找不到就从字符串反推
④ 定位线索      字符串(Shift+F12)+ 导入表:报错文案、URL、API 名
⑤ 交叉引用      X / axt:谁引用了这条字符串?谁调用了这个函数?
⑥ 重命名 + F5   按语义命名函数与变量,再让反编译器生成伪代码
⑦ 记录结论      画调用关系、写伪代码、标注不确定处,便于复现
\`\`\`
流程的第 ④ 步最像"破案":程序总要对用户说点什么,错误提示、成功提示、日志、URL 都是它留下的口供。**从文案找引用,从引用找函数,从函数看逻辑**,这条链路能解决大部分 CrackMe 和恶意样本的入口问题。

> [!tip] 载入前先确认三件事
> 架构对不对(x86/x64/ARM)、字节序对不对、基址设得对不对。这三件错一个,反汇编出来就是一屏乱码或满屏错位的跳转。PIE/ASLR 程序在 IDA 里常以 0x0 为基址,看到地址是 0x11A0 这种小数值时不要慌,那是文件内偏移。
## IDA:把二进制变成一张地图
IDA 的核心不是"反汇编",而是**建立交叉引用图**:谁调用了谁、谁读了哪个全局变量、哪个字符串被哪个函数引用。你在这个图上做减法,一路缩小到关键函数。
| 窗口/功能 | 快捷键 | 作用 |
| --- | --- | --- |
| IDA View | 空格切图形/文本 | 反汇编主视图,基本块 + 跳转箭头 |
| Hex View | 无 | 原始字节,对照文件偏移 |
| Strings | Shift+F12 | 列出所有字符串及其地址 |
| Imports / Exports | 无 | 导入了哪些 API、导出了哪些函数 |
| Xrefs | X(或 Ctrl+X) | 谁引用了当前地址/字符串/函数 |
| Names | N | 重命名函数、变量、地址 |
| Functions | 无 | 函数列表,按地址或名称过滤 |
| Decompiler | F5 | 生成伪 C 代码(Hex-Rays) |
| FLIRT | 自动 | 用签名库识别静态链接的库函数 |
| Structures | 无 | 定义结构体,恢复字段访问 |

两个高频技巧:**FLIRT 签名**能识别出静态链接进来的 libc/OpenSSL 函数,把 \`sub_401136\` 直接变成 \`strlen\`,省掉大量猜测;**结构体恢复**则是把 \`*(int *)(this + 0x10)\` 变回 \`this->level\`,读起来立刻像源码。

> [!pitfall] 伪代码不是源码
> F5 的输出是"反编译器认为最可能的 C 代码",不是原始源码。优化会让变量复用、尾调用被折叠、switch 变成跳转表、有符号与无符号判断被省略。凡是涉及**边界条件、符号性、移位与除法**的地方,都要切回汇编确认。曾经有题目的坑就是伪代码把 \`unsigned\` 比较显示成了有符号比较。
## Ghidra:免费开源的全能选手
Ghidra 是 NSA 开源的逆向平台,功能覆盖反汇编、反编译、脚本、版本化协作。入门只要四步:**New Project → Import File → Analyze(默认分析器全勾)→ 双击函数看 Decompiler**。它的反编译器对 x86/ARM 都相当稳,适合没有 IDA 授权时做主力。

Ghidra 的真正优势是**可编程**:脚本管理器支持 Java 与 Python(Jython),可以批量给函数重命名、导出调用图、扫描常量。比如一句话思路:遍历所有函数,把调用了 \`strcmp\` 且第二个参数是字符串常量的函数标记为"疑似校验点"。
| 工具 | 授权 | 反编译 | 强项 | 短板 |
| --- | --- | --- | --- | --- |
| IDA Pro | 商业(有免费版) | Hex-Rays | 生态、签名、调试一体 | 贵,免费版限制多 |
| Ghidra | 免费开源 | 内置 | 脚本化、格式多、协作 | 启动慢,界面偏重 |
| radare2 / Cutter | 免费开源 | pdc/r2dec | 命令行、可脚本、轻量 | 命令多,学习曲线陡 |
| Binary Ninja | 商业 | 有 | API 友好、现代 UI | 生态相对小 |
| objdump + strings | 免费 | 无 | 快速定位、无需安装 | 没有交叉引用视图 |
## radare2:一条命令一个动作
r2 是命令行逆向工具,所有操作都是"命令 + 参数",非常适合写进脚本批量跑。
| 命令 | 作用 |
| --- | --- |
| \`r2 -A ./crackme\` | 载入并自动分析 |
| \`aaa\` | 全量分析函数与交叉引用 |
| \`afl\` | 列出所有函数 |
| \`s main\` | 跳转到 main |
| \`pdf @ main\` | 反汇编当前函数(print disassemble function) |
| \`iz\` | 列出字符串 |
| \`ii\` | 列出导入表 |
| \`axt @ str.WRONG\` | 查谁引用了这条字符串 |
| \`V\` / \`VV\` | 图形视图 / 函数调用图 |
| \`db 0x1189\` | 在地址上下断点(动态时用) |
| \`wx 9090 @ 0x11c9\` | 写两个 NOP(patch) |
\`\`\`shell
r2 -A ./crackme
\`\`\`
\`\`\`output
[0x00001060]> afl
0x00001060    1     42 entry0
0x00001189    7    121 sym.verify
0x00001204    1     78 main
\`\`\`
Cutter 是 r2 的图形前端,把 \`afl\`/\`pdf\` 变成可点击的列表和反编译窗口,适合不习惯命令行的同学;但底层还是同一套引擎。
## 实战:静态拆一个自建 CrackMe
样本源码如下,编译命令 \`gcc -O0 -fno-inline -o crackme crackme.c\`。密码没有以字符串形式出现,而是拆成 8 个字节的数组 —— 这正是静态分析要解决的问题。
\`\`\`c
#include <stdio.h>
#include <string.h>

static const unsigned char TARGET[8] = {
    0x72, 0x33, 0x76, 0x33, 0x72, 0x73, 0x65, 0x21
};

static int verify(const char *input) {
    if (strlen(input) != 8) {
        return 0;
    }
    for (int i = 0; i < 8; i++) {
        if ((unsigned char) input[i] != TARGET[i]) {
            return 0;
        }
    }
    return 1;
}

int main(void) {
    char buf[32];
    printf("password: ");
    if (fgets(buf, sizeof buf, stdin) == NULL) {
        return 1;
    }
    buf[strcspn(buf, "\\n")] = '\\0';
    puts(verify(buf) ? "OK" : "WRONG");
    return 0;
}
\`\`\`
第一步永远是看格式和字符串:
\`\`\`shell
file crackme
strings -n 4 crackme | grep -E "password|OK|WRONG"
\`\`\`
\`\`\`output
crackme: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV),
  dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, not stripped
password:
OK
WRONG
\`\`\`
字符串里没有密码,但有三条"口供":\`password:\` 说明这是输入提示,\`OK\` 与 \`WRONG\` 是两条分支的结果。在 IDA/Ghidra 里对 \`WRONG\` 按 X,找到引用它的 \`main\`,再顺着 \`call verify\` 进入校验函数。

校验函数的关键汇编如下(省略机器码字节列,只保留指令与操作数):
\`\`\`text
verify:
    push   rbp
    mov    rbp, rsp
    sub    rsp, 0x20
    mov    [rbp-0x18], rdi              ; 第 1 个参数 input
    mov    rax, [rbp-0x18]
    mov    rdi, rax
    call   strlen@plt
    cmp    rax, 8
    je     .len_ok                      ; 长度必须等于 8
    mov    eax, 0
    jmp    .done
.len_ok:
    mov    DWORD PTR [rbp-0x4], 0       ; i = 0
    jmp    .cond
.body:
    mov    rax, [rbp-0x18]
    movsxd rdx, DWORD PTR [rbp-0x4]
    add    rax, rdx
    movzx  eax, BYTE PTR [rax]          ; input[i]
    lea    rdx, [rip+0x2e96]            ; TARGET 的地址
    movsxd rcx, DWORD PTR [rbp-0x4]
    movzx  edx, BYTE PTR [rdx+rcx]      ; TARGET[i]
    cmp    eax, edx
    je     .next
    mov    eax, 0                       ; 任意一字节不等就失败
    jmp    .done
.next:
    add    DWORD PTR [rbp-0x4], 1
.cond:
    cmp    DWORD PTR [rbp-0x4], 7
    jle    .body
    mov    eax, 1
.done:
    leave
    ret
\`\`\`
看懂了什么:函数先比较长度,再逐字节比较 input 与一个**全局数组**。数组地址通过 \`lea rdx, [rip+0x2e96]\` 取得,说明它位于 .data 或 .rodata。切到 Hex View 看这个地址,八个字节一目了然。F5 之后得到更直观的伪代码:
\`\`\`c
int verify(char *input)
{
  int i;

  if (strlen(input) != 8)
    return 0;
  for (i = 0; i < 8; ++i) {
    if (input[i] != TARGET[i])
      return 0;
  }
  return 1;
}
\`\`\`
结论:把 TARGET 的八个字节按 ASCII 读出来,是 \`r3v3rse!\`。**静态分析没有运行程序,就拿到了密码** —— 因为比较用的常量必须存在于文件里,区别只是它藏在数组而不是字符串里。

> [!interview] 面试官视角:为什么"硬编码密码"一定藏不住
> 程序要比较,就必须把被比较的值放进内存或立即数;只要它在文件里,静态分析就能读到。真正的防护不是"藏",而是让校验依赖**运行时才有的东西**:服务端下发的令牌、设备指纹、代码签名、加密狗。反过来,这也是你做后端设计时的原则:客户端只做体验,判定放服务端。
## 静态分析的边界
| 障碍 | 你看到的现象 | 对策 | 为什么需要动态 |
| --- | --- | --- | --- |
| 加壳 | 入口在壳段,导入表极少,节名 UPX0/UPX1 | 查壳 → 脱壳或内存 dump | 壳在运行时才还原真实代码 |
| 字符串加密 | 文件里全是乱码,运行时才解密 | 在解密函数返回处下断 | 明文只在内存里出现 |
| 控制流混淆 | 大段跳转、花指令、状态机 | 动态跟踪真实路径 | 静态读不出哪条路真的走 |
| 自修改代码 | 代码段运行时被改写 | 内存断点/硬件断点 | 文件里的代码不是最终代码 |
| 反调试 | 一挂调试器就退出 | 先静态找检测点,再动态绕过 | 检测逻辑本身要跑起来才触发 |

这张表的结论是:**静态负责"看懂结构",动态负责"看清取值"**。遇到壳和运行时解密,先静态找到解密函数与检测点,再进动态调试 —— 这也是下一章《动态调试:断点、单步与 x64dbg/gdb 实战》要解决的问题。
## 本章小结
静态分析是一套"从线索到结构"的方法:先查格式与壳,再从字符串和导入表找入口,用交叉引用把调用关系连成图,最后靠反编译器读懂逻辑。工具只是放大器,真正的功夫是**知道下一步该看哪里**。同时要记住它的边界:凡是运行时才产生的东西(解密后的字符串、动态分配的地址、环境相关的分支),静态都只能猜。
## 面试速记
- 静态分析流程:查壳 → 载入 → 找入口 → 字符串/导入表 → 交叉引用 → 重命名 → F5。
- IDA 三件宝:F5 伪代码、X 交叉引用、N 重命名;FLIRT 用来识别库函数。
- Ghidra 免费开源、脚本化强;radare2 命令行适合自动化,Cutter 是它的图形壳。
- 硬编码常量一定藏在文件里;字符串定位 + 交叉引用是最高效的入口。
- 反编译伪代码要回汇编确认边界、符号性与优化改写;遇到壳/加密必须转动态。
`,
  };

  window.REVERSE_EXTRA['ch05'] = {
    id: 'ch05',
    title: '动态调试:断点、单步与 x64dbg/gdb 实战',
    minutes: 50,
    points: ['断点类型', 'x64dbg 操作', 'gdb 命令', '反调试初步'],
    content: `
> [!danger] 调试器只对自己的程序开
> 本章样本是**自己编译的 CrackMe**,源码与命令都给出。对他人软件附加调试器、修改内存、绕过校验,在很多场景下违法或违约。授权评估要有书面范围,CTF 与自己的程序随便折腾。

> [!info] 本章导读 · 程序卡住了,怎么知道它停在哪个判断上
> 静态分析像看地图,动态调试像看行车记录仪。地图告诉你"这里有个岔路口",记录仪告诉你"车实际拐向了哪边、当时速度多少"。程序里成百上千个 if,静态读只能猜哪条重要;把程序跑起来、在关键位置按下暂停,寄存器里的值、栈上的返回地址、标志位的状态,会直接把答案摊在你面前。
> - 读完本章你将能:说清断点、单步、继续三种操作在 CPU 层面到底做了什么
> - 用 x64dbg 与 gdb 各自定位"输入错误密码后的那次跳转"
> - 读懂 ZF 标志与 \`je\` 的关系,并用改标志位或 patch 两种方式通过校验
> - 识别 IsDebuggerPresent、PEB.BeingDebugged、时间差三类反调试
> [!tip] 日常电脑现场 · F12 与 IDEA Debug
> 浏览器 F12 给 JS 打断点、IDEA 里 Debug 看变量、F8 单步 —— 你早就在用调试器了。x64dbg/gdb 只是把同样的操作搬到了机器码层面。

## 调试器到底在做什么
调试器不是"魔法视角",它靠操作系统提供的调试接口工作:程序每发生一次异常(包括断点这种人为异常),控制权先交给调试器,调试器读取寄存器与内存,决定是继续、单步,还是把异常交还给程序。
\`\`\`text
Windows:
  CreateProcess(DEBUG_ONLY_THIS_PROCESS) 或 DebugActiveProcess(pid)
    → WaitForDebugEvent(&ev, INFINITE)
    → 处理 CREATE_PROCESS / LOAD_DLL / EXCEPTION / EXIT_PROCESS
    → ContinueDebugEvent(pid, tid, DBG_CONTINUE 或 DBG_EXCEPTION_NOT_HANDLED)

Linux:
  ptrace(PTRACE_TRACEME) 或 ptrace(PTRACE_ATTACH, pid)
    → 子进程收到 SIGTRAP 停下
    → waitpid() 拿到停止状态
    → ptrace(PTRACE_PEEKTEXT / POKETEXT) 读写内存与寄存器
\`\`\`
因为要读写**别的进程**的内存和寄存器,调试是特权操作:Windows 需要 \`SeDebugPrivilege\`(管理员默认有),Linux 要求同 uid 且 \`/proc/sys/kernel/yama/ptrace_scope\` 允许,或者有 \`CAP_SYS_PTRACE\`。权限不够时,\`OpenProcess\` 直接失败,调试器只能干瞪眼。
## 四种断点:各有各的适用场景
| 类型 | 实现方式 | 数量限制 | 是否改内存 | 典型场景 |
| --- | --- | --- | --- | --- |
| 软件断点 | 把指令首字节改成 0xCC(INT3) | 不限 | 是,改代码段 | 常规代码断点 |
| 硬件断点 | 调试寄存器 DR0~DR3 记录地址 | 最多 4 个 | 否 | 反调试程序、监控读写 |
| 内存断点 | 把整页设为 Guard/不可访问 | 受页数限制 | 改页属性 | 找"谁改了这个变量" |
| 条件断点 | 每次命中后由调试器判断表达式 | 不限但很慢 | 视底层断点而定 | 循环里等特定值 |

软件断点的完整流程值得记住:\`0xCC\` 是单字节指令 \`int3\`,CPU 执行到就抛 #BP 异常;调试器收到异常,把原字节写回、把 RIP 减一(因为异常报告的是下一条指令),暂停在你眼前;继续执行时再写回 \`0xCC\`。**所以软件断点本质上是在改代码** —— 这也解释了为什么带代码段校验的程序一被下断就崩,而硬件断点不改内存,能躲过这种检测。
## x64dbg:Windows 下的主力
| 快捷键 | 作用 |
| --- | --- |
| F2 | 在光标处下/取消断点 |
| F3 | 打开文件、选择要调试的程序 |
| F4 | 运行到光标所在行 |
| F7 | 步入(Step Into),遇到 call 会跟进去 |
| F8 | 步过(Step Over),把 call 当一条指令执行 |
| F9 | 运行(遇到断点才停) |
| F12 | 暂停正在运行的程序 |
| Ctrl+F2 | 重新开始调试 |
| Ctrl+G | 跳转到地址或表达式 |
| 空格 | 汇编/修改当前指令(patch 入口) |

界面分四块,读法要固定:

1. **CPU 窗口**:左边反汇编(地址、机器码、指令、注释),右边寄存器和标志位。RIP 指向下一条要执行的指令。
2. **Dump 窗口**:内存十六进制视图。Ctrl+G 输入地址可以跳过去,右键可切换显示格式(字节/双字/ASCII)。
3. **Stack 窗口**:栈顶就是返回地址(call 压入的那一个),下面是参数与局部变量。Windows x64 还要注意 32 字节 shadow space,别把它误当成参数。
4. **断点/日志窗口**:列出所有断点与命中记录,排查"为什么没断"时先看这里。

> [!pitfall] 断点没命中,先查三件事
> ① 地址是否属于当前进程(ASLR 后基址每次不同,用模块名+偏移而不是绝对地址);② 断点是否被写回(某些保护会定期校验代码段并恢复原始字节);③ 代码是否根本没执行到(分支走的是另一条路)。按 F9 全速跑一遍、看日志窗口,比盯着屏幕猜有效。
## gdb:Linux 下的同款能力
| 命令 | 作用 |
| --- | --- |
| \`b check\` / \`b *0x401136\` | 按符号或地址下断点 |
| \`r\` | 运行 |
| \`ni\` / \`si\` | 汇编级步过 / 步入 |
| \`finish\` | 运行到当前函数返回,并打印返回值 |
| \`c\` | 继续运行 |
| \`bt\` | 打印调用栈 |
| \`i r\` | 查看所有寄存器 |
| \`x/20gx $rsp\` | 以 8 字节为单位看 20 项栈内容 |
| \`x/s 0x555555556004\` | 把地址当字符串看 |
| \`disas /r\` | 反汇编当前函数,带机器码 |
| \`p/x $eax\` | 以十六进制打印寄存器 |
\`\`\`shell
gcc -O0 -g -o crackme crackme.c
gdb -q ./crackme
\`\`\`
\`\`\`output
(gdb) b check
Breakpoint 1 at 0x1189: file crackme.c, line 6.
(gdb) r
Starting program: /home/ctf/crackme
password: hello
Breakpoint 1, check (input=0x7fffffffe2a0 "hello") at crackme.c:6
6       if (strcmp(input, "s3cr3t!") == 0) {
(gdb) finish
Run till exit from #0  check (input=0x7fffffffe2a0 "hello") at crackme.c:6
0x00005555555551c9 in main () at crackme.c:16
16          if (check(buf)) {
Value returned is $1 = 0
(gdb) ni
17              puts("WRONG");
(gdb) i r eax eflags
eax            0x0                 0
eflags         0x246               [ PF ZF IF ]
\`\`\`
读法:\`finish\` 显示 check 返回 0(密码错),\`ni\` 执行 \`test eax,eax\` 后 ZF=1,\`je\` 就会跳到 WRONG 分支。**看跳转先看 ZF,看 ZF 先看它是被哪条指令设置的** —— 这就是动态调试的核心动作。
## 实战:定位关键跳转,然后让校验通过
样本只有二十来行,密码硬编码,便于把注意力放在调试流程上。编译:\`gcc -O0 -g -o crackme crackme.c\`。
\`\`\`c
#include <stdio.h>
#include <string.h>

int check(const char *input) {
    return strcmp(input, "s3cr3t!") == 0;
}

int main(void) {
    char buf[32];
    printf("password: ");
    if (fgets(buf, sizeof buf, stdin) == NULL) return 1;
    buf[strcspn(buf, "\\n")] = '\\0';
    if (check(buf)) {
        puts("OK");
    } else {
        puts("WRONG");
    }
    return 0;
}
\`\`\`
调用点的汇编(省略字节码列):
\`\`\`text
    lea    rdi, [rbp-0x30]        ; buf
    call   check
    test   eax, eax               ; eax == 0 ?
    je     .wrong                 ; ZF=1(相等)就跳 WRONG
    lea    rdi, [rip+0xe70]       ; "OK"
    call   puts
    jmp    .end
.wrong:
    lea    rdi, [rip+0xe63]       ; "WRONG"
    call   puts
.end:
\`\`\`
操作步骤(输入错误密码 \`hello\`):

1. 在 \`test eax, eax\` 上下断点(x64dbg 用 F2,gdb 用 \`b *地址\`)。
2. 运行时输入 hello,程序停在断点;按 F8 步过这条 \`test\`(它只改标志、不改内存),此时 ZF=1,RIP 指向 \`je\`。
3. 按 F7 步入 \`je\`:因为 ZF=1,跳转发生,RIP 落到 \`.wrong\`。这就是**关键跳转**。
4. 想让它通过,有两条路:改标志位,或 patch 指令。
\`\`\`output
x64dbg CPU 窗口(停在 test 之后)
RAX  0000000000000000    ZF=1  PF=1  IF=1
RIP  00007FF6A1B211C4    je crackme.7FF6A1B211D6
RSP  000000C0001FF8E0    00007FF6A1B211C9   ; 返回地址
\`\`\`
改标志位最直接:双击 EFLAGS 里的 ZF 或右键 Modify flags,把 1 改成 0,然后 F9 继续 —— 程序会打印 OK。缺点是只对当前进程这一次有效,重启就没了。

patch 更持久,常见三种改法:
| 目标 | 原字节 | 补丁 | 效果 |
| --- | --- | --- | --- |
| 永不跳 WRONG | 0F 84 xx xx xx xx | 90 90 90 90 90 90 | 任意输入都落到 OK |
| 反转判断 | 0F 84 xx xx xx xx | 0F 85 xx xx xx xx | 正确密码反而失败(仅演示) |
| 强制非零 | 85 C0(test eax,eax) | FF C0(inc eax) | eax 变非 0,ZF=0,不跳 |

第三种最优雅:同样两个字节,\`test\` 换成 \`inc\` 后,eax 从 0 变 1、从 1 变 2,ZF 必为 0,\`je\` 永远不成立。x64dbg 里选中该行按空格,直接输入 \`inc eax\`,回车即生效;改完用"补丁"功能保存到文件才能持久化。

> [!tip] 为什么练习要 patch 两次
> 第一次改内存,理解"标志位驱动分支";第二次改文件,理解"文件里的字节才是程序的真相"。两者结合,你才能回答面试里的"你怎么绕过校验"而不只是"我会按 F8"。
## 反调试初步:程序怎么知道你在看它
| 手段 | 原理 | 现象 | 绕过思路(教育向) |
| --- | --- | --- | --- |
| IsDebuggerPresent | 读 PEB.BeingDebugged 字节 | 返回非 0 就走异常分支 | patch 返回值为 0,或改 PEB 那一个字节 |
| 直接读 PEB | x64 用 gs:[0x60],x86 用 fs:[0x30] | 静态看不出,运行才触发 | 同上;或换用不改内存的硬件断点 |
| CheckRemoteDebuggerPresent | 查询调试端口 | 被调试时返回真 | patch 返回值,或 Hook 该 API |
| 时间差检测 | rdtsc / GetTickCount 前后差值 | 单步会让时间异常变长 | 在比较处下断,直接把差值改成正常值 |
| 异常陷阱 | 故意触发异常看谁接管 | 调试器先收到异常 | 配置调试器忽略该异常类型 |
| 代码段校验 | 计算 .text 的 CRC/哈希 | 下软件断点就崩 | 用硬件断点,不改代码字节 |

直接读 PEB 的代码长这样,两条指令就能拿到"是否被调试":
\`\`\`text
    mov    rax, gs:[0x60]              ; x64: PEB 基址
    movzx  eax, BYTE PTR [rax+0x2]     ; PEB.BeingDebugged
    test   eax, eax
    jne    .debugger_detected
\`\`\`
> [!interview] 面试怎么答"反调试与绕过"
> 先分类:API 层(IsDebuggerPresent)、数据结构层(PEB.BeingDebugged)、行为层(时间差、异常)、代码完整性层(CRC)。再说对抗:API 层可 patch 返回值,结构层可改内存字节,行为层可下断改比较值,完整性层只能用硬件断点绕开"改代码"这件事。最后补一句:**反调试只是提高成本,不能阻止有权限的调试者** —— 这和"客户端不可信"是同一个道理。
## 本章小结
调试器的本质是"接管异常 + 读写现场"。断点让你在关键位置暂停,单步让你看清每条指令如何改变寄存器与标志位,栈窗口让你还原调用链。定位校验的逻辑很固定:找输入 → 找比较 → 找受比较结果影响的条件跳转 → 看 ZF → 改标志位或 patch。反调试则是这条链上的路障,识别类型再逐层绕开。
## 面试速记
- 调试器靠调试事件 / ptrace 工作;Windows 需 SeDebugPrivilege,Linux 受 ptrace_scope 限制。
- 软件断点 = 写 0xCC(INT3);硬件断点用 DR0~DR3,最多 4 个且不改内存;内存断点靠页保护。
- x64dbg:F2 断点、F7 步入、F8 步过、F9 运行、Ctrl+G 跳地址、空格汇编。
- 关键跳转 = cmp/test + 条件跳转;je 看 ZF,ZF=1 表示比较结果为零。
- 通过校验:改 ZF、把 je 换成 NOP、把 test 换成 inc;反调试靠 PEB/时间差/CRC,绕过靠 patch 与硬件断点。
`,
  };

  window.REVERSE_EXTRA_IQ.push({ q: '0x41414141 为什么会变成 AAAA?这说明了什么?', a: '0x41 是十进制 65,ASCII 里 65 对应大写字母 A,四个字节 41 41 41 41 连续排列就是字符串 AAAA。它说明**内存里没有类型,只有字节**,同一串字节按 int 读、按 char 读、按指令读会得到完全不同的结果;类型是读取者附加的解释框架。这也是栈溢出覆盖返回地址时最经典的标记。' });
  window.REVERSE_EXTRA_IQ.push({ q: '大端和小端的区别?x86、网络序、Java 各用哪种?', a: '大端把高位字节放低地址(0x12345678 → 12 34 56 78),小端把低位字节放低地址(→ 78 56 34 12)。x86/x64 是小端;TCP/IP 网络序是大端;Java 的 ByteBuffer 与 DataOutputStream 默认大端,因为 class 文件与网络协议都按大端定义。JVM 的 nativeOrder 在 x86 上返回 LITTLE_ENDIAN。' });
  window.REVERSE_EXTRA_IQ.push({ q: '补码为什么用取反加一?-1 在 32 位里怎么表示?', a: '补码让减法可以用加法器完成:减去一个数等于加上它的补码,硬件只需要一套加法电路。规则是负数 = 取反加一,+5 是 0x00000005,取反 0xFFFFFFFA,加一 0xFFFFFFFB 即 -5。全 1 的 0xFFFFFFFF 就是 -1;0x80000000 是 -2147483648,它取负仍是自己,所以 Math.abs(Integer.MIN_VALUE) 会返回负数。' });
  window.REVERSE_EXTRA_IQ.push({ q: '栈帧里有什么?函数调用时 rbp 和 rsp 怎么变化?', a: '高地址到低地址依次是:调用者栈帧、第 7 个以后的参数(x64)、返回地址、保存的 rbp、局部变量。入口执行 push rbp(保存旧帧)、mov rbp,rsp(立新锚点)、sub rsp,N(开局部空间);出口 leave 等价于 mov rsp,rbp 加 pop rbp,再 ret 弹出返回地址。局部变量用 rbp 负偏移访问,返回地址在 rbp+8。' });
  window.REVERSE_EXTRA_IQ.push({ q: 'x64 的 Windows 与 System V 调用约定有什么区别?this 指针在哪?', a: 'System V(Linux/macOS)前六个参数依次放 rdi、rsi、rdx、rcx、r8、r9;Windows x64 前四个放 rcx、rdx、r8、r9,并且调用者要预留 32 字节 shadow space。两者返回值都在 rax,栈要求 16 字节对齐。C++ 成员函数的 this 走第一个参数位:Windows 是 rcx,SysV 是 rdi。' });
  window.REVERSE_EXTRA_IQ.push({ q: 'cmp 和 test 有什么区别?je 依据哪个标志位?', a: 'cmp a,b 做 a-b 但只改标志位,不保存结果;test a,b 做 a&b 也只改标志位,常用于 test eax,eax 判断是否为零。je/jz 依据 ZF:ZF=1 表示结果为零或两数相等。jl/jg 看 SF 与 OF 的组合,jb/ja 看 CF,分别对应有符号和无符号比较。' });
  window.REVERSE_EXTRA_IQ.push({ q: 'PE 文件里 RVA 和文件偏移怎么换算?为什么不一样?', a: '文件偏移 = 节的 PointerToRawData + (RVA - 节的 VirtualAddress)。不一样是因为节在文件里按 0x200(FileAlignment)对齐,加载到内存按 0x1000(SectionAlignment)对齐,中间有填充。例:.text 的 RVA 0x1000、文件偏移 0x400,则 RVA 0x11A0 对应文件偏移 0x5A0。' });
  window.REVERSE_EXTRA_IQ.push({ q: '导入表和 IAT 是什么?为什么逆向先看导入表?', a: '导入表记录程序依赖哪些 DLL 的哪些函数;加载器解析后把真实地址写进 IAT(Import Address Table),代码通过 call [IAT 槽位] 间接调用。看导入表能快速判断行为:ws2_32 说明联网,CryptDecrypt 说明解密,IsDebuggerPresent 说明可能反调试,RegSetValue 说明写注册表。IAT 是可写数据,也是 IAT hook 的目标。' });
  window.REVERSE_EXTRA_IQ.push({ q: 'ELF 的 .plt 和 .got 如何实现延迟绑定?', a: '调用外部函数时先跳到 PLT 跳板,PLT 执行 jmp [GOT 槽位]。第一次调用时 GOT 里还是解析器地址,会触发动态链接器解析符号,并把真实地址写回 GOT;之后再次调用就直接跳到真实函数。这就是延迟绑定:启动时不解析全部符号,把成本摊到首次调用。GOT 可写,所以存在 GOT overwrite 攻击,现代系统用 RELRO 在启动后把它设为只读。' });
  window.REVERSE_EXTRA_IQ.push({ q: 'class 文件里有什么?常量池索引为什么从 1 开始?long/double 为什么占两个槽?', a: '结构是魔数 0xCAFEBABE、版本号、常量池、访问标志、this/super、字段表、方法表(含 Code 属性)、属性表。常量池 0 号被保留表示“不引用任何常量”,所以 constant_pool_count = 实际条目 + 1。long 和 double 是 8 字节,在池里占两个槽位,第二项是无效占位,遍历时要跳过。' });
  window.REVERSE_EXTRA_IQ.push({ q: 'DEX 与 class 有哪些关键差异?multidex 是怎么来的?', a: 'class 面向 JVM、栈式虚拟机、一个类一个文件、每类独立常量池;DEX 面向 Dalvik/ART、寄存器式虚拟机、一个文件打包所有类、全局共享常量池,指令直接操作 v0/v1 寄存器。DEX 的 method_ids 用 16 位索引,单个 dex 最多引用 65536 个方法,超出就要拆成 classes.dex、classes2.dex,这就是 multidex。' });
  window.REVERSE_EXTRA_IQ.push({ q: '静态分析的标准流程是什么?拿到样本第一步做什么?', a: '先查格式与壳(file、DIE),再载入并选对架构/基址,然后找入口(main/WinMain/OnInit),用字符串和导入表定位线索,通过交叉引用把调用关系连起来,重命名后按 F5 看伪代码,最后记录结论。第一步绝不是直接拖进 IDA,而是回答“什么格式、什么架构、有没有壳”。' });
  window.REVERSE_EXTRA_IQ.push({ q: '怎么从一条字符串定位到校验函数?', a: '在 IDA 里 Shift+F12 打开字符串窗口,找到“密码错误/OK/登录失败”这类文案,按 X 看交叉引用,跳到引用它的函数,再顺着 call 进入被调用的校验函数。radare2 里对应 izz 找字符串、axt @ str.xxx 查引用。核心链路是:文案 → 引用 → 函数 → 逻辑。' });
  window.REVERSE_EXTRA_IQ.push({ q: '反编译得到的伪代码可信吗?哪些地方必须回汇编确认?', a: '伪代码是反编译器的推测,不是源码。优化会导致变量复用、尾调用折叠、switch 变跳转表,有符号/无符号与边界条件也可能被简化。涉及比较符号性、移位与除法、数组边界、异常路径的地方必须回汇编确认。经验是:伪代码用来理解意图,汇编用来确认事实。' });
  window.REVERSE_EXTRA_IQ.push({ q: '软件断点的原理是什么?为什么带代码校验的程序一被下断就崩?', a: '软件断点把目标指令首字节替换成 0xCC(INT3),CPU 执行到就抛 #BP 异常,调试器接管后把原字节写回、把 RIP 减一,继续时再写回 0xCC。因为它**修改了代码段字节**,带 CRC/哈希校验的程序会发现代码被改而退出。硬件断点不改内存,用 DR0~DR3 记录地址,能绕过这种检测。' });
  window.REVERSE_EXTRA_IQ.push({ q: '为什么硬件断点最多只有 4 个?它和内存断点有什么区别?', a: '硬件断点依赖 CPU 调试寄存器 DR0~DR3,只有四个地址槽位,所以最多四个,且不改内存,可以断执行、写入或读写。内存断点是把整个内存页设为 Guard/不可访问,由缺页异常触发,能监控一大片区域,但粒度粗、开销大,适合找“谁改了这个变量”,不适合精确定位单条指令。' });
  window.REVERSE_EXTRA_IQ.push({ q: '怎么定位“输入错误密码后的关键跳转”?ZF 起什么作用?', a: '先在输入函数返回处或比较函数(call strcmp)下断,运行后输入错误密码,单步到 test/cmp 指令,看 ZF:结果为 0 时 ZF=1,后面的 je 就会跳走。用 F7 步入那条 je,确认它跳到错误分支,这条就是关键跳转。之后可以改 ZF、把 je 换成 NOP,或把 test 换成 inc eax 让 ZF 恒为 0。' });
  window.REVERSE_EXTRA_IQ.push({ q: '反调试常见手段有哪些?对应怎么绕过?', a: 'API 层 IsDebuggerPresent、CheckRemoteDebuggerPresent;数据结构层直接读 PEB.BeingDebugged(x64 是 gs:[0x60]+0x2);行为层用 rdtsc 或 GetTickCount 测时间差、故意触发异常看谁接管;完整性层对代码段做 CRC。绕过分别是:patch 返回值、改 PEB 字节、在比较处改时间值/配置调试器忽略异常、改用硬件断点避免改代码。核心结论是反调试只提高成本,不能阻止有权限的调试者。' });
})();
