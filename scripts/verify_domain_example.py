"""Maintainer regression check; website execution still uses browser Pyodide only."""
from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
content = (root / "assets/js/content/reverse_ext4.js").read_text(encoding="utf-8").replace("\\`", "`")
match = re.search(r"```python\n(.*?)```\s*\n\s*```output\n(.*?)```", content, re.S)
assert match, "Domain code and its documented output must remain paired"
source, expected = match.groups()
namespace = {}
output = StringIO()
with redirect_stdout(output):
    exec(compile(source, "course-domain-example", "exec"), namespace)
assert output.getvalue().strip() == expected.strip(), (output.getvalue(), expected)

cases = {
    "icbc.com.cn": "✓ 匹配白名单",
    "ICBC.COM.CN": "✓ 匹配白名单",
    "icbc.c0m.cn": "⚠ 可疑：形近域名",
    "lCBC.com.cn": "⚠ 可疑：形近域名",
    "1cbc.com.cn": "⚠ 可疑：形近域名",
    "icbc.corn.cn": "⚠ 可疑：形近域名",
    "ｉｃｂｃ.com.cn": "⚠ 可疑：形近域名",
    "icbc.ｃ０ｍ.cn": "⚠ 可疑：形近域名",
    "icbc.com.cn.evil.xyz": "⚠ 可疑：不在白名单",
    "login.icbc.com.cn": "⚠ 可疑：不在白名单",
    "iсbc.com.cn": "⚠ 可疑：不在白名单",  # Cyrillic U+0441, not Latin c
    "https://icbc.com.cn": "⚠ 可疑：不在白名单",
    "icbc.com.cn ": "⚠ 可疑：不在白名单",
    "": "⚠ 可疑：不在白名单",
}
for domain, expected_status in cases.items():
    assert namespace["classify"](domain) == expected_status, domain
assert namespace["skeleton"]("iсbc.com.cn") != namespace["skeleton"]("icbc.com.cn")
print(f"PASS: actual course output matches documentation; {len(cases)} domain cases")
