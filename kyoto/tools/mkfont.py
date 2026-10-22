"""PixelMplus10 から、ゲームで使う文字だけを抜き出した woff を作る（assets/fonts/ を更新する）。
使い方:  python3 kyoto/tools/mkfont.py /path/to/PixelMplus   （PixelMplus10-Regular.ttf / -Bold.ttf のあるフォルダ）
  事前に  node kyoto/tools/build.mjs  で dist を作っておく（画面で使う文字をそこから拾う）。
  必要: pip install fonttools   フォントの入手元と許諾: assets/fonts/LICENSE_M+FONTS_*.txt, assets/README.md
文字の範囲: ソース内の全文字 + ASCII + ひらがな・カタカナ + JIS第1水準漢字（新しい文章で漢字が増えても欠けにくくする余裕）。
"""
import re, sys, pathlib
from fontTools import subset
from fontTools.ttLib import TTFont

root = pathlib.Path(__file__).resolve().parent.parent
ttf_dir = pathlib.Path(sys.argv[1])
html = (root / 'dist' / 'kyoto.html').read_text(encoding='utf8')
html = re.sub(r'base64,[A-Za-z0-9+/=]+', '', html)
chars = set(c for c in html if ord(c) > 31) | set(chr(i) for i in range(32, 127)) | set(chr(i) for i in range(0x3041, 0x30FF))
for hi in range(0x88, 0x99):
    for lo in range(0x40, 0xFD):
        if lo == 0x7F:
            continue
        try:
            c = bytes([hi, lo]).decode('shift_jis')
        except Exception:
            continue
        if len(c) == 1:
            chars.add(c)
for name in ('Regular', 'Bold'):
    o = subset.Options(); o.flavor = 'woff'; o.layout_features = ['*']; o.notdef_outline = True
    f = TTFont(ttf_dir / f'PixelMplus10-{name}.ttf')
    s = subset.Subsetter(o); s.populate(text=''.join(chars)); s.subset(f)
    f.flavor = 'woff'
    out = root / 'assets' / 'fonts' / f'PixelMplus10-{name}.subset.woff'
    f.save(out)
    print(name, len(f.getBestCmap()), 'chars', out.stat().st_size, 'bytes')
