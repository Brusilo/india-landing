"""Offline visual-only Tours prototype test across EN/RU/HI at 9 viewport widths.

No link from the Tours tab or Tour Search submit. The selected city, nights,
date, and people stay interactive; original search tabs remain functional.
Usage: python tests/tours-browser.py . /tmp/tour-qa
"""
from pathlib import Path
import json, sys
from playwright.sync_api import sync_playwright
from fixture import load

root=Path(sys.argv[1]).resolve()
out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
widths=[320,360,390,600,768,1024,1101,1280,1440]
langs=[('en','index.html'),('ru','index-ru.html'),('hi','index-hi.html')]
failed=[];passed=0

def fits(page,selector,width):
    b=page.locator(selector).first.bounding_box()
    assert b is not None,selector+' not visible'
    assert b['x'] >= -2 and b['x']+b['width']<=width+2,selector+' clipped at '+str(width)

def check(page,lang,width):
    missing,errors=load(page,root,dict(langs)[lang])
    assert not missing,'missing local files '+repr(missing[:5])
    assert not errors,'initial JS errors '+repr(errors[:3])
    tab=page.locator('.transport .tours-tab')
    assert tab.count()==1 and tab.evaluate('el=>el.tagName')=='BUTTON'
    assert tab.get_attribute('href') is None,'Tours tab must have no link'
    tab.click()
    assert page.locator('form.search-v2').get_attribute('data-mode')=='tour'
    assert tab.get_attribute('aria-selected')=='true'
    assert 'is-active' in (tab.get_attribute('class') or '')
    fits(page,'form.search-v2',width)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'),'document overflows viewport'

    c=page.evaluate("""() => ({
       countryOptions:window.TUTU_TOUR_PUBLIC_OPTIONS.countries.length,
       departureOptions:window.TUTU_TOUR_PUBLIC_OPTIONS.departures.length,
       locationOptions:Object.values(window.TUTU_TOUR_PUBLIC_OPTIONS.resorts).reduce((n,a)=>n+a.length,0),
       countries:window.TUTU_TOURS.destinations.filter(d=>d.kind==='country').length,
       locations:window.TUTU_TOURS.destinations.filter(d=>d.kind==='place').length,
       departures:window.TUTU_TOURS.departures.length
    })""")
    assert c['countryOptions']>=70 and c['departureOptions']>=100 and c['locationOptions']>=700,str(c)
    assert c['countries']>=70 and c['locations']>=700 and c['departures']>=100,str(c)

    dest=page.locator('.tour-destination')
    dest.fill('Adler')
    item=page.locator('[data-tour-choice="catalog-place-76-1545"]')
    assert item.count()==1,'Russian resort Adler appears from provider catalogue'
    item.click()
    assert dest.input_value()!='','selected resort fills field'
    dest.fill('Goa')
    assert page.locator('[data-tour-choice="goa"]').count()==1
    page.locator('[data-tour-choice="goa"]').click()

    page.locator('[data-tour-trigger="departure"]').click()
    search=page.locator('.tour-departure-filter')
    assert search.count()==1
    search.fill('Kazan')
    assert page.locator('.tour-panel--departure [data-tour-dep="kazan"]').count()==1
    page.locator('.tour-panel--departure [data-tour-dep="kazan"]').click()

    page.locator('[data-tour-trigger="nights"]').click()
    fits(page,'.tour-panel--nights',width)
    page.locator('[data-tour-range="min"]').fill('9')
    assert page.locator('[data-tour-min]').inner_text()=='9'
    page.locator('[data-tour-trigger="date"]').click()
    fits(page,'.tour-panel--date',width)
    page.locator('.tour-days [data-tour-day]:not([disabled])').first.click()

    page.locator('[data-tour-trigger="people"]').click()
    fits(page,'.tour-panel--people',width)
    page.locator('[data-tour-person="child"][data-tour-step="1"]').click()
    page.locator('[data-tour-child-age="0"]').select_option('7')
    page.evaluate('window.__qaNavigations=[]')
    original=page.url
    page.locator('.tour-submit').click()
    assert page.url==original,'Tour Search unexpectedly navigated away'
    assert page.evaluate('window.__qaNavigations')==[],'search navigation should remain disabled'
    assert page.locator('.tour-preview-message[role="status"]').is_visible()
    assert not errors,'JS errors '+repr(errors[:3])
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'),'overflow after submit'

    # Other search modes must still work after entering/exiting visual tab.
    page.locator('.transport button:not(.tours-tab)').nth(1).click()
    assert page.locator('form.search-v2').get_attribute('data-mode')=='flight'
    page.locator('.transport .tours-tab').click()
    assert page.locator('form.search-v2').get_attribute('data-mode')=='tour'
    assert not errors,'errors after mode switch '+repr(errors[:3])

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,args=['--no-sandbox'])
    for lang,filename in langs:
        for width in widths:
            key=f'{lang}-{width}'
            page=browser.new_page(viewport={'width':width,'height':900},has_touch=width<600)
            page.on('dialog',lambda dialog:dialog.accept())
            page.set_default_timeout(8000)
            try:
                check(page,lang,width)
                if width in (390,1440):
                    page.screenshot(path=str(out/(key+'.png')))
                passed+=1;print('PASS',key,flush=True)
            except Exception as exc:
                failed.append({'case':key,'error':str(exc)})
                page.screenshot(path=str(out/('FAILED-'+key+'.png')))
                print('FAIL',key,str(exc),flush=True)
            finally:page.close()
    browser.close()
summary={'passed':passed,'total':passed+len(failed),'failures':failed}
(out/'tour-results.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
print('SUMMARY',json.dumps(summary,ensure_ascii=False),flush=True)
if failed:sys.exit(1)
