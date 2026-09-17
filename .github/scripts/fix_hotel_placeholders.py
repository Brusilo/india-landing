from pathlib import Path
import re

js_path = Path('assets/search-v2.js')
js = js_path.read_text(encoding='utf-8')
replacements = {
    "hotelWhere:'Город или направление'": "hotelWhere:'Город'",
    "hotelWhere:'City or destination'": "hotelWhere:'City'",
    "hotelWhere:'शहर या गंतव्य'": "hotelWhere:'शहर'",
}
for old, new in replacements.items():
    if old not in js:
        raise SystemExit(f'JS marker not found: {old}')
    js = js.replace(old, new, 1)
js_path.write_text(js, encoding='utf-8')

css_path = Path('assets/search-v2.css')
css = css_path.read_text(encoding='utf-8')
rule = '''\n/* Hotel empty-state fields match the neutral placeholder style. */\n.search-v2[data-mode="hotel"] .v2-field--date:not(.has-value) .v2-value {\n  font-weight: 400 !important;\n  color: #74748a !important;\n}\n'''
if rule.strip() not in css:
    css += rule
css_path.write_text(css, encoding='utf-8')

version = '20260917-hotel-placeholder'
for name in ['index.html', 'index-en.html', 'index-hi.html']:
    p = Path(name)
    s = p.read_text(encoding='utf-8')
    s = re.sub(r'assets/search-v2\.css(?:\?v=[^"\']+)?', f'assets/search-v2.css?v={version}', s)
    s = re.sub(r'assets/search-v2\.js(?:\?v=[^"\']+)?', f'assets/search-v2.js?v={version}', s)
    p.write_text(s, encoding='utf-8')
