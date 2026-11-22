/* Source explanations, never an execution trace. Strings/comments stay out of syntax tests. */
(function () {
  'use strict';
  function quoted(value) { return '「' + value.trim() + '」'; }
  function mask(text) {
    return text.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g, function (s) { return ' '.repeat(s.length); });
  }
  function split(text, separator) {
    var safe = mask(text), depth = 0, start = 0, result = [];
    for (var i = 0; i < safe.length; i++) {
      if ('([{'.indexOf(safe[i]) >= 0) depth++;
      else if (')]}'.indexOf(safe[i]) >= 0) depth--;
      else if (!depth && safe.slice(i, i + separator.length) === separator) { result.push(text.slice(start, i).trim()); start = i + separator.length; i += separator.length - 1; }
    }
    result.push(text.slice(start).trim()); return result;
  }
  function assignment(text) {
    var safe = mask(text), depth = 0;
    for (var i = 0; i < safe.length; i++) {
      if ('([{'.indexOf(safe[i]) >= 0) depth++;
      else if (')]}'.indexOf(safe[i]) >= 0) depth--;
      else if (!depth && safe[i] === '=' && !/[=!<>:]/.test(safe[i - 1] || ' ') && safe[i + 1] !== '=' && safe[i + 1] !== '>') {
        var op = /[+\-*/%&|^]/.test(safe[i - 1] || ' ') ? safe[i - 1] + '=' : '=';
        return { left: text.slice(0, i - op.length + 1).trim(), op: op, right: text.slice(i + 1).replace(/;$/, '').trim() };
      }
    }
    return null;
  }
  function expression(text, lang, level) {
    text = text.trim().replace(/;$/, ''); level = level || 0;
    if (!text) return '空表达式';
    if (level > 5) return quoted(text);
    var q = quoted, m, parts, safe = mask(text), py = lang === 'python';
    if (/^(?:[bru]{0,2})?["']/.test(text) && !mask(text).trim().replace(/^[bru]{1,2}/, '').trim()) return '字面量 ' + q(text);
    if (/^-?(?:0x[\da-f]+|\d+(?:\.\d+)?)[lLfFdD]?$/i.test(text)) return '数值 ' + text;
    if (/^(?:true|false|True|False)$/.test(text)) return '布尔值 ' + text;
    if (/^(?:null|None|undefined)$/.test(text)) return '空值 ' + text;
    var conditional = split(text, '?');
    if (conditional.length === 2) { var choices = split(conditional[1], ':'); if (choices.length === 2) return '判断 ' + q(conditional[0]) + '；成立时取 ' + expression(choices[0],lang,level + 1) + '，否则取 ' + expression(choices[1],lang,level + 1); }
    if ((m = text.match(/^(["'])(.*?)\1\.join\(([\s\S]*)\)$/))) {
      var generator = m[3].match(/^([\s\S]+?)\s+for\s+(.+?)\s+in\s+([\s\S]+)$/);
      var pair = generator && generator[1].match(/^(\w+)\s*\+\s*["']=["']\s*\+\s*str\((\w+)\)$/);
      return '用分隔符 ' + q(m[2] || '空字符串') + ' 连接' + (generator ? '集合 ' + q(generator[3]) + ' 中每项（解包为 ' + generator[2] + '），' + (pair ? '每项先把键 ' + pair[1] + '、等号和转成字符串的值 ' + pair[2] + ' 拼成“键=值”' : '每项先构造 ' + q(generator[1])) : q(m[3]) + ' 中的各个字符串');
    }
    parts = split(text, '+');
    if (parts.length > 1) return ((lang === 'java' ? /"|\.join\(|String\.valueOf\(/ : /['"]|\.join\(|\bstr\(/).test(text) ? '按顺序拼接：' : '相加（若操作数为字符串，则连接文本）：') + parts.map(function (p) { return expression(p, lang, level + 1); }).join('；再加上 ');
    if ((m = text.match(/^sorted\(([\s\S]+)\)$/))) {
      var comp = m[1].match(/^([\s\S]+?)\s+for\s+(.+?)\s+in\s+(.+?)\s+if\s+([\s\S]+)$/);
      if (comp) return '遍历 ' + q(comp[3]) + (comp[3].endsWith('.items()') ? ' 提供的字典键值对' : '') + '，将每项解包为 ' + comp[2] + '；' + (/\b\w+\s*!=\s*["']sign["']\s+and\s+\w+\s*!=\s*["']["']/.test(comp[4]) ? '排除键为 sign 或值为空字符串的项' : '仅保留满足 ' + q(comp[4]) + ' 的项') + '，构造成 ' + q(comp[1]) + '，再按默认升序排序（元组先比较第一个元素，再比较后续元素）';
      return '将 ' + q(m[1]) + ' 排序为新列表；默认升序，不原地修改输入';
    }
    if ((m = text.match(/^hashlib\.(md5|sha256|sha1)\(([\s\S]+)\)\.hexdigest\(\)$/))) return '先' + expression(m[2], lang, level + 1) + '，再计算 ' + m[1].toUpperCase() + ' 摘要，转换成' + ({md5:32,sha256:64,sha1:40})[m[1]] + ' 位十六进制字符串' + (m[1] === 'md5' ? '；这是摘要计算，不是加密，MD5 不适合新的安全签名设计' : '');
    if ((m = text.match(/^(.+)\.(encode|decode)\((.*)\)$/))) return '将 ' + q(m[1]) + (m[2] === 'encode' ? ' 按 ' + (m[3] || '默认 UTF-8') + ' 编码为字节' : ' 按 ' + (m[3] || '默认 UTF-8') + ' 将字节解码为文本');
    if ((m = text.match(/^(.+)\[::(-?\d+)\]$/))) return Number(m[2]) === -1 ? '倒序复制 ' + q(m[1]) + '，不修改原对象' : '对 ' + q(m[1]) + ' 按步长 ' + m[2] + ' 切片';
    if ((m = text.match(/^(?:bytes|bytearray)\((.+)\)$/))) return '构造' + (text.indexOf('bytearray') === 0 ? '可修改的字节数组' : '不可修改的字节序列') + '，内容来自 ' + q(m[1]);
    if ((m = text.match(/^(?:new\s+)([\w.$]+)(?:<[^>]*>)?\((.*)\)$/))) return '创建 ' + m[1] + ' 对象' + (m[2] ? '，构造参数为 ' + q(m[2]) : '，调用无参构造器');
    if ((m = text.match(/^new\s+([\w.]+)\[([^\]]+)\]$/))) return '创建长度为 ' + q(m[2]) + ' 的 ' + m[1] + ' 数组；元素先使用该类型的默认值';
    if ((m = text.match(/^(?:\{[\s\S]*\}|\[[\s\S]*\])$/))) return (text[0] === '{' ? (py ? '创建字典或集合' : '创建初始化内容') : '创建列表') + '：' + q(text);
    if ((m = text.match(/^(.+)\.items\(\)$/))) return '取得字典 ' + q(m[1]) + ' 的键值对视图，每项为 (键, 值)';
    if ((m = text.match(/^(.+)\.(get|put|add|append|remove|containsKey|contains|size|isEmpty|read|readLine|readAllBytes|nextLine|nextInt|start|join|close|write|flush)\((.*)\)$/))) {
      var receiver = m[1], method = m[2], args = m[3];
      var meanings = {get:'读取指定键或下标对应的值',put:'保存键值映射；相同键原来的值会被替换',add:'加入一个元素',append:'追加内容',remove:'移除指定内容',containsKey:'判断是否存在指定键',contains:'判断是否包含指定内容',size:'读取元素数量',isEmpty:'判断内容是否为空',read:'读取输入数据；具体单位与返回值由流类型决定',readLine:'读取一行文本，不包含行尾换行符；结束时返回 null',readAllBytes:'读取剩余全部字节',nextLine:'读取下一行输入',nextInt:'把下一个输入标记解析为整数',start:'启动这个线程，交由调度器执行 run；直接调用 run 不会新建线程',join:'等待这个线程结束后，当前线程才继续',close:'关闭资源，释放其占用',write:'写入指定内容',flush:'把缓冲内容交给底层输出目标'};
      return '对 ' + q(receiver) + ' 调用 ' + method + '：' + meanings[method] + (args ? '；参数为 ' + q(args) : '');
    }
    if ((m = text.match(/^([\w.$]+)\((.*)\)$/))) {
      var builtins = {len:'读取长度',str:'转换为字符串',int:'转换为整数',hex:'转换成带 0x 前缀的十六进制字符串',range:'创建整数范围（右端不包含）',input:'显示提示并读取一行输入',open:'打开文件并返回文件对象',print:'输出到控制台',abs:'求绝对值',max:'取最大值',min:'取最小值',sum:'求和',ord:'取得字符的 Unicode 码点',chr:'把 Unicode 码点变成字符',enumerate:'产生下标与元素的配对',zip:'逐项配对多个可迭代对象','Integer.parseInt':'把字符串解析为 int','Math.max':'取最大值','Math.min':'取最小值','Math.abs':'求绝对值','Thread.sleep':'让当前线程暂停指定毫秒；不会释放已持有的监视器锁','System.currentTimeMillis':'读取当前时间的毫秒数'};
      return (builtins[m[1]] || '调用函数/方法 ' + q(m[1])) + (m[2] ? '，传入 ' + q(m[2]) : '，不传参数');
    }
    for (var op of [' == ', ' != ', ' >= ', ' <= ', ' > ', ' < ', ' ^ ', ' * ', ' / ', ' % ', ' - ']) {
      parts = split(text, op); if (parts.length > 1) return ({' == ':'判断是否相等：',' != ':'判断是否不等：',' >= ':'判断大于或等于：',' <= ':'判断小于或等于：',' > ':'判断大于：',' < ':'判断小于：',' ^ ':'按位异或：',' * ':'相乘：',' / ':'相除：',' % ':'求余：',' - ':'相减：'})[op] + parts.map(q).join(' 与 ');
    }
    if ((m = text.match(/^(.+)\[([^\]]+)\]$/))) return '读取 ' + q(m[1]) + ' 中下标/键为 ' + q(m[2]) + ' 的内容';
    if (/^[\w.$]+$/.test(text)) return '读取 ' + q(text) + ' 当前保存的值';
    return '计算表达式 ' + q(text);
  }
  function describe(source, language, index) {
    var lines = Array.isArray(source) ? source : source.split('\n'), raw = lines[index] || '', s = raw.trim(), lang = ({py:'python',js:'javascript',mysql:'sql',bash:'shell',sh:'shell'})[language] || language;
    var m, a, safe = mask(s), q = quoted, inlineNote = '';
    function answer(title, text) {
      // A declaration and functional body may share one line; do not call the whole line boilerplate.
      if (/^(?:定义方法|定义类型|程序入口)/.test(title) && s.indexOf('{') >= 0 && s.slice(s.indexOf('{') + 1).replace(/}\s*$/, '').trim()) {
        var body = s.slice(s.indexOf('{') + 1).replace(/}\s*$/, '').trim();
        text += ' 本行还包含实现：' + split(body, ';').filter(Boolean).map(function (statement) { return describe(statement + (/[{}]$/.test(statement) ? '' : ';'),lang,0).text; }).join(' ');
      }
      return {title:title, text:text + (inlineNote ? ' 原注释补充：' + inlineNote : '')};
    }
    function expr(text) { return expression(text, lang); }
    if (!s) return answer('空行', '分隔相邻代码段，便于阅读；本行不执行操作。');
    var earlier = lines.slice(0,index).join('\n');
    if ((lang === 'java' || lang === 'python') && (earlier.match(/"""/g) || []).length % 2) return answer(s.indexOf('"""') >= 0 ? '多行字符串结束' : '多行字符串内容', '本行属于前面打开的多行字符串：' + q(s) + '。这里保存文本内容，不把文本中的关键字当作程序语句。');
    var commentsBefore = mask(earlier);
    if (commentsBefore.lastIndexOf('/*') > commentsBefore.lastIndexOf('*/')) return answer('块注释', '本行仍在 /* … */ 注释内：' + q(s) + '；不参与执行。');
    if (/^(?:\/\/|\/\*|\*|<!--)/.test(s) || /^(?:python|shell)$/.test(lang) && s[0] === '#' || /^(?:lua|sql)$/.test(lang) && s.startsWith('--')) return answer('注释', '说明：' + s.replace(/^(?:\/\/|#|--|\/\*|\*|<!--)\s*/, '').replace(/\*\/\s*$/, '') + '。注释不参与程序执行。');
    if ((m = s.match(/^#(include|define)\s+(.+)/))) return answer('预处理声明', m[1] === 'include' ? '引入头文件 ' + q(m[2]) + '，供编译器读取类型和函数声明。' : '定义宏 ' + q(m[2]) + '，在预处理阶段进行替换。');
    if (lang === 'python' && /^\s*(?:"""|''')/.test(s)) return answer('文档字符串', '为模块、函数或类提供说明：' + s.replace(/"""|'''/g,'') + '；位于定义体开头时可通过 __doc__ 读取。');
    // Only syntax outside strings starts a control statement. A join generator is not a for statement.
    var commentStart = lang === 'python' || lang === 'shell' ? safe.indexOf('#') : lang === 'sql' || lang === 'lua' ? safe.indexOf('--') : safe.indexOf('//');
    if (commentStart >= 0) { inlineNote = s.slice(commentStart + (lang === 'python' || lang === 'shell' ? 1 : 2)).trim(); s = s.slice(0, commentStart).trim(); safe = mask(s); }
    if ((m = s.match(/^package\s+([^;]+);?/))) return answer('包声明 · 模板代码', '把本文件的类型放入 ' + q(m[1]) + ' 包；完整类名需要带此包名前缀。');
    if ((m = s.match(/^(?:public\s+)?@interface\s+(\w+)/))) return answer('定义注解', '声明名为 ' + q(m[1]) + ' 的 Java 注解类型；其成员定义可填写的元数据，不是普通接口实现。');
    if ((m = s.match(/^pragma\s+solidity\s+(.+);/))) return answer('编译器版本约束', '要求 Solidity 编译器版本满足 ' + q(m[1]) + '，不产生合约运行逻辑。');
    if ((m = s.match(/^contract\s+(\w+)/))) return answer('定义合约', '声明 Solidity 合约 ' + q(m[1]) + '，后续状态变量和函数属于这个合约。');
    if ((m = s.match(/^import\s+(.+?);?$/))) return answer('导入依赖', lang === 'python' ? '加载模块 ' + q(m[1]) + (m[1] === 'hashlib' ? '，后面可调用 hashlib.md5 / sha256 等摘要函数。' : '，供后续代码引用其功能。') : '引入 ' + q(m[1].replace(/;$/, '')) + ' 的类型或静态成员名称，后文可用短名称引用；这行本身不运行 main。');
    if ((m = s.match(/^from\s+(\S+)\s+import\s+(.+)$/))) return answer('导入名称', '从模块 ' + q(m[1]) + ' 导入 ' + q(m[2]) + '，后文可直接使用这些名称。');
    if ((m = s.match(/^@(\w+)/))) {
      var annotations = {Override:'要求此方法覆盖/实现父类型方法；签名不匹配时编译报错',FunctionalInterface:'要求此接口只有一个抽象方法，供 lambda 实现',Deprecated:'标记已过时的 API，提醒调用者迁移',SpringBootApplication:'组合启动配置、自动配置和组件扫描标记，供 Spring Boot 启动时读取',RestController:'把类注册为 Web 控制器，并将方法返回值默认写入响应体',Controller:'把类注册为 Spring MVC 控制器',Service:'将业务类交给 Spring 组件扫描与容器管理',Component:'将类声明为可由 Spring 扫描管理的组件',Repository:'声明数据访问组件，可参与持久层异常转换',Autowired:'由 Spring 按依赖类型等规则注入对象',Bean:'把配置方法的返回对象注册为 Spring Bean',Configuration:'将类作为 Spring 的 Bean 配置来源',Transactional:'声明事务边界；通常需经 Spring 代理调用才会应用，内部自调用可能绕过代理',GetMapping:'把方法映射到 HTTP GET 请求',PostMapping:'把方法映射到 HTTP POST 请求',RequestMapping:'声明路径、HTTP 方法等请求映射条件',RequestBody:'从 HTTP 请求体读取并转换方法参数',RequestParam:'从请求参数中绑定方法参数',PathVariable:'从 URL 路径变量绑定方法参数',Test:'把紧随的方法标为测试用例，供测试运行器调用',BeforeEach:'在每个测试用例前执行此方法',AfterEach:'在每个测试用例后执行此方法',Data:'由 Lombok 在编译期生成常用访问器、equals/hashCode 等代码',Slf4j:'由 Lombok 在编译期生成日志字段',Entity:'把类映射为持久化实体',Id:'标记持久化主键',Scheduled:'声明由 Spring 调度器触发的方法',Async:'声明由 Spring 异步执行机制处理的方法'};
      return answer('注解/装饰器 ' + m[1], (lang === 'python' ? '使用装饰器 ' + q(s) + ' 在定义时包装下方函数或类' : annotations[m[1]] || '把 ' + q(s) + ' 元数据附加到紧随的声明，由其对应组件读取') + (s.indexOf('(') >= 0 ? '；本行参数为 ' + q(s.slice(s.indexOf('('))) : '') + '。');
    }
    if ((m = s.match(/^(?:async\s+)?def\s+(\w+)\((.*)\)(?:\s*->\s*[^:]+)?:/))) return answer('定义函数 ' + m[1], '定义函数 ' + q(m[1]) + '，参数为 ' + q(m[2] || '无') + '；函数体在后续缩进代码中，调用此函数时才执行。');
    if ((m = s.match(/^throws\s+(.+?)\s*\{/))) return answer('声明可能抛出的异常', '本方法向调用者声明可能抛出 ' + q(m[1]) + '；本行不代表异常已经发生。');
    if ((m = s.match(/^(?:public|protected|private)\s+(\w+)\s*\{/))) return answer('紧凑构造器', '定义 record ' + q(m[1]) + ' 的紧凑构造器；创建记录实例时先执行这里的校验，再由编译器完成字段赋值。');
    if ((m = s.match(/^(?:(?:public|private|protected|static|final|abstract|sealed)\s+)*(class|interface|enum|record)\s+(\w+)(.*)/))) return answer('定义类型 ' + m[2], '声明 ' + m[1] + ' ' + q(m[2]) + (m[3].replace(/[{:].*$/, '').trim() ? '，关系/参数为 ' + q(m[3].replace(/[{:].*$/, '')) : '') + '；定义类型不等于创建对象或执行方法。');
    if (/^(?:public\s+)?static\s+void\s+main\s*\(/.test(s)) return answer('程序入口 · 模板代码', '声明 Java 程序入口 main；虚拟机从此方法体开始执行，String[] args 接收程序参数。本行定义入口，实际功能在方法体内。');
    if ((m = s.match(/^(?:(?:public|private|protected|static|final|synchronized|native|abstract|default)\s+)*(?:[\w<>?\[\],.]+)\s+(\w+)\(([^)]*)\)(?:\s+throws\s+[^{};]+)?\s*[{;]/)) && !/^(?:return|throw|new|else|if|for|while|switch|catch)\b/.test(s)) return answer('定义方法 ' + m[1], '声明方法 ' + q(m[1]) + '，参数为 ' + q(m[2] || '无') + '；' + (/;\s*$/.test(s) ? '本行只有签名，实现由其他类或 native 代码提供。' : '方法体位于随后的花括号内，被调用时执行。'));
    var head = safe.match(/^(?:}\s*)?(if|else\s+if|while|for|switch|synchronized)\s*\(/);
    if (head) {
      var start = safe.indexOf('('), depth = 0, end = -1;
      for (var at = start; at < safe.length; at++) { if (safe[at] === '(') depth++; else if (safe[at] === ')' && --depth === 0) { end = at; break; } }
      if (end >= 0) {
        var condition = s.slice(start + 1, end), tail = s.slice(end + 1).trim(), kind = head[1];
        if (kind === 'for') { var components = split(condition, ';'); return components.length === 3 ? answer('循环', '进入循环前执行 ' + q(components[0]) + '；每轮先检查 ' + q(components[1] || '恒为真') + '，成立才执行循环体；每轮结束执行 ' + q(components[2]) + '，再检查条件。' + (tail && tail[0] !== '{' ? '循环体的操作是：' + describe(tail, lang, 0).text : '')) : answer('遍历元素', '按 ' + q(condition) + ' 逐项取出集合/数组元素，每项执行一次循环体。'); }
        if (kind === 'synchronized') return answer('进入同步块', '取得 ' + q(condition) + ' 的监视器锁后才执行块内代码；离开时释放锁。');
        if (kind === 'switch') return answer('选择分支', '计算 ' + q(condition) + '，选择匹配的 case；没有匹配项时进入 default（若存在）。');
        return answer(kind === 'while' ? '条件循环' : '条件分支', '检查 ' + q(condition) + '；' + (kind === 'while' ? '每轮检查为真才执行循环体，为假则退出。' : '为真时执行本分支，为假则跳过。') + (tail && tail[0] !== '{' ? '本分支的操作是：' + describe(tail, lang, 0).text : ''));
      }
    }
    if ((m = s.match(/^(?:}\s*)?else\s+if\s*\((.*)\)\s*\{?/)) || (m = s.match(/^(?:if|elif)\s*\(?(.+?)\)?\s*[:{]\s*$/))) return answer('条件分支', '判断条件 ' + q(m[1]) + '；成立时执行当前分支，不成立时跳过，继续检查后续分支。');
    if (/^(?:}\s*)?else\s*[:{]/.test(s)) return answer('否则分支', '前面的 if / elif 条件都不成立时，才执行这里的代码。');
    if ((m = s.match(/^for\s*\((.*)\)\s*\{?/))) {
      var loop = split(m[1], ';');
      if (loop.length === 3) return answer('循环', '进入循环前执行 ' + q(loop[0]) + '；每轮先检查 ' + q(loop[1] || '恒为真') + '，成立才执行循环体；每轮结束执行 ' + q(loop[2]) + '，再检查条件。');
      return answer('遍历元素', '按 ' + q(m[1]) + ' 逐项取出集合/数组元素，每取出一项执行一次循环体。');
    }
    if ((m = s.match(/^for\s+(.+?)\s+in\s+(.+):\s*$/))) return answer('遍历元素', '依次遍历 ' + q(m[2]) + '，把当前项赋给 ' + q(m[1]) + '；每项执行一次下方缩进的循环体。');
    if ((m = s.match(/^while\s*\(?(.+?)\)?\s*[:{]\s*$/))) return answer('条件循环', '每轮开始判断 ' + q(m[1]) + '；成立则继续执行循环体，否则退出。循环体需要改变条件所依赖的状态，才能正常结束。');
    if ((m = s.match(/^(?:return|yield)\b\s*([\s\S]*?);?$/))) return answer(s.startsWith('yield') ? '产生一个值' : '返回结果', m[1] ? expr(m[1]) + (s.startsWith('yield') ? '；产生该值并暂停生成器，等待下次迭代。' : '；将结果交给调用者，并结束本次方法/函数调用。') : '结束本次方法/函数调用，不返回具体值。');
    if ((m = s.match(/^(?:throw|raise)\s+(.+?);?$/))) return answer('抛出异常', expr(m[1]) + '；正常流程中断，交给匹配的异常处理代码，未处理时向调用者传播。');
    if (/^break\b/.test(s)) return answer('跳出', '立即退出最近一层循环或 switch，继续执行该结构之后的代码。');
    if (/^continue\b/.test(s)) return answer('下一轮', '跳过当前轮余下语句，进入循环的下一轮检查/更新。');
    if ((m = s.match(/^assert\s+(.+)/))) return answer('断言', '检查 ' + q(m[1]) + '；不成立则抛出断言异常。Java 断言默认可能关闭，需要启用 -ea。');
    if (/^(?:}\s*)?(?:try\s*[:{(]|catch\s*\(|except\b|finally\s*[:{])/.test(s)) return answer('异常与资源管理', /^try/.test(s) ? '开始受保护的代码块' + (s.indexOf('(') >= 0 ? '；括号中声明的资源会在离开代码块时自动关闭。' : '；后续异常可由 catch / except 处理，finally 负责收尾。') : /^(?:}\s*)?(?:catch|except)/.test(s) ? '捕获与 ' + q(s) + ' 匹配的异常；只有前面的受保护代码抛出对应异常时才进入。' : '执行收尾代码；正常结束和异常传播时通常都会经过此块。');
    if (/^do\s*\{/.test(s)) return answer('先执行再检查的循环', '先执行循环体，随后才检查 while 条件；因此循环体至少执行一次。');
    if ((m = s.match(/^(case\s+.+?|default)\s*(?:->|:)(.*)$/))) return answer('选择分支', '当 switch 匹配 ' + q(m[1]) + ' 时执行 ' + q(m[2] || '后续代码') + (/->/.test(s) ? '；箭头分支不会自动贯穿到下一个 case。' : '；冒号分支需注意 break，避免继续贯穿后面的 case。'));
    if ((m = s.match(/^(?:print|System\.out\.(?:println|print)|System\.err\.println|console\.(?:log|error|warn))\s*\(([\s\S]*)\);?$/))) return answer('输出', '将 ' + split(m[1], ',').map(expr).join('；以及 ') + ' 输出到控制台' + (/\.print\(/.test(s) ? '，不自动追加换行。' : '。'));
    if (lang === 'sql') {
      if ((m = s.match(/^EXPLAIN\s+(.+)/i))) return answer('查看执行计划', '分析 ' + q(m[1]) + ' 的执行计划，观察访问路径、索引和估算行数；EXPLAIN 本身不返回该查询的业务数据。');
      if ((m = s.match(/^SHOW\s+(.+?);?$/i))) return answer('查看数据库信息', '向数据库请求 ' + q(m[1]) + ' 对应的元数据、变量或运行状态；不修改业务记录。');
      if ((m = s.match(/^FROM\s+(.+?);?$/i))) return answer('指定查询来源', '从 ' + q(m[1]) + ' 读取数据，供本条 SELECT 的投影、筛选、连接或聚合使用。');
      if ((m = s.match(/^UPDATE\s+(\w+)$/i))) return answer('指定更新表', '准备更新表 ' + q(m[1]) + '；具体修改由后续 SET 指定，影响范围由 WHERE 指定。');
      if ((m = s.match(/^SET\s+(.+)/i))) return answer('设置值', '按照 ' + q(m[1]) + ' 设置字段或会话变量；具体作用取决于当前 UPDATE 或 SET 语句上下文。');
      if (/^\)\s*ENGINE\b/i.test(s)) return answer('表存储选项', '结束列定义，并指定表选项 ' + q(s.slice(1).replace(/;$/, '')) + '；例如 InnoDB 是存储引擎，CHARSET 指定字符集。');
      if ((m = s.match(/^(\w+)\s+(BIGINT|INT|INTEGER|VARCHAR\([^)]*\)|CHAR\([^)]*\)|DECIMAL\([^)]*\)|DATETIME|TIMESTAMP|TEXT|BOOLEAN)(?=\s|,|$)\s*(.*)/i))) return answer('声明数据列', '声明列 ' + q(m[1]) + '，类型为 ' + q(m[2]) + (m[3] ? '；约束和默认值为 ' + q(m[3]) : '') + '。NOT NULL 禁止空值，DEFAULT 给未指定值时使用的默认值。');
      if (/^SELECT\b/i.test(s)) {
        var fields = s.match(/^SELECT\s+([\s\S]+?)(?:\s+FROM\b|;?$)/i), from = s.match(/\bFROM\s+([^\s;]+)/i), where = s.match(/\bWHERE\s+(.+?)(?=\s+(?:GROUP BY|ORDER BY|LIMIT|HAVING)\b|;?$)/i), order = s.match(/\bORDER BY\s+(.+?)(?=\s+LIMIT\b|;?$)/i), group = s.match(/\bGROUP BY\s+(.+?)(?=\s+(?:HAVING|ORDER BY|LIMIT)\b|;?$)/i), limit = s.match(/\bLIMIT\s+([^;]+)/i);
        return answer('查询数据', '选择/计算 ' + q(fields ? fields[1] : s.slice(6)) + (from ? '，数据来自表 ' + q(from[1]) : '') + (where ? '；只保留满足 ' + q(where[1]) + ' 的行' : '') + (group ? '；按 ' + q(group[1]) + ' 分组' : '') + (order ? '；按 ' + q(order[1]) + ' 排序（DESC 降序，ASC 升序）' : '') + (limit ? '；限制结果行数为 ' + q(limit[1]) : '') + '。查询只返回结果，不修改原数据。');
      }
      if ((m = s.match(/^UPDATE\s+(\S+)\s+SET\s+(.+)/i))) return answer('更新数据', '更新表 ' + q(m[1]) + '，按 ' + q(m[2]) + ' 赋值；若整个语句没有 WHERE，将影响所有行。');
      if ((m = s.match(/^INSERT\s+INTO\s+(\S+)\s*(.*)/i))) return answer('插入数据', '向表 ' + q(m[1]) + ' 插入后续 VALUES 或查询给出的记录；需满足列类型与约束。');
      if ((m = s.match(/^DELETE\s+FROM\s+(\S+)(.*)/i))) return answer('删除数据', '从表 ' + q(m[1]) + ' 删除满足 ' + q(m[2] || '全部记录（无 WHERE）') + ' 的行。');
      if ((m = s.match(/^CREATE\s+(?:UNIQUE\s+)?(TABLE|INDEX|DATABASE|VIEW)\s+(?:IF NOT EXISTS\s+)?([^\s(]+)/i))) return answer('创建数据库对象', '创建 ' + m[1].toUpperCase() + ' ' + q(m[2]) + '；后续部分声明其列、索引或查询定义。');
      if ((m = s.match(/^(WHERE|AND|OR|ON|HAVING|ORDER BY|GROUP BY|LIMIT|JOIN|LEFT JOIN|INNER JOIN)\s+(.+)/i))) return answer('查询条件/结构', ({WHERE:'只保留满足条件的行',AND:'与前一条件同时成立',OR:'与前一条件至少一个成立',ON:'指定连接匹配条件',HAVING:'过滤分组后的结果','ORDER BY':'按给定字段及方向排序','GROUP BY':'按字段分组',LIMIT:'限制返回行数',JOIN:'连接另一张表','LEFT JOIN':'连接另一张表，保留左表全部行','INNER JOIN':'只保留连接匹配的行'})[m[1].toUpperCase()] + '：' + q(m[2]));
      if (/^(?:BEGIN|START TRANSACTION|COMMIT|ROLLBACK)\b/i.test(s)) return answer('事务控制', /^COMMIT/i.test(s) ? '提交当前事务的修改。' : /^ROLLBACK/i.test(s) ? '撤销当前事务中尚未提交的修改。' : '开始事务，将后续操作作为一个提交或回滚单元。');
    }
    if (/^(?:yml|yaml|properties|json|xml|dockerfile)$/.test(lang)) {
      if ((m = s.match(/^([^:=<>]+)\s*[:=]\s*(.+)$/))) return answer('配置项', '把配置键 ' + q(m[1]) + ' 设置为 ' + q(m[2]) + '；由读取此文件的组件解释，不是立即执行的语句。');
      if ((m = s.match(/^<([\w:.-]+)(?:\s[^>]*)?>([^<]+)<\//))) return answer('XML 配置值', '给 ' + q(m[1]) + ' 元素填写 ' + q(m[2]) + '；该值由配置读取方使用。');
      return answer('配置结构 · 模板代码', '本行 ' + q(s) + ' 声明配置的层级、标签或边界；需要与其外层配置共同交给相应组件读取。');
    }
    if (lang === 'shell') {
      var commands = {cd:'切换当前工作目录',ls:'列出目录内容',pwd:'显示当前目录',mkdir:'创建目录',cat:'读取并打印文件',echo:'打印给定内容',grep:'按模式筛选文本',find:'查找文件',chmod:'修改文件权限',chown:'修改文件所有者',ps:'查看进程',top:'实时查看进程资源',java:'使用 Java 启动类或 JAR',javac:'编译 Java 源码为 class 文件',javap:'反汇编/查看 class 的字段、方法和字节码',jdb:'启动 Java 调试器',python:'启动 Python 解释器',python3:'启动 Python 解释器',mvn:'执行 Maven 构建目标',git:'执行 Git 版本管理操作',curl:'发出网络请求',docker:'管理容器与镜像',redis:'执行 Redis 操作','redis-cli':'向 Redis 发送命令',mysql:'启动 MySQL 客户端'};
      var command = s.replace(/^\$\s*/, '').split(/\s+/)[0];
      return answer('命令 ' + command, (commands[command] || '调用命令 ' + q(command)) + '；完整参数/管道为 ' + q(s) + '。这是命令说明，网页不会执行本机命令。');
    }
    a = assignment(s);
    if (a) {
      var name = a.left.replace(/^(?:(?:public|private|protected|static|final|volatile|const|let|var)\s+)*/, '').replace(/^[\w.$<>?\[\], ]+\s+(?=[\w$]+$)/, '');
      if (a.op !== '=') return answer('更新 ' + name, '先读取 ' + q(name) + ' 原值，与 ' + q(a.right) + ' 执行 ' + a.op[0] + ' 运算，再把结果写回 ' + q(name) + '。');
      if (lang === 'python' && /\.join\(/.test(a.right) && /salt/i.test(a.right)) return answer('拼接参数与盐值', expr(a.right) + '；最终保存到 ' + q(name) + '，作为后续摘要计算的原始字符串。');
      return answer((/\bfinal\b|^[A-Z_][A-Z_\d]*$/.test(a.left) ? '设置常量 ' : '赋值给 ') + name, expr(a.right) + '；把结果保存到 ' + q(name) + (/\bSALT\b/.test(name) ? '，作为后续构造签名原文时追加的固定盐值。' : '，后续语句可使用它。'));
    }
    if ((m = s.match(/^([\w.$\[\]]+)\s*(\+\+|--);?$/))) return answer('更新 ' + m[1], '将 ' + q(m[1]) + (m[2] === '++' ? ' 加 1' : ' 减 1') + '，写回原位置；对共享变量的此类更新不天然保证原子性。');
    if (/^[}\]);]+\s*;?$/.test(s)) {
      var context = lines.slice(0,index).join('\n'), definitions = Array.from(context.matchAll(/\b(?:class|interface|def|function)\s+(\w+)/g));
      return answer('结构结束 · 模板代码', '结束前面打开的代码块、调用或字面量' + (definitions.length ? '；当前附近的定义为 ' + q(definitions[definitions.length - 1][1]) : '') + '。本行边界符本身不执行计算。');
    }
    if (/^synchronized\s*\(/.test(s)) return answer('进入同步块', '先取得 ' + q(s.match(/^synchronized\s*\((.*)\)/)[1]) + ' 对应的监视器锁，再进入代码块；离开时释放锁。');
    if (/\w\s*\(/.test(safe)) return answer('执行调用/表达式', expr(s) + '。具体实现以被调用函数的定义为准。');
    if ((m = s.match(/^(?:(?:public|private|protected|final|static|volatile|transient)\s+)*([\w<>?\[\]., ]+)\s+([\w$]+)(\[\])?;$/))) {
      var declaration = '声明类型为 ' + q(m[1] + (m[3] || '')) + ' 的 ' + q(m[2]) + '；此行没有显式赋初值。';
      if (lang === 'java' && /\bfinal\b/.test(s)) {
        return answer('声明 final 变量/字段', declaration + '必须在合法初始化路径中恰好赋值一次：实例字段由构造器或实例初始化块赋值，static 字段由静态初始化块赋值，局部变量必须在读取前赋值；不能依靠类型默认值跳过这项要求。' + (/\[\]/.test(s) ? 'final 限制数组引用改指向，不会禁止修改数组元素。' : '初始化后不能再赋值。'));
      }
      return answer('声明变量/字段', declaration + '非 final 字段使用类型默认值，局部变量则必须在使用前赋值。');
    }
    if ((m = s.match(/^struct\s+(\w+)\s*\{/))) return answer('定义结构体', '声明 C 结构体 ' + q(m[1]) + '；后续字段按其布局组成一份结构体数据。');
    if (s === '{') return answer('代码块开始 · 模板代码', '打开一个代码块或初始化块；具体执行时机由外层声明决定，花括号本身不进行计算。');
    if (/^[\u4e00-\u9fff][\u4e00-\u9fff\w ]+;?$/.test(s)) return answer('伪代码步骤', '本行描述步骤：' + s.replace(/;$/, '') + '。它省略了真实 API 调用细节，不是可以直接编译的语句。');
    if (/\)\s*(?:throws\s+[^{}]+)?\{$/.test(s) && index > 0) return answer('声明参数的续行', '补全前面方法/调用的参数或 throws 声明：' + q(s) + '；本行末尾的 { 开始随后的代码块。');
    if (lang === 'lua' && /^(?:end\)?|else)$/.test(s)) return answer('Lua 结构边界', s === 'else' ? '前面的条件不成立时，执行此分支。' : '结束前面的函数、条件或循环块。');
    if (/[,)]\s*;?$/.test(s) && index > 0) return answer('跨行表达式的续行', '为前面尚未结束的声明或调用补充 ' + q(s) + '；与前一行 ' + q(lines[index - 1].trim()) + ' 合起来阅读。');
    return answer('当前语句', '本行源码为 ' + q(s) + '。它依赖所在代码块的定义；片段未提供足够信息时，不能仅凭这一行断言其业务效果。');
  }
  window.HUB_LINES = {describe:describe, expression:expression, split:split};
})();
