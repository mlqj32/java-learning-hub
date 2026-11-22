# 内容模块格式规范(必须严格遵守)

请先阅读示范文件 `assets/js/content/redis.js`。新增课程也可在 Python 可读源中编辑，再用 JSON 序列化生成 JS，避免手工转义错误（见 scripts/build_learning_content.py）。

## 1. 文件骨架

```js
(function () {
  'use strict';
  window.CONTENT = window.CONTENT || {};

  window.CONTENT.<moduleId> = {
    id: '<moduleId>',
    title: '模块中文名',
    en: 'MODULE ENGLISH NAME',
    icon: '模块图标名',
    color: '#模块主题色',
    tagline: '一句话副标题(10-16字)',
    description: '2-3句模块介绍,面向读者说明学到什么',
    minutes: '≈ N 小时',
    chapters: [
      {
        id: 'ch01',            // 章节id必须与分配表一致
        title: '章节标题',
        minutes: 30,           // 预计阅读分钟数
        points: ['关键词1', '关键词2', '关键词3', '关键词4'],  // 3-5个,展示在章节卡片上
        content: `
## 第一个大节

正文……

### 小节

| 列1 | 列2 |
| --- | --- |
| a | b |

> [!interview] 提示框

\`\`\`java
System.out.println("Hello");
\`\`\`

\`\`\`output
Hello
\`\`\`

## 面试速记

- 要点1
- 要点2
`
      }
    ],
    interview: [
      { q: '面试问题', a: '参考答案(markdown,可用 **加粗** 和 `代码`)' }
    ]
  };
})();
```

## 2. Markdown 语法(渲染器支持的写法)

- `## 大节`(渲染器自动加编号01/02/…)、`### 小节`、`#### 小小节`。**不要用单个 #**
- 代码围栏:三个反引号 + 语言:`java` `sql` `shell` `xml` `yml` `properties` `text` `json`
  - 围栏第二行可写文件名:` ```java OrderService.java `
- 输出块:紧跟代码块之后写 `output` 语言围栏(会与上方代码块视觉配对);支持高亮标记:`[hl]重点[/hl]` `[err]错误[/err]` `[key]键名[/key]` `[dim]暗淡[/dim]`
- 交互演示:` ```demo:演示id ``` `(见下方演示注册表)
- 提示框:`> [!tip]`、`> [!warn]`、`> [!danger]`、`> [!info]`、`> [!interview]`、`> [!pitfall]`、`> [!best]`,第一行可加自定义标题如 `> [!interview] 高频追问:XXX?`,内容行也以 `> ` 开头,内部支持 `- 列表`
- 表格:标准 GFM,表头与分隔行必须都有
- 行内:`**加粗**`、\`行内代码\`、`==高亮结论==`
- 结尾分割线 `---` 可用

## 3. 转义规则(违反会产生错误内容,最重要!)

内容写在 JS 模板字符串里,以下规则**绝对不可违反**:

1. **禁止出现反引号字符**(`` ` ``):shell 示例禁用反引号命令替换(用 `$()` 替代);Java/SQL 示例本来也不会有
2. **禁止出现 `${`**:JS 示例代码禁用模板字符串(用字符串拼接 + 号);shell 禁用 `${VAR}`(用 `$VAR`)
3. **所有反斜杠必须双写**:Java 里 `"a\nb"` 要写成 `"a\\nb"`;正则 `\d+` 要写成 `\\d+`;Windows 路径 `D:\dir` 要写成 `D:\\dir`
4. 代码块内容必须保证语法正确、缩进整齐,输出的真实运行结果必须与代码逻辑一致

## 4. 内容质量要求

- 按学习目标决定篇幅，不用行数或代码块数量代替讲解质量。先交代前置知识、目标和运行环境，再给概念、具体例子、推理、反例、排错与验收。
- 零基础内容必须解释新术语、命令输入位置和文件路径；完整实验必须提供目录、依赖版本、完整源文件、运行命令、预期结果及失败处理。
- 每章最后必须有 `## 面试速记` 小节(4-5 条 bullet)
- 面试导向:高频追问、易错点、源码级结论都要覆盖;结论给"背诵版",推理给"理解版"
- 代码以 JDK 17 / MySQL 8 / Redis 7 为主要语境；注明版本差异。明确标注“完整程序”“某类的方法片段”“伪代码”；不要让读者误以为任意片段都能直接运行。确定性输出必须与实测一致；模拟日志须显著标注，耗时、地址、线程顺序等不得冒充固定结果。
- 每章在 practice.js 注册独有的动手任务、三个可检查标准和参考思路。练习检验知识迁移，避免所有章节套同一题。
- SVG 文字必须放入实际节点边界，给长标签预留宽度；测试图解总览和放大窗口。代码、表格和图解允许在独立容器滚动，不得撑宽整页。
- 正文 Java/Python 示例可通过代码旁的运行入口检验，仍需注明独立程序与依赖片段的区别。图形示例若新增教学模拟，在 simulations.js 显式注册对应逻辑并注明边界；不要把通用“运行”按钮绑定到无关的固定输出。SQL 网页试跑使用 SQLite，涉及 MySQL 的结论必须在实际 MySQL 验证。
- 语言风格:直接、干货、略带"修炼场"武侠味但不油腻;正文用中文,术语首次出现标英文

## 5. 演示与图解注册表(可在 content 里插入)

- 交互演示写法:` ```demo:演示id ``` `
- **图解写法:` ```diagram:图解id ``` **(渲染为手绘 SVG 卡片,含图题与说明)
- 每个图解前后建议配 2-3 句"通俗比喻"段落,先具象后抽象
- 图解本体在 `assets/js/diagrams.js` / `diagrams2.js` 的 `window.DIAGRAMS` 注册(基于 `window.DG.D()` 助手绘制),新增图解时两处同步

| 演示id | 说明 | 归属 |
| --- | --- | --- |
| concat-bench | String vs StringBuilder 拼接性能 | javase |
| hashmap-put | HashMap put 流程动画 | javase |
| thread-life | 线程状态机交互 | javase |
| threadpool | 线程池执行流程模拟 | javase |
| prodcons | 生产者消费者 wait/notify | javase |
| sort-visual | 排序算法可视化 | javase |
| jvm-memory | JVM 内存区域对象流动 | jvm |
| gc-demo | 分代 GC 回收动画 | jvm |
| classload | 类加载过程动画 | jvm |
| aop-proxy | AOP 代理链调用演示 | spring |
| tx-rollback | 事务回滚传播演示 | spring |
| bptree | B+树 vs 二叉树查找 | mysql |
| tx-isolation | 事务隔离级别异常演示 | mysql |
| mvcc | MVCC 版本链演示 | mysql |
| cache-3 | 缓存穿透/击穿/雪崩 | redis(已用) |
| redis-lock | 分布式锁竞争 | redis(已用) |
| mq-peak | MQ 削峰填谷 | mq |

写法:` ```demo:hashmap-put ``` ` 单独成段。每个模块最多插 3-6 个演示,放在最合适讲解的章节。

## 6. 模块元数据(固定值,不得更改)

| moduleId | title | en | icon | color |
| --- | --- | --- | --- | --- |
| javase | JavaSE 核心基础 | JAVA STANDARD EDITION | coffee | #f97316 |
| jvm | JVM 虚拟机底层 | JVM INTERNALS | chip | #a78bfa |
| spring | Spring 全家桶 | SPRING ECOSYSTEM | leaf | #34d399 |
| mysql | MySQL 数据库内核 | MYSQL KERNEL | database | #38bdf8 |
| mq | 消息队列 MQ | MESSAGE QUEUE | layers | #fbbf24 |
| linux | Linux 工程实战 | LINUX ENGINEERING | terminal | #2dd4bf |
| patterns | 设计模式心法 | DESIGN PATTERNS | gem | #f472b6 |

## 7. 完成后的自检(必须执行)

1. `node --check <你的文件>` 必须通过
2. grep 检查内容字符串里不得有未转义反引号/`${`(除 JS 语法本身的)
3. 确认每个 chapter 的 id 与分配表一致

## 8. 模拟与代码观察

- TEXT 围栏仅展示与复制，不添加运行/说明、实验、阅读按钮或能力标签。其余代码/配置块获得运行/说明与逐行释义入口。释义必须描述当前行的含义，模板代码说明其作用，不能仅重复泛用阅读建议；不得把源码释义冒充动态执行或伪造变量与输出。
- 逆向章节的免环境实验配置在 `assets/js/reverse-labs-ui.js`，纯计算在 `lab-models.js`；新增章节应补对应 profile 和 placements 对应小节。每章只放一个具名原理实验，在对应小节原位展开，说明固定样本及范围，不在各段代码上添加同一个泛用实验按钮。注明固定样本、输入范围、真实计算部分及未模拟的工具行为。
- 演示通过 `HUB_DEMO_SYSTEM.mount` 挂载。旧式演示的定时器使用 `HUB_DEMO_SYSTEM.scheduler(body)`；异步等待使用 `if (!await U.sleepFor(body, ms)) return`，使重置与路由切换能取消后续动作。新组件返回清理函数。
- 每个知识演示补充 `demo-system.js` 中的操作/观察说明。不可用预设毫秒冒充性能实测，唯一候选不自动等于已经证明的对象。
- 改动后执行 `node scripts/verify_content.js`、`node scripts/verify_simulations.js`、`node scripts/verify_browser_labs.js`，并更新生成的代码覆盖清单。模型输入、控制按钮和展开面板还需实际浏览器检查。

- 网页运行按钮只能使用网站内置浏览器虚拟环境，不得依赖本机 JDK/Python、数据库或执行 API。Java 当前为 Java 8，Python 为 Pyodide 标准库，SQL 为 SQLite；更新能力时同步维护运行报告。课程中的安装教程与网站运行条件必须区分。图形窗口属于明确标注的课程模型，不得声称执行任意 GUI 源码。
