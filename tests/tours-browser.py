"""Offline Chromium smoke tests for the Tutu India tour search.
Run: python3 tests/tours-browser.py . /tmp/tour-qa
Uses tests/fixture.py to intercept outgoing navigation and block external traffic.
"""
from pathlib import Path
from urllib.parse import urlparse, parse_qs
import json, sys
from playwright.sync_api import sync_playwright
from fixture import load

root=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(".").resolve()
out=Path(sys.argv[2]) if len(sys.argv)>2 else Path("/tmp/tour-qa")
out.mkdir(parents=True,exist_ok=True)
widths=list(map(int,sys.argv[3].split(","))) if len(sys.argv)>3 else [320,360,390,600,768,1024,1101,1280,1440]
languages=[("en","index.html"),("ru","index-ru.html"),("hi","index-hi.html")]
failures=[]
passed=0
def check(value,message):
    if not value: raise AssertionError(message)
def fit(pg,css):
    rect=pg.locator(css).first.bounding_box()
    check(rect is not None,css+" is not displayed")
    check(rect["x"]>=-2 and rect["x"]+rect["width"]<=pg.viewport_size["width"]+2,
          css+" clipped at "+str(rect))
def click_tab(pg):
    pg.locator(".transport .tours-tab").click()
    check(pg.locator("form.search-v2").get_attribute("data-mode")=="tour","tour mode opens")
    check(pg.locator(".tour-destination").is_visible(),"tour input visible")
def choose(pg,name,key):
    inp=pg.locator(".tour-destination")
    inp.fill(name)
    item=pg.locator('.tour-panel--destination [data-tour-choice="'+key+'"]')
    check(item.count()==1,"suggestion for "+name+" exists")
    item.click()
    check(inp.input_value()==pg.evaluate('(key)=>window.TUTU_TOURS.byKey.get(key).name[document.documentElement.lang]',key),
          "selection updates text")
def run_case(pg,lang,width):
    missing,errors=load(pg,root,{"en":"index.html","ru":"index-ru.html","hi":"index-hi.html"}[lang])
    check(not missing,"missing assets "+str(missing[:3]))
    check(not errors,"page Javascript errors "+str(errors))
    click_tab(pg)
    fit(pg,"form.search-v2")
    fit(pg,".tour-destination")
    # The suggestions were broken in v1 because the input was not a tour-trigger.
    choose(pg,"Murmansk","murmansk")
    check(pg.locator(".tour-destination").get_attribute("aria-expanded")=="false","combobox closes")
    pg.locator('[data-tour-trigger="date"]').click()
    check(pg.locator(".tour-panel--date").is_visible(),"date popover")
    fit(pg,".tour-panel--date")
    previous=pg.locator(".tour-month strong").inner_text()
    pg.locator('[data-tour-nav="1"]').click()
    check(pg.locator(".tour-panel--date").is_visible(),"calendar stays open after next month")
    check(pg.locator(".tour-month strong").inner_text()!=previous,"calendar month changes")
    pg.locator(".tour-days [data-tour-day]:not([disabled])").first.click()
    check(pg.locator(".tour-panel--date").count()==0,"calendar closes after date")
    pg.locator('[data-tour-trigger="nights"]').click()
    fit(pg,".tour-panel--nights")
    pg.locator('[data-tour-range="min"]').fill("9")
    check(pg.locator('[data-tour-min]').inner_text()=="9","min nights updates")
    check(pg.locator('[data-tour-range="max"]').input_value()=="14","max nights retained")
    check(pg.locator(".tour-range .tour-track").count()==1,"shared two-handle night track")
    pg.locator('[data-tour-trigger="people"]').click()
    fit(pg,".tour-panel--people")
    pg.locator('[data-tour-step="1"]').click()
    check("2" in pg.locator('[data-tour-trigger="people"]').inner_text(),"adults increment")
    # Fallback must preserve destination (not dump the user at an unrelated home page).
    pg.evaluate("window.__qaNavigations=[]")
    pg.locator(".tour-submit").click()
    fallback=pg.evaluate("window.__qaNavigations")
    check(fallback==["https://tours.tutu.ru/strana/rossiya/kurort/murmansk/"],
          "Murmansk opens matching Tutu landing page, got "+repr(fallback))
    # Known destination IDs must preserve date / nights / people / attribution.
    pg.evaluate("window.__qaNavigations=[]")
    choose(pg,"Egypt","egypt")
    pg.locator(".tour-submit").click()
    searches=pg.evaluate("window.__qaNavigations")
    check(len(searches)==1,"one navigation for exact search")
    u=urlparse(searches[0])
    q=parse_qs(u.query)
    check(u.netloc=="web.tutu.travelata.ru" and u.path=="/search/","branded Travelata search")
    check(q.get("arrival_id")==["29"] and q.get("departure")==["2"],"verified destination/departure IDs")
    check(q.get("nights_min")==["9"] and q.get("nights_max")==["14"] and q.get("adults")==["2"],
          "search constraints passed")
    check(q.get("utm_source")==["tutu_main"],"attribution passed")
    check("sid=" not in searches[0],"no reused session ID")
    # No side effects on existing transport modes.
    pg.locator(".transport button").nth(1).click()
    check(pg.locator("form.search-v2").get_attribute("data-mode")=="flight","flight restored")
    check(pg.locator(".v2-flight-dates").count()==1,"flight calendar preserved")
    click_tab(pg)
    check(pg.locator('[data-tour-trigger="people"]').inner_text().startswith("2"),"tour state persists")
    pg.locator(".transport button").nth(0).click()
    check(pg.locator("form.search-v2").get_attribute("data-mode")=="hotel","hotel restored")
    check(not errors,"no runtime exceptions "+str(errors))
    check(pg.evaluate("document.documentElement.scrollWidth <= innerWidth+2"),"no page horizontal overflow")

with sync_playwright() as pw:
    try:
        browser=pw.chromium.launch(executable_path="/usr/bin/chromium" if Path("/usr/bin/chromium").exists() else None,
                                    args=["--no-sandbox"])
    except Exception as exc:
        print("Cannot launch browser:",exc)
        raise
    for lang,file in languages:
        for width in widths:
            pg=browser.new_page(viewport={"width":width,"height":900},device_scale_factor=1,
                                is_mobile=width<600,has_touch=width<=1100)
            pg.on("dialog",lambda dialog:dialog.accept())
            name=f"{lang}-{width}"
            try:
                run_case(pg,lang,width)
                passed+=1
                print("PASS",name,flush=True)
                if width in (390,1440):
                    pg.locator(".transport .tours-tab").click()
                    pg.screenshot(path=str(out/(name+"-tours.png")),full_page=False)
            except Exception as exc:
                failures.append({"case":name,"error":str(exc)})
                print("FAIL",name,str(exc),flush=True)
                pg.screenshot(path=str(out/("FAIL-"+name+".png")),full_page=False)
            finally:pg.close()
    browser.close()
result={"passed":passed,"total":len(widths)*len(languages),"failures":failures}
(out/"tour-results.json").write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps(result,ensure_ascii=False,indent=2))
if failures:sys.exit(1)
