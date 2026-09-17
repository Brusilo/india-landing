from pathlib import Path
import re

js = Path('assets/search-v2.js')
text = js.read_text(encoding='utf-8')

text, n = re.subn(
    r"  function dateField\(caption,value\)\{.*?\n  \}\n\n  function paxField",
    '''  function dateField(caption,value){
    return '<div class="v2-field v2-field--date '+(value?'has-value':'')+'" data-role="date">'+
      '<button type="button" class="v2-trigger" data-trigger="date" aria-haspopup="dialog"><span class="v2-caption">'+esc(caption)+'</span><span class="v2-value">'+esc(value||caption)+'</span></button><div class="v2-calendar" hidden></div></div>';
  }

  function paxField''',
    text,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit('dateField patch failed')

text, n = re.subn(
    r"  function paxField\(caption\)\{.*?\n  \}\n\n  function renderForm",
    '''  function paxField(caption){
    return '<div class="v2-field v2-field--always-caption v2-field--pax" data-role="pax">'+
      '<button type="button" class="v2-trigger" data-trigger="pax" aria-haspopup="dialog"><span class="v2-caption">'+esc(caption)+'</span><span class="v2-value">'+esc(travellerValue())+'</span></button><div class="v2-popover" hidden></div></div>';
  }

  function renderForm''',
    text,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit('paxField patch failed')

text, n = re.subn(
    r"  function bindCalendar\(\)\{.*?\n  \}\n\n  function renderGuestPopover",
    '''  function bindCalendar(){
    const field=form.querySelector('.v2-field--date');if(!field)return;
    const trigger=field.querySelector('[data-trigger="date"]'),box=field.querySelector('.v2-calendar');
    trigger.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      const wasHidden=box.hidden;
      closeOverlays(box);
      if(wasHidden){
        const s=states[mode],focusDate=mode==='hotel'?(s.start||today):(s.date||today);
        calendarView=new Date(focusDate.getFullYear(),focusDate.getMonth(),1);
        renderCalendar(box);box.hidden=false;
      }else box.hidden=true;
    });
    box.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      const nav=e.target.closest('.cal-nav');
      if(nav){calendarView=new Date(calendarView.getFullYear(),calendarView.getMonth()+Number(nav.dataset.step),1);renderCalendar(box);return}
      const day=e.target.closest('.cal-day');
      if(!day||day.disabled)return;
      const chosen=parseIso(day.dataset.date),s=states[mode];
      if(mode==='hotel'){
        if(!s.start||s.end||chosen<=s.start){s.start=chosen;s.end=null}
        else{s.end=chosen}
      }else{s.date=chosen}
      field.classList.add('has-value');
      field.querySelector('.v2-value').textContent=mode==='hotel'?formatRange(s.start,s.end):formatSingle(s.date);
      renderCalendar(box);
      if(mode!=='hotel'||s.end)box.hidden=true;
      renderHints();
    });
  }

  function renderGuestPopover''',
    text,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit('bindCalendar patch failed')

text, n = re.subn(
    r"  function bindPax\(\)\{.*?\n  \}\n\n  function bindSwap",
    '''  function bindPax(){
    const field=form.querySelector('.v2-field--pax');if(!field)return;
    const trigger=field.querySelector('[data-trigger="pax"]'),box=field.querySelector('.v2-popover');
    trigger.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      const wasHidden=box.hidden;closeOverlays(box);
      if(wasHidden){renderGuestPopover(box);box.hidden=false}else box.hidden=true;
    });
    box.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      const step=e.target.closest('[data-step]');
      if(step){
        const s=states[mode],delta=Number(step.dataset.step);
        if(step.dataset.person==='adult')s.adults=Math.max(1,Math.min(9-s.children,s.adults+delta));
        else s.children=Math.max(0,Math.min(9-s.adults,s.children+delta));
        field.querySelector('.v2-value').textContent=travellerValue();renderGuestPopover(box);return;
      }
      const cab=e.target.closest('[data-cabin]');
      if(cab){states[mode].cabin=cab.dataset.cabin;field.querySelector('.v2-value').textContent=travellerValue();renderGuestPopover(box)}
    });
  }

  function bindSwap''',
    text,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit('bindPax patch failed')

js.write_text(text, encoding='utf-8')

css = Path('assets/search-v2.css')
c = css.read_text(encoding='utf-8')
marker = '.search-v2 .v2-field--interactive { cursor: pointer; text-align: left; }'
addition = '''
.search-v2 .v2-trigger {
  width: 100%;
  min-width: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  text-align: left;
  color: inherit;
}
'''
if addition.strip() not in c:
    if marker not in c:
        raise SystemExit('CSS trigger marker not found')
    c = c.replace(marker, marker + '\n' + addition, 1)
css.write_text(c, encoding='utf-8')

places = Path('assets/search-places.js')
p = places.read_text(encoding='utf-8')
replacements = [
    (
        "const search=normalize([ru,en,hi,iata,aliases,C[country].ru,C[country].en,C[country].hi].join(' '));",
        "const search=normalize([ru,en,hi,aliases,C[country].ru,C[country].en,C[country].hi].join(' '));",
    ),
    (
        "function display(p,l=lang()){return {name:p.name[l]||p.name.en,meta:[countryName(p.country,l),p.iata.join(', ')].filter(Boolean).join(' · ')}}",
        "function display(p,l=lang()){return {name:p.name[l]||p.name.en,meta:countryName(p.country,l)}}",
    ),
    (
        "const fields=[p.name.ru,p.name.en,p.name.hi,p.canonical,...p.iata,...p.aliases].map(normalize).filter(Boolean);",
        "const fields=[p.name.ru,p.name.en,p.name.hi,p.canonical,...p.aliases.filter(a=>!/^\\w{3}$/.test(a)||a!==a.toUpperCase())].map(normalize).filter(Boolean);",
    ),
    (
        "    if(best===99 && p.search.includes(q))best=.42;\n",
        "",
    ),
]
for old, new in replacements:
    if old not in p:
        raise SystemExit(f'place search marker not found: {old[:70]}')
    p = p.replace(old, new, 1)
places.write_text(p, encoding='utf-8')

for name in ['index.html', 'index-en.html', 'index-hi.html']:
    path = Path(name)
    html = path.read_text(encoding='utf-8')
    css_link = '<link rel="stylesheet" href="assets/search-v2.css">'
    js_link = '<script src="assets/search-v2.js"></script>'
    if css_link not in html:
        if '</head>' not in html:
            raise SystemExit(f'head marker not found in {name}')
        html = html.replace('</head>', css_link + '\n</head>', 1)
    if js_link not in html:
        if '</body>' not in html:
            raise SystemExit(f'body marker not found in {name}')
        html = html.replace('</body>', js_link + '\n</body>', 1)
    path.write_text(html, encoding='utf-8')
