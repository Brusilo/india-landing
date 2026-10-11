#!/usr/bin/env python3
"""Build a static VISUAL-ONLY destination list from Travelata's public link constructor.

No partner credentials, payments, prices, inventories, or search URLs are involved.
The generated labels reflect provider catalogue entries, not guaranteed bookable tours.
Source: https://traff.travelata.ru/constructor.php (public, 11 Oct 2026).
"""
from __future__ import annotations
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

OUTPUT=Path("assets/tour-public-options.js")
CYR={"а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"yo","ж":"zh","з":"z","и":"i","й":"y",
"к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f",
"х":"kh","ц":"ts","ч":"ch","ш":"sh","щ":"shch","ъ":"","ы":"y","ь":"","э":"e","ю":"yu","я":"ya"}
def transliterate(text):
    result=[]
    for ch in text:
        lo=ch.lower()
        value=CYR.get(lo,ch)
        if ch.isupper() and value: value=value[0].upper()+value[1:]
        result.append(value)
    return "".join(result)

def values(page,selector):
    return page.locator(selector).evaluate("""sel=>[...sel.options].map(o=>[o.value,o.textContent.trim()])
      .filter(row=>row[0]&&Number(row[0])>=0&&row[1]&&!/^(По умолчанию|Все курорты)$/.test(row[1]))""")

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,args=["--no-sandbox"])
    page=browser.new_page(locale="ru-RU")
    response=page.goto("https://traff.travelata.ru/constructor.php",
                        wait_until="domcontentloaded",timeout=30000)
    if not response or response.status!=200: raise RuntimeError("Public constructor unavailable")
    page.get_by_role("link",name="Конструктор ссылок").first.click(timeout=10000)
    page.wait_for_function("""()=>
        document.querySelector('select[name="fromCity"]')?.options.length>80
        &&document.querySelector('select[name="toCountry"]')?.options.length>55""",
        timeout=20000)
    country_options=values(page,'select[name="toCountry"]')
    origin_options=values(page,'select[name="fromCity"]')
    seen=set()
    countries=[]
    for identity,name in country_options:
        if (identity,name) in seen:continue
        seen.add((identity,name))
        countries.append([identity,name,transliterate(name)])
    origin_seen=set()
    origins=[]
    for identity,name in origin_options:
        if (identity,name) in origin_seen:continue
        origin_seen.add((identity,name))
        origins.append([identity,name,transliterate(name)])

    resorts={}
    for country,minimum,hint in [
        ("76",400,"Калининград"),("92",100,"Аланья"),("33",30,"Южный Гоа")
    ]:
        page.locator('select[name="toCountry"]').select_option(country)
        page.wait_for_function("""([n,text])=>{
          const select=document.querySelector('select[name="toCity"]');
          return select&&select.options.length>n&&[...select.options].some(o=>o.text.includes(text));
        }""",arg=[minimum,hint],timeout=18000)
        page.wait_for_timeout(400)
        rows=values(page,'select[name="toCity"]')
        resorts[country]=[[identity,name,transliterate(name)] for identity,name in rows]
    browser.close()

if len(countries)<65 or len(origins)<80 or len(resorts["76"])<490 or len(resorts["92"])<155 or len(resorts["33"])<40:
    raise RuntimeError("Provider options unexpectedly truncated: "+str((len(countries),len(origins),{k:len(v) for k,v in resorts.items()})))

data={"source":"Travelata public link constructor, 2026-10-11",
      "countries":countries,"departures":origins,"resorts":resorts}
serialized=json.dumps(data,ensure_ascii=False,separators=(",",":"))
content="/* Static public catalogue for visual-only Tours prototype; no search links or availability claims. */\n"
content+="(function(root){'use strict';root.TUTU_TOUR_PUBLIC_OPTIONS="+serialized+";})(window);\n"
OUTPUT.parent.mkdir(exist_ok=True)
OUTPUT.write_text(content,encoding="utf-8")
print("CREATED",OUTPUT,"countries",len(countries),"departures",len(origins),
      "resorts",{k:len(v) for k,v in resorts.items()},"bytes",len(content.encode("utf-8")))
