# 行为型模式（上）网页运行修复

验证日期：2026-11-15。页面：`#/m/patterns/pat5`，源内容键：`PATTERNS_EXTRA.p04`。

截图中的策略工厂示例缺少策略接口、实现类、上下文与运行入口，还调用了 Java 9 的 `Map.of`。现已补齐为独立 Java 8 程序，通过静态初始化块、HashMap 和不可修改视图构建规则表。

同章一并补全枚举策略、初版支付通知、请假审批、初版饮品流程、初版订单状态与初版遥控器的入口或辅助类。网关过滤链改用 Java 8 的 `Arrays.asList`。

## 浏览器实测

- 从网页代码块的运行按钮启动，逐个执行 15 个独立 Java 示例，全部成功。源码编译和运行均使用浏览器中的 Doppio Java 8 JVM，没有调用本机 JDK 或后端编译接口。
- 工厂示例结果为 NORMAL 39900、FULL_REDUCE 34900、VIP 31920；满减门槛前后分别为 29999、25000；未知类型输出明确的错误说明，与正文预期一致。
- 另核对观察者下游异常隔离、审批转交与拒绝、网关鉴权中断、咖啡跳过配料钩子、重复支付限制、命令逐次撤销及空历史提示。
- 3 段 Spring 集成片段显示“运行说明”和“框架集成阅读”，展开说明实际依赖，不出现独立执行按钮。

逐例输出见 [验证记录](pattern-examples-validation.json)，成功界面见 [截图](images/pattern-factory-browser-java8.jpg)。本记录覆盖本章，不能据此推断其他章节全部代码可执行。

## 自动检查

通过 `verify_pattern_examples.js`、`verify_content.js`、`verify_virtual_runtime.js`、`verify_line_explanations.js`、`verify_runtime_options.js`、`verify_highlight.js`。新增回归覆盖 15 个入口、3 个框架边界、Java 8 集合 API、工厂依赖，以及注释和字符串不误判为框架依赖。

阅读字体已重新生成，并更新字体及相关脚本缓存版本。
