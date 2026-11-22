/* ═══════════════════════════════════════════════════════════
   模块:逆向工程 · 进阶扩展(3 章)
   内容:native so 与加固脱壳 / Hook 运行时插桩 / 抓包与协议逆向
   定位:进阶 · 全程仅限自有 App、授权测试、CTF
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.REVERSE_EXTRA = window.REVERSE_EXTRA || {};
  window.REVERSE_EXTRA_IQ = window.REVERSE_EXTRA_IQ || [];

  /* ─────────────────────────────────────────── */
  window.REVERSE_EXTRA['ch10'] = {
    id: 'ch10',
    title: 'Android 进阶:native so、ARM 汇编与加固脱壳',
    minutes: 45,
    points: ["JNI 与 so","ARM64 汇编","加固原理","脱壳思路"],
    content: `
> [!danger] 本章边界:只在自有样本上动手
> so 分析、内存 dump、脱壳实验只对**自己开发的 App、开源样本、CTF 靶场**进行;对第三方商业 App 脱壳再分发,可能同时踩到著作权与《网络安全法》。

> [!info] 本章导读 · 为什么加固后的 App,jadx 里只剩空壳?
> 把一个加固包拖进 jadx,期待成百上千个类,结果只吐出七个文件:一个 StubApp、一个空 Application、几个工具类,业务代码一行没有;反倒 lib/arm64-v8a 下多出一个几 MB 的陌生 so。本章顺着这道"空壳"往里走:认 JNI 边界、读 ARM64 汇编、看壳把 dex 藏到哪、脱壳又在哪一步截下明文。
> - 读完本章你将能:用 readelf 与 nm 判断 JNI 函数是静态还是动态注册
> - 读懂 ARM64 常用指令,把一段反汇编还原成 if / return
> - 画出加固 App 的启动链,说清"内存 dump"为什么绕不过去

> [!tip] 日常电脑现场 · 手机游戏为什么几个 G
> 安装包最大的部分往往不是图片,而是 lib 目录下的 so 库(游戏引擎/音视频/加固)。本章就从这些 so 讲起。

## 空壳的第一现场
先把"空壳"量化:

\`\`\`shell
jadx -d out app-release.apk
find out/sources -name "*.java" | wc -l
tree -L 2 out/resources/lib
\`\`\`

\`\`\`output
7
out/resources/lib
├── arm64-v8a
│   ├── libjiagu_a64.so
│   └── libnative-lib.so
└── armeabi-v7a
    └── libjiagu.so
\`\`\`

七个 Java 文件、两个 so、外加一个几 MB 的 assets 二进制 —— 典型的壳。==你看到的 classes.dex 只是引信,炸药在 so 和加密数据里。==

| 现象 | 真相 |
| --- | --- |
| jadx 只有 StubApp / 空 Application | 真实 dex 被加密,启动后才解密加载 |
| lib/ 下多出几 MB 的陌生 so | 壳的 native 引擎:解密、校验、反调试 |
| assets/ 里有 .dat / .bin 大文件 | 加密后的 dex 或资源,常改名伪装 |
| 重打包后启动即闪退 | 签名与完整性校验在 native 层 |

\`\`\`diagram:d-android-stack
\`\`\`

搞清这条"Java → JNI → so"的边界,后面脱壳和 native 分析才有坐标系。

## JNI 边界:Java 世界与 native 世界
Java 侧只留一句声明,实现由 so 提供:

\`\`\`java
package com.example.nativeapp;

public class License {
    static { System.loadLibrary("native-lib"); }        // 加载 libnative-lib.so
    public static native boolean checkLicense(int type);
}
\`\`\`

**静态注册**按"包名_类名_方法名"拼符号(点变下划线、下划线变 \`_1\`),so 必须导出 \`Java_com_example_nativeapp_License_checkLicense\` 这样的长名,ART 首次调用时 dlsym 查找 —— ==名字即地图,一搜就穿==。**动态注册**相反:so 由 \`JNI_OnLoad\` 把 \`{名字, 签名, 函数指针}\` 表交给 ART,导出表里干干净净,加固与商业 App 几乎都选它。

\`\`\`c
#include <jni.h>

static jboolean check(JNIEnv *env, jclass clazz, jint type) {
    return type == 1 ? JNI_TRUE : JNI_FALSE;         // 1 = 正式版
}

static const JNINativeMethod gMethods[] = {
    {"checkLicense", "(I)Z", (void *) check}         // 64 位下每项 24 字节
};

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *reserved) {
    JNIEnv *env = NULL;
    if ((*vm)->GetEnv(vm, (void **) &env, JNI_VERSION_1_6) != JNI_OK) return JNI_ERR;
    jclass clazz = (*env)->FindClass(env, "com/example/nativeapp/License");
    (*env)->RegisterNatives(env, clazz, gMethods, 1);
    return JNI_VERSION_1_6;
}
\`\`\`

> [!interview] 面试常问:怎么区分静态与动态注册?
> 一条命令:\`nm -D libxxx.so | grep Java_\`。有就是静态;没有但导出了 \`JNI_OnLoad\`、反汇编里又调用 \`RegisterNatives\`,基本是动态。==静态注册是"名字即地图",动态注册是"指针藏在数据表里"==,后者要做的是找到那张表:64 位下按 24 字节一项解析 \`JNINativeMethod\`,能一次拿到所有 native 入口。

## so 文件解剖:ELF for ARM64
\`\`\`shell
file libnative-lib.so
readelf -h libnative-lib.so | grep -E "Magic|Type|Machine"
nm -D --defined-only libnative-lib.so | head -4
\`\`\`

\`\`\`output
libnative-lib.so: ELF 64-bit LSB shared object, ARM aarch64, version 1 (SYSV), dynamically linked, stripped
  Magic:   7f 45 4c 46 02 01 01 00 00 00 00 00 00 00 00 00
  Type:                              DYN (Shared object file)
  Machine:                           AArch64
0000000000012a30 T Java_com_example_nativeapp_License_checkLicense
0000000000012b04 T JNI_OnLoad
0000000000012c50 T Java_com_example_nativeapp_License_nativeSign
0000000000013d18 T _ZN7Decoder6decodeEPKhm
\`\`\`

四个字段抓重点:**ELF64 / AArch64 / DYN**(可加载到任意地址的共享对象)/ **stripped**。\`nm -D\` 看的是**动态符号表**:静态注册的 JNI 就在这几行里,\`T\` 是代码段全局符号,\`_Z...\` 是 C++ 名字修饰;壳真正做事的函数常写在 \`.init_array\` 里,比 JNI_OnLoad 更早执行。

> [!pitfall] stripped 不等于没有符号
> strip 删的是 **.symtab**(调试用),删不掉 **.dynsym**(动态链接器要靠它解析)。所以静态注册的 JNI 在 stripped 的 so 里依然能被 \`nm -D\` 看见;连 \`JNI_OnLoad\` 都没有的 so,大概率只是壳的数据容器。

## ARM64 汇编速览与调用链
| 寄存器 | 约定用途 |
| --- | --- |
| x0 - x7 | 前 8 个整型/指针参数;x0 兼作返回值 |
| x8 | 间接结果指针,或系统调用号 |
| x9 - x15,x16 - x17 | 调用者保存的临时寄存器 / 链接器暂存(IP0、IP1) |
| x19 - x28 | 被调用者保存,返回前必须还原 |
| x29 / x30 | 帧指针 FP / 返回地址 LR |
| sp / pc / wN | 栈指针(16 字节对齐)/ 程序计数器 / xN 的低 32 位 |

| 指令 | 含义 | Java 里的影子 |
| --- | --- | --- |
| ldr w0, [x1, #8] | 从内存读 4 字节 | 读对象字段 |
| str w0, [sp, #12] | 往内存写 4 字节 | 赋值 / 落栈 |
| mov / add / sub | 立即数、加减、调栈 | int a = 1 |
| cmp + b.eq / b.ne / b.lt | 比较后条件跳转 | if / else / 循环 |
| cbz / cbnz w0, label | 为 0 / 非 0 跳转 | if (x == 0) |
| bl target / ret | 调用(返回地址进 x30)/ 返回 | 方法调用 / return |
| adrp + add / ldp / stp | 取页基址加偏移 / 成对读写 | 取常量地址 / 保存现场 |

读懂一张反汇编的全部技巧,就是上面这张表的组合:\`sub sp, sp, #16\` 开栈帧,\`str w0, [sp, #12]\` 把参数落栈,\`cmp w8, #1\` + \`b.ne\` 是 if 条件不成立跳走,\`mov w0, #1\` 与 \`mov w0, #0\` 是两个 return 分支 —— 十二行 O0 代码合起来只有一句 \`return type == 1;\`。开 -O2 后它会压成 \`cmp w0, #1\` + \`cset w0, eq\` + \`ret\` 三行。

\`\`\`text
Java:  License.checkLicense(1)
  │    invoke-static → ArtMethod(access_flags 含 kAccNative)
  ▼
ART:   art_jni_dlsym_lookup_stub / generic JNI trampoline
  │    ① 静态注册:dlsym(so, "Java_com_example_nativeapp_License_checkLicense")
  │    ② 动态注册:查 RegisterNatives 填的 gMethods → fnPtr
  ▼
so:    check_license(x0=JNIEnv*, x1=jclass, x2=type),返回值放 x0
\`\`\`

> [!pitfall] w0 和 x0 混用会读出垃圾
> \`ldr w0, [x1]\` 只读 4 字节并清零高 32 位;若 [x1] 是指针,读完只剩半截,后面 \`blr\` 必崩。==指针一律用 x 寄存器,int/bool 才用 w==。

## 加固:壳把 dex 藏到哪里
\`\`\`text
Zygote fork 出 App 进程
  ↓ ① attachBaseContext():loadLibrary("jiagu"),注册 native 校验
  ↓ ② 解密:从 assets/ 或 so 的 .rodata 取出加密 dex
  ↓ ③ 加载:new DexClassLoader(...) / InMemoryDexClassLoader
  ↓ ④ 掉包:反射替换 ActivityThread.mClassLoader
  ↓ ⑤ 真实 Application 启动,业务代码开始跑
\`\`\`

| 厂商 | 常见库名 / 类名特征 |
| --- | --- |
| 360 加固 | libjiagu.so / libjiagu_a64.so,StubApp |
| 腾讯乐固 | libshella-*.so / libshellx-*.so,StubShell |
| 梆梆安全 | libsecexe.so / libDexHelper.so,SecShell |
| 阿里聚安全 | libmobisec.so / libsgmain.so |
| 网易易盾 / 百度 | libnesec.so / libbaiduprotect.so |

> [!warn] 库名不是指纹
> 厂商每个大版本都会改名、拆 so、套壳中壳。==更稳的判断依据是行为==:谁在 attachBaseContext 里 loadLibrary、谁调了 DexClassLoader、谁在 .init_array 里做 ptrace 自附加。表里的名字只用来建立假设,验证永远靠行为。

## 脱壳:把"必然解密"变成机会
立足点只有一句:**ART 要执行 dex,内存里就必须存在一份结构合法的 dex**。所以思路只有三条:Hook 加载点、Hook native 的 \`OpenMemory\`、扫内存魔数。

\`\`\`js
// dump_dex.js —— 仅用于自有/授权样本
Java.perform(function () {
  var Loader = Java.use("dalvik.system.DexClassLoader");
  Loader.$init.overload("java.lang.String", "java.lang.String",
      "java.lang.String", "java.lang.ClassLoader").implementation =
    function (dexPath, opt, lib, parent) {
      console.log("[*] DexClassLoader: " + dexPath);
      this.$init(dexPath, opt, lib, parent);
    };
  var magic = "64 65 78 0a 30 33 35 00";        // dex\\n035\\0
  Process.enumerateRanges("r--").forEach(function (r) {
    Memory.scanSync(r.base, r.size, magic).forEach(function (m) {
      console.log("[+] dex @" + m.address + " range=" + r.size);
    });
  });
});
\`\`\`

\`\`\`shell
frida -U -f com.example.mytarget -l dump_dex.js --no-pause
\`\`\`

\`\`\`output
Spawned com.example.mytarget. Resuming main thread!
[*] DexClassLoader: /data/user/0/com.example.mytarget/app_dex/0.dex
[+] dex @ 0x7b3c2a1000 range=4194304
\`\`\`

| 工具类型 | 代表 | 原理 / 适用 |
| --- | --- | --- |
| 运行时脚本 | FRIDA-DEXDump | 扫内存 dex 头落盘;整体加密壳 |
| 定制 ART | Youpk、FART | 改 ClassLinker::DefineClass,类加载时 dump |
| 免 root 沙箱 | BlackDex 一类 | 容器内运行并 dump |
| 手工分析 | MT 管理器 | 设备上直接看已加载的 dex |

> [!danger] 抽取壳与 VMP:dump 出来也未必能读
> **抽取壳**把方法体 CodeItem 抽空、运行时回填,你 dump 到的 dex 里方法体全是空指令;**VMP** 把字节码翻译成自定义指令,由 so 解释器执行,根本没有标准 dex。==加固的价值不是不可破,而是把成本推到不划算。==

## 加壳、混淆、反调试:三种不同的敌人
| 手段 | 防的是什么 | 典型实现 | 天然局限 |
| --- | --- | --- | --- |
| 混淆 | 可读性 | R8/ProGuard 重命名、删调试信息 | 字符串与调用图仍能还原 |
| 加壳 | 静态可分析性 | dex 加密 + 壳 ClassLoader | 运行时必然解密 |
| 反调试 / 反注入 | 动态分析 | ptrace 自附加、TracerPid、扫 maps | 检测点可 patch 或 hook |
| 完整性校验 | 重打包 | 签名哈希、dex CRC、so 段哈希 | 校验点定位后可 patch |
| VMP | 汇编级阅读 | 方法体翻译成自定义指令 | 行为仍可观测,成本陡增 |

> [!best] 防守方:别指望客户端
> 客户端的一切保护都是**提高成本**,不是"防止"。有效组合是:关键判定放服务端 + 签名带时间戳与 nonce + 行为风控 + 设备指纹。反过来,收到客户端的 \`isVip=true\` 必须当作**不可信输入**重新校验。

## 本章小结
- 空壳 = dex 加密 + 壳 ClassLoader 掉包 + native 校验三件事叠加。
- JNI 静态注册看符号,动态注册看 JNI_OnLoad 与 24 字节的 JNINativeMethod 表。
- ELF 的关键在 .text、.rodata、.dynsym、.init_array;strip 只删 .symtab。

## 面试速记
- 静态注册看符号(Java_ 包_类_方法),动态注册看 JNI_OnLoad + RegisterNatives。
- ARM64:x0-x7 传参、x0 返回、x29 帧指针、x30 返回地址;wN 是 xN 低 32 位。
- 壳五步:attachBaseContext → loadLibrary → 解密 dex → DexClassLoader → 掉包。
- 脱壳三路:Hook 加载点、Hook native OpenMemory、扫魔数;防守靠服务端。
`,
  };

  /* ─────────────────────────────────────────── */
  window.REVERSE_EXTRA['ch11'] = {
    id: 'ch11',
    title: 'Hook 技术:Frida·Xposed 与运行时插桩',
    minutes: 40,
    points: ["Hook 分类","Frida","Xposed/LSPosed","检测对抗"],
    content: `
> [!danger] 授权边界:注入他人进程等于入侵
> Hook 的本质是"在别人的进程里执行自己的代码"。只对**自己写的测试 App、CTF 靶场、书面授权的渗透测试目标**使用。本章每个示例的目标,都是本地那个自己编译的 com.example.mytarget。

> [!info] 本章导读 · 不改安装包,怎么让 App 执行你的代码?
> 上一秒你还在 apktool 里改 smali、重签名、装包,下一秒发现签名校验把你挡在门外。Hook 提供了另一条路:安装包一个字节都不动,等 App 跑起来之后,在内存里把某个方法的入口改成自己的函数。听起来像魔法,其实是三件很朴素的事 —— 找到方法在内存里的地址、把入口指针换掉、在合适的时机把控制权交回去。本章拆到 ART 的 ArtMethod 一级,再讲清防守方怎么把它抓出来。
> - 读完本章你将能:说清 Java Hook 与 native inline hook 各自改的是哪块内存
> - 用 Frida 的 attach / spawn 两种模式跑通一次方法改写
> - 写出一个最小 Xposed 模块,并解释 LSPosed 为什么不用重打包
> - 列出六种 Frida 检测点与对应绕过思路,理解"检测永远可被绕过"

> [!tip] 日常电脑现场 · 输入法的"自动联想"
> 输入法在不改你 App 的前提下插入候选词、无障碍服务帮你自动点击 —— 都是"在别人的程序执行路径上插一脚"的 Hook 思想。

## 一次方法调用,ART 把它交给谁

Java 方法在 ART 里不是一个"名字",而是一个 **ArtMethod 结构体**:所属类、访问标志、dex 里 CodeItem 的偏移,以及最重要的 **entry_point_from_quick_compiled_code** —— 一个函数指针。

\`\`\`text
Java 源码:  license.isVip()
  ↓ dex:     invoke-virtual {v0}, Lcom/example/LicenseManager;->isVip()Z
  ↓ ART:     解析出 ArtMethod*,取 entry_point_from_quick_compiled_code
  ├── 已被 AOT/JIT 编译 → 指向 oat 里的机器码
  └── 尚未编译         → 指向解释器桥 art_quick_to_interpreter_bridge
\`\`\`

所以 Java 层 Hook 只有两种改法:**把入口指针换成自己的 trampoline**,或**改 access_flags 让它走 native 桥,在桥里插回调**。Xposed 走后者,Frida 在 ART 内部插自己的跳板 —— 手段不同,落点是同一个字段。

| Hook 形态 | 改什么 | 代表工具 | 优点 | 代价 |
| --- | --- | --- | --- | --- |
| Java 方法替换 | ArtMethod 入口 / 实现体 | Xposed、Frida(Java) | 与架构无关,能直接拿对象 | 受 ART 版本影响,特征明显 |
| native inline | 函数头若干字节改成跳转 | Frida Interceptor、Dobby | 通吃所有 native 调用 | 要改页权限、刷 icache、有竞态 |
| PLT / GOT | 改 GOT 表项指向自己 | 自写 linker hook | 适合拦 libc 导入函数 | 只对动态导入有效 |
| IAT(Windows PE) | 改导入地址表 | Detours | Windows 生态成熟 | Android 不适用,面试对比用 |
| syscall | 改 svc 指令或内核入口 | seccomp、内核模块 | 最底层,覆盖全部 | 权限要求最高,稳定性差 |

> [!tip] 为什么 Java Hook 比 native Hook 好写
> 因为 ART 已经把"方法"抽象成了对象:你能拿到 \`this\`、参数列表、直接返回一个 Java 对象。而 native Hook 面对的是寄存器和栈,==参数是 x0-x7 里的裸值,返回值是 x0 里的一个整数==,类型信息全靠自己脑补。能用 Java 层解决的,不要下到 native。

## Java 层 Hook:ArtMethod 上的手术

Xposed 的思路可以拆成三步:注入进程 → 找到目标 ArtMethod → 把入口换成自己的 native 桥,桥里先跑 before 回调,再决定是否执行原方法,最后跑 after 回调。LSPosed 借助 Zygisk 在 **Zygote** 里完成注入,于是每个 fork 出来的 App 进程天然带着模块,安装包不用动、签名也不用改。

\`\`\`java
package com.example.hookdemo;

import de.robv.android.xposed.IXposedHookLoadPackage;
import de.robv.android.xposed.XC_MethodHook;
import de.robv.android.xposed.XposedBridge;
import de.robv.android.xposed.XposedHelpers;
import de.robv.android.xposed.callbacks.XC_LoadPackage;

/** 仅用于 hook 自己开发的 com.example.mytarget */
public class HookEntry implements IXposedHookLoadPackage {
    @Override
    public void handleLoadPackage(XC_LoadPackage.LoadPackageParam lpparam) {
        if (!"com.example.mytarget".equals(lpparam.packageName)) return;
        XposedBridge.log("Hooked: " + lpparam.packageName);
        XposedHelpers.findAndHookMethod(
            "com.example.mytarget.LicenseManager", lpparam.classLoader,
            "isVip", new XC_MethodHook() {
                @Override
                protected void beforeHookedMethod(MethodHookParam param) {
                    param.setResult(Boolean.TRUE);      // 不执行原方法,直接给结果
                }
            });
    }
}
\`\`\`

\`\`\`output
11-14 21:12:03.220  4410  4410 I LSPosed: Loading module HookDemo for com.example.mytarget
11-14 21:12:03.221  4410  4410 I Xposed: Hooked: com.example.mytarget
11-14 21:12:05.877  4410  4410 I Xposed: isVip() intercepted, result forced to true
\`\`\`

> [!warn] 同一个 setResult,能调试也能造假
> 它可以让你的调试版跳过付费墙,也可以伪造别人的交易结果。区别不在代码,在授权。做安全评估时,正确做法是**在测试包上验证防护是否有效**,而不是在线上包里改数据。

## Frida:attach 与 spawn

Frida 的架构比 Xposed 轻:设备上跑 \`frida-server\`(需要 root)或把 gadget 塞进 App,host 侧用 CLI/Python 把 JS 脚本送进目标进程,脚本在进程内的 JS 引擎里跑,通过 RPC 回传结果。

| 模式 | 命令 | 注入时机 | 适合 |
| --- | --- | --- | --- |
| spawn | frida -U -f 包名 -l x.js | 启动瞬间挂起后注入 | 抓启动期:壳解密、反调试、证书初始化 |
| attach | frida -U 进程名 -l x.js | 附加到已运行进程 | 抓交互期:登录、下单、签名 |

\`\`\`shell
adb push frida-server-16.5.9-android-arm64 /data/local/tmp/frida-server
adb shell "chmod 755 /data/local/tmp/frida-server"
adb shell "su -c '/data/local/tmp/frida-server &'"
frida-ps -U | head -8
\`\`\`

\`\`\`output
Waiting for USB device...

 PID  Name
----  ---------------------------------
 812  com.android.systemui
1210  com.android.phone
4211  com.example.mytarget
\`\`\`

一段改写 Java 方法的完整脚本。先把原始 overload 存下来,再在 implementation 里 \`call(this)\`,否则会无限递归:

\`\`\`js
Java.perform(function () {
  var LicenseManager = Java.use("com.example.mytarget.LicenseManager");
  var isVip = LicenseManager.isVip.overload();       // 保存原始实现
  isVip.implementation = function () {
    var real = isVip.call(this);                     // 先跑原逻辑
    console.log("[*] isVip() 真实返回 " + real + ",改写为 true");
    return true;
  };
});
\`\`\`

\`\`\`output
[*] isVip() 真实返回 false,改写为 true
[*] isVip() 真实返回 false,改写为 true
[*] isVip() 真实返回 true,改写为 true
\`\`\`

native 侧同样能拦。静态注册的函数可以直接按导出名找,\`args\` 的顺序就是 JNI 的参数顺序:

\`\`\`js
var addr = Module.findExportByName("libnative-lib.so",
    "Java_com_example_nativeapp_License_checkLicense");
Interceptor.attach(addr, {
  onEnter: function (args) {
    this.type = args[2].toInt32();          // env, clazz, type
    console.log("[>] checkLicense(type=" + this.type + ")");
  },
  onLeave: function (retval) {
    console.log("[<] ret=" + retval + ",强制改为 1");
    retval.replace(ptr(1));                 // 返回 true
  }
});
\`\`\`

\`\`\`output
[>] checkLicense(type=0)
[<] ret=0x0,强制改为 1
[>] checkLicense(type=1)
[<] ret=0x1,强制改为 1
\`\`\`

> [!pitfall] Frida 脚本最常见的三个坑
> ① **类没加载**:\`Java.use\` 抛 ClassNotFoundException,要放进 \`Java.perform\` 并确认类已加载;② **overload 不匹配**:同名方法多签名时 \`.implementation\` 会报 ambiguous,必须写 \`.overload("java.lang.String")\`;③ **递归爆栈**:implementation 里又调同名方法,必须先存 \`var original = X.m.overload()\` 再 \`original.call(this)\`。

## 检测与对抗:防守方在看什么

Hook 框架再隐蔽,也必须在目标进程里**留下可观测的痕迹**:一个被加载的 so、一个线程、一段被改过的内存、一个监听的端口。

| 检测点 | 原理 | 常见绕过 | 防守建议 |
| --- | --- | --- | --- |
| 27042 / 27043 端口 | frida-server 默认监听 | 改端口启动 | 端口只是最浅一层 |
| 进程名 frida-server | 遍历 /proc 或 ps | 重命名二进制 | 结合其他特征交叉验证 |
| maps 里的 frida-agent | 注入的 so 必然出现在 maps | gadget 改名、内存加载 | 关注匿名可执行段 |
| 线程名 gum-js-loop | Frida 的 JS 线程固定命名 | patch 线程名 | 线程枚举 + 白名单 |
| 内存中的 frida:rpc | 通信协议字符串 | 改协议字符串 | 全内存特征扫描 |
| TracerPid != 0 | 被 ptrace 附加 | hook fopen / strstr | 多处冗余 + 放 native |
| 方法体哈希 | dex/oat 被改动 | hook 校验函数 | 哈希结果参与解密 |
| Xposed 痕迹 | ClassLoader 中出现 XposedBridge | 隐藏模块 | 检查 dex 路径与类加载器 |

一段 native 检测,读 \`/proc/self/maps\` 找注入痕迹,放在 \`.init_array\` 里能在 Java 层之前执行:

\`\`\`c
#include <stdio.h>
#include <string.h>

static int detect_frida(void) {
    FILE *fp = fopen("/proc/self/maps", "r");
    char line[512];
    int hit = 0;
    if (!fp) return 0;
    while (fgets(line, sizeof(line), fp)) {
        if (strstr(line, "frida") || strstr(line, "gum-js-loop") ||
            strstr(line, "gadget")) {
            hit = 1;
            break;
        }
    }
    fclose(fp);
    return hit;
}
\`\`\`

\`\`\`output
11-14 21:03:12.441  4821  4821 D AntiHook: maps hit: /data/local/tmp/frida-agent-64.so
11-14 21:03:12.443  4821  4821 D AntiHook: tracer_pid=0, frida=1, xposed=0, port27042=0
11-14 21:03:12.501  4821  4821 D AntiHook: risk=HIGH → abort
\`\`\`

> [!interview] 面试官爱问:这些检测能绕过吗?
> 能,而且成本不高:改 frida-server 的端口与名字、用 gadget 而不起 server、hook 掉 \`fopen\` 返回假数据、patch 检测函数本身。所以要给出**分层结论**:客户端检测只能提高门槛;真正难绕的是"服务端行为风控 + 关键结果服务端校验"。先讲检测原理,再讲绕过手段,最后落到纵深防御。

## 合法用途:把 Hook 用在正道上

Hook 本身只是"在函数执行前后插一段代码",落在不同场景就是不同工具:

- **安全测试**:对自己 App 的签名校验、pinning、反调试做红队式自查 —— 用 Frida hook \`checkServerTrusted\`,看校验是否真的生效,产出可复现的评估报告,而不是等外部报漏洞。
- **协议分析**:hook 加密函数,在明文进入 \`Cipher.update\` 之前打印输入与密钥长度,十分钟看清自定义协议的字段与签名规则,比自己啃 ARM 汇编快得多。
- **自动化测试**:替换登录态、模拟接口异常、注入弱网与超时,构造手工点不出来的边界场景;CTF 题的标准解法也是"找校验 → hook 绕过 → 拿 flag"。

> [!warn] 一句话边界
> Hook 的对象必须是自有 App、开源样本、书面授权目标或 CTF 靶场。把同样的技术用于绕过他人付费、窃取数据,性质就从测试变成了侵入。

面试表述时,把 Hook 说成==可观测性与测试手段==,并主动说明授权范围,比强调"我会注入"更专业。

## 本章小结

- ART 里方法就是 ArtMethod,入口是 \`entry_point_from_quick_compiled_code\`;Java Hook 改的就是它。
- Hook 分四类:Java 方法替换、native inline、PLT/GOT、IAT/syscall;越底层越通用,也越难写。
- Xposed 靠 Zygote 注入做到"不改包",Frida 靠 server/gadget 注入;两者都要 root 或特殊环境。
- 检测点无非是"痕迹":端口、进程名、maps、线程名、协议字符串、TracerPid、代码哈希。

## 面试速记

- Java Hook = 改 ArtMethod 入口;native inline hook = 改函数头字节 + mprotect + 刷 icache。
- Frida 两模式:spawn 抓启动期,attach 抓交互期;\`Java.perform\` + \`Java.use\` 是入口。
- Xposed/LSPosed:Zygote 注入 + findAndHookMethod,安装包不动、签名不变。
- 六个检测点:端口、进程名、maps、线程名、frida:rpc、TracerPid;都能绕,只能抬高成本。
- 一句话定位:客户端不可信,关键校验必须回服务端。
`,
  };

  /* ─────────────────────────────────────────── */
  window.REVERSE_EXTRA['ch12'] = {
    id: 'ch12',
    title: '抓包与协议逆向:HTTPS·SSL Pinning 与二进制协议',
    minutes: 40,
    points: ["抓包矩阵","SSL Pinning","二进制协议","签名还原"],
    content: `
> [!danger] 只抓自己的流量
> 抓包、改包、复现签名只对**自己开发的 App、书面授权的渗透测试目标、CTF 靶场**进行。截取他人通信内容可能违反《个人信息保护法》《网络安全法》;即使技术上抓到了,也不代表你有权查看。

> [!info] 本章导读 · App 的接口参数 sign 是怎么算出来的?
> 你打开抓包工具,看到请求体里安安静静躺着一个 32 位十六进制字符串:\`sign=ebbf2d6d45d985548b0df2596b18954f\`。改一个参数,它就变;不改,重放十次也不变。你想自己构造请求,却卡在这串字符上 —— 它由什么拼出来、用什么算法算的?本章从抓包的层次讲起,穿过 HTTPS 与证书固定两道门,最后落到二进制协议与签名还原:从字节流里把结构"读"出来,再用二十行 Python 复现。
> - 读完本章你将能:按层次选对抓包工具,写出常用的 Wireshark 显示过滤器
> - 说清 HTTPS 中间人的前提,以及 Android 7 之后用户证书为什么失效
> - 认出三层 SSL Pinning 的实现位置,并说明各自的绕过点
> - 从一段十六进制里切出 magic / length / TLV,并用 Python 复现一个 MD5 签名

> [!tip] 日常电脑现场 · F12 Network 与代理
> 浏览器 F12 的 Network 面板、公司内网的代理、手机装 Charles 证书 —— 抓包不是玄学,是选择在 HTTP 层还是 TCP 层"偷看"。

## 抓包先分层:工具守着不同的关口
同一个请求,不同工具看到的东西完全不同。选工具前先问一句:**我要看的是密文、明文,还是加密前的原始数据?**

| 工具 | 所在层 | 能看到 | 看不到 | 适合 |
| --- | --- | --- | --- | --- |
| Wireshark | L2-L7 | 所有包、TLS 握手细节、有 keylog 时的明文 | 无 keylog 的 HTTPS 正文 | 定位连接问题、看协议结构 |
| tcpdump | L3-L4 | 原始包,可存 pcap | 同上,且无图形界面 | 服务器上抓、容器内抓 |
| Charles | HTTP 代理层 | 解密后的 HTTP/HTTPS、WebSocket 帧 | 不走代理的流量 | 手工改包、重放、断点 |
| mitmproxy | HTTP 代理层 | 同上,且可用 Python 脚本改写 | 同上 | 自动化、批量、写脚本 |
| ecapture / r0capture | 应用进程内 | 加密前的明文(SSL_read/SSL_write) | 需要 root 或注入 | 对抗 pinning、native 网络栈 |

## Wireshark:过滤器是抓包人的母语
捕获过滤器(BPF)在抓之前生效,只抓你要的包,减少丢包与文件体积;显示过滤器在抓之后生效,从已有 pcap 里挑包,可以随时改。日常排障九成时间都在写后者:

| 显示过滤器 | 作用 |
| --- | --- |
| tcp.port == 443 | 只看 443 端口的 TCP |
| ip.addr == 10.0.0.5 | 源或目的为该地址 |
| http.request.method == "POST" | 只看 POST 请求 |
| http contains "sign" | HTTP 报文里含 sign 关键字 |
| tls.handshake.type == 1 | 只看 ClientHello |

## HTTPS 中间人:证书链是唯一的钥匙
TLS 的安全建立在一条链上:服务器证书由中间 CA 签发,中间 CA 由根 CA 签发,客户端信任库里存着根 CA 的公钥。客户端验证的不是"证书像不像",而是**这条链能不能走到一个我信任的根**;中间人要做的事,就是把链的终点换成自己的 CA。手机用 \`adb shell settings put global http_proxy 192.168.1.10:8080\` 挂上代理(不同网段可用 \`adb reverse tcp:8080 tcp:8080\`)。

\`\`\`shell
# ① 电脑上启动代理,默认监听 8080
mitmproxy -p 8080
# ② 手机浏览器访问 mitm.it 下载 CA;③ 算出 Android 系统证书要求的 hash.0 文件名
openssl x509 -inform PEM -subject_hash_old -in mitmproxy-ca-cert.pem | head -1
\`\`\`

\`\`\`output
8f1a2b3c
\`\`\`

装证书这一步决定成败:Android 7 之后用户证书对 targetSdk >= 24 的 App 不生效,必须把 \`8f1a2b3c.0\` 放进 \`/system/etc/security/cacerts/\` 并 \`chmod 644\`,或改用 Magisk 证书模块(Android 14 的 CA 已迁到 \`/apex/com.android.conscrypt/cacerts\`)。

| 抓不到的原因 | 现象 | 怎么确认 | 对策(授权测试) |
| --- | --- | --- | --- |
| 不走系统代理 | 代理端一条请求都没有 | 存在 Proxy.NO_PROXY / 自研 DNS | 透明代理、VPN 模式或 hook |
| 用户证书不被信任 | 握手失败,浏览器却正常 | targetSdk >= 24 且无自定义 config | 装系统证书 / 改 config / hook |
| SSL Pinning | 装了系统证书仍失败 | 异常里出现 CertificatePinner 或 pin 校验 | hook 校验函数 |
| 双向认证 mTLS | 服务器要求客户端证书 | 服务端日志或 TLS alert | 用授权范围内的客户端证书 |
| QUIC / HTTP3 | 只有 UDP 443 的包 | Wireshark 里看到 UDP 443 | 关掉 HTTP3 或走 hook |

> [!pitfall] 装完证书为什么还是 Trust anchor 报错
> 报 \`Trust anchor for certification path not found\`,说明客户端根本没把你那张 CA 放进信任链:要么装成了用户证书而 App 只信系统证书,要么 App 自带信任库(自定义 SSLSocketFactory),要么证书的 SAN 与请求域名不匹配。**先看报错在哪一层,再决定是补证书还是上 hook。**

## SSL Pinning 的三层实现
固定的对象有三代:整张证书、证书公钥、公钥的 SPKI 哈希。落到代码上就是三种写法:OkHttp 的 \`CertificatePinner\`、自定义 \`TrustManager\` 的 \`checkServerTrusted\`、以及系统级 \`network_security_config\` 的 pin-set。**越靠系统层越难绕**,因为校验不在应用代码里。

第一种,OkHttp 官方 API:

\`\`\`java
OkHttpClient client = new OkHttpClient.Builder()
    .certificatePinner(new CertificatePinner.Builder()
        .add("api.example.com", "sha256/n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=")
        .add("api.example.com", "sha256/LCa0a2j/xo/5m0U8HTBBNBNCLXBkg7+g+YpeiGJm564=")
        .build())
    .build();
\`\`\`

第二种,自己写 TrustManager,在 \`checkServerTrusted\` 里比对公钥:

\`\`\`java
public class PinnedTrustManager implements X509TrustManager {
    private static final String PIN =
        "n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=";   // 真实项目应由服务端下发

    @Override
    public void checkServerTrusted(X509Certificate[] chain, String authType)
            throws CertificateException {
        if (chain == null || chain.length == 0) throw new CertificateException("empty chain");
        byte[] spki = chain[0].getPublicKey().getEncoded();
        String pin = Base64.getEncoder()
                .encodeToString(MessageDigest.getInstance("SHA-256").digest(spki));
        if (!PIN.equals(pin)) throw new CertificateException("pin mismatch");
    }

    @Override public void checkClientTrusted(X509Certificate[] c, String a) {}
    @Override public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
}
\`\`\`

第三种,系统级配置,连 OkHttp 都不用改 —— 只要 App 用了系统 TLS 栈:

\`\`\`xml
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">api.example.com</domain>
        <pin-set expiration="2027-06-01">
            <pin digest="SHA-256">n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=</pin>
            <pin digest="SHA-256">LCa0a2j/xo/5m0U8HTBBNBNCLXBkg7+g+YpeiGJm564=</pin>
        </pin-set>
    </domain-config>
</network-security-config>
\`\`\`

绕过的原理很直接:**让校验函数认为自己通过了**,仅用于自有 App 的测试:

\`\`\`js
Java.perform(function () {
  var Pinner = Java.use("okhttp3.CertificatePinner");
  Pinner.check.overload("java.lang.String", "java.util.List").implementation =
    function (host, pins) {
      console.log("[*] 跳过 pinning: " + host + " (pins=" + pins.size() + ")");
    };
  var TM = Java.use("com.android.org.conscrypt.TrustManagerImpl");
  TM.checkTrustedRecursive.implementation = function () {
    return Java.use("java.util.ArrayList").$new();
  };
});
\`\`\`

\`\`\`output
[*] 跳过 pinning: api.example.com (pins=2)
[*] 跳过 pinning: cdn.example.com (pins=1)
\`\`\`

> [!interview] 为什么 pin 要配两个,怎么绕?
> 证书会轮换,只配一个等于埋雷:一旦换证,旧版本 App 集体连不上。标准做法是**至少两个 pin**(当前 + 备用)再加 \`expiration\` 提醒。绕过则要**先定位层次**:OkHttp 5.x 的 check 签名变成 \`(String, Certificate...)\`,overload 对不上会静默失效;校验写在 native 或结果参与解密时,Java 层 hook 根本无效。

## 二进制协议:从字节流里长出结构
文本协议靠肉眼,二进制协议靠三个锚点:**魔数(magic)、长度字段、类型字段**。拿到一段字节,先按这三样切格子,剩下的才是内容。

\`\`\`text
偏移   字节                      含义
0x00   4D 53 47 31               magic = "MSG1"
0x04   00 01                     version = 1(大端)
0x06   00 2C                     body 长度 = 44 字节
0x08   01 00 00 00 2C            cmd = 1,seq = 44
0x0D   ...                       body(TLV 列表,共 44 字节)
末尾   9A 3F 1C 0B               crc32(body)
\`\`\`

body 内部通常是 TLV:**类型(1 字节)+ 长度(1 字节)+ 值**,比如 \`0A 06 73 6B 75 2D 38 38\` 就是 type=0x0A、len=6、value="sku-88",按 3 字节一组就能试切出来。

protobuf 的识别要点只有一个公式:**首字节 = (字段号 << 3) | wire_type**。wire_type 0 是 varint、1 是固定 8 字节、2 是长度前缀、5 是固定 4 字节;所以 0x08 是"字段 1,varint",0x0A 是"字段 1,长度前缀",0x12 是"字段 2,长度前缀"。没有 \`.proto\` 也能先看层级:

\`\`\`shell
protoc --decode_raw < payload.bin
\`\`\`

## 案例:还原 sign = MD5(排序参数 + salt)
抓到的请求长这样:

\`\`\`text
POST /api/v1/order/list HTTP/1.1

page=1&size=20&status=2&ts=1731000000&sign=ebbf2d6d45d985548b0df2596b18954f
\`\`\`

推理过程比结论重要,按六步走:

\`\`\`text
① 原样重放十次 → sign 不变             ⇒ 不含随机数 / nonce
② 只改 page → sign 变                  ⇒ 业务参数参与签名
③ 只改 ts   → sign 变                  ⇒ 时间戳参与签名
④ 打乱参数顺序重发 → sign 不变         ⇒ 先排序再拼接
⑤ hook MessageDigest.digest → 32 位 hex ⇒ 算法是 MD5
⑥ 读 hook 到的输入串 → 看到 salt        ⇒ 盐值硬编码在客户端
\`\`\`

拿到拼接规则,用 Python 复现并验证:

\`\`\`python
import hashlib

SALT = "Zx9!kP2m"

def sign(params):
    # 去掉 sign 与空值,按 key 升序,拼成 k=v&... 再补盐
    items = sorted((k, v) for k, v in params.items() if k != "sign" and v != "")
    raw = "&".join(k + "=" + str(v) for k, v in items) + "&salt=" + SALT
    return hashlib.md5(raw.encode("utf-8")).hexdigest()

req1 = {"page": "1", "size": "20", "status": "2", "ts": "1731000000"}
req2 = {"status": "2", "ts": "1731000120", "size": "20", "page": "1"}
print("req1:", sign(req1))
print("match:", sign(req1) == "ebbf2d6d45d985548b0df2596b18954f")
print("req2:", sign(req2))
\`\`\`

\`\`\`output
req1: ebbf2d6d45d985548b0df2596b18954f
match: True
req2: 4b16a12b9bc32be3840b6d74cdc67d72
\`\`\`

注意 req2 的字典顺序被打乱了,结果仍与规则一致 —— 这就是"先排序"的证明。拿到这个函数,你就能按自己的参数批量构造合法请求(在授权范围内验证接口的幂等与限流)。

> [!best] 如果你是防守方,这个方案该怎么改
> 固定 salt + MD5 只能防"随手改一个参数",挡不住逆向:盐在客户端、算法在客户端、输入还能被 hook 打印出来。正确做法是 **HMAC-SHA256(密钥服务端下发并轮换)+ 时间戳窗口 + nonce 一次性校验 + 服务端行为风控**;关键接口再加 mTLS 或设备指纹。==签名防的是篡改与重放,不是防逆向。==

## WebSocket 一句话

WebSocket 借 HTTP 握手升级成**全双工 TCP 长连接**:客户端发 \`GET /chat\`,带 \`Upgrade: websocket\`、\`Connection: Upgrade\`、\`Sec-WebSocket-Key\`;服务端回 \`101 Switching Protocols\` 与派生的 \`Sec-WebSocket-Accept\`,之后按帧收发,没有请求-响应配对。

| 维度 | WebSocket | HTTP 长轮询 |
| --- | --- | --- |
| 连接 | 一次握手长期保持 | 请求结束即断,反复重建 |
| 推送 | 服务端可随时发帧 | 只能等客户端来问 |
| 延迟 | 毫秒级 | 看轮询间隔 |

抓包:Charles 把每帧列在面板,看 opcode 与 payload;Wireshark 用 \`tcp.port == 8080\` 过滤后 Follow → TCP Stream。\`wss://\` 与 HTTPS 同一道证书关,pinning 与 mTLS 一样躲不掉。

Java 客户端:\`HttpClient.newWebSocketBuilder().buildAsync(uri, listener)\`(JDK 11+);服务端用 Spring 的 \`@ServerEndpoint\`。

## 本章小结
- HTTPS 中间人的唯一前提是"客户端信任你的 CA";Android 7 之后要装系统证书或改配置。
- 抓不到包的五个原因:不走代理、用户证书失效、pinning、mTLS、QUIC。
- Pinning 三层:OkHttp Pinner、自定义 TrustManager、network_security_config;绕过都要先定位层次。

## 面试速记
- Wireshark 两种过滤器:捕获(BPF,抓前)与显示(抓后);\`tls.handshake.type == 1\` 是 ClientHello。
- 中间人 = 用受信 CA 签一张同域名证书;用户证书在 targetSdk >= 24 时对 App 无效。
- Pinning 三层与绕过:check / checkServerTrusted / TrustManagerImpl,共同点是"让校验返回成功"。
- protobuf tag = (字段号 << 3) | wire_type;0 varint、1 八字节、2 长度前缀、5 四字节。
- 签名还原的抓手是"控制变量 + hook 摘要函数";防守靠 HMAC + 时间戳 + nonce + 风控。
`,
  };

  /* ─────────────────────────────────────────── */
  window.REVERSE_EXTRA_IQ.push(
    { q: "加固后的 App 为什么 jadx 里只剩空壳?壳的启动链是怎样的?", a: "因为 classes.dex 被加密,磁盘上只有壳代码。启动链:**壳的 Application.attachBaseContext → System.loadLibrary 加载 native 壳 → native 解密 assets/so 里的加密 dex → DexClassLoader / InMemoryDexClassLoader 加载 → 反射替换 ActivityThread 的 ClassLoader(掉包)→ 真实 Application 启动**。jadx 静态看只能看到壳,真实业务代码要等运行时解密后才出现,所以脱壳的核心是\"在解密之后、加载之前把明文截下来\"。" },
    { q: "JNI 静态注册与动态注册的区别?怎么判断一个 so 用的是哪种?", a: "**静态注册**:符号名由\"包名_类名_方法名\"拼成(点变下划线、下划线变 _1),so 必须导出 \`Java_com_example_License_checkLicense\` 这样的长名,ART 首次调用时用 dlsym 查找。**动态注册**:so 在 \`JNI_OnLoad\` 里调用 \`RegisterNatives\`,把 {name, signature, fnPtr} 数组交给 ART,名字不必出现在符号表。判断:\`nm -D lib.so | grep Java_\`,有就是静态;没有但导出 JNI_OnLoad 且引用 RegisterNatives,就是动态。定位动态注册:64 位下 JNINativeMethod 每项 24 字节,顺着 JNI_OnLoad 的第三个参数解析即可。" },
    { q: "ARM64 的函数调用约定是什么?x0-x7、x0、x29、x30 各是什么角色?", a: "**x0-x7 传前 8 个整型/指针参数,返回值放 x0**;x8 用于返回大结构体时的间接结果指针(或系统调用号);x9-x15 是调用者保存的临时寄存器;x19-x28 被调用者保存;**x29 是帧指针 FP,x30 是返回地址 LR**;sp 栈指针需 16 字节对齐;wN 是 xN 的低 32 位,写 wN 会清零高 32 位。读汇编时最容易错的是把指针用 w 寄存器读,高 32 位被截断。" },
    { q: "给一段 ARM64 反汇编,怎么快速还原成高级语言?", a: "按\"栈帧 → 参数 → 比较 → 分支 → 返回\"的顺序读:\`sub sp, sp, #16\` 是开栈帧,\`str w0, [sp, #12]\` 是把第一个参数落栈,\`ldr w8, [sp, #12]\` 再读回来(O0 常见),\`cmp w8, #1\` + \`b.ne\` 是 if 条件不成立跳走,\`mov w0, #1\` / \`mov w0, #0\` 是两个返回分支,\`ret\` 返回。整体就是 \`return type == 1;\`。开 -O2 后会压成 \`cmp w0, #1; cset w0, eq; ret\` 三行。" },
    { q: "脱壳的原理是什么?为什么说\"内存里一定有明文 dex\"?", a: "因为 ART 只能执行结构合法的 dex:壳可以把 dex 加密在磁盘上、可以反调试、可以做完整性校验,但最终必须把解密后的 dex 放进内存交给 DexClassLoader 或 InMemoryDexClassLoader。所以三条路都成立:**Hook DexClassLoader / defineClass 拿 byte[]**、**Hook native 的 art::DexFile::OpenMemory 拿 base+size**、**遍历可读内存搜 dex 魔数 64 65 78 0a 并用 header 的 file_size 校验**。抽取壳(dump 出来方法体为空)要主动调用触发回填;VMP 则没有标准 dex 可还原。" },
    { q: "加壳、混淆、反调试分别防什么?为什么说客户端没有绝对安全?", a: "**混淆**防可读性(R8 重命名、删调试信息),控制流仍在;**加壳**防静态分析(dex 加密 + 壳 ClassLoader + 掉包),但运行时必解密;**反调试/反注入**防动态分析(ptrace、TracerPid、端口、maps、线程名),但检测点都能被 patch。三者叠加只是把攻击成本推高。客户端最终要被执行,所以逻辑必然可观测 —— 真正敏感的判断(支付、权益、风控)必须放服务端二次校验。" },
    { q: "Java 层 Hook 的原理?Xposed / LSPosed 为什么不用重打包?", a: "ART 里每个 Java 方法对应一个 **ArtMethod**,其中 \`entry_point_from_quick_compiled_code\` 指向编译后的机器码或解释器桥。Hook 就是把这个入口换成自己的 trampoline(或在 access_flags 上做手脚走 native 桥),在回调里决定是否执行原方法。Xposed 通过 root 注入 Zygote,在**每个 App 进程 fork 出来时**就把模块加载进去,所以安装包不动、签名不变;LSPosed 用 Zygisk/Riru 实现同样的注入点。" },
    { q: "native inline hook 怎么做?ARM64 上要注意什么?", a: "核心是**覆盖函数头若干字节为跳转**:ARM64 常用 16 字节绝对跳转 \`LDR X16, #8\`(0x58000050)+ \`BR X16\`(0xD61F0200)+ 8 字节目标地址;x86 常用 5 字节 jmp rel32 或 14 字节 jmp [rip+0]。步骤:\`mprotect\` 把代码页改成可写(通常 RWX)→ 备份原始字节 → 写入跳转 → **\`__builtin___clear_cache\` 刷新指令缓存**(ARM 上不刷会执行旧指令)→ 还原页权限。难点是多线程下改写瞬间的竞态、以及 ARM64 没有天然的长跳转,必须用 16 字节方案。" },
    { q: "Frida 的 attach 与 spawn 有什么区别?各自适合什么场景?", a: "**spawn**:\`frida -U -f 包名\` 让 App 在启动瞬间暂停,注入脚本后再恢复,能抓到启动阶段的壳解密、反调试、证书初始化。**attach**:\`frida -U 进程名\` 附加到已经运行的进程,响应快,但会错过启动期逻辑,且如果 App 启动时已完成 pinning 初始化,可能抓不到。原则:**要抓初始化就用 spawn,要抓交互就用 attach**。两者都依赖设备上的 frida-server(root)或 gadget。" },
    { q: "如何检测 Frida / Xposed?这些检测能被绕过吗?", a: "检测点都是\"痕迹\":**27042/27043 端口**、进程名 frida-server、\`/proc/self/maps\` 里的 frida-agent/gadget、线程名 gum-js-loop、内存中的 \"frida:rpc\" 字符串、\`/proc/self/status\` 的 TracerPid、方法体哈希、ClassLoader 里的 XposedBridge。都能绕:改端口与文件名、用 gadget、hook fopen/strstr 返回假数据、patch 检测函数本身。所以正确结论是:**客户端检测只提高成本**,最终要靠服务端行为风控与关键结果校验。" },
    { q: "抓包工具怎么选?为什么 App 抓不到包?", a: "按层次选:**Wireshark/tcpdump** 看原始包与 TLS 握手(拿不到正文),**Charles/mitmproxy/Burp** 做 HTTP 层中间人(能解 HTTPS、能改包),**ecapture/r0capture/Frida** 在进程内 hook SSL_read/SSL_write 拿加密前明文。App 抓不到的五个原因:① 不走系统代理(Proxy.NO_PROXY、自研网络栈)② targetSdk >= 24 用户证书不被信任 ③ SSL Pinning ④ 双向认证 mTLS ⑤ QUIC/HTTP3(UDP 443)。" },
    { q: "HTTPS 中间人的原理?为什么 Android 7 之后用户证书对 App 失效?", a: "中间人要让客户端相信\"我就是服务器\":它用一张**由客户端信任的 CA 签发**的、CN/SAN 为目标域名的证书,和客户端握手;同时自己作为客户端和真服务器握手。于是两段 TLS 各自成立,明文在代理处汇合。Android 7 起,targetSdk >= 24 的 App 默认只信任**系统 CA**,用户安装的证书不在信任库内,所以握手报 \`Trust anchor for certification path not found\`。解法:装系统证书(root)、改 network_security_config、或 hook 校验。" },
    { q: "SSL Pinning 有哪几种实现?各自的绕过思路是什么?", a: "三层:**① OkHttp CertificatePinner**(\`CertificatePinner.check\` 里比对证书/公钥的 sha256)**② 自定义 TrustManager**(\`checkServerTrusted\` 里比对)**③ network_security_config**(系统层 pin-set,由 Conscrypt 的 TrustManagerImpl 执行)。绕过分别对应:hook \`check\` 让它直接返回、hook 自定义 TrustManager 或替换 SSLContext、hook \`TrustManagerImpl.checkTrustedRecursive\`。前提是**先定位校验发生在哪一层**;如果校验写在 native 或结果参与解密,Java 层 hook 无效。" },
    { q: "拿到一段二进制流量,怎么开始逆向?protobuf 怎么认?", a: "先找三个锚点:**magic(固定开头)**、**length(长度字段)**、**type(命令/类型字段)**,再判断字节序,剩下按 TLV 切。若没有魔数、首字节多是 \`08/0A/12/1A\`,试 protobuf:tag = **(field_number << 3) | wire_type**,wire_type 0=varint、1=8 字节、2=长度前缀、5=4 字节。工具上先 \`protoc --decode_raw < payload.bin\` 看结构,再结合字段语义猜 .proto。" },
    { q: "一个接口的 sign 参数怎么还原?怎样设计才更安全?", a: "还原六步:① 原样重放看是否变化(判随机数)② 改单个参数定位参与字段 ③ 打乱顺序判断是否排序 ④ hook \`MessageDigest.digest\` 或 \`Mac.doFinal\` 拿算法与输入串 ⑤ 从输入串读出拼接规则与盐 ⑥ 用 Python 复现并比对。防守:**HMAC-SHA256 + 服务端下发并轮换的密钥 + 时间戳窗口 + nonce 一次性 + 服务端风控**,关键接口加 mTLS。要记住签名防的是篡改与重放,不是防逆向 —— 盐放在客户端就一定会被还原。" }
  );
})();
