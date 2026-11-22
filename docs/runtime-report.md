# 网站虚拟代码环境与图形窗口

2026-11-15。入口：`#/playground`。整个网站只需 HTTP(S) 静态托管，访客无需安装 JDK、Python 或数据库，也无需启动本机执行服务。此前的 `/api/runner`、`/api/run` 与 native 子进程执行已经移除；`scripts/serve.py` 仅是维护者可选的静态预览工具。

## 真实执行范围

| 类型 | 网站内运行方式 | 可观察内容 | 兼容边界 |
| --- | --- | --- | --- |
| Java | Doppio JVM 0.5.0 + Java 8 类库与 javac，在 Worker 内编译和执行字节码 | 源码修改、标准输入、参数、stdout、编译诊断、异常栈；包名与主类选择 | Java 8 标准库，单份源码可包含多个类；不含 Java 9～21 新语法、Spring 依赖、原生库和外部服务 |
| Python | Pyodide 0.27.7 / Python 3.12 WebAssembly | input、参数、标准输出、异常和私有虚拟文件 | 内置标准库；不自动安装第三方包，不运行本机 Python |
| SQL | sql.js 1.13.0 / SQLite WebAssembly | 多语句建表、写入、查询、表格、二进制结果 | 每次运行独立内存库，最多显示 200 行；不等同于 MySQL 的语法、锁、引擎与权限 |
| JavaScript | 浏览器 Worker | console.log、input 字符串、args 数组 | 没有 DOM，运行时限 10 秒 |
| HTML / SVG | sandbox iframe | 内联 CSS/JS、按钮交互、绘图 | 不开放外部网络、表单提交、弹窗与父页面权限 |
| 六个图形课程 | 专门编写的网页窗口模型 | 计算器、倒计时、小球、移动方块、MIDlet 生命周期、RecordStore | 按对应课程逻辑制作，不是把任意 Swing / JavaFX / J2ME 源码自动变成窗口 |
| Shell、配置、框架摘录 | 结构阅读与相关原理模型 | 逐行阅读、实验链接及能力说明 | 不执行操作系统命令、安装依赖或启动服务，不用预设输出假冒任意源码执行 |

正文代码/配置块保留运行/说明入口；245 个 TEXT 展示块仅保留复制。能打开编辑器不等于自动补齐 import、方法所属类、项目依赖与服务。逆向 18 章提供免环境教学实验；其中 Java/Python 独立程序使用上表的真实浏览器运行时，x86/APK/Frida 等仍属于明确标注的教学模型或结构阅读，不能宣称任意目标软件都能在网站运行。

Java 语句片段自动放入 main。标准输入写入 `/home/.stdin` 虚拟文件后交给 Java 的 FileInputStream，保证 Scanner 的 UTF-8 与 EOF 正确；异常会解包、打印原栈并显示执行失败。网页 JVM 采用协作调度，竞态示例某次输出 10000 不证明线程安全，不能用它测量真实多核性能。

## 生命周期、加载与部署

- Java/Python/SQL 每次创建新 Worker；Java 的 `/home` 和 `/tmp`、Python 的工作目录、SQLite 内存库都属于本次虚拟环境，不对应访客电脑文件。Java 类库从网站只读资源加载。
- “停止运行”直接终止 Worker，不是只停止等待；切换语言、关闭实验区和离开页面也会清理运行实例。重新运行创建新环境。
- 加载/编译最长 120 秒，Java/Python 执行最长 30 秒；SQL 在总时限内可随时停止。控制台限制 65,536 字符。Python 异常保持换行并在独立容器内滚动。
- 全部运行时随网站打包，无运行期 CDN 请求或远程编译服务。85 个固定资源共 69,067,965 字节（含来源记录和许可证，不含清单本身），首次 Java 约 42 MB，Python 约 14 MB。首次加载按语言发生，HTTP 缓存可复用。
- 静态托管需要 Worker、同源资源与 WebAssembly 支持；`.wasm` 使用 `application/wasm`，建议缓存 vendor 目录。直接 file:// 打开只适合阅读。来源、许可证和文件 SHA-256 见 [vendor 说明](../assets/vendor/README.md) 与 manifest.json。

## 验证

自动检查：

```shell
node scripts/verify_virtual_runtime.js
node scripts/verify_highlight.js
python scripts/verify_runner.py
node scripts/verify_content.js
node scripts/verify_simulations.js
node scripts/verify_browser_labs.js
```

- 虚拟环境检查：Java 源码预处理（注释、字面量、包名、嵌套/辅助类、主类选择、record 保留后真实报错）、输入/异常启动类、85 个资源 SHA-256、纯浏览器运行路径与无 native 子进程后端。
- 静态服务 3 项测试：页面与 Worker、GET 无执行 API / POST 拒绝、WASM 类型和缓存。旧的本机执行器测试已替换，不再沿用旧 14 项测试结论。
- 既有检查通过：50 个页面脚本、131 章/练习、6 个图形适配器、4,384 组排序及逆向模型、1,044 个围栏块能力清单（799 个代码/配置、245 个 TEXT）。Worker 另作语法和逻辑检查，不混入页面脚本数量。
- 浏览器实际执行：Java 算术、CounterRace 及正文 TenThreads 原例（10 线程、lambda、join，观察到 counter = 10000）；将循环 1000 改为 100 后，真实结果变为 counter = 1000、中文输入参数、空输入 EOF、带包名与辅助类、真正编译错误、异常失败、Java 新语法拒绝、无限循环 30 秒超时与手动取消后重跑；Python 中文输入、参数、虚拟文件、空 EOF、ZeroDivisionError；SQLite 多语句、分号字符串、二进制、200 行上限和每次清库。
- 新运行器在 320、390、768、1440px 检查 Java 编译错误、Python 异常、SQL 表格、正文展开运行区，共 16 项布局检查，所检查容器无横向越出视口。既有图形窗口/全站布局记录见 [浏览器实验报告](browser-labs-report.md)。

原始浏览器记录：[virtual-runtime-validation.json](virtual-runtime-validation.json)。截图：[网页 JVM 多线程运行](images/virtual-java-runtime.jpg)。这不是对全部课程程序逐一执行的声明；能力限制在运行入口中明确展示。

## 编辑区高亮与三个输入选项

运行编辑区现在与正文共用语法高亮器，补充 Python、JavaScript 和 SVG 规则；Java、Python、JavaScript、SQL、HTML 输入后即时着色。高亮层保持源码原文，转义 HTML，避免把示例标签变成页面元素。文本框负责原生选区、光标、输入法与编辑；滚动、缩放和尺寸变化同步高亮层，恢复原例时同步重绘。系统强制颜色模式回退到原生文本框，保证文字可见。

- 标准输入：运行前提供给程序读取的文本。Java 通过 System.in / Scanner 读取，Python 通过 input() / sys.stdin 读取，JavaScript 作为 input 字符串传入。代码不读取输入时留空。
- 程序参数：每行一个字符串参数，空行忽略。Java / JavaScript 的第一、二行分别对应 args[0] / args[1]；Python 对应 sys.argv[1] / sys.argv[2]，sys.argv[0] 为脚本名。
- 主类名：Java 从哪个类的 main 开始运行，通常留空自动识别；同一源码需指定其他入口时填写。带 package lab 的 Main 可填 lab.Main。

截图中的 RecordBytes 固定写入数字 980，不读取标准输入或 args；三个字段现在全部隐藏,直接运行即可。有需要时显示对应字段、用途与填写例子,并通过 aria-describedby 关联，屏幕阅读器也能读取。

`verify_highlight.js` 检查五种语言的关键字/字符串颜色标记、源码原文保留、HTML 转义、未完成编辑以及 70,000 字符输入。浏览器编辑、滚动、运行与响应式记录见 [editor-highlight-validation.json](editor-highlight-validation.json)。

浏览器实测覆盖五种语言在 320、390、768、1440px 的 20 项编辑区布局检查，所检查容器均未横向越出视口；长源码水平/垂直滚动时高亮层与文本框位置一致，修改数字与恢复原例均即时重绘。RecordBytes 三个字段留空后真实执行输出 4 字节 `00 00 03 D4`；带包名 Java 程序读取中文标准输入及两个参数、Python 读取中文输入与 sys.argv[1] 均得到对应实际输出。截图见 [编辑区高亮与输入说明](images/editor-highlight-input-guide.jpg)。

## 域名示例输出一致性修正

逆向第 15 章原先把形近串相等当成正常,导致 icbc.c0m.cn 与 lCBC.com.cn 的实际输出与正文相反。改为先按原始主机名核对白名单(只忽略大小写),其余一律提示可疑,形近串只说明原因。NFKC 先于替换执行,并删去其能自动折叠西里尔字母的错误说法。“正常”改为“匹配白名单”,避免把域名匹配误读成完整安全认证。

维护者回归命令 `python scripts/verify_domain_example.py` 从课程提取实际源码与相邻输出进行逐字符比较,另覆盖 14 种输入,包括大小写、0/1/l/rn、全角、伪装后缀、未列出的子域名、西里尔字母和无效输入。网站继续通过 Pyodide 执行,不需要访客本机 Python。浏览器复核记录见 [domain-example-validation.json](domain-example-validation.json),截图见 [正文与实际输出一致](images/domain-example-output-match.jpg)。

## 按当前代码显示运行输入项

标准输入、程序参数和主类字段按源码更新可见性,编辑和恢复原例都会重新判断。注释和普通字符串不触发选项,Java 入口签名中未使用的参数不算读取,Python 的 sys 别名和 from sys 导入、常见格式化字符串中的引用也可识别。只有多个 Java main 或入口不在默认类中时显示主类项。全部隐藏时,提示文字与布局容器一并隐藏；字段暂存值可在重新显示时恢复,但隐藏字段的旧值不会传入运行任务。

该判断用于编辑器界面的静态提示,覆盖常见直接引用和导入别名,不是完整的语言数据流分析,反射、eval 或运行时生成的间接读取不在判断范围内。`node scripts/verify_runtime_options.js` 覆盖 36 种代码形态；页面/内容及虚拟运行器检查通过。浏览器验证记录见 [runtime-options-validation.json](runtime-options-validation.json),截图见 [无输入示例的精简运行区](images/runtime-options-hidden.jpg)。
