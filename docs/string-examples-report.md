# String 源码摘录与网页实验修复

修复截图中的 `variable value not initialized in the default constructor`：删减的 JDK String 源码不是独立程序，缺少 final 字段初始化和 main 入口，也不应该用自定义 String 类替代标准库来演示。

- 3 处明确标记的 JDK 源码摘录统一显示“JDK 源码阅读 / 源码阅读说明”，保留高亮、复制和逐行阅读，不创建编译编辑器。普通 Java 语句片段和 Spring 阅读分类保持可用。
- 补充 StringImmutableDemo 完整实验，验证构造器防御性复制、replace 返回结果与变量重新赋值；输出逐项说明。
- 修正 String 的 hash 缓存字段并非 final、final 数组引用不保证元素不可变的讲解，以及未初始化 final 字段的逐行释义。
- User 增加 main 与 HashSet 判重实验；两个比较器示例改为 Java 8 普通类与 Arrays.asList；拼接示例缩小至 800 轮，并明确计时结果会波动。
- 修正相邻 ArrayList 教学摘录扩容后又分配新数组的问题，以及“new ArrayList 不分配内存”的不准确表述。

## 验证

全部执行发生于网页 Doppio Java 8 JVM，没有调用本机 javac/java：本章 14 个完整示例全部执行成功，实际输出与页面预期一致（拼接实验仅核对确定性的次数、长度和内容一致性，不把耗时作为固定答案）。逐项记录见 [string-examples-validation.json](string-examples-validation.json)。

浏览器确认三处摘录均使用源码阅读分类；String 摘录可打开说明与逐行阅读并关闭；390px 手机视口无页面横向溢出、无说明区和按钮栏溢出。

维护检查通过：verify_string_examples、verify_line_explanations、verify_content、verify_pattern_examples、verify_runtime_options、verify_highlight、verify_unique_media、verify_pattern_uml、verify_virtual_runtime。已重建本地阅读字体并更新资源缓存版本。

截图：`images/string-source-reading.jpg`、`images/string-source-mobile.jpg`、`images/string-immutable-runtime.jpg`。
