#!/usr/bin/env python3
"""Advisory inspection of public Travelata tour-link constructor metadata.

Do not treat an ID as verified unless it matches known independent examples.
Never scrape private partner API endpoints or introduce credentials in frontend.
"""
import json
from html.parser import HTMLParser
from urllib.request import Request, urlopen
from pathlib import Path

URL='https://traff.travelata.ru/constructor.php'
HEADERS={'User-Agent':'Mozilla/5.0 (Tutu Landing QA; public constructor)','Accept':'text/html'}
OUT=Path('/tmp/tutu-tour-audit/public-travelata-constructor.json')
OUT.parent.mkdir(parents=True,exist_ok=True)

class Options(HTMLParser):
    def __init__(self):
        super().__init__()
        self.current_select=None
        self.option=None
        self.entries=[]
        self.selects=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='select':
            self.current_select={key:a.get(key) for key in ('name','id','class')}
            self.selects.append(self.current_select)
        elif tag=='option':
            self.option={'value':a.get('value'),'select':self.current_select,'label':''}
    def handle_data(self,data):
        if self.option is not None:self.option['label']+=data
    def handle_endtag(self,tag):
        if tag=='option' and self.option is not None:
            self.option['label']=self.option['label'].strip()
            if self.option['label']:self.entries.append(self.option)
            self.option=None
        elif tag=='select':self.current_select=None

result={'source':URL,'data_scope':'public HTML only','confirmed_ids':{},'inspect':[]}
try:
    with urlopen(Request(URL,headers=HEADERS),timeout=22) as r:
        body=r.read(3000000).decode('utf-8','replace')
        result['http_status']=r.status;result['bytes']=len(body)
    parser=Options();parser.feed(body)
    result['select_elements']=parser.selects[:30]
    result['total_options']=len(parser.entries)
    result['all_public_options']=parser.entries[:400]
    needles=('турц','егип','москв','санкт','russia','росси','мал','тайл','инди')
    found=[e for e in parser.entries if any(n in e['label'].lower() for n in needles)]
    result['inspect']=found[:70]
    names={e['label'].lower():e['value'] for e in parser.entries}
    # Only exact names and previously verified country/departure ID pairs qualify.
    known={'турция':'92','египет':'29','москва':'2','санкт-петербург':'1'}
    result['known_id_checks']={n:{'expected':v,'observed':names.get(n),'matches':names.get(n)==v} for n,v in known.items()}
    result['public_metadata_supports_partner_ids']=result['known_id_checks']['турция']['matches']
except Exception as e:
    result['error']=repr(e)
OUT.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print('PUBLIC TRAVELATA CONSTRUCTOR',json.dumps({k:result.get(k) for k in ('http_status','bytes','total_options','known_id_checks','public_metadata_supports_partner_ids','error')},ensure_ascii=False))
print('OPTIONS',json.dumps(result['inspect'][:15],ensure_ascii=False))
