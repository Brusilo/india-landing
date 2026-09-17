from pathlib import Path
import re

css_path = Path('assets/search-v2.css')
css = css_path.read_text(encoding='utf-8')
rule = '''
/* Force empty hotel dates to match neutral text placeholders. */
.search.search-v2[data-mode="hotel"] .v2-field--date:not(.has-value) .v2-value {
  font-family: var(--font) !important;
  font-size: 18px !important;
  font-weight: 400 !important;
  line-height: 1.2 !important;
  color: #74748a !important;
  opacity: 1 !important;
}
@media (max-width: 899px) {
  .search.search-v2[data-mode="hotel"] .v2-field--date:not(.has-value) .v2-value {
    font-size: 17px !important;
  }
}
'''
if 'Force empty hotel dates to match neutral text placeholders.' not in css:
    css += rule
css_path.write_text(css, encoding='utf-8')

version = '20260917-hotel-date-placeholder-3'
for name in ['index.html', 'index-en.html', 'index-hi.html']:
    p = Path(name)
    s = p.read_text(encoding='utf-8')
    s = re.sub(r'assets/search-v2\.css(?:\?v=[^"\']+)?', 'assets/search-v2.css?v=' + version, s)
    p.write_text(s, encoding='utf-8')
