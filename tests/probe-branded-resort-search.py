"""Validate public resort selection in the actual Tutu x Travelata search.

Uses only public search URLs; never books, logs in or sends payment data.
Stores rendered input values and screenshots to distinguish real resort
selection from a generic country search shell.
"""
import json,subprocess,sys
from pathlib import Path
from urllib.parse import urlsplit,urlunsplit,parse_qsl,urlencode
from playwright.sync_api import sync_playwright

ROOT=Path(sys.argv[1]).resolve();OUT=Path(sys.argv[2]);OUT.mkdir(parents=True,exist_ok=True)
js=r"""
const fs=require('fs'),vm=require('vm'),ctx={window:{},URLSearchParams};
vm.runInNewContext(fs.readFileSync('assets/tour-catalog.js','utf8'),ctx);
const t=new Date();t.setDate(t.getDate()+10);
const date=[t.getFullYear(),String(t.getMonth()+1).padStart(2,'0'),String(t.getDate()).padStart(2,'0')].join('-');
const state={departure:'moscow',destination:'russia',date,nightsMin:7,nightsMax:14,adults:1};
console.log(ctx.window.TUTU_TOURS.build(state).url);
"""
baseline=subprocess.check_output(['node','-e',js],cwd=ROOT,text=True).strip()
# Public Travelata constructor lists Murmansk toCity=1726 in Russia=76.
# Distinct hypotheses: co-branded query should control whether the city
# is treated as a country, city or resort. The hash selector may be toCity.
config=[
 ('country-hash-toCity',76,'country','Россия','toCity'),
 ('resort-query-hash-toCity',1726,'resort','Мурманск','toCity'),
 ('city-query-hash-toCity',1726,'city','Мурманск','toCity'),
 ('resort-query-hash-toResort',1726,'resort','Мурманск','toResort'),
 ('country-hash-toResort',76,'country','Россия','toResort')
]
def make_url(item):
  _,id,kind,text,hashkey=item
  u=urlsplit(baseline)
  q=dict(parse_qsl(u.query));q.update(arrival_id=str(id),arrival_type=kind,arrival_text=text)
  h=dict(parse_qsl(u.fragment.removeprefix('?')));h[hashkey]='1726';h.pop('sid',None)
  return urlunsplit((u.scheme,u.netloc,u.path,urlencode(q), '?'+urlencode(h)))

cases=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(args=['--no-sandbox'])
 for name,identifier,kind,txt,hfield in config:
  url=make_url((name,identifier,kind,txt,hfield))
  page=browser.new_page(viewport={'width':1280,'height':850},locale='ru-RU')
  entry={'name':name,'url':url,'query_id':identifier,'type':kind,'hash_field':hfield}
  try:
   response=page.goto(url,wait_until='domcontentloaded',timeout=23000)
   page.wait_for_timeout(9000)
   inputs=page.locator('input').evaluate_all(
     "(xs)=>xs.slice(0,30).map(x=>({v:x.value,p:x.placeholder})).filter(x=>x.v)")
   body=page.locator('body').inner_text(timeout=3000)
   url_state=dict(parse_qsl(urlsplit(page.url).fragment.removeprefix('?')))
   entry.update(http=response.status if response else None,
     inputs=inputs,body_sample=body[:500],final_url=page.url,
     final_hash_keys=list(url_state.keys()),
     rendered_city=any('Мурманск' in x['v'] for x in inputs),
     rendered_country=any('Россия'==x['v'] for x in inputs),
     sid_generated=bool(url_state.get('sid')))
  except Exception as exc:
   entry['error']=repr(exc)[:850]
  finally:
   try:page.screenshot(path=str(OUT/(name+'.png')),timeout=7000)
   except Exception:pass
   page.close()
  cases.append(entry)
  print('RESORT SEARCH',name,'HTTP',entry.get('http'),
    'MURMANSK_INPUT',entry.get('rendered_city'),
    'RUSSIA_INPUT',entry.get('rendered_country'),
    'SID',entry.get('sid_generated'),
    'ERR',entry.get('error'),flush=True)
 browser.close()
(OUT/'resort-search-variants.json').write_text(json.dumps(cases,ensure_ascii=False,indent=2),encoding='utf-8')
