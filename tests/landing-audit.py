#!/usr/bin/env python3
"""End-to-end local Chromium smoke audit of the production landing entrypoints.

Runs the actual HTML/CSS/JS from main over HTTP, without third-party requests.
External Tutu/Travelata availability and payment flows are out of scope.
"""
import json
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse
from zoneinfo import ZoneInfo

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = "http://127.0.0.1:8765/"
REPORT_DIR = ROOT / "reports"
REPORT_DIR.mkdir(exist_ok=True)
LANGUAGES = {"ru": "index-ru.html", "en": "index.html", "hi": "index-hi.html"}
WIDTHS = [320, 390, 768, 1101, 1440]
MOSCOW_TOMORROW = (datetime.now(ZoneInfo("Europe/Moscow")).date() + timedelta(days=1)).isoformat()
failures, warnings, checks = [], [], []


def check(value, description):
    checks.append(description)
    if not value:
        raise AssertionError(description)


def digits(value):
    return re.sub(r"\D", "", value)


def check_assets(page, lang, width):
    data = page.evaluate("""() => ({
      refs: [...document.querySelectorAll('img[src], script[src], link[rel="stylesheet"][href]')]
        .map(n => n.getAttribute('src') || n.getAttribute('href')),
      backgrounds: [...document.querySelectorAll('.card-media')]
        .map(n => getComputedStyle(n).backgroundImage)
    })""")
    for value in data["refs"]:
        if value.startswith(("http:", "https:", "data:", "//", "#")):
            continue
        path = ROOT / unquote(value.split("?", 1)[0])
        check(path.is_file(), f"{lang}/{width} missing local asset {value}")
    for bg in data["backgrounds"]:
        for item in re.findall(r'url\(["\']?([^"\')]+)', bg):
            uri = urlparse(item)
            if uri.hostname not in (None, "127.0.0.1"):
                continue
            target = uri.path.lstrip("/")
            if target.startswith("india-landing/"):
                target = target[len("india-landing/"):]
            check((ROOT / unquote(target)).is_file(), f"{lang}/{width} missing card image {item}")


def card_audit(page, lang, width):
    feed = page.evaluate("""() => ({
      snapshot: window.TUTU_DAILY_PRICES?.quotes,
      today: window.TUTU_PRICING?.moscowDate(),
      rate: window.TUTU_PRICING?.rubToInr()
    })""")
    data = feed["snapshot"] or {}
    check(data.get("for") == MOSCOW_TOMORROW,
          f"{lang}/{width} price snapshot dated tomorrow ({MOSCOW_TOMORROW})")
    check(data.get("currency") == "RUB", f"{lang}/{width} RUB price feed")
    check(0.1 < feed["rate"] < 10, f"{lang}/{width} INR conversion valid")
    for group, prefix, expected in (("routes", "r", 14), ("hotels", "h", 13)):
        selector = ".card--route" if group == "routes" else ".card--hotel"
        cards = page.locator(f"#{group}-row {selector}")
        check(cards.count() == expected, f"{lang}/{width} {group} {expected} cards")
        check(len(data.get(group, {})) == expected,
              f"{lang}/{width} {group} all {expected} verified price values")
        for number in range(1, expected + 1):
            key = f"{prefix}{number}"
            card = page.locator(f"#{group}-row [data-cta='{ 'route_' if group == 'routes' else 'hotel_'}{key}']")
            check(card.count() == 1, f"{lang}/{width} card {key} exists")
            base = data[group][key]
            check(isinstance(base, (int, float)) and base >= 100,
                  f"{lang}/{width} {key} valid supplier quote")
            day = data.get("dates", {}).get(group, {}).get(key, MOSCOW_TOMORROW)
            check(card.get_attribute("data-quote-day") == day,
                  f"{lang}/{width} {key} quoted date is preserved")
            text = card.locator(".price").inner_text()
            check("check price" not in text.lower() and "уточнить" not in text.lower()
                  and "कीमत देखें" not in text,
                  f"{lang}/{width} {key} no Check price for verified quote")
            discount = min(round(base * .15), 1000 if key == "r2" else 3000) if group == "hotels" or key == "r2" else 0
            correct = str(int(base - discount))
            check(digits(text) == correct,
                  f"{lang}/{width} {key} correct price (expected {correct}, got {text})")
            link = card.get_attribute("data-href")
            check(bool(link) and link.startswith("https://"), f"{lang}/{width} {key} active destination")
            parsed = urlparse(link)
            check(parsed.hostname in ("www.tutu.ru", "avia.tutu.ru", "bus.tutu.ru", "hotel.tutu.ru"),
                  f"{lang}/{width} {key} points to Tutu")
            query = parse_qs(parsed.query)
            if group == "hotels":
                check(query.get("check_in") == [day],
                      f"{lang}/{width} {key} hotel check-in matches displayed quote")
                check(query.get("room[0]") == ["1"],
                      f"{lang}/{width} {key} 1 guest")
            elif key == "r2":
                check(day.replace("-", "")[6:]+day.replace("-", "")[4:6]+day[:4] in
                      query.get("route[0]", [""])[0],
                      f"{lang}/{width} {key} flight date matches quote")
            else:
                dt = datetime.strptime(day, "%Y-%m-%d")
                check(query.get("date") == [dt.strftime("%d.%m.%Y")],
                      f"{lang}/{width} {key} train date matches quote")
    for sect in ("routes", "hotels"):
        see = page.locator(f"#{sect} .card--cta")
        check(see.count() == 1, f"{lang}/{width} {sect} See all exists")
        check((see.get_attribute("href") or "").startswith("https://"),
              f"{lang}/{width} {sect} See all functional link")
    check(page.locator("#hotels .card--cta").evaluate(
        "el => getComputedStyle(el).backgroundColor") == "rgb(255, 255, 255)",
        f"{lang}/{width} hotel See all matches white cards")


with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, args=["--no-sandbox"])
    for lang, filename in LANGUAGES.items():
        for width in WIDTHS:
            context = browser.new_context(
                locale="en-GB", timezone_id="Europe/Moscow",
                viewport={"width": width, "height": 900})
            page = context.new_page()
            errors, missing_http = [], []
            page.on("pageerror", lambda err: errors.append(str(err)))
            page.on("response", lambda response: (
                missing_http.append(f"{response.status} {response.url}")
                if urlparse(response.url).hostname == "127.0.0.1" and response.status >= 400
                else None))
            # Run actual local site assets but not third-party network services.
            page.route("**/*", lambda route: route.continue_()
                       if urlparse(route.request.url).hostname == "127.0.0.1"
                       else route.abort())
            case = f"{lang}/{width}"
            try:
                response = page.goto(BASE + filename, wait_until="domcontentloaded", timeout=25000)
                check(response.status == 200, f"{case} HTML responds 200")
                page.wait_for_function(
                    "() => document.documentElement.classList.contains('search-ui-ready')",
                    timeout=12000)
                check(page.locator("html").get_attribute("lang") == lang,
                      f"{case} correct language")
                check(page.locator(".hero h1").count() == 1, f"{case} hero heading exists")
                for section in ("routes", "hotels", "reviews", "faq"):
                    check(page.locator(f"#{section}").count() == 1,
                          f"{case} {section} exists")
                check(page.locator("#reviews-row .review-card").count() == 5,
                      f"{case} five reviews")
                check(page.locator("#faq-list .faq-item").count() >= 4,
                      f"{case} FAQ rendered")
                check(not errors, f"{case} no JS page errors: {errors}")
                check(not missing_http, f"{case} no local HTTP 404/500: {missing_http}")
                card_audit(page, lang, width)
                check_assets(page, lang, width)
                check(page.evaluate(
                    "document.documentElement.scrollWidth <= innerWidth + 2"),
                    f"{case} no page-wide horizontal overflow")
                check(page.locator(".search-hints-v2").is_visible() == (width > 1100),
                      f"{case} correct desktop-only quick hints")
                for mode, idx in (("hotel", 0), ("flight", 1), ("train", 2),
                                  ("bus", 3), ("tour", None)):
                    tab = (page.locator(".transport .tours-tab") if mode == "tour"
                           else page.locator(".transport button:not(.tours-tab)").nth(idx))
                    tab.click()
                    check(page.locator("#search").get_attribute("data-mode") == mode,
                          f"{case} {mode} tab works")
                    check(page.locator("#search .v2-submit").is_visible(),
                          f"{case} {mode} search button visible")
                page.locator(".transport button:not(.tours-tab)").nth(1).click()
                item = page.locator("#faq-list .faq-item").first
                item.locator("summary").click()
                check(item.get_attribute("open") is not None,
                      f"{case} FAQ expands")
                item.locator("summary").click()
                check(item.get_attribute("open") is None, f"{case} FAQ collapses")
                if width == 1440:
                    page.evaluate("""() => {
                        window.__promoCopied=[];
                        Object.defineProperty(navigator,'clipboard',{
                          configurable:true,
                          value:{writeText:(s)=>{window.__promoCopied.push(s);return Promise.resolve()}}
                        });
                    }""")
                    for code in ("INTAVIATUTU", "INTHOTELTUTU"):
                        page.locator(f".promo-strip__copy[data-promo-code='{code}']").click()
                        page.wait_for_function(
                            "(code) => window.__promoCopied.includes(code)", code)
                        check(True, f"{case} copy promo {code}")
                if width in (390, 1440):
                    for section in ("routes", "hotels", "about"):
                        page.locator(f"#{section}").scroll_into_view_if_needed()
                    check(not missing_http, f"{case} no broken loaded imagery: {missing_http}")
                    page.screenshot(
                        path=str(REPORT_DIR / f"{lang}-{width}.png"),
                        full_page=True, animations="disabled")
                check(not errors, f"{case} no browser errors after interactions: {errors}")
                print("PASS", case, flush=True)
            except Exception as exc:
                message = f"{case}: {type(exc).__name__}: {str(exc)[:900]}"
                failures.append(message)
                print("FAIL", message, flush=True)
                try:
                    page.screenshot(path=str(REPORT_DIR / f"failed-{lang}-{width}.png"),
                                    full_page=True, timeout=8000)
                except Exception:
                    pass
            finally:
                context.close()
    browser.close()

report = {"branch": "main", "engine": "Chromium (actual local site, external APIs blocked)",
          "priceBatch": MOSCOW_TOMORROW, "pageVariants": 3 * len(WIDTHS),
          "assertions": len(checks), "failures": failures, "warnings": warnings,
          "passed": not failures,
          "limits": "Does not execute live Tutu/Travelata searches, payments or third-party analytics"}
(REPORT_DIR / "landing-audit.json").write_text(json.dumps(report, ensure_ascii=False, indent=2))
print(json.dumps({k: v for k, v in report.items() if k != "warnings"}, ensure_ascii=False, indent=2))
if failures:
    sys.exit(1)
