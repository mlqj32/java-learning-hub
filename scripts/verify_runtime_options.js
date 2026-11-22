/* Check optional controls against real source forms, without native runtimes. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const context = {window: {}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/js/runtime-options.js'), 'utf8'), context);
const inspect = (source, lang) => JSON.parse(JSON.stringify(context.window.HUB_RUNTIME_OPTIONS.inspect(source, lang)));
const none = {stdin: false, args: false, main: false};
const main = body => 'public class Main { public static void main(String[] args) {' + body + '} }';
const cases = [
  [main('System.out.println(980);'), 'java', none],
  [main('// System.in args[0]\nSystem.out.println("System.in args[0]");'), 'java', none],
  [main('new java.util.Scanner(System.in).nextLine();'), 'java', {...none, stdin:true}],
  [main('System.console().readLine();'), 'java', {...none, stdin:true}],
  ['import static java.lang.System.in; ' + main('System.out.println(1);'), 'java', none],
  ['import static java.lang.System.in; ' + main('new java.util.Scanner(in).nextLine();'), 'java', {...none, stdin:true}],
  [main('System.out.println(args.length);'), 'java', {...none, args:true}],
  ['class Main { public static void main(String... values) { System.out.println(values[0]); }}', 'java', {...none, args:true}],
  ['class Main { public static void main(String values[]) { System.out.println(values[0]); }}', 'java', {...none, args:true}],
  ['class Main { public static void main(String[] values) {} }', 'java', none],
  ['class Main { public static void main(String[] $argv) { System.out.println($argv.length); } }', 'java', {...none, args:true}],
  ['package lab; class Helper {} ' + main(''), 'java', none],
  ['class Helper {} class Entry { public static void main(String[] args) {} }', 'java', {...none, main:true}],
  [main('') + ' class Entry { public static void main(String[] other) {} }', 'java', {...none, main:true}],
  ['class Outer { static class Inner { public static void main(String[] args) {} } }', 'java', {...none, main:true}],
  ['System.out.println(args[0]);', 'java', {...none, args:true}],
  ['System.out.println("hi");', 'java', none],
  ['import unicodedata\nprint("sys.argv input()") # input()\n', 'python', none],
  ['print(input())', 'python', {...none, stdin:true}],
  ['import sys\nprint(sys.stdin.read())', 'python', {...none, stdin:true}],
  ['import sys as s\nprint(s.argv[1])', 'python', {...none, args:true}],
  ['from sys import stdin as stream\nprint(stream.read())', 'python', {...none, stdin:true}],
  ['from sys import argv as values\nprint(values[1])', 'python', {...none, args:true}],
  ['from sys import argv\nprint(1)', 'python', none],
  ['print(f"hello {input()}")', 'python', {...none, stdin:true}],
  ['import sys\nprint(f"{sys.argv[1]}")', 'python', {...none, args:true}],
  ['"""input() sys.argv"""\nprint(1)', 'python', none],
  ['import argparse\np = argparse.ArgumentParser()\np.parse_args()', 'python', {...none, args:true}],
  ['import argparse\nprint(1)', 'python', none],
  ['import fileinput\nprint(1)', 'python', none],
  ['console.log(1); // input args\nconsole.log("input args");', 'javascript', none],
  ['console.log(input);', 'javascript', {...none, stdin:true}],
  ['console.log(args[0]);', 'javascript', {...none, args:true}],
  ['console.log(`hello ${input}`);', 'javascript', {...none, stdin:true}],
  ['SELECT 1;', 'sql', none],
  ['<input value="args">', 'html', none]
];
for (const [source, lang, expected] of cases) assert.deepEqual(inspect(source, lang), expected, lang + ': ' + source);
console.log('PASS: ' + cases.length + ' optional-field cases: comments, literals, input/argument aliases, Java entry points and interpolated strings.');
