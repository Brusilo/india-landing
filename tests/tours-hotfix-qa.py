"""Tours hotfix acceptance for RU/EN/HI on four device widths, no live booking."""
from pathlib import Path
from urllib.parse import urlparse,parse_qs
import json,sys
from playwright.sync_api import sync_playwright
from fixture import load

root=Path(sys.argv[1]).resolve()
out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
languages={'en':'index.html','ru':'index-ru.html','hi':'index-hi.html'}
widths=(320,390,768,1440)
failures=[];passed=0
with sync_playwright() as pw:
 browser=pw.chromium.launch(args=['--no-sandbox'])
 for lang,filename in languages.items():
  for width in widths:
   key=lang+'-'+str(width)
   page=browser.new_page(viewport={'width':width,'height':900},has_touch=width<600)
   page.set_default_timeout(9000)
   page.on('dialog',lambda dialog:dialog.accept())
   missing,errors=load(page,root,filename)
   try:
    assert not missing,'missing assets '+repr(missing[:3])
    assert not errors,'initial page JS errors '+repr(errors[:2])
    tab=page.locator('.transport .tours-tab')
    assert tab.evaluate('e=>e.tagName')=='BUTTON' and not tab.get_attribute('href')
    original=page.locator('.search-hints-v2 .quick-chip-v2').first.evaluate(
      "e=>({radius:getComputedStyle(e).borderRadius,font:getComputedStyle(e).fontSize,"
      "padding:getComputedStyle(e).padding,weight:getComputedStyle(e).fontWeight,"
      "bg:getComputedStyle(e).backgroundColor})")
    tab.click()
    assert page.locator('form.search-v2').get_attribute('data-mode')=='tour'
    assert page.locator('.search-hints-v2 .quick-chip-v2').count()==6,'expected six native chips'
    assert page.locator('.search-hints-v2 .quick-group-v2').count()==3,'expected three native groups'
    assert page.locator('.tour-hints-winter').count()==0,'extra winter chip row'
    style=page.locator('.search-hints-v2 .quick-chip-v2').first.evaluate(
      "e=>({radius:getComputedStyle(e).borderRadius,font:getComputedStyle(e).fontSize,"
      "padding:getComputedStyle(e).padding,weight:getComputedStyle(e).fontWeight,"
      "bg:getComputedStyle(e).backgroundColor})")
    assert style==original,'Tours chip style differs from Flights '+str((original,style))
    counts=page.evaluate("""()=>({
      countries:window.TUTU_TOURS.destinations.filter(d=>d.kind==='country').length,
      departures:window.TUTU_TOURS.departures.length,
      places:window.TUTU_TOURS.destinations.filter(d=>d.kind==='place').length
    })""")
    assert counts['countries']>=70 and counts['departures']>=100 and counts['places']>=700,str(counts)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'),'page horizontal overflow'
    # Search box must search the real extended resort catalogue.
    field=page.locator('.tour-destination')
    field.fill('Adler')
    item=page.locator('[data-tour-choice="catalog-place-76-1545"]')
    assert item.count()==1,'Adler not found through autocomplete'
    item.click()
    page.evaluate('window.__qaNavigations=[]')
    page.locator('.tour-submit').click()
    nav=page.evaluate('window.__qaNavigations')
    assert len(nav)==1,'search button did not navigate for resort: '+str(nav)
    u=urlparse(nav[0]);q=parse_qs(u.query);h=parse_qs(u.fragment.lstrip('?'))
    assert u.netloc=='web.tutu.travelata.ru' and q.get('arrival_id')==['76'] and h.get('toCity')==['1545'],'wrong resort search URL'
    assert 'sid' not in h,'session must be provider-generated'
    # Search must work for curated country, and its origin must be correct.
    page.locator('[data-tour-trigger="departure"]').click()
    page.locator('.tour-departure-filter').fill('Moscow')
    page.locator('[data-tour-dep="moscow"]').click()
    field.fill('Turkey')
    page.locator('[data-tour-choice="turkey"]').click()
    page.evaluate('window.__qaNavigations=[]')
    page.locator('.tour-submit').click()
    nav=page.evaluate('window.__qaNavigations')
    assert len(nav)==1,'country search button did not navigate'
    params=parse_qs(urlparse(nav[0]).query)
    assert params.get('departure')==['2'] and params.get('arrival_id')==['92'],'incorrect departure/country'
    # Unsupported curated resort opens the exact verified Tutu page, not null.
    field.fill('Goa')
    page.locator('[data-tour-choice="goa"]').click()
    page.evaluate('window.__qaNavigations=[]')
    page.locator('.tour-submit').click()
    assert page.evaluate('window.__qaNavigations')==['https://tours.tutu.ru/strana/india/kurort/goa/'],'curated resort fallback broken'
    # Other search modes still work after switching.
    page.locator('.transport button:not(.tours-tab)').nth(1).click()
    assert page.locator('form.search-v2').get_attribute('data-mode')=='flight','flight mode broken'
    page.locator('.transport .tours-tab').click()
    assert page.locator('.search-hints-v2 .quick-chip-v2').count()==6,'quick chips disappear after tab switch'
    assert not errors,'JS runtime errors '+repr(errors[:2])
    if width in (390,1440):page.screenshot(path=str(out/(key+'.png')))
    print('PASS',key,flush=True);passed+=1
   except Exception as exc:
    print('FAIL',key,str(exc),flush=True)
    failures.append({'case':key,'error':str(exc)})
    page.screenshot(path=str(out/('FAILED-'+key+'.png')))
   finally:page.close()
 browser.close()
report={'passed':passed,'total':passed+len(failures),'failures':failures}
(out/'hotfix-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('SUMMARY',json.dumps(report,ensure_ascii=False),flush=True)
if failures:sys.exit(1)
