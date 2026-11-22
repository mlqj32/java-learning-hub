# 运行说明原位展开

“运行说明”只在当前代码下方展开,不再将焦点送入面板或自动滚动到面板顶部。展开和关闭保留页面的横纵向滚动位置,关闭时以 preventScroll 将焦点返回原按钮。

在逆向第 10 章截图中的单行 Frida 命令处,使用实际鼠标点击验证：展开前后 scrollY 均为 7745,点击内部关闭按钮前后也均为 7745。说明与对应源码相邻,不跳到其他实验区。

记录见 [instruction-scroll-validation.json](instruction-scroll-validation.json),截图见 [说明原位展开](images/instruction-no-scroll.jpg)。
