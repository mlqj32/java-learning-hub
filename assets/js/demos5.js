/* ═══════════════════════════════════════════════════
   交互演示 · 第五批:反诈识别训练 / PE 结构浏览器
   ═══════════════════════════════════════════════════ */
(function () {
  'use strict';
  var D = window.DEMOS = window.DEMOS || {};
  var U = window.DUTIL;
  var el = U.el, btn = U.btn, logArea = U.logArea, counters = U.counters, tabs = U.tabs;
  function dlog(box, msg, cls) { U.log(box, msg, cls); }

  /* ═══════════ 1. 反诈识别训练 ═══════════ */
  D['scam-quiz'] = {
    title: '反诈识别训练:这通电话/这条消息,危险吗?',
    subtitle: '8 个真实套路 · 选完立刻看解析',
    icon: 'lock',
    mount: function (body) {
      var setTimeout = window.HUB_DEMO_SYSTEM.scheduler(body);
      var BANK = [
        { t: '「客服」来电:您买的面膜有质量问题,可三倍退款,请加微信并共享屏幕操作。', a: false, why: '真实退款只会原路退回 App 内,**不需要加微信、更不需要共享屏幕**。共享屏幕=把手机借给对方。', tag: '假客服' },
        { t: '银行官方 App 弹出账单提醒:您有一笔 99 元消费,点击查看详情(跳转 App 内页面)。', a: true, why: '从官方 App 内进入、不索要验证码、不引导转账,属于正常通知。', tag: '正常' },
        { t: '自称公安局:您涉嫌洗钱,案件涉密,请把资金转入「安全账户」接受审查,不许告诉家人。', a: false, why: '公检法**不会电话办案**,更没有"安全账户";"保密"是阻止你核实的经典话术。', tag: '冒充公检法' },
        { t: '好友微信求助:手机摔坏只能打字,急借 3000,转账到这个卡号。', a: false, why: '账号可能被盗,**转账前必须语音/电话核实本人**。骗子最怕你打一个电话。', tag: '冒充熟人' },
        { t: '12306 官方 App 登录,要求输入短信验证码完成身份验证。', a: true, why: '你在主动登录官方 App,验证码输入在官方页面里完成,且不需要转给任何人。', tag: '正常' },
        { t: '兼职刷单:点赞一单返 8 元,前三单秒到账;第 4 单要求先垫付 500 元,刷完连本带利返还。', a: false, why: '**凡是要垫付的兼职都是诈骗**。前几单的小额返利就是"喂料"。', tag: '刷单' },
        { t: '招聘:东南亚客服,月薪 3 万,包机票包吃住,不用签合同,到了有人接。', a: false, why: '不签合同、不办签证、地点含糊、包出境 —— **境外高薪招聘**的典型信号,可能是电诈园区。', tag: '境外高薪' },
        { t: '短信:您的快递丢失,加微信办理理赔,点击链接填写银行卡与验证码。', a: false, why: '理赔走官方渠道;**卡号+验证码=直接转走你的钱**。链接一律不从短信点。', tag: '快递理赔' }
      ];
      var idx = 0, score = 0, answered = false;
      var card = el('div', 'dm-panel');
      card.style.cssText = 'min-height:120px;display:flex;flex-direction:column;justify-content:center;gap:10px';
      var qText = el('div', '');
      qText.style.cssText = 'font-size:14.5px;line-height:1.85;color:#e8eef7';
      var feedback = el('div', '');
      feedback.style.cssText = 'font-size:12.5px;line-height:1.8;min-height:44px;color:#9fb0c8';
      card.appendChild(qText);
      card.appendChild(feedback);
      var anti = el('div', 'dm-legend', '<span class="lg"><i style="background:#34d399"></i>安全</span><span class="lg"><i style="background:#fb7185"></i>骗局</span><span class="lg"><i style="background:#fbbf24"></i>拿不准 = 当骗局处理</span>');
      var counter = counters([{ key: 'n', label: '进度' }, { key: 'score', label: '得分', cls: 'ok' }, { key: 'tag', label: '套路类型' }]);
      var log = logArea();
      function render() {
        answered = false;
        feedback.textContent = '判断一下:这条消息/电话是正常还是骗局?';
        feedback.style.color = '#9fb0c8';
        if (idx >= BANK.length) {
          qText.innerHTML = '<b>训练结束 🎉</b> 你的得分:' + score + ' / ' + BANK.length + (score === BANK.length ? ' —— 反诈体质满级!' : ' —— 错的那几条,正是骗子最常用的剧本。');
          feedback.textContent = '记住三句话:验证码不给、屏幕不共享、陌生账户不转账。';
          counter.set('tag', '完成');
          return;
        }
        var q = BANK[idx];
        qText.textContent = q.t;
        counter.set('n', (idx + 1) + ' / ' + BANK.length);
        counter.set('tag', '待判断');
      }
      function answer(choice) {
        if (answered) return;
        if (idx >= BANK.length) { idx = 0; score = 0; render(); return; }
        answered = true;
        var q = BANK[idx];
        var right = choice === q.a;
        if (right) score++;
        counter.set('score', score);
        counter.set('tag', q.tag);
        var whyHtml = q.why.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        feedback.innerHTML = (right ? '<span style="color:#34d399">✓ 判断正确</span>' : '<span style="color:#fb7185">✗ 判断错了</span>') +
          ' · <b>' + q.tag + '</b>:' + whyHtml;
        dlog(log, (right ? '✓ ' : '✗ ') + q.tag + ' —— ' + whyHtml, right ? 'l-ok' : 'l-err');
        idx++;
        setTimeout(render, 1600);
      }
      var bar = el('div', 'dm-toolbar');
      bar.appendChild(btn('🛡 这是骗局', function () { answer(false); }));
      bar.appendChild(btn('✅ 安全/正常', function () { answer(true); }, true));
      bar.appendChild(btn('↺ 重新训练', function () { idx = 0; score = 0; log.innerHTML = ''; render(); }, true));
      body.appendChild(bar);
      body.appendChild(card);
      body.appendChild(counter);
      body.appendChild(anti);
      body.appendChild(log);
      render();
    }
  };

  /* ═══════════ 2. PE 结构浏览器 ═══════════ */
  D['pe-explorer'] = {
    title: 'PE 文件结构浏览器:点开每个抽屉',
    subtitle: '一个 exe 从文件头到资源节的解剖图',
    icon: 'search',
    mount: function (body) {
      var setTimeout = window.HUB_DEMO_SYSTEM.scheduler(body);
      var PARTS = [
        { id: 'dos', name: 'MS-DOS 头(DOS Header)', off: '0x00', desc: '文件最开头 64 字节,前两个字节是魔数 MZ(0x4D5A),指向真正的 PE 头位置。保留它是为了兼容 DOS 时代。', fields: [['e_magic', '0x4D5A("MZ")'], ['e_lfanew', 'PE 头在文件中的偏移']], see: '任意十六进制编辑器打开 exe,看开头 4D 5A' },
        { id: 'stub', name: 'DOS Stub', off: '0x40', desc: '一小段 16 位程序,在纯 DOS 下运行时打印 "This program cannot be run in DOS mode",然后退出。', fields: [['内容', '一条打印字符串的 DOS 程序']], see: 'strings 命令可以看到这句提示' },
        { id: 'nt', name: 'NT 头(PE Header)', off: '0x80 附近', desc: 'PE\\0\\0 签名 + FileHeader(机器类型/节数) + OptionalHeader(入口点 RVA、镜像基址、数据目录)。', fields: [['Signature', '50 45 00 00("PE..")'], ['AddressOfEntryPoint', '程序入口 RVA'], ['ImageBase', '默认加载基址']], see: 'dumpbin /headers app.exe' },
        { id: 'sections', name: '节表 Section Table', off: 'NT 头之后', desc: '每个节一张登记表:名字、虚拟大小、虚拟地址、文件偏移、权限(R/W/X)。', fields: [['Name', '.text / .rdata / .data / .rsrc'], ['VirtualAddress', 'RVA'], ['Characteristics', '可读/可写/可执行']], see: 'PE 工具里"节"列表' },
        { id: 'text', name: '.text 代码节', off: '—', desc: '存放编译后的机器指令,是逆向分析的主战场;加壳软件常把它压缩/加密。', fields: [['内容', 'x86/x64 机器码'], ['工具', 'IDA / Ghidra / x64dbg']], see: '反汇编器把字节翻译成汇编' },
        { id: 'rdata', name: '.rdata 只读数据', off: '—', desc: '字符串常量、导入表(程序要调用哪些 DLL 的哪些函数)。导入表是判断程序"能做什么"的线索。', fields: [['导入表', 'kernel32.dll!CreateFileW 等'], ['敏感 API', 'VirtualAllocEx / WriteProcessMemory']], see: 'strings + Dependencies 工具' },
        { id: 'data', name: '.data 数据节', off: '—', desc: '全局变量、静态变量等可读写数据。', fields: [['内容', '初始化后的全局数据']], see: '动态调试时观察数据变化' },
        { id: 'rsrc', name: '.rsrc 资源节', off: '—', desc: '图标、位图、对话框、版本信息、清单文件。恶意软件有时把载荷藏在这里。', fields: [['内容', '图标/对话框/版本信息'], ['工具', 'Resource Hacker']], see: 'Resource Hacker 打开 exe' }
      ];
      var active = 'dos';
      var list = el('div', 'dm-part-list');
      var detail = el('div', 'dm-panel');
      detail.style.flex = '1';
      var row = el('div', 'dm-row');
      row.style.alignItems = 'flex-start';
      row.appendChild(list);
      row.appendChild(detail);
      function paint() {
        list.innerHTML = '';
        PARTS.forEach(function (p) {
          var b = el('button', 'demo-btn' + (p.id === active ? '' : ' ghost'));
          b.style.cssText = 'justify-content:flex-start;text-align:left;width:100%;font-family:var(--font-mono);font-size:11.5px;padding:9px 12px';
          b.innerHTML = '<span style="opacity:.55;margin-right:8px">' + p.off + '</span>' + p.name;
          b.addEventListener('click', function () { active = p.id; paint(); });
          list.appendChild(b);
        });
        var p = PARTS.find(function (x) { return x.id === active; });
        detail.innerHTML = '<div class="dm-panel-title">' + p.name + '</div>' +
          '<p style="font-size:13px;line-height:1.85;color:#cbd5e1;margin-bottom:10px">' + p.desc + '</p>' +
          p.fields.map(function (f) {
            return '<div class="dm-part-field"><span style="color:#7dd3fc">' + f[0] + '</span><span style="color:#9fe8c8">' + f[1] + '</span></div>';
          }).join('') +
          '<div class="dm-chip c-amber" style="margin-top:12px">🔧 怎么看:' + p.see + '</div>';
      }
      var bar = el('div', 'dm-toolbar');
      bar.appendChild(el('div', 'dm-chip c-cyan', '点击左侧任一区块查看说明'));
      body.appendChild(bar);
      body.appendChild(row);
      body.appendChild(el('div', 'dm-legend', '<span class="lg"><i style="background:#22d3ee"></i>文件头/目录</span><span class="lg"><i style="background:#34d399"></i>代码</span><span class="lg"><i style="background:#fbbf24"></i>数据/导入表</span><span class="lg"><i style="background:#fb7185"></i>资源</span>'));
      paint();
    }
  };
})();
