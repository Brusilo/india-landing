"""Offline Chromium interaction/layout regression tests.
Run: python tests/landing-browser.py SITE_ROOT OUTPUT_DIR [widths-comma-separated]
Requires playwright and Chromium. Public navigation is recorded, not executed.
"""
import json, sys, datetime
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from playwright.sync_api import sync_playwright
from fixture import load
root=Path(sys.argv[1]).resolve();out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
widths=list(map(int,sys.argv[3].split(','))) if len(sys.argv)>3 else [320,360,390,414,600,768,1024,1101,1280,1440]
checks=[];failures=[];scenario_count=0
now=datetime.date.today();one=now+datetime.timedelta(days=1);two=now+datetime.timedelta(days=2)
def check(condition,message):
 checks.append(message)
 if not condition:raise AssertionError(message)
def date(page,day):
 target=f'.cal-day[data-date="{day.isoformat()}"]'
 for _ in range(12):
  if page.locator(target).count():page.locator(target).click();return
  page.locator('.cal-nav[data-step="1"]').click()
 raise AssertionError('Date not found '+str(day))
def pick(page,role,text,city):
 inp=page.locator(f'[data-role="{role}"] input');inp.fill(text)
 item=page.locator(f'[data-role="{role}"] .suggest-item[data-place-id="{city}"]')
 check(item.count()==1,'suggestion '+text);item.click()
 check(inp.get_attribute('data-place-id')==city,'selected city '+city)
def reset(page):page.evaluate('window.__qaNavigations=[];window.__qaAlerts=[]')
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for lang,file in [('ru','index.html'),('en','index-en.html'),('hi','index-hi.html')]:
  for width in widths:
   pg=browser.new_page(viewport={'width':width,'height':900},has_touch=width<=1100)
   missing,errors=load(pg,root,file)
   prefix=f'{lang}/{width}'
   try:
    check(not missing,prefix+' local assets exist')
    check(not errors,prefix+' no initial JavaScript errors')
    check(pg.evaluate('[...document.images].every(i=>i.complete&&i.naturalWidth>0)'),prefix+' images decoded')
    check(pg.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),prefix+' no horizontal document scroll')
    check(pg.locator('#routes .head-actions').is_visible()==(width>1100),prefix+' responsive header buttons')
    check(pg.locator('.search-hints-v2').is_visible()==(width>1100),prefix+' responsive quick chips')
    for index,mode in enumerate(['hotel','flight','train','bus']):
     pg.locator('.transport button').nth(index).click();reset(pg);scenario_count+=1
     role='destination' if mode=='hotel' else 'from';inp=pg.locator(f'[data-role="{role}"] input')
     styles=pg.evaluate("""() => {const v=document.querySelector('.v2-field--date .v2-value'),i=document.querySelector('.v2-input');const a=getComputedStyle(v),b=getComputedStyle(i,'::placeholder');return [a.color,b.color,a.fontSize,b.fontSize,a.fontWeight,b.fontWeight]}""")
     check(styles[0]==styles[1] and styles[2]==styles[3] and styles[4]==styles[5],prefix+'/'+mode+' empty date placeholder')
     inp.click();pg.wait_for_timeout(70)
     check(pg.locator(f'[data-role="{role}"] .suggest-item').count()==6,prefix+'/'+mode+' initial six cities')
     check(pg.locator(f'[data-role="{role}"] .search-suggest').is_visible(),prefix+'/'+mode+' suggestions stay open')
     check(inp.get_attribute('aria-expanded')=='true',prefix+'/'+mode+' combobox expanded')
     if mode=='hotel':pick(pg,'destination','Adler','ru-adler')
     elif mode=='flight':
      pick(pg,'from','New Delhi','in-delhi');pick(pg,'to','\u043c\u043e\u0441\u043a\u0432\u0430','ru-moscow')
     else:
      pick(pg,'from','\u092e\u0949\u0938\u094d\u0915\u094b','ru-moscow');pick(pg,'to','St Petersburg','ru-saint-petersburg')
      pg.locator('.v2-swap').click();check(pg.locator('[data-role="from"] input').get_attribute('data-place-id')=='ru-saint-petersburg',prefix+'/'+mode+' swap');pg.locator('.v2-swap').click()
     pg.locator('[data-trigger="date"]').click()
     date(pg,one)
     if mode=='hotel':
      check(pg.locator('.v2-calendar').is_visible(),prefix+' hotel waits for checkout');date(pg,two)
     check(pg.locator('.v2-calendar').is_hidden(),prefix+'/'+mode+' calendar closes after complete selection')
     pg.locator('[data-trigger="pax"]').click()
     pg.locator('[data-person="child"][data-step="1"]').click()
     pg.locator('[data-child-age="0"]').select_option('6')
     cancelled=pg.evaluate("() => {const e=new MouseEvent('click',{bubbles:true,cancelable:true});document.querySelector('[data-child-age]').dispatchEvent(e);return e.defaultPrevented}")
     check(cancelled is False,prefix+'/'+mode+' native child age selector not cancelled')
     if mode=='flight':pg.locator('[data-cabin="business"]').click()
     pg.locator('[data-trigger="pax"]').click();pg.locator('.v2-submit').click()
     nav=pg.evaluate('window.__qaNavigations');check(len(nav)==1,prefix+'/'+mode+' one navigation')
     check(not pg.evaluate('window.__qaAlerts'),prefix+'/'+mode+' valid form has no error')
     q=parse_qs(urlparse(nav[0]).query)
     if mode=='flight':
      check(q['class']==['C'] and q['travelers']==['1.6'],prefix+' flight cabin and ages')
      check(q['route[0]']==['216-'+one.strftime('%d%m%Y')+'-491'],prefix+' numeric route and date')
     elif mode=='train':check(q['date']==[one.strftime('%d.%m.%Y')] and q['travelers']==['1.6'],prefix+' train date and ages')
     elif mode=='hotel':check(q['room[0]']==['2.6'] and q['check_out']==[two.isoformat()],prefix+' hotel child ages and range')
     elif mode=='bus':check(q['date']==[one.strftime('%d.%m.%Y')] and q['travelers']==['1.6'] and q['amount']==['2'] and q['from']==['1447874'] and q['to']==['1447624'],prefix+' bus city IDs date and ages')
     # Exact typed names must work without clicking a suggestion, including Enter.
     reset(pg)
     if mode=='hotel':pg.locator('[data-role="destination"] input').fill('\u092e\u0949\u0938\u094d\u0915\u094b')
     else:
      pg.locator('[data-role="from"] input').fill('Moscow');pg.locator('[data-role="to"] input').fill('St Petersburg')
     pg.locator(f'[data-role="{role}"] input').press('Enter')
     nav=pg.evaluate('window.__qaNavigations');check(len(nav)==1 and nav[0]!='https://www.tutu.ru/',prefix+'/'+mode+' Enter accepts exact typed cities')
     # Edited values must invalidate a stale city selection and fall back safely.
     reset(pg);pg.locator(f'[data-role="{role}"] input').fill('Unknown_city_xyz_123')
     check(not pg.locator(f'[data-role="{role}"] input').get_attribute('data-place-id'),prefix+'/'+mode+' stale city ID cleared')
     pg.locator('.v2-submit').click();check(pg.evaluate('window.__qaNavigations')==['https://www.tutu.ru/'],prefix+'/'+mode+' unknown city fallback')
     # Arrow keys + Enter select a city; Escape closes without accidentally navigating.
     reset(pg);inp=pg.locator(f'[data-role="{role}"] input');inp.fill('Moscow');inp.press('ArrowDown');inp.press('Enter')
     check(inp.get_attribute('data-place-id')=='ru-moscow' and not pg.evaluate('window.__qaNavigations'),prefix+'/'+mode+' keyboard selection')
     inp.click();inp.press('Escape');check(pg.locator(f'[data-role="{role}"] .search-suggest').is_hidden(),prefix+'/'+mode+' Escape closes')
     check(not errors,prefix+'/'+mode+' no runtime exceptions')
     check(pg.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),prefix+'/'+mode+' no overflow after interactions')
    # Carousel gestures, menu and footer work with compact layouts.
    if width<=1100:
     pg.locator('.mobile-menu-toggle').click();check(pg.locator('.top-nav').is_visible(),prefix+' mobile menu opens');pg.keyboard.press('Escape')
     toggle=pg.locator('.footer-toggle').first;toggle.click();check(toggle.get_attribute('aria-expanded')=='true',prefix+' footer accordion');toggle.click()
    for section in ['routes','hotels']:
     row=pg.locator('#'+section+'-row')
     row.evaluate('(e)=>e.scrollLeft=200');pg.wait_for_timeout(60)
     check(row.evaluate('(e)=>e.scrollLeft')>0,prefix+' '+section+' carousel scroll')
     row.evaluate('(e)=>e.scrollLeft=0')
    check(pg.locator('[data-cta="hotel_h5"] .rating').inner_text()=='9,1',prefix+' Grifon rating')
    check(pg.locator('[data-cta="hotel_h5"]').get_attribute('data-href').startswith('https://hotel.tutu.ru/h_gostevye_'),prefix+' direct hotel link')
    if width in [390,1440]:
     pg.locator('#routes').scroll_into_view_if_needed();pg.screenshot(path=str(out/f'{lang}-{width}-routes.png'))
    print('PASS',prefix,flush=True)
   except Exception as e:
    failures.append({'case':prefix,'error':str(e)});print('FAIL',prefix,str(e),flush=True)
    pg.screenshot(path=str(out/f'FAILED-{lang}-{width}.png'))
   pg.close()
 browser.close()
report={'scenarios':scenario_count,'assertions':len(checks),'layoutCases':len(widths)*3,'failures':failures,'engine':'Chromium offline fixture; outgoing navigation recorded'}
(out/'browser-results.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
if failures:sys.exit(1)
