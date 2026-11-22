/* Source inspection for optional runner fields. Does not execute lesson code. */
(function () {
  'use strict';
  function blank(text) { return text.replace(/[^\n]/g, ' '); }
  function codeOnly(source, lang) {
    if (lang === 'python') return source.replace(/#[^\n]*|\b[frbu]{1,2}(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)|"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?/gi, function (text) {
      if (/^[frbu]*f[frbu]*["']/i.test(text)) return ' ' + Array.from(text.matchAll(/(?<!\{)\{([^{}]*)\}(?!\})/g), function (m) { return codeOnly(m[1], lang); }).join(' ') + ' ';
      return blank(text);
    });
    return source.replace(/\/\*[\s\S]*?(?:\*\/|$)|\/\/[^\n]*|"(?:\\.|[^"\\])*"?|'(?:\\.|[^'\\])*'?|`(?:\\.|[^`\\])*`?/g, function (text) {
      if (lang === 'javascript' && text[0] === '`') return ' ' + Array.from(text.matchAll(/\$\{([^{}]*)\}/g), function (m) { return codeOnly(m[1], lang); }).join(' ') + ' ';
      return blank(text);
    });
  }
  function javaOptions(code) {
    var mains = [], classes = [], scopes = [], pending = null, depth = 0, match;
    var tokens = /[{}]|\b(public\s+)?(?:(?:final|abstract|strictfp)\s+)*(?:class|interface|enum|record)\s+([\w$]+)|\bstatic\s+(?:(?:public|final|synchronized|strictfp)\s+)*void\s+main\s*\(\s*(?:java\s*\.\s*lang\s*\.\s*)?String\s*(?:\[\s*\]|\.\.\.)?\s*([\w$]+)\s*(?:\[\s*\])?\s*\)/g;
    while ((match = tokens.exec(code))) {
      if (match[0] === '{') { depth++; scopes.push(pending); pending = null; }
      else if (match[0] === '}') { depth--; scopes.pop(); }
      else if (match[2]) { pending = match[2]; if (depth === 0) classes.push({ name: pending, public: !!match[1] }); }
      else if (match[3]) mains.push({ name: scopes.filter(Boolean).join('$'), parameter: match[3], start: match.index, end: tokens.lastIndex });
    }
    var body = code;
    mains.slice().reverse().forEach(function (entry) { body = body.slice(0, entry.start) + blank(body.slice(entry.start, entry.end)) + body.slice(entry.end); });
    var first = classes.filter(function (entry) { return entry.public; })[0] || classes[0];
    var executable = code.replace(/\bimport\s+[^;]+;/g, blank);
    return {
      stdin: /\bSystem\s*\.\s*(?:in\b|console\s*\()/.test(executable) || /\bimport\s+static\s+java\s*\.\s*lang\s*\.\s*System\s*\.\s*(?:in|\*)\s*;/.test(code) && /\bin\b/.test(executable),
      args: mains.length ? mains.some(function (entry) { return new RegExp('(^|[^\\w$])' + entry.parameter.replace(/\$/g, '\\$') + '(?![\\w$])').test(body); }) : /\bargs\b/.test(code),
      main: mains.length > 1 || mains.length === 1 && !!first && mains[0].name !== first.name
    };
  }
  function optionsFor(source, lang) {
    lang = ({ py: 'python', python3: 'python', js: 'javascript' })[lang] || lang;
    var code = codeOnly(source, lang), result = { stdin: false, args: false, main: false };
    if (lang === 'java') return javaOptions(code);
    if (lang === 'javascript') return { stdin: /\binput\b/.test(code), args: /\bargs\b/.test(code), main: false };
    if (lang !== 'python') return result;
    result.stdin = /\binput\s*\(/.test(code);
    var sysNames = ['sys'], match;
    var imports = /\bimport\s+sys\s+as\s+(\w+)/g;
    while ((match = imports.exec(code))) sysNames.push(match[1]);
    sysNames.forEach(function (name) {
      result.stdin = result.stdin || new RegExp('\\b' + name + '\\s*\\.\\s*(?:stdin|__stdin__)\\b').test(code);
      result.args = result.args || new RegExp('\\b' + name + '\\s*\\.\\s*argv\\b').test(code);
    });
    var fromSys = /\bfrom\s+sys\s+import\s+(\([^)]*\)|[^\n;]+)/g;
    while ((match = fromSys.exec(code))) {
      Array.from(match[1].matchAll(/\b(stdin|__stdin__|argv)\b(?:\s+as\s+(\w+))?/g)).forEach(function (item) {
        var body = code.slice(0, match.index) + code.slice(fromSys.lastIndex);
        if (new RegExp('\\b' + (item[2] || item[1]) + '\\b').test(body)) result[item[1] === 'argv' ? 'args' : 'stdin'] = true;
      });
    }
    if (/\.\s*parse_(?:known_|intermixed_)?args\s*\(/.test(code) || /\bfileinput\s*\.\s*input\s*\(/.test(code)) result.args = true;
    return result;
  }
  window.HUB_RUNTIME_OPTIONS = { inspect: optionsFor };
})();
