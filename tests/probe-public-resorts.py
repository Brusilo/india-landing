"""Explore only public Travelata link constructor dropdowns in a browser.

This is read-only research. No affiliate links are generated, no bookings or
payments made, and no private endpoints/credentials are used. Never copy
unconfirmed IDs into production just because they appear in a dropdown.
Outputs JSON + a short stdout summary.
"""
from pathlib import Path
import json, sys
from playwright.sync_api import sync_playwright

out=Path(sys.argv[1]) if len(sys.argv)>1 else Path('/tmp/public-resorts')
out.mkdir(parents=True,exist_ok=True)
result={'source':'https://traff.travelata.ru/constructor.php','contexts':[],'notes':[]}
with sync_playwright() as pw:
    browser=pw.chromium.launch(args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':1000},locale='ru-RU')
    try:
        response=page.goto(result['source'],wait_until='domcontentloaded',timeout=28000)
        result['http_status']=response.status if response else None
        page.wait_for_timeout(2600)
        selector_snapshot="""() => Array.from(document.querySelectorAll('select')).map((s,i)=>({
          index:i,name:s.name, value:s.value,
          options:Array.from(s.options).slice(0,1000).map(o=>({id:o.value,name:o.textContent.trim()}))
        }))"""
        result['initial']=page.evaluate(selector_snapshot)
        print('INITIAL',[(s['name'],len(s['options'])) for s in result['initial']],flush=True)
        for name,idx,country in [
            ('toCountry',0,'76'),
            ('toCountry',0,'92'),
            ('defaultCountry',0,'76'),
            ('defaultCountry',0,'92'),
            ('defaultCountry',1,'76'),
            ('countries',0,'76')
        ]:
            nodes=page.locator('select[name="'+name+'"]')
            if nodes.count()<=idx:
                result['notes'].append(f'No select {name}[{idx}]')
                continue
            select=nodes.nth(idx)
            found=select.locator('option[value="'+country+'"]').count()
            if not found:
                result['notes'].append(f'No option {country} in {name}[{idx}]')
                continue
            try:
                select.select_option(country,timeout=3000)
                page.wait_for_timeout(1700)
                snapshot=page.evaluate(selector_snapshot)
                useful={s['name']+'['+str(s['index'])+']':s['options']
                        for s in snapshot if s['name'] in ('resorts','toCity','fromCity','departureCity')}
                key={
                    'country':country,'field':name,'select_index':idx,
                    'available':{k:len(v) for k,v in useful.items()},
                    'values':useful
                }
                result['contexts'].append(key)
                print('COUNTRY',country,name,idx,key['available'],flush=True)
                for prefix,opts in useful.items():
                    filtered=[x for x in opts if any(q in x['name'].lower() for q in
                        ['мурманск','красная полян','сочи','антал','алан','байкал','казань','карел','иркутск','шарм'])]
                    if filtered:print('MATCHING',prefix,filtered[:20],flush=True)
            except Exception as exc:
                result['notes'].append(f'{country} {name}[{idx}]: {repr(exc)[:300]}')
        result['script_sources']=[u.split('?')[0] for u in page.locator('script[src]').evaluate_all(
          '(all)=>all.map(s=>s.src).filter(Boolean)') if 'travelata' in u]
    except Exception as exc:
        result['fatal_error']=repr(exc)[:700]
    finally:
        (out/'public-constructor-browser-options.json').write_text(
            json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
        browser.close()
print('FINAL',json.dumps({'http_status':result.get('http_status'),
    'contexts':len(result['contexts']),'notes':result['notes']},ensure_ascii=False),flush=True)
