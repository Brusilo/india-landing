"""Verify Tours matches native flight fields exactly and stays usable in 3 locales.

No real partner visits: fixture intercepts window.location.assign and collects URLs.
"""
from pathlib import Path
from urllib.parse import urlparse,parse_qs
import json,sys
from playwright.sync_api import sync_playwright
from fixture import load

root=Path(sys.argv[1]).resolve()
out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
language_files={'en':'index.html','ru':'index-ru.html','hi':'index-hi.html'}
widths=(320,360,390,600,768,899,900,1024,1280,1440)
results=[];failures=[]
def computed(page,query):
  return page.locator(query).first.evaluate("""e=>{
    const s=getComputedStyle(e),r=e.getBoundingClientRect();
    return {height:r.height,width:r.width,left:r.left,top:r.top,
      background:s.backgroundColor,radius:s.borderRadius,padding:s.padding,
      borderBottom:s.borderBottomWidth,color:s.color,fontSize:s.fontSize,
      fontWeight:s.fontWeight,shadow:s.boxShadow,display:s.display};
  }""")
def verify(page,lang,width):
  missing,errors=load(page,root,language_files[lang])
  assert not missing,'local assets missing '+str(missing[:4])
  assert not errors,'initial JS exceptions '+str(errors[:4])
  flightField=computed(page,'form.search-v2 .v2-field--place')
  flightInput=computed(page,'form.search-v2 .v2-input')
  flightForm=computed(page,'form.search-v2')
  f=page.locator('form.search-v2 .v2-input').first
  f.click()
  flightSuggestion=computed(page,'form.search-v2 .search-suggest')
  flightItem=computed(page,'form.search-v2 .search-suggest .suggest-item')
  page.locator('.transport .tours-tab').click()
  form=page.locator('form.search-v2')
  assert form.get_attribute('data-mode')=='tour'
  assert page.locator('.transport .tours-tab').get_attribute('href') is None
  assert page.locator('.tour-departure-input').input_value()=='','origin should be blank initially'
  assert page.locator('.tour-destination').input_value()=='','destination should be blank initially'
  assert 'has-value' not in (page.locator('.tour-cell--date').get_attribute('class') or '')
  assert page.locator('.tour-cell--date .v2-value').inner_text() in (
      'Когда','Departure','कब'), 'date must show placeholder not an actual date'
  assert '7' in page.locator('.tour-cell--nights .v2-value').inner_text()
  assert '1' in page.locator('.tour-cell--people .v2-value').inner_text()
  tourField=computed(page,'.tour-cell--departure')
  tourInput=computed(page,'.tour-departure-input')
  tourForm=computed(page,'form.search-v2')
  assert abs(flightField['height']-tourField['height'])<=1,(flightField,tourField)
  assert abs(flightForm['width']-tourForm['width'])<=1,(flightForm,tourForm)
  for key in ('background','padding','borderBottom'):
    assert flightField[key]==tourField[key],('field '+key,flightField,tourField)
  for key in ('fontSize','fontWeight','color'):
    assert flightInput[key]==tourInput[key],('input '+key,flightInput,tourInput)
  # Three destination-only shortcuts shown only on desktop.
  chips=page.locator('.search-hints-v2 .quick-chip-v2')
  assert chips.count()==3,'expected only Kaliningrad Baikal Turkey'
  keys=chips.evaluate_all("xs=>xs.map(e=>e.dataset.tourChoice)")
  assert keys==['kaliningrad','baikal','turkey'],keys
  if width<=1100:
    assert not chips.first.is_visible(),'chips must be shown on desktop only'
    assert tourForm['display']=='grid','Tours must match native Tutu responsive grid'
    if width<=599:
      fields=page.locator('form.search-v2 > .v2-field')
      first=fields.nth(0).bounding_box();second=fields.nth(1).bounding_box()
      seam=second['y']-(first['y']+first['height'])
      assert -4<=seam<=2, 'From/To shared mobile card should have no gap: '+str(seam)
      for i in range(1,fields.count()-1):
        a=fields.nth(i).bounding_box();b=fields.nth(i+1).bounding_box()
        assert 5<=b['y']-(a['y']+a['height'])<=9,'wrong 7px phone gap'
    else:
      left=page.locator('.tour-cell--departure').bounding_box()
      right=page.locator('.tour-cell--destination').bounding_box()
      assert abs(left['y']-right['y'])<=1,'tablet From and To must share a row'
  else:
    assert chips.first.is_visible(),'desktop-only chips unexpectedly hidden'
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'),'horizontal overflow'
  # Test native autocomplete popup against the actual Flights popup.
  departure=page.locator('.tour-departure-input')
  departure.fill('Kaz')
  depList=page.locator('.tour-panel--departure')
  assert depList.is_visible(),'departure suggestions not visible'
  assert page.locator('.tour-panel--departure [data-tour-dep="kazan"]').count()==1
  tourSuggestion=computed(page,'.tour-panel--departure')
  tourItem=computed(page,'.tour-panel--departure .suggest-item')
  for key in ('background','radius','padding','shadow'):
    assert flightSuggestion[key]==tourSuggestion[key],('dropdown '+key,flightSuggestion,tourSuggestion)
  for key in ('background','radius','padding'):
    assert flightItem[key]==tourItem[key],('option '+key,flightItem,tourItem)
  page.locator('.tour-panel--departure [data-tour-dep="kazan"]').click()
  assert 'has-value' in (page.locator('.tour-cell--departure').get_attribute('class') or '')
  # Real multilingual matching, including extended city and resort catalogue.
  dest=page.locator('.tour-destination')
  dest.fill('Baikal')
  assert page.locator('.tour-panel--destination [data-tour-choice="baikal"]').count()==1
  page.locator('.tour-panel--destination [data-tour-choice="baikal"]').click()
  date=page.locator('[data-tour-trigger="date"]')
  date.click()
  assert page.locator('.tour-panel--date').is_visible()
  assert page.locator('.tour-panel--date .cal-day:not([disabled])').count()>0
  page.locator('.tour-panel--date .cal-day:not([disabled])').first.click()
  assert 'has-value' in (page.locator('.tour-cell--date').get_attribute('class') or '')
  page.locator('[data-tour-trigger="nights"]').click()
  assert page.locator('.tour-panel--nights').is_visible()
  page.locator('[data-tour-range="min"]').fill('8')
  assert page.locator('[data-tour-min]').inner_text()=='8'
  page.locator('[data-tour-trigger="people"]').click()
  assert page.locator('.tour-panel--people').is_visible()
  page.evaluate('window.__qaNavigations=[]')
  page.locator('.tour-submit').click()
  nav=page.evaluate('window.__qaNavigations')
  assert nav==['https://tours.tutu.ru/rossiya/baikal/iz/33_kazan/'],nav
  # Real country search URL, with a selected city/date, not fabricated presets.
  dest.fill('Turkey')
  page.locator('.tour-panel--destination [data-tour-choice="turkey"]').click()
  page.evaluate('window.__qaNavigations=[]')
  page.locator('.tour-submit').click()
  nav=page.evaluate('window.__qaNavigations')
  assert len(nav)==1 and urlparse(nav[0]).netloc=='web.tutu.travelata.ru',nav
  params=parse_qs(urlparse(nav[0]).query)
  assert params.get('departure')==['29'] and params.get('arrival_id')==['92'],params
  # Chips update only the destination and do not fill unrelated fields.
  if width>=900:
    page.locator('.search-hints-v2 [data-tour-choice="kaliningrad"]').click()
    assert page.locator('.tour-destination').input_value()!=''
    assert page.locator('.tour-departure-input').input_value()!=''
  # Other modes untouched after Tours.
  page.locator('.transport button:not(.tours-tab)').nth(1).click()
  assert page.locator('form.search-v2').get_attribute('data-mode')=='flight'
  assert page.locator('form.search-v2 .v2-input').count()>0
  page.locator('.transport .tours-tab').click()
  assert page.locator('.tour-cell--departure').count()==1
  assert not errors,'runtime JS errors '+str(errors[:5])
  if width in (390,900,1440):
    page.screenshot(path=str(out/(lang+'-'+str(width)+'.png')),full_page=False)

with sync_playwright() as pw:
  browser=pw.chromium.launch(args=['--no-sandbox'])
  for lang in language_files:
    for width in widths:
      label=lang+'-'+str(width)
      page=browser.new_page(viewport={'width':width,'height':900},has_touch=width<900)
      page.set_default_timeout(7000)
      page.on('dialog',lambda dialog:dialog.accept())
      try:
        verify(page,lang,width)
        results.append(label)
        print('PASS',label,flush=True)
      except Exception as ex:
        failures.append({'case':label,'error':str(ex)})
        print('FAIL',label,repr(ex),flush=True)
        try:page.screenshot(path=str(out/('failed-'+label+'.png')),full_page=False)
        except Exception:pass
      finally:page.close()
  browser.close()
summary={'passed':len(results),'total':len(results)+len(failures),'failures':failures}
(out/'style-and-search-results.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
print('SUMMARY',json.dumps(summary,ensure_ascii=False),flush=True)
if failures:sys.exit(1)
