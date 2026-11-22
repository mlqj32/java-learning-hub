/* ═══════════════════════════════════════════════════
   交互演示 · 第六批:AI 模型选择助手
   ═══════════════════════════════════════════════════ */
(function () {
  'use strict';
  var D = window.DEMOS = window.DEMOS || {};
  var U = window.DUTIL;
  var el = U.el, btn = U.btn, logArea = U.logArea, counters = U.counters, tabs = U.tabs;
  function dlog(box, msg, cls) { U.log(box, msg, cls); }

  D['model-picker'] = {
    title: '选型助手:你的任务该用哪类模型?',
    subtitle: '任务 × 上下文 × 隐私 → 推荐组合(经验规则,非绝对)',
    icon: 'spark',
    mount: function (body) {
      var setTimeout = window.HUB_DEMO_SYSTEM.scheduler(body);
      var state = { task: '代码补全', ctx: '单个文件', privacy: '普通代码' };
      var GROUPS = [
        [['代码补全'], '轻量快速模型 / IDE 插件', '补全追求延迟(<200ms)与上下文内联,GitHub Copilot、通义灵码、CodeGeeX 这类 IDE 插件足够;不必上最贵的大模型。'],
        [['代码解释', '学习提问'], '对话型模型(中文友好)', '解释概念、出练习题、review 小片段,对话模型更划算:DeepSeek、Qwen、Kimi 中文表达好、价格低;需要深推理时再切旗舰模型。'],
        [['单文件生成', '写测试'], '通用强模型', '单个方法/测试用例,主流旗舰模型(GPT / Claude / Gemini 中档)都能胜任;重点是给足上下文与验收标准。'],
        [['跨文件重构', '疑难排错'], '强推理 + 大上下文模型', '跨文件重构、死锁排查、性能分析需要长上下文与强推理:选各家的旗舰模型(如 Claude 长上下文系列、GPT 高级推理),并给出完整报错与相关文件。'],
        [['仓库级任务', '自动化改造'], 'Agent 形态工具 + 旗舰模型', '多文件修改、跑测试、迭代修复,用 Cursor / Claude Code / Cline 这类 Agent 工具,配合旗舰模型;务必要求它先给计划再动手,并逐条 review diff。']
      ];
      var PRIVACY = {
        '普通代码': '',
        '涉密/公司代码': '⚠ 隐私要求优先:改用**私有化部署或本地模型**(开源 Qwen/DeepSeek 本地化、企业版通义灵码),不要上传仓库到公网服务;先确认公司合规政策。',
        '个人学习': ''
      };
      var CTX = {
        '单个文件': '',
        '多个文件': '上下文变长:优先选择**上下文窗口大**的模型,把相关文件一起给它,别让它猜。',
        '整个仓库': '整仓库级别:用 **Agent 工具**(能读目录、跑测试),并要求它先输出改动计划。'
      };
      var panel = el('div', 'dm-panel');
      panel.style.cssText = 'min-height:160px';
      var log = logArea();
      function recommend() {
        var title = '', why = '', tag = '';
        for (var i = 0; i < GROUPS.length; i++) {
          if (GROUPS[i][0].indexOf(state.task) >= 0) { title = GROUPS[i][1]; why = GROUPS[i][2]; tag = state.task; break; }
        }
        var extra = (CTX[state.ctx] || '') + ' ' + (PRIVACY[state.privacy] || '');
        panel.innerHTML = '<div class="dm-panel-title">推荐组合</div>' +
          '<div class="dm-chip c-cyan" style="margin-bottom:10px">' + tag + ' · ' + state.ctx + ' · ' + state.privacy + '</div>' +
          '<div style="font-size:16px;font-weight:800;color:#e8eef7;margin-bottom:8px">→ ' + title + '</div>' +
          '<p style="font-size:13px;line-height:1.85;color:#9fb0c8">' + why + '</p>' +
          (extra.trim() ? '<p style="font-size:12.5px;line-height:1.8;color:#fbbf24;margin-top:8px">' + extra.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') + '</p>' : '') +
          '<p style="font-size:11.5px;color:#64748b;margin-top:10px">提示:选型是经验规则;同一个任务先小样试 2~3 个模型对比输出质量,再固定在团队规范里。</p>';
        dlog(log, '任务 <b>' + state.task + '</b> / 上下文 <b>' + state.ctx + '</b> / 隐私 <b>' + state.privacy + '</b> → ' + title, 'l-info');
      }
      var area = el('div', '');
      area.style.cssText = 'display:flex;flex-direction:column;gap:12px;margin-bottom:16px';
      function group(label, opts, key) {
        var wrap = el('div', '');
        wrap.appendChild(el('div', 'dm-panel-title', label));
        var t = tabs(opts, state[key], function (o) { state[key] = o; recommend(); });
        wrap.appendChild(t);
        area.appendChild(wrap);
      }
      group('① 任务类型', ['代码补全', '代码解释', '单文件生成', '写测试', '跨文件重构', '疑难排错', '仓库级任务', '自动化改造', '学习提问'], 'task');
      group('② 上下文规模', ['单个文件', '多个文件', '整个仓库'], 'ctx');
      group('③ 隐私要求', ['普通代码', '涉密/公司代码', '个人学习'], 'privacy');
      var bar = el('div', 'dm-toolbar');
      bar.appendChild(el('div', 'dm-chip c-purple', '选择后实时推荐'));
      body.appendChild(area);
      body.appendChild(panel);
      body.appendChild(log);
      recommend();
      dlog(log, '一句话原则:<b>小任务用快模型,难任务用强模型,涉密用私有化,跑仓库用 Agent</b>。', 'l-hl');
    }
  };
})();
