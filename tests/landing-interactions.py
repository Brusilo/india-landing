#!/usr/bin/env python3
"""Additional interactive regression: navigation, resizing, carousels, and train-tab glyph."""
from __future__ import annotations

from pathlib import Path
from urllib.parse import urlparse
import json
import re
import sys

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8765/"
REPORTS = Path("reports")
REPORTS.mkdir(exist_ok=True)
LANGUAGES = {"ru": "index-ru.html", "en": "index.html", "hi": "index-hi.html"}
RESPONSIVE_WIDTHS = [320, 360, 375, 414, 599, 600, 767, 899, 1024, 1100, 1101, 1280, 1920]
passed, failures = [], []


def verify(cond, description):
    if not cond:
        raise AssertionError(description)
    passed.append(description)


def open_page(page, locale):
    response = page.goto(BASE + LANGUAGES[locale], wait_until="domcontentloaded", timeout=30000)
    verify(response and response.status == 200, locale + " reachable HTML")
    page.wait_for_function(
        "() => document.documentElement.classList.contains('search-ui-ready')",
        timeout=15000)
    verify(page.locator("html").get_attribute("lang") == locale,
           locale + " proper document locale")


def assert_train_glyph(page, description):
    node = page.locator('.hero .transport > button:nth-child(3) .ico img[src*="icon-train"]')
    verify(node.count() == 1, description + " target white train icon inside Trains tile")
    verify("train" in page.locator('.hero .transport > button:nth-child(3)').inner_text().lower()
           or page.locator('.hero .transport > button:nth-child(3)').get_attribute('role') == 'tab',
           description + " target third travel-mode tile")
    matrix = node.evaluate("el => getComputedStyle(el).transform")
    verify(bool(re.match(r"matrix\(1, 0, 0, 1, 1(?:\.0+)?, -?\d", matrix)),
           description + " train white glyph shifted +1px without moving purple tile: " + matrix)


with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, args=["--no-sandbox"])
    for locale in LANGUAGES:
        context = browser.new_context(
            viewport={"width": 390, "height": 900},
            timezone_id="Europe/Moscow", locale="en-GB",
            is_mobile=True, has_touch=True)
        page = context.new_page()
        page_errors = []
        page.on("pageerror", lambda err: page_errors.append(str(err)))
        page.route("**/*", lambda route: route.continue_()
                   if urlparse(route.request.url).hostname == "127.0.0.1"
                   else route.abort())
        try:
            open_page(page, locale)
            assert_train_glyph(page, locale + "/390")

            menu = page.locator(".mobile-menu-toggle")
            verify(menu.count() == 1, locale + " mobile menu button exists")
            verify(menu.get_attribute("aria-expanded") == "false",
                   locale + " mobile menu starts collapsed")
            menu.click()
            verify(menu.get_attribute("aria-expanded") == "true",
                   locale + " mobile menu opens")
            verify(page.locator(".top.is-menu-open").count() == 1,
                   locale + " header announces opened navigation")
            page.keyboard.press("Escape")
            verify(menu.get_attribute("aria-expanded") == "false",
                   locale + " Escape closes mobile menu")

            toggles = page.locator(".footer-toggle")
            verify(toggles.count() >= 1, locale + " mobile footer accordion exists")
            toggle = toggles.first
            verify(toggle.get_attribute("aria-expanded") == "false",
                   locale + " footer initially collapsed")
            toggle.click()
            verify(toggle.get_attribute("aria-expanded") == "true",
                   locale + " footer can expand")
            toggle.click()
            verify(toggle.get_attribute("aria-expanded") == "false",
                   locale + " footer can collapse")

            train = page.locator(".transport button:not(.tours-tab)").nth(2)
            train.click()
            verify(page.locator("#search").get_attribute("data-mode") == "train",
                   locale + " train tile activates search")
            field = page.locator('#search [data-role="from"] .v2-input')
            field.fill("Mosc")
            verify(field.input_value() == "Mosc", locale + " city entry usable")
            field.press("Escape")
            verify(page.locator('#search [data-role="from"] .search-suggest').is_hidden(),
                   locale + " Escape closes autocomplete")
            page.locator(".transport button:not(.tours-tab)").nth(1).click()
            train.click()
            verify(page.locator('#search [data-role="from"] .v2-input').input_value() == "Mosc",
                   locale + " unfinished train input survives tab switch")

            # The 1100px breakpoint must restore desktop nav/footer without
            # discarding the search field, then restore compact controls.
            page.set_viewport_size({"width": 1440, "height": 900})
            page.wait_for_function("() => !document.querySelector('.mobile-menu-toggle')")
            verify(page.locator(".mobile-menu-toggle").count() == 0,
                   locale + " desktop removes mobile menu")
            verify(page.locator(".footer-toggle").count() == 0,
                   locale + " desktop restores original footer markup")
            verify(page.locator('#search [data-role="from"] .v2-input').input_value() == "Mosc",
                   locale + " input survives mobile-to-desktop resize")
            assert_train_glyph(page, locale + "/1440")

            # Real carousel arrow events, both directions, plus native scroll.
            for section in ("routes", "hotels", "reviews"):
                row = page.locator("#" + section + "-row")
                verify(row.count() == 1, locale + " " + section + " row exists")
                metrics = row.evaluate("""el => ({
                  maxScroll:el.scrollWidth-el.clientWidth,
                  cards:el.children.length
                })""")
                verify(metrics["maxScroll"] > 120 and metrics["cards"] >= 5,
                       locale + " " + section + " carousel has overflow items")
                row.evaluate("el => el.scrollLeft = 0")
                nav = page.locator(".carousel-nav[data-carousel='" + section + "']")
                verify(nav.count() == 1, locale + " " + section + " navigation exists")
                button = nav.locator("button").nth(1)
                if button.is_visible():
                    button.click()
                    page.wait_for_function(
                        "selector => document.querySelector(selector).scrollLeft > 20",
                        arg="#" + section + "-row", timeout=6000)
                    previous = row.evaluate("el => el.scrollLeft")
                    verify(previous > 20, locale + " " + section + " next arrow scrolls")
                    nav.locator("button").nth(0).click()
                    page.wait_for_function(
                        "arg => document.querySelector(arg.selector).scrollLeft < arg.max",
                        arg={"selector": "#" + section + "-row", "max": previous-5},
                        timeout=6000)
                    verify(True, locale + " " + section + " previous arrow scrolls back")
                else:
                    verify(row.evaluate("""el => {
                      el.scrollLeft = 130;
                      return el.scrollLeft > 15;
                    }"""), locale + " " + section + " native horizontal scroll")

            for section in ("routes", "hotels"):
                all_card = page.locator("#" + section + " .card--cta")
                verify(all_card.get_attribute("href").startswith("https://"),
                       locale + " " + section + " See all has a working URL")

            page.set_viewport_size({"width": 390, "height": 900})
            page.wait_for_function("() => !!document.querySelector('.mobile-menu-toggle')")
            verify(page.locator(".mobile-menu-toggle").count() == 1,
                   locale + " mobile nav returns after desktop")
            verify(page.locator(".footer-toggle").count() >= 1,
                   locale + " mobile footer returns after desktop")
            verify(page.locator('#search [data-role="from"] .v2-input').input_value() == "Mosc",
                   locale + " search text survives roundtrip resize")
            verify(not page_errors, locale + " no runtime errors after actions: " + repr(page_errors))
            print("PASS", locale, "interactive resizing/menu/carousel", flush=True)
        except Exception as exc:
            msg = locale + "/interactive " + type(exc).__name__ + ": " + str(exc)[:850]
            failures.append(msg)
            print("FAIL", msg, flush=True)
            try:
                page.screenshot(path=str(REPORTS / ("interactive-failed-" + locale + ".png")),
                                full_page=True, timeout=7500)
            except Exception:
                pass
        finally:
            context.close()

    # Sweep additional breakpoints, particularly the gaps between current
    # regression widths; Hindi text must not overflow the document.
    for locale in LANGUAGES:
        context = browser.new_context(
            viewport={"width": 390, "height": 900},
            timezone_id="Europe/Moscow", locale="en-GB")
        page = context.new_page()
        page.route("**/*", lambda route: route.continue_()
                   if urlparse(route.request.url).hostname == "127.0.0.1"
                   else route.abort())
        try:
            open_page(page, locale)
            for width in RESPONSIVE_WIDTHS:
                page.set_viewport_size({"width": width, "height": 900})
                check = page.evaluate("""() => ({
                  viewport:innerWidth,
                  documentWidth:document.documentElement.scrollWidth,
                  toggle:document.querySelectorAll('.mobile-menu-toggle').length,
                  hints:!!document.querySelector('.search-hints-v2') &&
                    getComputedStyle(document.querySelector('.search-hints-v2')).display!=='none'
                })""")
                verify(check["documentWidth"] <= width + 2,
                       locale + "/" + str(width) + " no horizontal page overflow: " + repr(check))
                verify(check["toggle"] == (1 if width <= 1100 else 0),
                       locale + "/" + str(width) + " breakpoint menu count")
                verify(check["hints"] == (width > 1100),
                       locale + "/" + str(width) + " breakpoint hints")
            print("PASS", locale, "13 additional viewport widths", flush=True)
        except Exception as exc:
            msg = locale + "/responsive " + type(exc).__name__ + ": " + str(exc)[:900]
            failures.append(msg)
            print("FAIL", msg, flush=True)
        finally:
            context.close()

    browser.close()

report = {
    "locales": list(LANGUAGES), "additional_breakpoints": RESPONSIVE_WIDTHS,
    "assertions": len(passed), "failures": failures, "passed": not failures,
    "scope": "Local Chromium, no purchases and no third-party network calls"
}
(REPORTS / "landing-interactions.json").write_text(
    json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(report, ensure_ascii=False, indent=2))
if failures:
    sys.exit(1)
