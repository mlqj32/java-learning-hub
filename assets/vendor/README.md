# 网站内置运行时

这些文件由静态网站自行提供，执行时不使用 CDN、远程编译 API 或本机语言环境。约 69 MB 总资源按语言加载；首次 Java 约 42 MB、Python 约 14 MB。版本、原始包完整性记录见各目录的 `source.json`，当前部署文件 SHA-256 见 `manifest.json`。

| 组件 | 版本 | 来源 | 许可证 |
| --- | --- | --- | --- |
| BrowserFS | 1.4.3 | npm 官方包 browserfs | MIT，browserfs/LICENSE |
| Doppio JVM | 0.5.0 | npm 官方包 doppiojvm，浏览器 release bundle | MIT，doppio/LICENSE |
| Java 类库与编译器 | Doppio JCL v3.2 / Java 8 | 官方 doppio_jcl 发布的 java_home.tar.gz | GPLv2 + Classpath Exception；java_home/LICENSE、ASSEMBLY_EXCEPTION、THIRD_PARTY_README |
| Pyodide | 0.27.7 | npm 官方包 pyodide，许可证取自同版本官方源码 | MPL-2.0 及依赖许可证，pyodide/LICENSE；标准库内部保留 Python 许可证 |
| sql.js | 1.13.0 | npm 官方包 sql.js | MIT，sql.js/LICENSE；SQLite 为 public domain |

源码项目：[BrowserFS](https://github.com/jvilk/BrowserFS)、[Doppio](https://github.com/plasma-umass/doppio)、[Doppio JCL](https://github.com/plasma-umass/doppio_jcl)、[OpenJDK 8](https://github.com/openjdk/jdk8u)、[Pyodide](https://github.com/pyodide/pyodide/tree/0.27.7)、[sql.js](https://github.com/sql-js/sql.js/tree/v1.13.0)。JCL 的具体构建配方和修改以其仓库为准。

Java JAR 重新使用 ZIP deflate 压缩，减少传输体积；class 内容未改动。BrowserFS 的 listings.json 与 jdk.json 为本项目生成。未执行 npm 安装脚本。Doppio 的 setImmediate 兼容层和课程启动类在本项目 `assets/js/virtual-worker.js` 中实现，不修改第三方运行时 bundle。

部署时保留所有目录结构，WASM 使用 `application/wasm`；允许同源 Worker、脚本、资源加载和 WebAssembly 编译。`assets/vendor/` 建议启用缓存及 gzip/brotli（JAR/WASM 本身已压缩时按服务器策略处理）；更新运行时后清除旧缓存。Pyodide 的锁文件会列出额外包，但本站不自动下载或安装这些包。

每次运行创建新的 Worker 和虚拟文件系统，停止/完成后销毁。Java 的 `/home`、`/tmp` 是内存文件系统；`/sys` 是网站只读类库。Python 的文件与 SQLite 数据库均为本次运行的浏览器数据，不对应访客电脑文件。
