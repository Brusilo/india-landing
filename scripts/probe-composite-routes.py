#!/usr/bin/env python3
import json, re, ssl, urllib.request, urllib.parse
from datetime import date, timedelta
from pathlib import Path

DELHI={"slug":"Deli_2098491","id":2098491,"label":"Delhi"}
CITIES=[
 ("Tver",1369087),("Smolensk",1403603),("Ryazan",1312827),("Tula",1422403),("Oryol",1407808),
 ("Yaroslavl",1397799),("Saratov",1433947),("Volgograd",1412651),("Voronezh",1381189),("Kursk",1416451),
 ("Penza",1393941),("Tambov",1382947),("Joshkar-Ola",1356140),("Cheboksary",1352828),("Saransk",1432621),
 ("Nizhnij-Novgorod",1427804),("Pskov",1360894),("Stavropol",1435837),("Belgorod",1414841),("Ulyanovsk",1351868)
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
            keys=["пересад","составн","маршрут","дели","tver","smolensk","ryazan","tula","oryol","yaro","saratov","volgograd","voronezh","kursk","penza","tambov","joshkar","cheboksary","saransk","nizhn","pskov","stavropol","belgorod","ulyanovsk"]
            hits={k:low.count(k) for k in keys if low.count(k)}
            snippets=[]
            for k in ["пересад","составн"]:
                pos=low.find(k)
                if pos>=0: snippets.append(re.sub(r"\s+"," ",text[max(0,pos-180):pos+420])[:700])
            return {"ok":True,"status":getattr(r,"status",200),"final_url":r.geturl(),"bytes":len(raw),"title":title,"hits":hits,"snippets":snippets}
    except Exception as e:
        return {"ok":False,"error":repr(e)}

out={"travel_date":TRAVEL,"source_note":"Delhi locality ID 2098491 came from a user-verified Tutu deep link; Russian locality IDs are the repository's confirmed bus IDs.","routes":[]}
for city,city_id in CITIES:
    for direction in ("delhi_to_city","city_to_delhi"):
        if direction=="delhi_to_city":
            u=url(DELHI["slug"],DELHI["id"],city,city_id)
        else:
            u=url(city,city_id,DELHI["slug"],DELHI["id"])
        result=fetch(u)
        result.update({"city":city,"city_id":city_id,"direction":direction,"url":u})
        out["routes"].append(result)
        print(direction, city, result.get("status"), result.get("title"), result.get("error",""))

Path("docs/composite-route-probe.json").write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding="utf-8")
