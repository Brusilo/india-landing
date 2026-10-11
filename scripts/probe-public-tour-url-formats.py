"""Inspect publicly shipped Travelata link-constructor JavaScript syntax.

Read-only: requests only script files linked by the unauthenticated widget
constructor. Report short excerpts around resort/departure URL parameters;
never publish script source wholesale or guess production URL formats.
"""
from pathlib import Path
from urllib.request import Request,urlopen
import json,re,sys

BASE='https://traff.travelata.ru/content/js/'
SOURCES=['linksConstructor.js','common/getAffiliateURL.js','service/getAffiliateUrl.js',
         'service/getResorts.js','common/setResorts.js','main.js']
KEYWORDS=('toCity','toResort','toResorts','resortId','resort','arrival_type','arrival_id',
          'toCountry','fromCity','constructor')
res={'origin':'Travelata publicly served widget JS','files':[]}
for name in SOURCES:
  url=BASE+name
  item={'path':name,'url':url}
  try:
    with urlopen(Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=15) as reply:
      content=reply.read(350000).decode('utf-8','replace')
      item['http_status']=reply.status
      item['size']=len(content)
    matches=[]
    for kw in KEYWORDS:
      items=list(re.finditer(re.escape(kw),content,re.IGNORECASE))[:12]
      for m in items:
        left=max(0,m.start()-90);right=min(len(content),m.end()+130)
        sample=content[left:right].replace('\\n',' ').replace('\n',' ')
        matches.append({'keyword':kw,'around':sample[:260]})
    item['snippets']=matches[:90]
    item['keyword_counts']={kw:len(list(re.finditer(re.escape(kw),content,re.IGNORECASE))) for kw in KEYWORDS}
    print('SOURCE',name,'status',item['http_status'],'size',item['size'],'counts',item['keyword_counts'],flush=True)
  except Exception as exc:item['error']=repr(exc)[:500];print('JS_FETCH_ERROR',name,repr(exc)[:120],flush=True)
  res['files'].append(item)
output=Path(sys.argv[1]) if len(sys.argv)>1 else Path('/tmp/public-travelata-js-format.json')
output.parent.mkdir(parents=True,exist_ok=True)
output.write_text(json.dumps(res,ensure_ascii=False,indent=2),encoding='utf-8')
