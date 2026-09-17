from pathlib import Path

root = Path('.')

# Add more verified Tutu Hotel localities.
p = root / 'assets/search-places.js'
s = p.read_text(encoding='utf-8')
marker = '    // India — international and high-demand nodes'
assert marker in s
rows = [
    ('Лазаревское', "    ['RU','Лазаревское','Lazarevskoye','लाज़ारेव्स्कोये','','',134],"),
    ('Дивноморское', "    ['RU','Дивноморское','Divnomorskoye','दिव्नोमोर्स्कोये','','',135],"),
    ('Кабардинка', "    ['RU','Кабардинка','Kabardinka','कबार्दिंका','','',136],"),
    ('Витязево', "    ['RU','Витязево','Vityazevo','वित्याज़ेवो','','',137],"),
    ('Сукко', "    ['RU','Сукко','Sukko','सुक्को','','',138],"),
    ('Архыз', "    ['RU','Архыз','Arkhyz','आर्खिज़','','',139],"),
    ('Шерегеш', "    ['RU','Шерегеш','Sheregesh','शेरेगेश','','',140],"),
    ('Листвянка', "    ['RU','Листвянка','Listvyanka','लिस्तव्यांका','','',141],"),
    ('Зеленоградск', "    ['RU','Зеленоградск','Zelenogradsk','ज़ेलेनोग्राद्स्क','','',142],"),
    ('Светлогорск', "    ['RU','Светлогорск','Svetlogorsk','स्वेतलोगोर्स्क','','',143],"),
    ('Сортавала', "    ['RU','Сортавала','Sortavala','सोर्टावाला','','',144],"),
    ('Белокуриха', "    ['RU','Белокуриха','Belokurikha','बेलोकुरिखा','','',145],"),
    ('Сириус', "    ['RU','Сириус','Sirius','सिरियस','','',146],"),
    ('Теберда', "    ['RU','Теберда','Teberda','तेबेर्दा','','',147],"),
]
missing = [row for city, row in rows if city not in s]
if missing:
    s = s.replace(marker, '\n'.join(missing) + '\n\n' + marker, 1)
    p.write_text(s, encoding='utf-8')

# Preserve combined-route cards, but do not claim an exact single-search link or stale price.
p = root / 'assets/card-links.js'
s = p.read_text(encoding='utf-8')
old = """    ['route_r6_combined','route_r7_combined'].forEach(id=>{const x=routes.querySelector('[data-cta=\"'+id+'\"]');if(x)x.remove()});
    routes.querySelectorAll('.card[data-transport]').forEach(card=>{
      const id=(card.dataset.cta||'').replace(/^route_/,'').replace(/_combined$/,'');
      const d=routeData[id];
      if(d){
        const price=card.querySelector('.price');if(price)price.textContent=(lang==='en'?'from ':lang==='hi'?'से ':'от ')+nf(d.price)+' ₽';
        const alt=card.querySelector('.price-alt');if(alt)alt.textContent='≈ ₹'+Math.round(d.price*RUB_TO_INR).toLocaleString('en-IN');
        const meta=card.querySelector('.card-meta');if(meta)meta.textContent=duration(d.h,d.m);
      }
      activate(card,routeUrl(card));
    });"""
new = """    const combinedFallback=new Set(['r6','r7']);
    routes.querySelectorAll('.card[data-transport]').forEach(card=>{
      const id=(card.dataset.cta||'').replace(/^route_/,'').replace(/_combined$/,'');
      if(combinedFallback.has(id)){
        const price=card.querySelector('.price');if(price)price.textContent=lang==='ru'?'Уточнить на Туту':lang==='hi'?'टूटू पर देखें':'Check on Tutu';
        const alt=card.querySelector('.price-alt');if(alt)alt.textContent='';
        const meta=card.querySelector('.card-meta');if(meta)meta.textContent=lang==='ru'?'Составной маршрут':lang==='hi'?'संयुक्त मार्ग':'Combined route';
        activate(card,HOME);
        return;
      }
      const d=routeData[id];
      if(d){
        const price=card.querySelector('.price');if(price)price.textContent=(lang==='en'?'from ':lang==='hi'?'से ':'от ')+nf(d.price)+' ₽';
        const alt=card.querySelector('.price-alt');if(alt)alt.textContent='≈ ₹'+Math.round(d.price*RUB_TO_INR).toLocaleString('en-IN');
        const meta=card.querySelector('.card-meta');if(meta)meta.textContent=duration(d.h,d.m);
      }
      activate(card,routeUrl(card));
    });"""
assert old in s, 'combined route block not found'
s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')

for fn in ['index.html', 'index-en.html', 'index-hi.html']:
    p = root / fn
    h = p.read_text(encoding='utf-8')
    h = h.replace('assets/search-places.js?v=20260917-places-9', 'assets/search-places.js?v=20260917-places-11')
    h = h.replace('assets/card-links.js?v=20260917-links-10', 'assets/card-links.js?v=20260917-links-11')
    p.write_text(h, encoding='utf-8')

# Clean temporary helper/workflow from the final tree.
for tmp in [root / 'tools/finalize_v11.py', root / '.github/workflows/finalize-resorts-v11.yml']:
    if tmp.exists():
        tmp.unlink()
