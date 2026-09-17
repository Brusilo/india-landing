from pathlib import Path

css_path = Path('assets/search-v2.css')
css = css_path.read_text(encoding='utf-8')

replacements = [
    (
        '  grid-template-columns: minmax(0, 1fr) 52px minmax(0, 1fr) minmax(185px, .78fr) minmax(190px, .82fr) 172px;',
        '  grid-template-columns: minmax(0, 1fr) 52px minmax(0, 1fr) minmax(145px, .55fr) minmax(250px, 1.05fr) 172px;',
    ),
    (
        '  max-height: 330px;\n  padding: 8px;\n  overflow: auto;',
        '  max-height: none;\n  padding: 8px;\n  overflow: visible;',
    ),
    (
        '''.search-hints.search-hints-v2 {
  position: relative;
  z-index: 4;
  display: flex !important;
  gap: 8px;
  flex-wrap: wrap;
  width: 100%;
  margin-top: 7px;
}
.search-hints-v2 .quick-group-v2 { display: flex; gap: 6px; flex-wrap: wrap; }
.search-hints-v2 .quick-group-v2 + .quick-group-v2 { margin-left: 146px; }
''',
        '''.search-hints.search-hints-v2 {
  position: relative;
  z-index: 4;
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) 52px minmax(0, 1fr) minmax(145px, .55fr) minmax(250px, 1.05fr) 172px;
  column-gap: 0;
  row-gap: 8px;
  width: 100%;
  margin-top: 7px;
}
.search-hints-v2[data-mode="hotel"] {
  grid-template-columns: minmax(320px, 1.55fr) minmax(300px, .95fr) minmax(220px, .8fr) 172px;
}
.search-hints-v2 .quick-group-v2 { display: flex; gap: 6px; flex-wrap: wrap; min-width: 0; }
.search-hints-v2[data-mode="hotel"] .quick-group-v2:first-child { grid-column: 1; }
.search-hints-v2[data-mode="hotel"] .quick-group-v2:nth-child(2) { grid-column: 2; }
.search-hints-v2[data-mode="flight"] .quick-group-v2:first-child,
.search-hints-v2[data-mode="train"] .quick-group-v2:first-child,
.search-hints-v2[data-mode="bus"] .quick-group-v2:first-child { grid-column: 1 / 4; }
.search-hints-v2[data-mode="flight"] .quick-group-v2:nth-child(2),
.search-hints-v2[data-mode="train"] .quick-group-v2:nth-child(2),
.search-hints-v2[data-mode="bus"] .quick-group-v2:nth-child(2) { grid-column: 4; }
''',
    ),
    (
        '''  .search-v2 .v2-popover { left: 0; right: auto; }
  .search-hints-v2 .quick-group-v2 + .quick-group-v2 { margin-left: 0; }
''',
        '''  .search-v2 .v2-popover { left: 0; right: auto; }
  .search-hints.search-hints-v2,
  .search-hints-v2[data-mode="hotel"] {
    display: flex !important;
    flex-wrap: wrap;
    gap: 8px;
  }
''',
    ),
]

for old, new in replacements:
    if old not in css:
        raise SystemExit(f'CSS marker not found: {old[:80]!r}')
    css = css.replace(old, new, 1)

css_path.write_text(css, encoding='utf-8')

js_path = Path('assets/search-v2.js')
js = js_path.read_text(encoding='utf-8')

old = "      input.addEventListener('focus',()=>{closeOverlays(box);renderSuggestions(input,role)});\n"
new = "      input.addEventListener('focus',()=>{closeOverlays(box);renderSuggestions(input,role)});\n      input.addEventListener('click',e=>{e.stopPropagation();closeOverlays(box);renderSuggestions(input,role)});\n"
if old not in js:
    raise SystemExit('bindPlaces focus marker not found')
js = js.replace(old, new, 1)

old = "  function renderHints(){\n    let a=[],b=[];\n"
new = "  function renderHints(){\n    hints.dataset.mode=mode;\n    let a=[],b=[];\n"
if old not in js:
    raise SystemExit('renderHints marker not found')
js = js.replace(old, new, 1)

js_path.write_text(js, encoding='utf-8')
