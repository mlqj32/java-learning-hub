/* ═══════════════════════════════════════════
   轻量语法高亮器(零依赖) — java/sql/shell/xml/yml/text
   ═══════════════════════════════════════════ */
(function () {
  'use strict';

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // 核心实现:从当前位置逐条尝试规则,命中即消费文本
  function highlight(src, rules) {
    let html = '';
    let i = 0;
    const n = src.length;
    while (i < n) {
      let matched = null;
      for (const r of rules) {
        r.re.lastIndex = 0;
        const m = r.re.exec(src.slice(i));
        if (m && m.index === 0) { matched = { rule: r, m: m }; break; }
      }
      if (matched) {
        const text = matched.m[0];
        const cls = matched.rule.cls;
        html += cls ? '<span class="' + cls + '">' + esc(text) + '</span>' : esc(text);
        i += text.length;
      } else {
        html += esc(src[i]);
        i += 1;
      }
    }
    return html;
  }

  function rulesOf(lang) {
    const kwJava = 'abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|native|new|package|private|protected|public|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|void|volatile|while|var|record|sealed|permits|yield|true|false|null';
    const kwSQL = 'SELECT|FROM|WHERE|AND|OR|NOT|NULL|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|DATABASE|INDEX|DROP|ALTER|ADD|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|AS|DISTINCT|UNION|ALL|EXISTS|IN|BETWEEN|LIKE|IS|ASC|DESC|PRIMARY|KEY|FOREIGN|REFERENCES|UNIQUE|DEFAULT|CONSTRAINT|AUTO_INCREMENT|ENGINE|CHARSET|BEGIN|COMMIT|ROLLBACK|TRANSACTION|ISOLATION|LEVEL|READ|WRITE|UNCOMMITTED|COMMITTED|REPEATABLE|SERIALIZABLE|LOCK|UNLOCK|SHOW|EXPLAIN|DESCRIBE|USE|TRUNCATE|VIEW|TRIGGER|PROCEDURE|FUNCTION|IF|THEN|ELSE|END|CASE|WHEN|COUNT|SUM|AVG|MAX|MIN|FOR|SHARE|PARTITION|CHARACTER|VARCHAR|INT|BIGINT|DECIMAL|DATETIME|TIMESTAMP|DATE|TEXT|STORED|VIRTUAL|DUPLICATE|IGNORE|CASCADE|STATUS|VARIABLES|KILL|TIDB';
    const kwSH = 'if|then|else|elif|fi|for|while|do|done|case|esac|function|in|select|until|time|coproc|exit|return|local|export|readonly|declare|unset|shift|break|continue|eval|exec|source|trap|set|unset|alias|echo|cd|ls|pwd|cat|grep|awk|sed|find|chmod|chown|ps|kill|top|df|du|tar|zip|unzip|curl|wget|ssh|scp|systemctl|journalctl|netstat|ss|ping|free|vmstat|iostat|head|tail|touch|mkdir|rmdir|rm|cp|mv|ln|which|whoami|sudo|apt|yum|rpm|nohup|watch|lsof|history|tee|sort|uniq|wc|cut|tr|xargs|printf|test|useradd|usermod|passwd|su|crontab|date|sleep|jobs|fg|bg|nice|renice|uname|hostname|arch|uptime|dmesg|mount|umount|fdisk|system';
    const common = [
      { re: /\/\*[\s\S]*?\*\//, cls: 'tk-com' },
      { re: /\/\/[^\n]*/, cls: 'tk-com' },
      { re: /--[^\n]*/, cls: 'tk-com' },
      { re: /#[^\n]*/, cls: 'tk-com' },
      { re: /--\s*\[[^\]]*\][^\n]*/, cls: 'tk-com' },
      { re: /"(?:\\.|[^"\\])*"?/, cls: 'tk-str' },
      { re: /'(?:\\.|[^'\\])*'?/, cls: 'tk-str' },
      { re: /`(?:\\.|[^`\\])*`?/, cls: 'tk-str' },
    ];
    switch (lang) {
      case 'python': case 'py': {
        return [
          { re: /#[^\n]*/, cls: 'tk-com' },
          { re: /(?:[rRbBuUfF]{0,2})(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$))/, cls: 'tk-str' },
          { re: /[rRbBuUfF]{0,2}(?:"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)/, cls: 'tk-str' },
          { re: /@[A-Za-z_][\w.]*/, cls: 'tk-ann' },
          { re: /\b(?:False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield|match|case)\b/, cls: 'tk-kw' },
          { re: /\b(?:0[xX][\da-fA-F_]+|0[bB][01_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?j?)\b/, cls: 'tk-num' },
          { re: /\b[A-Z][A-Za-z0-9_]*\b/, cls: 'tk-typ' },
          { re: /\b[A-Za-z_]\w*(?=\s*\()/, cls: 'tk-fn' }
        ];
      }
      case 'javascript': case 'js': {
        return [
          { re: /\/\*[\s\S]*?(?:\*\/|$)|\/\/[^\n]*/, cls: 'tk-com' },
          { re: /"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?|`(?:\\.|[^`\\])*`?/, cls: 'tk-str' },
          { re: /\b(?:async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|false|finally|for|from|function|if|import|in|instanceof|let|new|null|of|return|static|super|switch|this|throw|true|try|typeof|undefined|var|void|while|yield)\b/, cls: 'tk-kw' },
          { re: /\b(?:0[xX][\da-fA-F_]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?n?)\b/, cls: 'tk-num' },
          { re: /\b[A-Z][A-Za-z0-9_]*\b/, cls: 'tk-typ' },
          { re: /\b[A-Za-z_$][\w$]*(?=\s*\()/, cls: 'tk-fn' },
          { re: /=>|===|!==|==|!=|&&|\|\||\?\?|\?\./, cls: 'tk-op' }
        ];
      }
      case 'java': {
        const r = [
          { re: /\/\*[\s\S]*?(?:\*\/|$)|\/\/[^\n]*/, cls: 'tk-com' },
          { re: /"(?:\\.|[^"\\])*"?/, cls: 'tk-str' },
          { re: /'(?:\\.|[^'\\])*'?/, cls: 'tk-str' },
          { re: /@[A-Za-z_][\w.]*/, cls: 'tk-ann' },
          { re: new RegExp('\\b(?:' + kwJava + ')\\b'), cls: 'tk-kw' },
          { re: /\b\d[\d_]*(?:\.\d+)?[eE][+-]?\d*[fFdDlL]?\b|\b0[xX][0-9a-fA-F_]+\b|\b\d[\d_]*[fFdDlL]\b|\b\d+(?:\.\d+)?\b/, cls: 'tk-num' },
          { re: /\b[A-Z][A-Za-z0-9_]*\b/, cls: 'tk-typ' },
          { re: /\b[a-z][A-Za-z0-9_]*(?=\s*\()/, cls: 'tk-fn' },
        ];
        return r;
      }
      case 'sql': case 'mysql': {
        return [
          { re: /\/\*[\s\S]*?\*\//, cls: 'tk-com' },
          { re: /--[^\n]*/, cls: 'tk-com' },
          { re: /"(?:\\.|[^"\\])*"?/, cls: 'tk-str' },
          { re: /'(?:\\.|[^'\\])*'?/, cls: 'tk-str' },
          { re: /`[^`]*`/, cls: 'tk-var' },
          { re: new RegExp('\\b(?:' + kwSQL + ')\\b', 'gi'), cls: 'tk-kw' },
          { re: /\b\d+(?:\.\d+)?\b/, cls: 'tk-num' },
          { re: /\b[a-z_][\w]*(?=\s*\()/i, cls: 'tk-fn' },
        ];
      }
      case 'shell': case 'bash': case 'sh': case 'console': {
        return [
          { re: /#[^\n]*/, cls: 'tk-com' },
          { re: /"(?:\\.|[^"\\])*"?/, cls: 'tk-str' },
          { re: /'(?:[^'\\]|\\.)*'?/, cls: 'tk-str' },
          { re: /\$\{[^}]*\}|\$[A-Za-z_]\w*|\$\?|\$!|\$\$|\$\(/, cls: 'tk-var' },
          { re: /\|\||&&|;;|\||&|>>|<<|>/, cls: 'tk-op' },
          { re: new RegExp('\\b(?:' + kwSH + ')\\b'), cls: 'tk-kw' },
          { re: /\b\d+(?:\.\d+)?\b/, cls: 'tk-num' },
          { re: /^\s*-{1,2}[\w-]+/, cls: 'tk-ann' },
          { re: /\b[A-Z][A-Z_]{2,}\b/, cls: 'tk-typ' },
        ];
      }
      case 'xml': case 'html': case 'svg': {
        return [
          { re: /<!--[\s\S]*?-->/, cls: 'tk-com' },
          { re: /"[^"]*"?/, cls: 'tk-str' },
          { re: /<\/?[\w:-]+/, cls: 'tk-kw' },
          { re: /[\w:-]+(?==)/, cls: 'tk-ann' },
          { re: /\/?>/, cls: 'tk-kw' },
        ];
      }
      case 'yml': case 'yaml': case 'properties': {
        return [
          { re: /#[^\n]*/, cls: 'tk-com' },
          { re: /"(?:\\.|[^"\\])*"?/, cls: 'tk-str' },
          { re: /'(?:[^'\\]|\\.)*'?/, cls: 'tk-str' },
          { re: /-?\b\d+(?:\.\d+)?\b/, cls: 'tk-num' },
          { re: /\b(?:true|false|null|on|off|yes|no)\b/, cls: 'tk-kw' },
          { re: /^[\s-]*[\w.$-]+(?=\s*:)/m, cls: 'tk-ann' },
          { re: /\$\{[^}]*\}/, cls: 'tk-var' },
        ];
      }
      case 'json': {
        return [
          { re: /"(?:\\.|[^"\\])*"(?=\s*:)/, cls: 'tk-ann' },
          { re: /"(?:\\.|[^"\\])*"/, cls: 'tk-str' },
          { re: /\b(?:true|false|null)\b/, cls: 'tk-kw' },
          { re: /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/, cls: 'tk-num' },
        ];
      }
      case 'docker': case 'dockerfile': {
        return [
          { re: /#[^\n]*/, cls: 'tk-com' },
          { re: /"(?:\\.|[^"\\])*"?/, cls: 'tk-str' },
          { re: /^\s*(?:FROM|RUN|CMD|COPY|ADD|ENV|WORKDIR|EXPOSE|ENTRYPOINT|VOLUME|ARG|LABEL|USER|HEALTHCHECK)\b/m, cls: 'tk-kw' },
          { re: /\$\{[^}]*\}|\$\w+/, cls: 'tk-var' },
        ];
      }
      case 'diff': {
        return [
          { re: /^\+[^\n]*/m, cls: 'tk-str' },
          { re: /^-[^\n]*/m, cls: 'tk-err' },
          { re: /^@@[^\n]*/m, cls: 'tk-num' },
        ];
      }
      default:
        return [];
    }
  }

  var cache = Object.create(null);
  window.HL = function (src, lang) {
    lang = (lang || '').toLowerCase();
    // Every token must start at the cursor; avoid repeatedly searching the remaining file.
    const rules = cache[lang] || (cache[lang] = rulesOf(lang).map(function (rule) { return {re: new RegExp('^(?:' + rule.re.source + ')', rule.re.flags.replace(/[gmy]/g, '')), cls: rule.cls}; }));
    if (!rules.length) return esc(src);
    try { return highlight(src, rules); } catch (e) { return esc(src); }
  };
})();
