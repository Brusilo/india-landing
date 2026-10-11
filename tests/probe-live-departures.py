"""Advisory branded-search proof for Travelata departure-city IDs publicly
listed in its unauthenticated affiliate link constructor.

ID candidates come from https://traff.travelata.ru/constructor.php (fromCity).
Only GET navigation to public result pages; never book, pay or authenticate.
"""
from pathlib import Path
from urllib.parse import urlsplit,parse_qsl,urlencode,urlunsplit
import json,subprocess,sys
from playwright.sync_api import sync_playwright

root=Path(sys.argv[1]).resolve()
out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
code=r"""
const fs=require('fs'),vm=require('vm'),ctx={window:{},URLSearchParams,Date};
vm.runInNewContext(fs.readFileSync('assets/tour-catalog.js','utf8'),ctx);
const d=new Date();d.setDate(d.getDate()+13);
const iso=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const res=ctx.window.TUTU_TOURS.build({departure:'moscow',destination:'turkey',date:iso,nightsMin:7,nightsMax:14,adults:1});
console.log(JSON.stringify({url:res.url,date:iso}));
"""
baseline=json.loads(subprocess.check_output(['node','-e',code],cwd=root,text=True))
# All of these IDs are publicly shown in Travelata's fromCity selector.
candidates=[('kazan',29,'Казань'),('ekaterinburg',25,'Екатеринбург'),
            ('novosibirsk',53,'Новосибирск'),('samara',64,'Самара')]
def with_city(url,id):
    u=urlsplit(url)
    query=dict(parse_qsl(u.query,keep_blank_values=True));query['departure']=str(id)
    frag=dict(parse_qsl(u.fragment.removeprefix('?'),keep_blank_values=True))
    frag['fromCity']=str(id)
    frag.pop('sid',None)
    return urlunsplit((u.scheme,u.netloc,u.path,urlencode(query),'?'+urlencode(frag)))

report={'source':'Travelata public fromCity selector','base_search_url':baseline['url'],'date':baseline['date'],'cases':[]}
with sync_playwright() as pw:
    browser=pw.chromium.launch(args=['--no-sandbox'])
    for key,city_id,name in candidates:
        page=browser.new_page(viewport={'width':1200,'height':900},locale='ru-RU')
        url=with_city(baseline['url'],city_id)
        entry={'city':key,'city_id':city_id,'name':name,'tested_url':url,'verified':False}
        try:
            res=page.goto(url,wait_until='domcontentloaded',timeout=25000)
            page.wait_for_timeout(11000)
            visible=page.locator('body').inner_text(timeout=5000)
            inputs=page.locator('input').evaluate_all('(xs)=>xs.slice(0,30).map(x=>x.value).filter(Boolean)')
            frag=dict(parse_qsl(urlsplit(page.url).fragment.removeprefix('?')))
            date=baseline['date'][8:10]+'.'+baseline['date'][5:7]+'.'+baseline['date'][:4]
            checks={
              'http_200':bool(res and res.status==200),
              'origin_visible':any(name.lower() in x.lower() for x in [visible[:3500],*inputs]),
              'country_visible':any('Турция' in x for x in [visible[:3500],*inputs]),
              'date_visible':any(date in x for x in inputs),
              'origin_id_persisted':frag.get('fromCity')==str(city_id),
              'sid_generated':bool(frag.get('sid'))
            }
            entry.update(http_status=res.status if res else None,
                         final_url=page.url,checks=checks,verified=all(checks.values()),
                         input_values=inputs[:25],text_sample=visible[:550])
        except Exception as ex:
            entry['error']=repr(ex)[:550]
        finally:
            try:page.screenshot(path=str(out/('departure-'+key+'.png')),timeout=7000)
            except Exception as ex:entry['screenshot_error']=str(ex)[:130]
            report['cases'].append(entry)
            print('CITY',key,city_id,'VERIFIED',entry['verified'],'CHECKS',entry.get('checks'),
                  'ERROR',entry.get('error'),flush=True)
            page.close()
    browser.close()
(out/'verified-departure-city-ids.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
