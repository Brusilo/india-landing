"""Cross-browser responsive smoke check for India landing Tours.
Runs in Chromium, Firefox and WebKit on Linux to catch engine differences.
It is not a substitute for physical iPhone and Android acceptance tests.
Run: python tests/tours-cross-browser.py . /tmp/tours-cross-browser
"""
import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright
from fixture import load

root=Path(sys.argv[1]).resolve()
out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
widths=[375,768,1440]
langs={'en':'index.html','ru':'index-ru.html','hi':'index-hi.html'}
errors=[]
passes=[]
def assert_visible_and_fit(page,selector,width):
    box=page.locator(selector).first.bounding_box()
    assert box and box['x']>=-2 and box['x']+box['width']<=width+2,selector+' outside viewport '+str(box)

def hittable(page,selector):
    page.locator(selector).scroll_into_view_if_needed()
    return page.locator(selector).evaluate('''el=>{
      const r=el.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
      const top=document.elementFromPoint(x,y);
      return Boolean(top&&(el===top||el.contains(top)));
    }''')

with sync_playwright() as pw:
    for engine in ('chromium','firefox','webkit'):
        browser=getattr(pw,engine).launch(headless=True,args=['--no-sandbox'] if engine=='chromium' else [])
        for lang,file in langs.items():
            for width in widths:
                label=engine+'-'+lang+'-'+str(width)
                pg=browser.new_page(viewport={'width':width,'height':900},has_touch=width<600)
                pg.set_default_timeout(7500)
                pg.on('dialog',lambda dialog:dialog.accept())
                missing,js_errors=load(pg,root,file)
                try:
                    assert not missing,'missing local assets '+repr(missing)
                    assert not js_errors,'initial JS errors '+repr(js_errors)
                    pg.locator('.transport .tours-tab').click()
                    assert pg.locator('form.search-v2').get_attribute('data-mode')=='tour'
                    assert_visible_and_fit(pg,'form.search-v2',width)
                    assert pg.evaluate('document.documentElement.scrollWidth<=innerWidth+2'),'document horizontal scrolling'
                    inp=pg.locator('.tour-destination')
                    inp.fill('Murmansk')
                    pg.locator('.tour-panel--destination [data-tour-choice="murmansk"]').click()
                    pg.locator('[data-tour-trigger="date"]').click()
                    assert_visible_and_fit(pg,'.tour-panel--date',width)
                    pg.keyboard.press('Escape')
                    pg.locator('[data-tour-trigger="nights"]').click()
                    assert_visible_and_fit(pg,'.tour-panel--nights',width)
                    pg.locator('[data-tour-range="min"]').fill('9')
                    assert pg.locator('[data-tour-min]').inner_text()=='9'
                    pg.locator('[data-tour-trigger="people"]').click()
                    assert_visible_and_fit(pg,'.tour-panel--people',width)
                    pg.locator('[data-tour-person="child"][data-tour-step="1"]').click()
                    pg.locator('[data-tour-child-age="0"]').select_option('10')
                    assert hittable(pg,'.tour-submit'),'submit button is blocked by an overlay'
                    pg.locator('.tour-submit').click()
                    nav=pg.evaluate('window.__qaNavigations')
                    assert nav==[],'visual-only prototype unexpectedly navigated '+repr(nav)
                    assert pg.locator('.tour-preview-message[role="status"]').is_visible(), 'demo notice on submit'
                    assert pg.locator('.transport .tours-tab').get_attribute('href') is None, 'Tours tab must not link'
                    pg.locator('.transport button').nth(1).click()
                    assert pg.locator('form.search-v2').get_attribute('data-mode')=='flight'
                    pg.locator('.transport .tours-tab').click()
                    assert pg.evaluate('document.documentElement.scrollWidth<=innerWidth+2'),'overflow after tab switch'
                    assert not js_errors,'runtime JS errors '+repr(js_errors)
                    if width in (375,1440):
                        pg.screenshot(path=str(out/(label+'.png')))
                    passes.append(label);print('PASS',label,flush=True)
                except Exception as exc:
                    errors.append({'case':label,'error':str(exc)})
                    print('FAIL',label,str(exc),flush=True)
                    pg.screenshot(path=str(out/('FAILED-'+label+'.png')))
                finally: pg.close()
        browser.close()
report={
 'engine_note':'Chromium, Firefox, WebKit on Linux; WebKit approximates Safari rendering but is not iOS Safari.',
 'passed':len(passes),'total':len(passes)+len(errors),'failures':errors
}
(out/'cross-browser-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('SUMMARY',json.dumps(report,ensure_ascii=False,indent=2))
if errors:sys.exit(1)
