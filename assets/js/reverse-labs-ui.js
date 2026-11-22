(function () {
  'use strict';
  var U = window.HUB_LAB_UI, M = window.HUB_MODELS;
  var profiles = {
    r01: ['evidence', '样本证据台：字节、格式与哈希'], r02: ['assembly', '寄存器与分支：从输入走到返回'],
    r03: ['binary', '文件头：高亮字节与边界检查'], r04: ['xref', '静态线索：字符串引用与分支核对'],
    r05: ['debug', '断点现场：参数、栈和返回值'], r06: ['memory-scan', '内存扫描：变化前后缩小候选'],
    r07: ['esp-principle', '坐标与覆盖层：观察可见性和证据'], r08: ['bytecode', '字节码执行：操作数栈逐条变化'],
    r09: ['apk', '打包状态机：跳过签名会怎样'], r10: ['jni', 'Java → JNI → native 调用链'],
    r11: ['hook', '自有样本插桩：参数与返回值的区别'], r12: ['protocol', '协议缓冲区：拆包、粘包与残帧'],
    r13: ['xor', '算法还原：按字节 XOR 与恢复'], r14: ['triage', '防御分析：证据与结论分开'],
    r15: ['scam-quiz', '反诈识别：先判断，再看证据'], r16: ['bytecode', 'BytecodeLab：输入、栈与边界'],
    r17: ['binary', '文件头检查器：真实解析人工字节'], r18: ['protocol', '离线协议：逐段喂入真实字节']
  };
  function plainModel(code, frames) { return { code: code, frames: [{ line: -1, note: '先看初始条件，再沿步骤核对状态。', state: { '状态': '准备' } }].concat(frames) }; }
  function branchModel(value, debug) {
    var model = M.bytecode(value);
    if (debug) { model.frames[0].note = '模拟断点停在 score 入口；这里固定演示 BytecodeLab，不执行任意 jdb 命令。'; model.frames.forEach(function (f) { f.state['调用栈'] = 'main → score'; }); }
    return model;
  }
  function mountKind(host, kind) {
    if (kind === 'memory-scan' || kind === 'esp-principle' || kind === 'scam-quiz') {
      host.appendChild(U.el('p', 'lab-note', '浏览器内的自有虚拟现场，不读取其他进程、不连接目标程序。修改状态后观察证据；现实工具与系统行为不由本演示保证。'));
      return window.HUB_DEMO_SYSTEM ? window.HUB_DEMO_SYSTEM.mount(host, kind) : window.DEMOS[kind].mount(host);
    }
    if (['bytecode', 'assembly', 'debug', 'xref'].indexOf(kind) >= 0) {
      return U.configurable(host, kind === 'assembly' ? '固定教学函数：32 位有符号整数 n * 3 + 1，再与 10 比较。修改 2、3、负数和极大值，观察分支及溢出。指令是简化模型，不是通用 x86 模拟器。' : kind === 'xref' ? '自有样本固定为 score(n)=n*3+1，decision 比较结果与 10，引用 ok/retry 两个字符串。单有字符串不能证明路径执行；用输入验证分支。' : '无需 JDK：浏览器实现本章固定样本的六条字节码语义。参数为 Java int；逐步观察局部变量、栈、返回值及 decision。它不是通用 Java 编译器。', function (settings) { return U.field(settings, '输入 n（Java int）', '2'); }, function (input) {
        var model = kind === 'assembly' ? M.assembly(input.value) : branchModel(input.value, kind === 'debug');
        if (kind === 'xref') model.frames.unshift({ line: -1, note: '引用关系：main → decision → score；decision 同时引用 ok 和 retry。下面验证哪个字符串实际被返回。', state: { '静态事实': '两条候选字符串', '仍需验证': '运行时选中了哪条路径' } });
        return model;
      });
    }
    if (kind === 'binary') {
      var hexInput;
      var cleanup = U.configurable(host, '用真实字节检查文件头；先验证读取边界，再按字节序解释字段。样例是人工夹具，不能据此判断完整文件可运行或安全。可删掉最后几个字节观察截断错误。', function (settings) { hexInput = U.field(settings, '文件字节（十六进制）', M.binarySample('class'), true); return hexInput; }, function (input) { return M.inspectBinary(input.value); });
      var presets = U.el('div', 'lab-controls'); ['class', 'PE', 'ELF', 'DEX'].forEach(function (format) { presets.appendChild(U.button('载入 ' + format + ' 夹具', function () { hexInput.value = M.binarySample(format); })); }); host.insertBefore(presets, host.children[1]); return cleanup;
    }
    if (kind === 'protocol') {
      var bytesInput;
      var stop = U.configurable(host, '真实解析本章的两字节大端长度前缀协议：UTF-8 按字节计长。每步添加一段输入，缓冲不足就等待，足够才解码。超长和非法 UTF-8 会明确拒绝。', function (settings) { bytesInput = U.field(settings, '输入字节流（十六进制）', M.hex(M.encodeMessages('OK\n你好')), true); return { hex: bytesInput, chunk: U.field(settings, '每次到达字节数（1～64）', '2') }; }, function (inputs) { return M.protocol(inputs.hex.value, inputs.chunk.value); });
      var controls = U.el('div', 'lab-controls'); [['完整双消息', '00 02 4f 4b 00 06 e4 bd a0 e5 a5 bd'], ['残帧', '00 05 4f 4b'], ['非法 UTF-8', '00 01 ff'], ['超长头', 'ff ff']].forEach(function (sample) { controls.appendChild(U.button('载入' + sample[0], function () { bytesInput.value = sample[1]; })); }); host.insertBefore(controls, host.children[1]); return stop;
    }
    if (kind === 'xor') return U.configurable(host, '按 UTF-8 字节计算 XOR；修改明文和密钥后，输出与恢复结果随之改变。异或是可逆运算，不等于安全加密。', function (settings) { return { text: U.field(settings, '明文', 'JAVA'), key: U.field(settings, '单字节密钥（0～255）', '42') }; }, function (inputs) { return M.xor(inputs.text.value, inputs.key.value); });
    if (kind === 'apk') return U.configurable(host, '简化 APK 工作流模型：只验证样本状态与步骤前提，不运行 apktool/adb，也不安装软件。签名变化与设备策略的真实兼容性需要在对应环境另测。', function (settings) { var label = U.el('label', 'lab-field', '故障注入'), select = U.el('select'); [['normal', '完整流程'], ['unsigned', '跳过签名'], ['changed', '签名后又修改内容']].forEach(function (item) { var option = U.el('option', '', item[1]); option.value = item[0]; select.appendChild(option); }); label.appendChild(select); settings.appendChild(label); return select; }, function (input) {
      var changed = input.value === 'changed', signed = input.value !== 'unsigned';
      return plainModel(['读取自有样本容器', '解包资源与代码', '重建后签名已失效', '对齐并签名', '检查签名与内容是否匹配', '尝试安装验证'], [
        { line: 0, note: '这里只使用虚拟样本，不接触真实 APK。', state: { '容器': 'ZIP/APK', '签名': '原样本签名' } },
        { line: 1, note: '资源和 DEX 分别分析；输出目录不是已经签名的安装包。', state: { '产物': '资源 / dex / smali', '可安装': '否' } },
        { line: 2, note: '内容改变后，旧签名不能证明新内容完整。', state: { '内容': '已改变', '签名有效': '否' } },
        { line: 3, note: signed ? '使用教学证书给当前内容签名。' : '注入故障：跳过签名。', state: { '签名': signed ? '已签名' : '缺失', '对齐': '完成' } },
        { line: 4, note: changed ? '签名后再次改内容，摘要不再匹配。' : '核对当前内容与签名状态。', state: { '内容摘要匹配': signed && !changed ? '是' : '否' } },
        { line: 5, note: signed && !changed ? '此模型满足签名前提；不代表绕过设备兼容、证书冲突或 App 自校验。' : '模型拒绝安装；回到签名步骤修复原因。', state: { '模型结果': signed && !changed ? '通过前提检查' : '失败：签名缺失或无效' } }
      ]);
    });
    if (kind === 'jni' || kind === 'hook') return U.configurable(host, '固定自有样本：nativeScore(n)=n*3+1。观察调用边界和参数/返回值；网页不连接 Frida、设备或其他进程。', function (settings) { var inputs = { n: U.field(settings, '调用参数 n', '2'), delta: U.field(settings, '教学插桩增加值', '1') }; var wrap = U.el('label', 'lab-field', '插桩位置'), select = U.el('select'); [['none', '不修改'], ['argument', '进入 native 前修改参数'], ['return', '返回 Java 前修改结果']].forEach(function (item) { var option = U.el('option', '', item[1]); option.value = item[0]; select.appendChild(option); }); wrap.appendChild(select); settings.appendChild(wrap); inputs.mode = select; return inputs; }, function (inputs) {
      var n = Number(inputs.n.value), delta = Number(inputs.delta.value); if (![n, delta].every(function (v) { return Number.isInteger(v) && Math.abs(v) <= 1000000; })) throw Error('请输入 ±1000000 以内的整数。');
      var arg = inputs.mode.value === 'argument' ? n + delta : n, original = arg * 3 + 1, result = inputs.mode.value === 'return' ? original + delta : original;
      return plainModel(['Java 调用 nativeScore(n)', 'JNI 绑定到自有 native 函数', '观察/修改入参', 'native 计算 n * 3 + 1', '观察/修改返回值', 'Java 收到返回值'], [
        { line: 0, note: '记录调用现场的原始输入。', state: { n: n } }, { line: 1, note: 'JNI 负责调用边界，native 函数体仍需要单独分析。', state: { '调用链': 'Java → JNI → native', '原始参数': n } },
        { line: 2, note: arg !== n ? '入参被改变，因此后续整个计算使用新参数。' : '入参未修改。', state: { '实际入参': arg } },
        { line: 3, note: '按实际入参计算。', state: { 'native 内部结果': original } }, { line: 4, note: result !== original ? '只改返回值，不倒推改变 native 内部已经发生的操作。' : '返回值原样传回。', state: { '内部结果': original, '传回结果': result } },
        { line: 5, note: '修改参数与修改返回值是两种干预，结果可能不同。', state: { '不插桩基线': n * 3 + 1, '本次 Java 观察值': result } }
      ]);
    });
    if (kind === 'triage') return U.configurable(host, '只分析人工文本中的行为线索。单个 API 名、字符串或文件头不能证明恶意；这里不执行样本、不计算“恶意概率”。', function (settings) { return U.field(settings, '自有样本观察记录', '导入：VirtualAlloc、CreateFile、WinHttpOpen\n字符串：example.test\n动态行为：未执行，未知', true); }, function (input) {
      var text = input.value, facts = [['内存相关线索', /VirtualAlloc|mmap/i], ['网络相关线索', /WinHttp|socket|https?:/i], ['文件相关线索', /CreateFile|fopen|write/i]];
      var frames = facts.map(function (entry, i) { var hit = entry[1].test(text); return { line: i, note: hit ? '记录到一条候选线索；正常程序也可能使用它。' : '本记录没有发现此类关键词；未发现不代表不存在。', state: { '观察项': entry[0], '关键词命中': hit ? '是' : '否', '能否认定恶意': '不能' } }; }); frames.push({ line: 3, note: '下一步应在合适隔离环境中验证行为；没有执行的事实不能写成“已经观察到”。', state: { '可报告': '静态线索与尚未验证的问题', '不能报告': '仅凭关键词断言恶意或安全' } }); return plainModel(['核对内存线索', '核对网络线索', '核对文件线索', '区分事实与待验证推断'], frames);
    });
    if (kind === 'evidence') {
      host.appendChild(U.el('p', 'lab-note', '输入自有样本的字节。浏览器真实计算 SHA-256，并记录文件头事实；哈希用于识别构建，不判断安全性。'));
      var bytes = U.field(host, '样本字节（十六进制）', M.binarySample('class'), true), output = U.el('pre', 'runtime-console'), alive = true;
      host.appendChild(U.button('读取证据与 SHA-256', async function () { try { var data = M.unhex(bytes.value), result = M.inspectBinary(bytes.value), digest = await crypto.subtle.digest('SHA-256', data); if (!alive || !host.isConnected) return; output.textContent = '格式线索：' + result.format + '\n字节数：' + data.length + '\nSHA-256：' + M.hex(new Uint8Array(digest)).replace(/ /g, '') + '\n事实：以上字节的头部与摘要。\n未知：完整文件是否可执行、是否安全。'; } catch (err) { output.textContent = err.message; } })); host.appendChild(output); return function () { alive = false; };
    }
    throw Error('未注册的实验类型：' + kind);
  }
  var cleanups = new Set();
  // One named concept lab per chapter, located beside the concept it teaches.
  // A chapter lab is not an execution adapter for every source block in that chapter.
  var placements = {
    r01: ['一个 10 秒', '读取人工样本字节，观察文件头与 SHA-256。'],
    r02: ['一段 C 函数', '用固定的 n * 3 + 1 教学函数观察寄存器与分支。'],
    r03: ['先问格式', '检查人工 class、PE、ELF、DEX 文件头，不运行文件。'],
    r04: ['静态分析跟做', '用固定 score(n) 样本核对字符串引用与实际分支。'],
    r05: ['动态验证', '用固定 score(n) 样本观察模拟断点、调用栈和返回值。'],
    r06: ['为什么第一次扫描', '在虚拟金币现场反复扫描，核对候选字段。'],
    r07: ['从防守角度', '用固定二维坐标观察覆盖层和可见性证据。'],
    r08: ['字节码阅读的顺序', '逐条推演固定 score(n) 函数的操作数栈。'],
    r09: ['重打包三件套', '检查打包、对齐、签名的步骤前提，不安装 APK。'],
    r10: ['JNI 边界:Java', '推演固定 nativeScore(n) 函数的 Java / JNI 调用边界。'],
    r11: ['插桩先做观测', '比较固定 nativeScore(n) 样本修改入参和返回值后的差别。'],
    r12: ['二进制协议:从字节流', '只推演长度前缀协议的拆包与粘包；下方 MD5 签名代码请使用代码自己的运行按钮。'],
    r13: ['实战一:还原', '按字节观察 XOR 与恢复；不执行 patch 或符号执行工具。'],
    r14: ['不运行未知样本', '对人工观察记录归类，不执行恶意样本。'],
    r15: ['证据核实', '练习识别反诈线索与核实证据，不对应资金流向文本图。'],
    r16: ['第二步：把描述符', '对应 BytecodeLab 的 score(n)：观察六条字节码与 int 边界。'],
    r17: ['第一步：实现', '与文件头检查器共用读取边界原理；这里解析输入字节，不执行全部 Python 测试文件。'],
    r18: ['实现：缓冲', '对应本章两字节大端长度前缀协议：观察缓冲、解码和残帧。']
  };
  function attach(root, chapter) {
    var profile = profiles[chapter.id]; if (!profile) return;
    // Explicit lesson demos already own their state and lifecycle. Reuse them.
    if (root.querySelector('#reverse-browser-lab')) return;
    var existing = Array.from(root.querySelectorAll('.demo-mount[data-demo]')).find(function (node) { return node.dataset.demo === profile[0]; });
    if (existing) { existing.id = 'reverse-browser-lab'; existing.dataset.reverseLabKind = profile[0]; return; }
    var placement = placements[chapter.id], heading = Array.from(root.querySelectorAll('h2,h3')).find(function (node) { return node.textContent.indexOf(placement[0]) >= 0; });
    var headingText = chapter.title;
    if (heading) { var label = heading.cloneNode(true), number = label.querySelector('.h-idx'); if (number) number.remove(); headingText = label.textContent; }
    var details = U.el('details', 'chapter-lab'); details.id = 'reverse-browser-lab'; details.dataset.reverseLabKind = profile[0];
    var summary = U.el('summary'); summary.appendChild(U.el('span', 'chapter-lab-title', '原理实验 · ' + profile[1])); summary.appendChild(U.el('span', 'chapter-lab-context', '对应小节：' + headingText + ' · 点击在此展开'));
    details.appendChild(summary); var body = U.el('div', 'chapter-lab-body'), stage = U.el('div', 'chapter-lab-stage'); body.appendChild(U.el('p', 'lab-relation', placement[1])); body.appendChild(stage); details.appendChild(body);
    if (heading) heading.after(details); else root.querySelector('.ch-pager').before(details);
    details.addEventListener('toggle', function () { if (details.open && !body.dataset.loaded) { body.dataset.loaded = '1'; var stop = mountKind(stage, profile[0]); if (stop) cleanups.add(stop); } });
  }
  function open(root) { var target = root.querySelector('#reverse-browser-lab'); if (target && target.tagName === 'DETAILS') target.open = true; }
  function dispose() { cleanups.forEach(function (stop) { stop(); }); cleanups.clear(); }
  window.HUB_REVERSE_LABS = { profiles: profiles, placements: placements, attach: attach, open: open, mountKind: mountKind, dispose: dispose };
})();
