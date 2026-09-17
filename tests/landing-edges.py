"""Additional invalid-input, gesture, resize and artwork regression checks."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,sys,datetime
from fixture import load
root=Path(sys.argv[1]);out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True);baseline=Path(sys.argv[3]) if len(sys.argv)>3 else None
results=[]
def ok(x,what):
 assert x,what
 results.append(what)
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for lang,file in [('ru','index.html'),('en','index-en.html'),('hi','index-hi.html')]:
  pg=b.new_page(viewport={'width':390,'height':900},has_touch=True);missing,errors=load(pg,root,file)
  # No internal exception should leak from incomplete or identical-city forms.
  pg.locator('.v2-submit').click();ok(len(pg.evaluate('window.__qaAlerts'))==1,lang+' empty form friendly validation')
  for role in ['from','to']:
   pg.locator(f'[data-role="{role}"] input').fill('Moscow')
  pg.locator('[data-trigger="date"]').click();pg.locator('.cal-day:not([disabled])').first.click()
  pg.locator('.v2-submit').click();ok(len(pg.evaluate('window.__qaAlerts'))==2,lang+' identical cities validation')
  pg.locator('[data-role="from"] input').fill('<img src=x onerror=alert(99)>');ok(pg.locator('.search-suggest img').count()==0,lang+' injection not interpreted')
  pg.locator('.v2-submit').click()
  ok(pg.evaluate('window.__qaNavigations.at(-1)')=='https://www.tutu.ru/',lang+' noncity markup falls back to home')
  # Preserve chosen values across responsive breakpoint changes.
  inp=pg.locator('[data-role="from"] input');inp.fill('Delhi');pg.locator('[data-role="from"] [data-place-id="in-delhi"]').click()
  before=pg.locator('.search-v2').inner_text()
  pg.set_viewport_size({'width':1440,'height':900});pg.wait_for_timeout(60)
  ok(inp.get_attribute('data-place-id')=='in-delhi',lang+' city retained on desktop resize')
  ok(pg.locator('.mobile-menu-toggle').count()==0,lang+' original desktop header restored')
  pg.set_viewport_size({'width':390,'height':900});pg.wait_for_timeout(60)
  ok(pg.locator('.search-v2').inner_text()==before,lang+' form retained on mobile resize')
  # Actual touch moves must scroll cards without opening them.
  cdp=pg.context.new_cdp_session(pg)
  for name in ['routes','hotels']:
   row=pg.locator('#'+name+'-row');row.scroll_into_view_if_needed();rect=row.bounding_box();y=max(10,min(890,rect['y']+70))
   pg.evaluate('window.__qaNavigations=[]')
   cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':330,'y':y}]})
   for x in [300,270,240,210,180,150,120,90]:
    cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x,'y':y}]});pg.wait_for_timeout(20)
   cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});pg.wait_for_timeout(170)
   ok(row.evaluate('(e)=>e.scrollLeft')>0,lang+' '+name+' actual touch swipe')
   ok(not pg.evaluate('window.__qaNavigations'),lang+' swipe does not click a card')
  ok(not errors,lang+' no edge-case runtime exceptions');pg.close()
  # All card destinations are well-formed; special combined cards use explicit home fallback.
  pg=b.new_page(viewport={'width':1440,'height':1000});load(pg,root,file)
  for card in pg.locator('.card[role="link"]').all():
   ok(card.get_attribute('data-href').startswith('https://'),lang+' card URL')
  for id in ['r6','r7']:
   ok(pg.locator(f'[data-cta="route_{id}_combined"]').get_attribute('data-href')=='https://www.tutu.ru/',lang+' combined route safe fallback')
  # Desktop ticket moves by exactly 40px; public links remain hit-testable.
  if baseline:
   old=b.new_page(viewport={'width':1440,'height':1000});load(old,baseline,file)
   y0=old.locator('.section-decor--ticket').bounding_box()['y'];y1=pg.locator('.section-decor--ticket').bounding_box()['y'];ok(abs(y0-y1-40)<.1,lang+' ticket lifted exactly 40px');old.close()
  for selector in ['#routes .see-all','#hotels .see-all']:
   link=pg.locator(selector);link.scroll_into_view_if_needed();rect=link.bounding_box()
   hit=pg.evaluate('([x,y])=>Boolean(document.elementFromPoint(x,y)?.closest("a.see-all"))',[rect['x']+rect['width']/2,rect['y']+rect['height']/2])
   ok(hit,lang+' all-results link clickable')
  if lang=='ru':
   pg.locator('#routes').scroll_into_view_if_needed();pg.screenshot(path=str(out/'desktop-ticket-v25.png'))
  pg.close()
 b.close()
(out/'edge-results.json').write_text(json.dumps({'assertions':len(results),'allPassed':True,'checks':results},indent=2));print('PASS',len(results),'edge assertions')
