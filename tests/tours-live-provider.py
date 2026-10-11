"""Advisory end-to-end probe of Tutu-branded Travelata tour searches.

Runs only public searches using verified example IDs. Does not book or purchase,
cannot prove availability/prices, and records WAF/network limitations explicitly.
Run: python tests/tours-live-provider.py . /tmp/tours-live
"""
from pathlib import Path
from urllib.parse import urlsplit, parse_qs
import json, subprocess, sys
from playwright.sync_api import sync_playwright

root=Path(sys.argv[1]).resolve()
out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
js="""
const fs=require('fs'),vm=require('vm');
const ctx={window:{},URLSearchParams,Date};
vm.runInNewContext(fs.readFileSync('assets/tour-catalog.js','utf8'),ctx);
const d=new Date();d.setDate(d.getDate()+14);
const day=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
for(const [departure,destination] of [['moscow','turkey'],['spb','egypt']]){
  const result=ctx.window.TUTU_TOURS.build({departure,destination,date:day,nightsMin:7,nightsMax:14,adults:1});
  console.log(JSON.stringify({departure,destination,date:day,...result}));
}
"""
items=[json.loads(line) for line in subprocess.check_output(['node','-e',js],cwd=root,text=True).splitlines()]
report={'method':'Live Chromium public search, not a booking or inventory guarantee','cases':[]}
with sync_playwright() as playwright:
    browser=playwright.chromium.launch(args=['--no-sandbox'])
    for item in items:
        page=browser.new_page(viewport={'width':1280,'height':900},locale='ru-RU')
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)[:400]))
        data={
            'departure':item['departure'],
            'destination':item['destination'],
            'requested_date':item['date'],
            'requested_url':item['url'],
            'filtered_url_built':item['filtered'],
            'network':'unknown',
            'live_result_confirmed':False,
        }
        try:
            request=urlsplit(item['url'])
            q=parse_qs(request.query)
            assert q['arrival_id']==(['92'] if item['destination']=='turkey' else ['29'])
            assert q['nights_min']==['7'] and q['nights_max']==['14']
            assert 'sid' not in q
            response=page.goto(item['url'],wait_until='domcontentloaded',timeout=25000)
            page.wait_for_timeout(4500)
            data['http_status']=response.status if response else None
            data['final_url']=page.url
            data['title']=page.title()[:250]
            try:
                body=page.locator('body').inner_text(timeout=4000)
            except Exception:
                body=''
            data['body_preview']=body[:1600]
            data['input_values']=page.locator('input').evaluate_all(
                'els=>els.slice(0,24).map(e=>({placeholder:e.placeholder,value:e.value})).filter(x=>x.placeholder||x.value)')
            data['js_errors']=errors[:5]
            data['network']='reachable' if data['http_status'] and 200<=data['http_status']<400 else 'http_error'
            # A successful page response and the destination visibly selected
            # are the minimum to confirm more than a generic shell page.
            lookfor=('Турция','Turkey') if item['destination']=='turkey' else ('Египет','Egypt')
            matches=any(word.lower() in (body+' '+str(data['input_values'])).lower() for word in lookfor)
            data['destination_visible']=matches
            data['live_result_confirmed']=data['network']=='reachable' and matches
            if data['network']=='reachable' and not matches:
                data['review_note']='Page loaded, but selected destination could not be confirmed from rendered text/inputs'
        except Exception as exc:
            data['error']=str(exc)[:950]
            data['network']='blocked_or_timeout'
        finally:
            try:
                page.screenshot(path=str(out/(item['destination']+'-travelata.png')),full_page=False,timeout=8000)
            except Exception as exc:
                data['screenshot_error']=str(exc)[:220]
            report['cases'].append(data)
            print('TRAVELATA',item['departure'],item['destination'],'network',data['network'],
                  'status',data.get('http_status'),'destination_visible',data.get('destination_visible'),
                  'final_url',data.get('final_url'),flush=True)
            page.close()
    browser.close()
(out/'travelata-live-probe.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('REPORT',json.dumps([{
 'destination':v['destination'],'network':v['network'],
 'status':v.get('http_status'),'destination_visible':v.get('destination_visible'),
 'url':v.get('final_url'),'error':v.get('error')
} for v in report['cases']],ensure_ascii=False))
# Advisory probe: preserve the full evidence even when partner cannot be reached
# from a CI runner. Never represent an HTTP response as confirmed tour inventory.
