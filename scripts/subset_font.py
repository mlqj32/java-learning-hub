"""Rebuild the local reading font after changing lesson text. Requires fonttools[woff]."""
from pathlib import Path
import tempfile
import urllib.request
from fontTools.ttLib import TTFont
from fontTools import subset

ROOT = Path(__file__).resolve().parents[1]
FONT_DIR = ROOT / 'assets/fonts'
SOURCE_URL = 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf'
source = Path(tempfile.gettempdir()) / 'java-hub-NotoSansSC.ttf'
if not source.exists():
    urllib.request.urlretrieve(SOURCE_URL, source)
chars = set()
for file in ROOT.rglob('*'):
    if file.is_file() and file.relative_to(ROOT).parts[:2] != ('assets', 'vendor') and file.suffix in ('.js', '.css', '.html', '.md', '.py'):
        chars.update(file.read_text(encoding='utf-8'))
chars.update(chr(i) for i in range(32, 127))
font = TTFont(source)
options = subset.Options()
options.flavor = 'woff2'
worker = subset.Subsetter(options=options)
worker.populate(unicodes=[ord(c) for c in chars])
worker.subset(font)
# A distinct internal family name identifies this modified, subsetted font.
for name_id, value in [(1, 'Hub Sans'), (2, 'Regular'), (4, 'Hub Sans'), (6, 'HubSans'), (16, 'Hub Sans'), (17, 'Regular')]:
    font['name'].setName(value, name_id, 3, 1, 0x409)
font.flavor = 'woff2'
FONT_DIR.mkdir(exist_ok=True)
font.save(FONT_DIR / 'hub-sans-sc.woff2')
urllib.request.urlretrieve('https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/OFL.txt', FONT_DIR / 'OFL.txt')
print('Characters:', len(chars), 'Bytes:', (FONT_DIR / 'hub-sans-sc.woff2').stat().st_size)
