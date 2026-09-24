#!/usr/bin/env python3
import json, re, ssl, urllib.request, urllib.parse
from datetime import date, timedelta
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

DELHI={"slug":"Deli_2098491","id":2098491,"label":"Delhi"}
CITIES=[
 ("Tver",1369087),("Ryazan",1312827),("Smolensk",1403603),("Tula",1422403),("Oryol",1407808),
 ("Belgorod",1414841),("Kursk",1416451),("Voronezh",1381189),("Rostov-na-Donu",1391657),("Joshkar-Ola",1356140),
 ("Cheboksary",1352828),("Saransk",1432621),("Penza",1393941),("Pskov",1360894),("Yaroslavl",1397799),
 ("Ivanovo",1444796),("Tambov",1382947),("Ulyanovsk",1351868),("Arhangelsk",1339817),("Saratov",1433947)
]
TRAVEL=(date.today()+timedelta(days=2)).strftime("%d.%m.%Y")
ctx=ssl.create_default_context()
headers={"User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/154 Safari/537.36","Accept-Language":"ru-RU,ru;q=0.9,en;q=0.8"}

def url(a_slug,a_id,b_slug,b_id):
    qs=urllib.parse.urlencode({"from":a_id,"to":b_id,"date":TRAVEL,"travelers":"1","amount":"1"})
    return f"https://bus.tutu.ru/raspisanie/gorod_{a_slug}/gorod_{b_slug}/?{qs}"

def fetch(u):
    req=urllib.request.Request(u,headers=headers)
    try:
        with urllib.request.urlopen(req,timeout=30,context=ctx) as r:
            raw=r.read()
            text=raw.decode("utf-8","ignore")
            title=""
            m=re.search(r"<title[^>]*>(.*?)</title>",text,re.I|re.S)
            if m:title=re.sub(r"\s+"," ",re.sub("<[^>]+>","",m.group(1))).strip()
            low=text.lower()
            keys=["пересад","составн","маршрут","дели","tver","smolensk","ryazan","tula","oryol","yaro","saratov","voronezh","kursk","penza","tambov","joshkar","cheboksary","saransk","pskov","belgorod","ulyanovsk","rostov","ivanovo","arhangelsk"]
            hits={k:low.count(k) for k in keys if low.count(k)}
            snippets=[]
            for k in ["пересад","составн"]:
                pos=low.find(k)
                if pos>=0: snippets.append(re.sub(r"\s+"," ",text[max(0,pos-180):pos+420])[:700])
            return {"ok":True,"status":getattr(r,"status",200),"final_url":r.geturl(),"bytes":len(raw),"title":title,"hits":hits,"snippets":snippets}
    except Exception as e:
        return {"ok":False,"error":repr(e)}

out={"travel_date":TRAVEL,"source_note":"Delhi locality ID 2098491 came from a user-verified Tutu deep link; Russian locality IDs are the repository's confirmed bus IDs.","routes":[]}
jobs=[]
for city,city_id in CITIES:
    for direction in ("delhi_to_city","city_to_delhi"):
        if direction=="delhi_to_city":
            u=url(DELHI["slug"],DELHI["id"],city,city_id)
        else:
            u=url(city,city_id,DELHI["slug"],DELHI["id"])
        jobs.append((city,city_id,direction,u))

def probe(job):
    city,city_id,direction,u=job
    result=fetch(u)
    result.update({"city":city,"city_id":city_id,"direction":direction,"url":u})
    return result

with ThreadPoolExecutor(max_workers=12) as ex:
    future_map={ex.submit(probe,j):j for j in jobs}
    for f in as_completed(future_map):
        result=f.result()
        out["routes"].append(result)
        print(result["direction"],result["city"],result.get("status"),result.get("title"),result.get("error",""))

out["routes"].sort(key=lambda x:(x["city"],x["direction"]))
Path("docs/composite-route-probe.json").write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding="utf-8")
