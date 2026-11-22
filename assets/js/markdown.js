/* ═══════════════════════════════════════════════════
   Mini-Markdown 渲染器
   支持: 标题/代码块(行号+高亮)/输出台/提示框/表格/列表/演示插入
   ═══════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ---------- 行内渲染 ---------- */
  function inline(s) {
    // 先转义,再用占位符保护 code
    var codes = [];
    var t = s.replace(/`([^`]+)`/g, function (_, c) {
      codes.push(c);
      return '\u0000C' + (codes.length - 1) + '\u0000';
    });
    t = esc(t);
    // ==高亮==
    t = t.replace(/==([^=]+)==/g, '<mark>$1</mark>');
    // **粗体**
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // [文本](链接)
    t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_, txt, url) {
      if (!/^(https?:|#|mailto:)/i.test(url)) return txt;
      return '<a href="' + url + '"' + (url.charAt(0) === '#' ? '' : ' target="_blank" rel="noopener"') + '>' + txt + '</a>';
    });
    t = t.replace(/\u0000C(\d+)\u0000/g, function (_, i) {
      return '<code class="inline">' + esc(codes[+i]) + '</code>';
    });
    return t;
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- 块级代码(带状态机的块注释处理) ---------- */
  function codeBlockHTML(code, lang, file) {
    var lines = code.replace(/\t/g, '    ').split('\n');
    while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
    var inComment = false;
    var rows = '';
    for (var i = 0; i < lines.length; i++) {
      var raw = lines[i];
      var html;
      var hasOpen = raw.indexOf('/*') !== -1;
      var hasClose = raw.indexOf('*/') !== -1;
      if (inComment) {
        html = '<span class="tk-com">' + esc(raw) + '</span>';
        if (hasClose) inComment = false;
      } else if (hasOpen && raw.indexOf('*/') === -1 && (lang === 'java' || lang === 'sql' || lang === 'css' || lang === 'c')) {
        html = '<span class="tk-com">' + esc(raw) + '</span>';
        inComment = true;
      } else {
        html = window.HL(raw, lang);
      }
      rows += '<tr><td class="ln">' + (i + 1) + '</td><td class="cl">' + (html || ' ') + '</td></tr>';
    }
    var langLabel = ({ java: 'Java', sql: 'SQL', mysql: 'MySQL', shell: 'Shell', bash: 'Bash', sh: 'Shell', console: 'Terminal', xml: 'XML', html: 'HTML', yml: 'YAML', yaml: 'YAML', properties: 'Properties', json: 'JSON', text: 'TEXT', docker: 'Dockerfile', dockerfile: 'Dockerfile', diff: 'Diff' })[lang] || lang.toUpperCase();
    return '<div class="code-wrap" data-language="' + esc(lang) + '" data-file="' + esc(file || '') + '">' +
      '<div class="code-head"><div class="code-dots"><i></i><i></i><i></i></div>' +
      '<span class="code-lang">' + esc(langLabel) + '</span>' +
      (file ? '<span class="code-file">' + esc(file) + '</span>' : '') +
      '<button class="code-copy" data-copy><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>复制</button>' +
      '</div>' +
      '<div class="code-body"><table class="code-tbl">' + rows + '</table></div></div>';
  }

  /* ---------- 输出台 ---------- */
  function outputBlockHTML(text, standalone) {
    var lines = text.split('\n');
    while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
    var body = lines.map(function (l) {
      return l
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\[dim\](.*?)\[\/dim\]/g, '<span class="o-dim">$1</span>')
        .replace(/\[hl\](.*?)\[\/hl\]/g, '<span class="o-hl">$1</span>')
        .replace(/\[err\](.*?)\[\/err\]/g, '<span class="o-err">$1</span>')
        .replace(/\[key\](.*?)\[\/key\]/g, '<span class="o-key">$1</span>');
    }).join('\n');
    return '<div class="output-wrap' + (standalone ? ' standalone' : '') + '">' +
      '<div class="output-head"><span class="blink-dot"></span>OUTPUT · 运行结果</div>' +
      '<div class="output-body">' + body + '</div></div>';
  }

  /* ---------- 提示框 ---------- */
  var CALLOUT_ICONS = {
    tip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.7 1 1.6 1 2.5h6c0-.9.2-1.8 1-2.5A6 6 0 0 0 12 3z"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
    danger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01"/><circle cx="12" cy="12" r="10"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    interview: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    pitfall: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 13l4-9 4 5 4-7 4 8 4-3-2 8H4l-2-2z"/></svg>',
    best: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3 6.5 7 .8-5.2 4.7 1.4 7-6.2-3.6L5.8 21l1.4-7L2 9.3l7-.8L12 2z"/></svg>'
  };
  var CALLOUT_NAMES = { tip: '要点 · TIP', warn: '注意 · WARNING', danger: '高危 · DANGER', info: '补充 · INFO', interview: '面试官视角 · INTERVIEW', pitfall: '踩坑现场 · PITFALL', best: '最佳实践 · BEST PRACTICE' };

  /* ---------- 主解析 ---------- */
  function render(md) {
    var lines = md.split('\n');
    var html = '';
    var toc = [];
    var h2n = 0;
    var i = 0;
    var prevWasCode = false;

    function slug(text) {
      return 'sec-' + text.replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase().slice(0, 40) + '-' + (toc.length + 1);
    }

    while (i < lines.length) {
      var line = lines[i];

      // 空行
      if (line.trim() === '') { i++; prevWasCode = false; continue; }

      // 代码围栏
      var fence = line.match(/^```\s*([\w:-]+)?\s*(.*)$/);
      if (fence) {
        var lang = (fence[1] || 'text').toLowerCase();
        var meta = (fence[2] || '').trim();
        var buf = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
        i++; // 跳过结尾 ```
        var src = buf.join('\n');

        if (lang.indexOf('demo:') === 0) {
          html += '<div class="demo-mount" data-demo="' + esc(lang.slice(5)) + '"></div>';
          prevWasCode = false;
        } else if (lang.indexOf('diagram:') === 0) {
          html += '<div class="diagram-mount" data-diagram="' + esc(lang.slice(8)) + '"></div>';
          prevWasCode = false;
        } else if (lang === 'output' || lang === 'console-out') {
          html += outputBlockHTML(src, !prevWasCode);
          prevWasCode = false;
        } else {
          var file = null;
          var fm = meta.match(/(?:file|f)[=:](\S+)/);
          if (fm) file = fm[1];
          else if (meta) file = meta;
          html += codeBlockHTML(src, lang, file);
          prevWasCode = true;
        }
        continue;
      }

      // 标题
      var h = line.match(/^(#{2,4})\s+(.*)$/);
      if (h) {
        var level = h[1].length;
        var text = inline(h[2]);
        var id = slug(h[2]);
        if (level === 2) {
          h2n++;
          html += '<h2 id="' + id + '"><span class="h-idx">' + String(h2n).padStart(2, '0') + '</span>' + text + '</h2>';
          toc.push({ level: 2, id: id, text: h[2].replace(/\*\*/g, '') });
        } else if (level === 3) {
          html += '<h3 id="' + id + '">' + text + '</h3>';
          toc.push({ level: 3, id: id, text: h[2].replace(/\*\*/g, '') });
        } else {
          html += '<h4>' + text + '</h4>';
        }
        prevWasCode = false; i++;
        continue;
      }

      // 分割线
      if (/^---+\s*$/.test(line)) { html += '<hr>'; prevWasCode = false; i++; continue; }

      // 提示框
      if (/^>\s?/.test(line)) {
        var bufC = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) { bufC.push(lines[i].replace(/^>\s?/, '')); i++; }
        var type = 'info';
        var title = null;
        var first = bufC[0] || '';
        var cm = first.match(/^\[!(\w+)\]\s*(.*)$/);
        if (cm) {
          type = cm[1].toLowerCase();
          if (!CALLOUT_ICONS[type]) type = 'info';
          title = cm[2].trim() || CALLOUT_NAMES[type];
          bufC.shift();
        }
        if (!title) title = CALLOUT_NAMES[type];
        // Reuse the block parser so nested code, tables and lists remain structured.
        var inner = render(bufC.join('\n')).html;
        html += '<div class="callout ' + type + '"><div class="callout-icon">' + CALLOUT_ICONS[type] + '</div>' +
          '<div class="callout-body"><div class="callout-title">' + esc(title) + '</div>' + inner + '</div></div>';
        prevWasCode = false;
        continue;
      }

      // 表格
      if (/^\|.*\|/.test(line) && i + 1 < lines.length && /^\|[\s:-]+\|/.test(lines[i + 1].replace(/[^|:\-\s]/g, ''))) {
        function splitRow(r) {
          var cells = [], cell = '', code = false;
          r = r.trim().replace(/^\||\|$/g, '');
          for (var k = 0; k < r.length; k++) {
            var ch = r[k];
            if (ch === '\\' && r[k + 1] === '|') { cell += '|'; k++; continue; }
            if (ch === '`') code = !code;
            if (ch === '|' && !code) { cells.push(cell.trim()); cell = ''; }
            else cell += ch;
          }
          cells.push(cell.trim());
          return cells;
        }
        var head = splitRow(lines[i]);
        i += 2;
        var body = [];
        while (i < lines.length && /^\|.*\|/.test(lines[i])) { body.push(splitRow(lines[i])); i++; }
        var tbl = '<div class="tbl-wrap"><table><thead><tr>' +
          head.map(function (c) { return '<th>' + inline(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          body.map(function (row) {
            return '<tr>' + head.map(function (_, k) { return '<td>' + inline(row[k] || '') + '</td>'; }).join('') + '</tr>';
          }).join('') + '</tbody></table></div>';
        html += tbl;
        prevWasCode = false;
        continue;
      }

      // 列表(支持二级嵌套)
      if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
        var isOrdered = /^\s*\d+\.\s+/.test(line);
        var items = [];
        while (i < lines.length) {
          var li = lines[i];
          if (/^\s*[-*]\s+/.test(li) || /^\s*\d+\.\s+/.test(li)) {
            var indent = (li.match(/^(\s*)/) || ['', ''])[1].length;
            var txt = li.replace(/^\s*(?:[-*]|\d+\.)\s+/, '');
            items.push({ indent: indent, text: txt });
            i++;
            // 吃进续行(普通缩进文本)
            while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*(?:[-*]|\d+\.)\s+/.test(lines[i]) && !/^\s*```/.test(lines[i])) {
              items[items.length - 1].text += ' ' + lines[i].trim();
              i++;
            }
          } else if (li.trim() !== '' && /^\s{4,}\S/.test(li) && items.length) {
            items[items.length - 1].text += ' ' + li.trim();
            i++;
          } else break;
        }
        var openStack = [0];
        var listHtml = '';
        for (var v = 0; v < items.length; v++) {
          var it = items[v];
          var tag = isOrdered ? 'ol' : 'ul';
          if (it.indent >= 2 && openStack.length === 1) {
            listHtml += '<' + tag + '>';
            openStack.push(1);
          } else if (it.indent < 2 && openStack.length > 1) {
            listHtml += '</' + (isOrdered ? 'ol' : 'ul') + '></li>';
            openStack.pop();
          } else if (v > 0) {
            listHtml += '</li>';
          }
          if (v === 0 && openStack.length === 1) listHtml += '<' + tag + '>';
          listHtml += '<li>' + inline(it.text);
        }
        while (openStack.length > 1) { listHtml += '</' + (isOrdered ? 'ol' : 'ul') + '></li>'; openStack.pop(); }
        listHtml += '</li></' + (isOrdered ? 'ol' : 'ul') + '>';
        html += listHtml;
        prevWasCode = false;
        continue;
      }

      // 段落
      var pp = [line];
      i++;
      while (i < lines.length && lines[i].trim() !== '' &&
        !/^(#{2,4}\s|```|>|\||---+\s*$|\s*[-*]\s|\s*\d+\.\s)/.test(lines[i])) {
        pp.push(lines[i]); i++;
      }
      html += '<p>' + pp.map(inline).join('<br>') + '</p>';
      prevWasCode = false;
    }

    return { html: html, toc: toc };
  }

  window.MD = { render: render };
})();
