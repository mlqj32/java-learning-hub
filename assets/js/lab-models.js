(function () {
  'use strict';
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function hex(bytes) { return Array.from(bytes, function (b) { return b.toString(16).padStart(2, '0'); }).join(' '); }
  function unhex(value) {
    var text = value.replace(/\s+/g, '');
    if (!text || text.length % 2 || !/^[\da-f]+$/i.test(text) || text.length > 16384) throw Error('请输入完整的十六进制字节（最多 8192 字节），例如 ca fe ba be。');
    return Uint8Array.from(text.match(/../g).map(function (s) { return parseInt(s, 16); }));
  }
  function integer(value) { var n = Number(value); if (!Number.isInteger(n) || n < -2147483648 || n > 2147483647) throw Error('请输入 int 范围内的整数。'); return n; }
  function bytecode(value) {
    var n = integer(value), stack = [], frames = [{ line: -1, note: '把参数放入局部变量槽 0；操作数栈为空。', state: { '局部变量 0': n, '操作数栈': '[]', '下一条': 'iload_0' } }];
    var instructions = ['iload_0', 'iconst_3', 'imul', 'iconst_1', 'iadd', 'ireturn'];
    instructions.forEach(function (op, i) {
      var note, result;
      if (op === 'iload_0') { stack.push(n); note = '读取参数 n，压入操作数栈。'; }
      if (op === 'iconst_3') { stack.push(3); note = '常量 3 压栈。'; }
      if (op === 'imul') { var b = stack.pop(), a = stack.pop(); result = Math.imul(a, b); stack.push(result); note = '弹出 ' + a + ' 与 ' + b + '，按 Java int 乘法压入 ' + result + '。'; }
      if (op === 'iconst_1') { stack.push(1); note = '常量 1 压栈。'; }
      if (op === 'iadd') { var rhs = stack.pop(), lhs = stack.pop(); result = (lhs + rhs) | 0; stack.push(result); note = '两数相加，结果按 32 位有符号整数保存。'; }
      if (op === 'ireturn') { result = stack.pop(); note = '返回 score=' + result + '；decision 比较 score >= 10，得到 ' + (result >= 10 ? 'ok' : 'retry') + '。'; }
      frames.push({ line: i, note: note, state: { '局部变量 0': n, '操作数栈': JSON.stringify(stack), '当前指令': op, '返回值': op === 'ireturn' ? result : '尚未返回', 'decision': op === 'ireturn' ? (result >= 10 ? 'ok' : 'retry') : '尚未执行' } });
    });
    return { code: instructions, frames: frames, output: (Math.imul(n, 3) + 1) | 0 };
  }
  function assembly(value) {
    var n = integer(value), r = 0, less = false, frames = [{ line: -1, note: '教学指令集：R0 保存结果，arg 是输入；不对应任意真实 CPU。', state: { arg: n, R0: 0, '比较结果': '尚未比较' } }];
    var code = ['MOV R0, arg', 'MUL R0, 3', 'ADD R0, 1', 'CMP R0, 10', 'JL retry', 'RETURN "ok"', 'retry: RETURN "retry"'];
    [0, 1, 2, 3, 4].forEach(function (line) {
      if (line === 0) r = n;
      if (line === 1) r = Math.imul(r, 3);
      if (line === 2) r = (r + 1) | 0;
      if (line === 3) less = r < 10;
      frames.push({ line: line, note: ['输入复制到 R0。', 'R0 乘 3。', 'R0 加 1。', '比较 R0 与 10，不改写 R0。', less ? '有符号小于成立，跳到 retry 标签。' : '不跳转，继续返回 ok。'][line], state: { arg: n, R0: r, '比较结果': line >= 3 ? String(less) : '尚未比较', '下一条': line === 4 ? (less ? 6 : 5) : line + 1 } });
    });
    frames.push({ line: less ? 6 : 5, note: '沿刚才实际选中的分支返回。', state: { arg: n, R0: r, '返回': less ? 'retry' : 'ok' } });
    return { code: code, frames: frames };
  }
  function inspectBinary(text) {
    var bytes = unhex(text), view = new DataView(bytes.buffer), frames = [], format = '未知';
    function read(offset, length, name, value) { if (offset < 0 || offset + length > bytes.length) throw Error(name + ' 越界：需要 [' + offset + ',' + (offset + length) + ')，文件只有 ' + bytes.length + ' 字节。'); frames.push({ line: frames.length, note: name + '：先检查边界，再解码。', state: { '文件长度': bytes.length, '读取范围': '[' + offset + ',' + (offset + length) + ')', '原始字节': hex(bytes.slice(offset, offset + length)), '解析结果': value === undefined ? '' : String(value) }, range: [offset, offset + length] }); }
    function need(size, label) { if (bytes.length < size) throw Error(label + ' 截断：至少需要 ' + size + ' 字节，实际 ' + bytes.length + '。'); }
    if (hex(bytes.slice(0, 4)) === 'ca fe ba be') {
      format = 'class'; need(10, 'class 文件头'); read(0, 4, 'CAFEBABE 魔数', 'class'); read(4, 2, 'minor_version（大端）', view.getUint16(4)); read(6, 2, 'major_version（大端）', view.getUint16(6)); read(8, 2, 'constant_pool_count（大端）', view.getUint16(8));
    } else if (bytes[0] === 0x4d && bytes[1] === 0x5a) {
      format = 'PE'; need(64, 'DOS 头'); read(0, 2, 'DOS 魔数', 'MZ'); var offset = view.getUint32(60, true); read(60, 4, 'e_lfanew（小端）', offset); if (offset < 64 || offset + 24 > bytes.length) throw Error('PE 头偏移越界：' + offset); read(offset, 4, 'PE 签名', hex(bytes.slice(offset, offset + 4))); if (hex(bytes.slice(offset, offset + 4)) !== '50 45 00 00') throw Error('PE 签名不匹配。'); read(offset + 4, 2, 'Machine（小端）', '0x' + view.getUint16(offset + 4, true).toString(16)); read(offset + 6, 2, 'NumberOfSections', view.getUint16(offset + 6, true));
    } else if (hex(bytes.slice(0, 4)) === '7f 45 4c 46') {
      format = 'ELF'; need(16, 'ELF ident'); read(0, 4, 'ELF 魔数', 'ELF'); read(4, 1, 'EI_CLASS', bytes[4] === 2 ? '64 位' : bytes[4] === 1 ? '32 位' : '未知'); read(5, 1, 'EI_DATA', bytes[5] === 1 ? '小端' : bytes[5] === 2 ? '大端' : '未知');
    } else if (hex(bytes.slice(0, 4)) === '64 65 78 0a') {
      format = 'DEX'; need(40, 'DEX 文件头片段'); read(0, 8, 'DEX 魔数与版本', new TextDecoder().decode(bytes.slice(0, 8))); read(32, 4, 'file_size（小端）', view.getUint32(32, true)); read(36, 4, 'header_size（小端）', view.getUint32(36, true));
    } else { read(0, Math.min(8, bytes.length), '未知魔数', '停止猜测；不能只凭文件扩展名判断'); }
    frames.push({ line: -1, note: '仅验证以上文件头字段；没有验证完整结构、可执行性或安全性。', state: { '识别格式': format, '结论范围': '文件头检查，不是完整加载器' } });
    return { code: frames.filter(function (f) { return f.line >= 0; }).map(function (f) { return f.note; }), frames: frames, bytes: Array.from(bytes), format: format };
  }
  function binarySample(kind) {
    if (kind === 'class') return 'ca fe ba be 00 00 00 3d 00 01';
    if (kind === 'ELF') return '7f 45 4c 46 02 01 01 00 00 00 00 00 00 00 00 00';
    if (kind === 'DEX') { var dex = new Uint8Array(112); dex.set([0x64, 0x65, 0x78, 10, 0x30, 0x33, 0x39, 0]); new DataView(dex.buffer).setUint32(32, 112, true); new DataView(dex.buffer).setUint32(36, 112, true); return hex(dex); }
    var pe = new Uint8Array(88); pe[0] = 77; pe[1] = 90; var view = new DataView(pe.buffer); view.setUint32(60, 64, true); pe.set([80, 69, 0, 0], 64); view.setUint16(68, 0x8664, true); view.setUint16(70, 1, true); return hex(pe);
  }
  function encodeMessages(text) {
    var result = []; text.split('\n').forEach(function (line) { var bytes = new TextEncoder().encode(line); if (bytes.length > 1024) throw Error('单条消息最多 1024 字节。'); result.push(bytes.length >> 8, bytes.length & 255); Array.prototype.push.apply(result, Array.from(bytes)); }); return new Uint8Array(result);
  }
  function protocol(text, chunk) {
    var data = unhex(text), size = Number(chunk), buffer = [], decoded = [], frames = [];
    if (!Number.isInteger(size) || size < 1 || size > 64) throw Error('分段大小必须为 1～64 字节。');
    for (var start = 0; start < data.length; start += size) {
      var piece = Array.from(data.slice(start, start + size)); buffer = buffer.concat(piece); var note = '接收 ' + piece.length + ' 字节，追加缓冲区。';
      while (buffer.length >= 2) {
        var length = buffer[0] * 256 + buffer[1]; if (length > 1024) throw Error('声明的消息长度 ' + length + ' 超过 1024 字节限制。');
        if (buffer.length < length + 2) { note += ' 头部要求 ' + length + ' 字节正文，继续等待。'; break; }
        var message; try { message = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(buffer.slice(2, length + 2))); } catch (_) { throw Error('完整帧含非法 UTF-8；不能把损坏数据当成有效消息。'); }
        decoded.push(message); buffer = buffer.slice(length + 2); note += ' 解析消息 ' + JSON.stringify(message) + '；消费后保留剩余字节。';
      }
      frames.push({ line: buffer.length >= 2 ? 2 : 1, note: note, state: { '新到字节': hex(piece), '未消费缓冲': hex(buffer) || '空', '已解析消息': JSON.stringify(decoded), '等待字节': buffer.length >= 2 ? Math.max(0, buffer[0] * 256 + buffer[1] + 2 - buffer.length) : 2 - buffer.length } });
    }
    frames.push({ line: 3, note: buffer.length ? '输入结束，仍有残帧：保留缓冲，不假装已经解析成功。' : '输入处理完毕，所有完整消息都已输出。', state: { '已解析消息': JSON.stringify(decoded), '残留字节数': buffer.length, '状态': buffer.length ? '等待更多数据' : '完成' } });
    return { code: ['追加新到的字节', '至少 2 字节才能读取长度头', '等到完整正文后解码，再消费缓冲', '继续解析；残帧留待下一次输入'], frames: frames, messages: decoded, remaining: buffer };
  }
  function xor(text, key) {
    var value = Number(key); if (!Number.isInteger(value) || value < 0 || value > 255) throw Error('密钥必须为 0～255。');
    var data = new TextEncoder().encode(text); if (!data.length || data.length > 128) throw Error('请输入 1～128 字节的文本。');
    var encoded = [], frames = [];
    Array.from(data).forEach(function (byte, i) { encoded.push(byte ^ value); frames.push({ line: 1, note: '第 ' + i + ' 个字节：' + byte + ' XOR ' + value + ' = ' + (byte ^ value), state: { '输入字节': hex([byte]), '密钥': hex([value]), '输出字节': hex([byte ^ value]), '已处理结果': hex(encoded) } }); });
    var decoded = new TextDecoder().decode(Uint8Array.from(encoded.map(function (b) { return b ^ value; })));
    frames.push({ line: 2, note: '对结果再次 XOR 同一密钥，恢复原字节。XOR 编码不提供现代密码学安全性。', state: { '完整结果': hex(encoded), '恢复文本': decoded } });
    return { code: ['把文本编码为 UTF-8 字节', 'out[i] = input[i] XOR key', '再 XOR 同一个 key 恢复'], frames: frames, encoded: encoded, decoded: decoded };
  }
  window.HUB_MODELS = { copy: copy, hex: hex, unhex: unhex, bytecode: bytecode, assembly: assembly, inspectBinary: inspectBinary, binarySample: binarySample, encodeMessages: encodeMessages, protocol: protocol, xor: xor };
})();
