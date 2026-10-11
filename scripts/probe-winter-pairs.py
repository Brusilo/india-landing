"""Check potential winter-in-Russia city-to-resort Tutu SEO landing pages.

Source city slugs come from exact existing /murmansk/iz/... landing paths.
Destination slugs come from the public Tutu resort directory.
Candidates are NOT promoted unless they resolve to the same path and
mention the intended origin/destination in the page heading/title.
This probes only 28 public pages, 3 parallel requests, no private APIs.
"""
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from urllib.error import HTTPError,URLError
from urllib.parse import urlsplit
from urllib.request import Request,urlopen
import json,sys,time
from pathlib import Path

ORIGINS={
 'moscow':('491_moskva','москв'),
 'spb':('75_sankt-peterburg','петербург'),
 'kazan':('33_kazan','казан'),
 'ekaterinburg':('29_ekaterinburg','екатеринбург'),
}
DESTINATIONS={
 'baikal':('baikal','байкал'),
 'karelia':('karelia','карели'),
 'krasnaya-polyana':('krasnaya_polyana','красн'),
 'sheregesh':('sheregesh','шерегеш'),
 'altai':('altai','алта'),
 'sochi':('sochi','соч'),
 'veliky-ustyug':('veliky_ustyug','устюг')
}
HEADERS={'User-Agent':'Mozilla/5.0 (Tutu India Tours QA; public pages only)',
         'Accept':'text/html','Accept-Language':'ru-RU,ru;q=0.9'}

class TextCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.element=None;self.title=[];self.h1=[];self.skip=0
    def handle_starttag(self,tag,attrs):
        if tag in ('script','style'):self.skip+=1
        if tag in ('title','h1'):self.element=tag
    def handle_endtag(self,tag):
        if tag in ('script','style'):self.skip=max(0,self.skip-1)
        if tag==self.element:self.element=None
    def handle_data(self,text):
        if self.skip:return
        if self.element=='title':self.title.append(text)
        elif self.element=='h1':self.h1.append(text)

def fetch_one(item):
    url=item['url']
    attempts=[]
    for i in range(2):
        try:
            req=Request(url,headers=HEADERS)
            with urlopen(req,timeout=11) as resp:
                body=resp.read(420000)
                final=resp.geturl()
                status=resp.status
            p=TextCollector();p.feed(body.decode('utf-8','replace'))
            title=' '.join(p.title).lower();heading=' '.join(p.h1).lower()
            path_matches=urlsplit(final).path.rstrip('/')==urlsplit(url).path.rstrip('/')
            origin_mentions=item['origin_stem'] in title or item['origin_stem'] in heading
            dest_mentions=item['destination_stem'] in title or item['destination_stem'] in heading
            item.update(status=status,final_url=final,title=title[:180],h1=heading[:150],
                exact_path=path_matches,origin_in_heading=origin_mentions,
                destination_in_heading=dest_mentions,
                verified=bool(status==200 and path_matches and origin_mentions and dest_mentions),
                attempts=i+1)
            return item
        except HTTPError as exc:
            attempts.append(exc.code)
            if exc.code not in (429,502,503,504):break
        except (URLError,TimeoutError,OSError) as exc:
            attempts.append(str(exc)[:160])
            if i==1:break
        if i==0:time.sleep(0.4)
    item.update(status=attempts[-1] if attempts and isinstance(attempts[-1],int) else None,
       attempts=len(attempts),verified=False,errors=attempts)
    return item

items=[]
for d,(dest_slug,dest_stem) in DESTINATIONS.items():
  for k,(city_slug,city_stem) in ORIGINS.items():
    items.append({'origin':k,'destination':d,'origin_stem':city_stem,
                  'destination_stem':dest_stem,
                  'url':f'https://tours.tutu.ru/rossiya/{dest_slug}/iz/{city_slug}/'})
with ThreadPoolExecutor(max_workers=3) as pool:
  results=list(pool.map(fetch_one,items))
verified=[x for x in results if x['verified']]
output=Path(sys.argv[1]) if len(sys.argv)>1 else Path('/tmp/winter-pairs.json')
output.parent.mkdir(parents=True,exist_ok=True)
output.write_text(json.dumps({'total':len(results),'verified':len(verified),
                  'verified_pairs':[{k:v for k,v in x.items() if k in ('origin','destination','url')}
                      for x in verified],
                  'results':results},ensure_ascii=False,indent=2),encoding='utf-8')
print('WINTER PAIRS',len(verified),'/',len(results),'strongly verified')
for x in results:
  print('PAIR',x['origin'],x['destination'],x.get('status'),
        'verified' if x['verified'] else 'NOT_VERIFIED',x.get('title','')[:130])
