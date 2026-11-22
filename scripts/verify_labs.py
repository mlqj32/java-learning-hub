"""Execute the standalone new examples and build the documented Maven project in a temp dir."""
from pathlib import Path
import os
import re
import shutil
import subprocess
import tempfile
import json
import time
import urllib.request
from build_learning_content import FOUNDATIONS, ENGINEERING
from build_reverse_labs import LABS, DEPTH

WORK = Path(tempfile.mkdtemp(prefix='java-hub-labs-'))


def run(args, cwd=WORK, stdin=None):
    result = subprocess.run(args, cwd=cwd, input=stdin, text=True, encoding='utf-8', errors='replace',
                            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=180)
    if result.returncode:
        raise RuntimeError(str(args) + '\n' + result.stdout)
    return result.stdout.replace('\r\n', '\n').strip()


def blocks(content, lang):
    return re.findall(r'^```' + lang + r'([^\n]*)\n(.*?)^```\s*$', content, re.M | re.S)


expected_java = {
    'Hello': '你好，Java！\n5', 'Receipt': '3600\n3600\n5400',
    'MemberPrice': '4860', 'Sum': 'i=1, sum=1\ni=2, sum=3\ni=3, sum=6',
    'Cart': '输入优惠金额（分）：\n应付：3000', 'MethodLab': '3000\n1800',
    'ObjectLab': '奶茶 x 2\n咖啡 x 2', 'DebugPrice': '1300',
    'BytecodeLab': 'score=10\ndecision=ok'
}
for chapter in FOUNDATIONS + [ENGINEERING[2], LABS[0]]:
    for meta, code in blocks(chapter['content'], 'java'):
        name = re.search(r'public class (\w+)', code).group(1)
        (WORK / (name + '.java')).write_text(code, encoding='utf-8')
        run(['javac', '-g', '-encoding', 'UTF-8', name + '.java'])
        command = ['java', '-Dfile.encoding=UTF-8', '-cp', '.', name]
        if name == 'BytecodeLab':
            command.append('3')
        actual = run(command, stdin='500\n' if name == 'Cart' else None)
        assert actual == expected_java[name], (name, actual)
print('PASS: 9 standalone Java programs')

root = Path(__file__).resolve().parents[1]
original = json.loads(run(['node', '-e', "const fs=require('fs'),vm=require('vm');const c={window:{}};vm.createContext(c);vm.runInContext(fs.readFileSync('assets/js/content/javase.js','utf8'),c);console.log(JSON.stringify(c.window.CONTENT.javase.chapters.slice(0,2)));"], root))
for lesson, name, expected in [
    (original[0], 'OperatorTrap', '4 / i=3\n3 -3 1\nInfinity NaN\n  isFalse() 执行了\ntrue\n  isFalse() 执行了\nfalse'),
    (original[1], 'CompositeDemo', 'add: a\nadd: b\n2')
]:
    code = next(code for _, code in blocks(lesson['content'], 'java') if 'public class ' + name in code)
    (WORK / (name + '.java')).write_text(code, encoding='utf-8')
    run(['javac', '-encoding', 'UTF-8', name + '.java'])
    assert run(['java', '-Dfile.encoding=UTF-8', '-cp', '.', name]) == expected
print('PASS: corrected short-circuit output and composition program')

disassembly = run(['javap', '-c', '-p', '-s', '-l', 'BytecodeLab'])
for instruction in ['iload_0', 'iconst_3', 'imul', 'iconst_1', 'iadd', 'ireturn', '(I)I']:
    assert instruction in disassembly, instruction
print('PASS: BytecodeLab descriptor and instructions')

for chapter in LABS[1:]:
    for meta, code in blocks(chapter['content'], 'python'):
        (WORK / meta.strip()).write_text(code, encoding='utf-8')
run(['python', 'make_fixture.py'])
assert 'PE machine=0x8664 sections=1' in run(['python', 'inspect_header.py', 'pe_fixture.bin'])
assert 'class major=61' in run(['python', 'inspect_header.py', 'BytecodeLab.class'])
assert run(['python', 'frame_lab.py']) == "[]\n['OK']\n['你好']"
out = run(['python', '-m', 'unittest', 'test_header', 'test_frame', '-v'])
assert 'Ran 9 tests' in out and 'OK' in out
print('PASS: 9 Python assertions, fixture generation and frame output')

for meta, code in blocks(DEPTH['r13'], 'python'):
    (WORK / 'xor_lab.py').write_text(code, encoding='utf-8')
assert run(['python', 'xor_lab.py']) == '62756269\nJAVA'
print('PASS: XOR example output')

maven = shutil.which('mvn')
if not maven:
    raise RuntimeError('Maven is required to verify the documented project')
project = WORK / 'hello-service'
project.mkdir()
for chapter in [ENGINEERING[0], ENGINEERING[3]]:
    for lang in ['xml', 'java']:
        for meta, code in blocks(chapter['content'], lang):
            target = project / meta.strip()
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(code, encoding='utf-8')
print('Building documented Maven project:', project, flush=True)
out = run([maven, '--batch-mode', '-q', 'test', 'package'], project)
report = (project / 'target/surefire-reports/lab.PriceTest.txt').read_text('utf-8')
assert 'Tests run: 4, Failures: 0, Errors: 0, Skipped: 0' in report
jar = project / 'target/hello-service-1.0.0.jar'
assert jar.exists()
print('PASS: Maven project, 4 JUnit tests and executable jar')
logfile = WORK / 'http-smoke.log'
with logfile.open('w', encoding='utf-8') as log:
    server = subprocess.Popen(['java', '-Dfile.encoding=UTF-8', '-jar', str(jar),
                               '--server.address=127.0.0.1', '--server.port=0'],
                              cwd=project, stdout=log, stderr=subprocess.STDOUT)
    try:
        deadline = time.monotonic() + 40
        port = None
        while time.monotonic() < deadline:
            logs = logfile.read_text('utf-8', errors='replace')
            match = re.search(r'Tomcat started on port (\d+)', logs)
            if match:
                port = match[1]
                break
            if server.poll() is not None:
                raise RuntimeError(logs)
            time.sleep(.2)
        if not port:
            raise RuntimeError('HTTP smoke start timeout: ' + logfile.read_text('utf-8', errors='replace'))
        with urllib.request.urlopen('http://127.0.0.1:' + port + '/hello?name=Java', timeout=5) as response:
            assert response.status == 200
            assert response.read().decode('utf-8') == 'hello, Java'
        print('PASS: executable jar returns hello, Java over HTTP')
    finally:
        server.terminate()
        server.wait(timeout=10)
print('Artifacts:', WORK)
