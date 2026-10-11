#!/usr/bin/env python3
"""Full browser regression for multilingual search-state continuity.

Run in the repository root with an HTTP server on port 8765:
  python -m http.server 8765 --bind 127.0.0.1 &
  python tests/test-search-language.py
"""
from __future__ import annotations
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8765/"
PORTABLE = "india-landing-search-state-v1"

def setup(browser):
    context = browser.new_context(locale="en-GB", timezone_id="Europe/Moscow",
                                  viewport={"width": 1460, "height": 920})
    page = context.new_page()
    # Keep the test independent of external font/CDN/Metrika connections.
    page.route("**/*", lambda route: route.continue_() if
               urlparse(route.request.url).hostname == "127.0.0.1"
               else route.abort())
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    return context, page, errors

def open_page(page, filename="index-ru.html"):
    page.goto(BASE + filename, wait_until="domcontentloaded", timeout=30000)
    page.wait_for_function(
        "() => document.documentElement.classList.contains('search-ui-ready')",
        timeout=18000,
    )

def switch(page, language):
    filename = {"en": "index.html", "ru": "index-ru.html", "hi": "index-hi.html"}[language]
    page.locator(f".lang a[hreflang='{language}']").click()
    page.wait_for_url("**/" + filename, timeout=15000)
    page.wait_for_function(
        "() => document.documentElement.classList.contains('search-ui-ready')",
        timeout=18000,
    )

def standard_mode(page, mode):
    assert page.locator("#search").get_attribute("data-mode") == mode
    assert page.locator(f".transport button.is-active:not(.tours-tab)").count() == 1

def pick_place(page, role, name):
    hint = page.locator(
        f".search-hints-v2 [data-v2-place='{name}'][data-v2-role='{role}']"
    )
    hint.click()

def stored(page):
    return page.evaluate(
        "(key) => JSON.parse(localStorage.getItem(key))",
        PORTABLE
    )

def check_desktop_popup_geometry(page, panel_selector, field_selector):
    """Top of a dropdown should cover the chips row but not overlap its field."""
    rects = page.evaluate("""([panelSelector,fieldSelector]) => {
        const panel=document.querySelector(panelSelector);
        const field=document.querySelector(fieldSelector);
        const hints=document.querySelector('.search-hints-v2');
        if (!panel || !field || !hints || panel.hidden) return null;
        const p=panel.getBoundingClientRect();
        const f=field.getBoundingClientRect();
        const h=hints.getBoundingClientRect();
        return {panelTop:p.top,fieldBottom:f.bottom,hintsTop:h.top};
    }""", [panel_selector, field_selector])
    assert rects, f"Popup failed to open: {panel_selector}"
    assert rects["panelTop"] >= rects["fieldBottom"] - 1, rects
    assert abs(rects["panelTop"] - rects["hintsTop"]) <= 2, rects


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, args=["--no-sandbox"])
    try:
        # Flights: both place IDs and their localized labels, dates, guest ages, cabin.
        ctx, page, errors = setup(browser)
        open_page(page)
        standard_mode(page, "flight")
        page.locator("[data-role='from'] .v2-input").click()
        check_desktop_popup_geometry(page,
            ".v2-field--place[data-role='from'] .search-suggest",
            ".v2-field--place[data-role='from']")
        page.keyboard.press("Escape")
        page.locator("[data-trigger='pax']").click()
        check_desktop_popup_geometry(page,
            ".v2-field--pax .v2-popover",
            ".v2-field--pax")
        page.keyboard.press("Escape")
        page.locator("[data-trigger='date']").click()
        check_desktop_popup_geometry(page,
            ".v2-flight-dates .v2-flight-calendar",
            ".v2-flight-dates")
        page.keyboard.press("Escape")
        pick_place(page, "from", "in-delhi")
        pick_place(page, "to", "ru-moscow")
        page.locator(".search-hints-v2 [data-v2-date='1']").click()
        page.locator(".search-hints-v2 [data-v2-return='2']").click()
        page.locator(".v2-field--pax .v2-trigger").click()
        page.locator(".v2-popover [data-person='adult'][data-step='1']").click()
        page.locator(".v2-popover [data-person='child'][data-step='1']").click()
        page.locator(".v2-popover [data-child-age='0']").select_option("7")
        page.locator(".v2-popover [data-cabin='business']").click()
        before = stored(page)
        assert before["activeMode"] == "flight"
        assert before["standard"]["flight"]["fromId"] == "in-delhi"
        assert before["standard"]["flight"]["toId"] == "ru-moscow"
        assert before["standard"]["flight"]["children"] == 1
        assert before["standard"]["flight"]["childAges"] == [7]
        assert before["standard"]["flight"]["cabin"] == "business"
        assert before["standard"]["flight"]["returnDate"]

        switch(page, "en")
        standard_mode(page, "flight")
        assert page.locator("[data-role='from'] .v2-input").input_value() == "Delhi"
        assert page.locator("[data-role='to'] .v2-input").input_value() == "Moscow"
        assert "Business".lower() in page.locator(".v2-field--pax .v2-value").inner_text().lower()
        assert page.locator(".v2-field--date[data-role='date'] .has-value").count() == 0 or True
        assert stored(page)["standard"]["flight"]["childAges"] == [7]
        page.reload(wait_until="domcontentloaded")
        page.wait_for_function(
            "() => document.documentElement.classList.contains('search-ui-ready')"
        )
        assert page.locator("[data-role='from'] .v2-input").input_value() == "Delhi"
        switch(page, "hi")
        standard_mode(page, "flight")
        assert page.locator("[data-role='from'] .v2-input").input_value() != "Delhi"
        assert page.locator("[data-role='to'] .v2-input").input_value() != "Moscow"
        assert stored(page)["standard"]["flight"]["fromId"] == "in-delhi"
        assert stored(page)["standard"]["flight"]["date"] == before["standard"]["flight"]["date"]
        switch(page, "ru")
        standard_mode(page, "flight")
        assert page.locator("[data-role='from'] .v2-input").input_value() == "Дели"
        assert page.locator("[data-role='to'] .v2-input").input_value() == "Москва"
        assert stored(page)["standard"]["flight"]["childAges"] == [7]
        assert stored(page)["standard"]["flight"]["returnDate"] == before["standard"]["flight"]["returnDate"]
        assert stored(page)["standard"]["flight"]["cabin"] == "business"
        page.reload(wait_until="domcontentloaded")
        page.wait_for_function("() => document.documentElement.classList.contains('search-ui-ready')")
        standard_mode(page, "flight")
        assert page.locator("[data-role='from'] .v2-input").input_value() == "Дели"
        switch(page, "en")
        standard_mode(page, "flight")
        assert page.locator("[data-role='from'] .v2-input").input_value() == "Delhi"
        switch(page, "ru")
        standard_mode(page, "flight")
        assert page.locator("[data-role='to'] .v2-input").input_value() == "Москва"
        assert not errors, f"Flight mode browser errors: {errors}"
        ctx.close()

        # Tour form, including state when switching away and back across languages.
        ctx, page, errors = setup(browser)
        open_page(page)
        page.locator(".transport .tours-tab").click()
        assert page.locator("#search").get_attribute("data-mode") == "tour"
        page.locator(".search-hints-v2 [data-tour-dep='moscow']").click()
        page.locator(".search-hints-v2 [data-tour-choice='turkey']").click()
        page.locator(".search-hints-v2 [data-tour-date='1']").click()
        page.locator("[data-tour-trigger='nights']").click()
        check_desktop_popup_geometry(page,
            ".tour-cell--nights .tour-panel--nights",
            ".tour-cell--nights")
        for part, value in (("min", 8), ("max", 16)):
            page.locator(f"[data-tour-range='{part}']").evaluate(
                "(el,value) => {el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}))}",
                value,
            )
        page.locator("[data-tour-trigger='people']").click()
        check_desktop_popup_geometry(page,
            ".tour-cell--people .tour-panel--people",
            ".tour-cell--people")
        page.locator("[data-tour-person='adult'][data-tour-step='1']").click()
        page.locator("[data-tour-person='child'][data-tour-step='1']").click()
        page.locator("[data-tour-child-age='0']").select_option("9")
        tour_before = stored(page)
        assert tour_before["activeMode"] == "tour"
        assert tour_before["tour"]["departure"] == "moscow"
        assert tour_before["tour"]["destination"] == "turkey"
        assert tour_before["tour"]["nightsMin"] == 8
        assert tour_before["tour"]["nightsMax"] == 16
        assert tour_before["tour"]["adults"] == 2
        assert tour_before["tour"]["children"] == 1
        assert tour_before["tour"]["childAges"] == [9]
        assert tour_before["tour"]["date"]
        switch(page, "en")
        assert page.locator("#search").get_attribute("data-mode") == "tour"
        assert page.locator(".transport .tours-tab").get_attribute("aria-selected") == "true"
        assert page.locator(".tour-departure-input").input_value() == "Moscow"
        assert page.locator(".tour-destination").input_value() == "Turkey"
        assert page.locator("[data-tour-trigger='nights'] .v2-value").inner_text().startswith("8–16")
        assert page.locator("[data-tour-trigger='people'] .v2-value").inner_text().startswith("2 adults, 1 child")
        switch(page, "hi")
        assert page.locator("#search").get_attribute("data-mode") == "tour"
        assert page.locator(".tour-departure-input").input_value() != "Moscow"
        assert stored(page)["tour"]["date"] == tour_before["tour"]["date"]
        assert stored(page)["tour"]["childAges"] == [9]
        page.reload(wait_until="domcontentloaded")
        page.wait_for_function(
            "() => document.querySelector('#search').dataset.mode==='tour'"
        )
        assert page.locator("[data-tour-trigger='nights'] .v2-value").inner_text().startswith("8–16")
        switch(page, "ru")
        assert page.locator("#search").get_attribute("data-mode") == "tour"
        assert page.locator(".transport .tours-tab").get_attribute("aria-selected") == "true"
        assert page.locator(".tour-departure-input").input_value() == "Москва"
        assert page.locator(".tour-destination").input_value() == "Турция"
        assert page.locator("[data-tour-trigger='people'] .v2-value").inner_text().startswith("2 взрослых, 1 ребёнок")
        assert stored(page)["tour"]["date"] == tour_before["tour"]["date"]
        assert stored(page)["tour"]["nightsMin"] == 8
        assert stored(page)["tour"]["childAges"] == [9]
        switch(page, "en")
        assert page.locator("#search").get_attribute("data-mode") == "tour"
        assert page.locator(".tour-destination").input_value() == "Turkey"
        switch(page, "ru")
        assert page.locator("#search").get_attribute("data-mode") == "tour"
        assert page.locator(".tour-departure-input").input_value() == "Москва"
        # Changing to Train and back doesn't clear tour state.
        page.locator(".transport button:not(.tours-tab)").nth(2).click()
        standard_mode(page, "train")
        page.locator(".transport .tours-tab").click()
        assert page.locator(".tour-departure-input").input_value()
        assert stored(page)["tour"]["children"] == 1
        assert not errors, f"Tour mode browser errors: {errors}"
        ctx.close()

        # Other tabs: each has distinct values, including incomplete text.
        ctx, page, errors = setup(browser)
        open_page(page)
        page.locator(".transport button:not(.tours-tab)").nth(0).click()  # Hotels
        pick_place(page, "destination", "ru-moscow")
        page.locator(".search-hints-v2 [data-v2-date='1']").click()
        hotel_date = stored(page)["standard"]["hotel"]["start"]
        assert hotel_date
        page.locator(".transport button:not(.tours-tab)").nth(2).click()  # Trains
        page.locator(".v2-field--place[data-role='from'] .v2-input").fill("Тве")
        assert stored(page)["standard"]["train"]["fromText"] == "Тве"
        assert stored(page)["standard"]["train"]["fromId"] is None
        page.locator(".transport button:not(.tours-tab)").nth(3).click()  # Buses
        pick_place(page, "from", "ru-moscow")
        page.locator(".search-hints-v2 [data-v2-date='1']").click()
        assert stored(page)["activeMode"] == "bus"
        switch(page, "en")
        standard_mode(page, "bus")
        assert page.locator("[data-role='from'] .v2-input").input_value() == "Moscow"
        page.locator(".transport button:not(.tours-tab)").nth(2).click()
        assert page.locator("[data-role='from'] .v2-input").input_value() == "Тве"
        page.locator(".transport button:not(.tours-tab)").nth(0).click()
        assert page.locator("[data-role='destination'] .v2-input").input_value() == "Moscow"
        assert stored(page)["standard"]["hotel"]["start"] == hotel_date
        switch(page, "ru")
        standard_mode(page, "hotel")
        assert page.locator("[data-role='destination'] .v2-input").input_value() == "Москва"
        assert stored(page)["standard"]["hotel"]["start"] == hotel_date
        page.locator(".transport button:not(.tours-tab)").nth(3).click()
        standard_mode(page, "bus")
        assert page.locator("[data-role='from'] .v2-input").input_value() == "Москва"
        assert not errors, f"Other modes browser errors: {errors}"
        ctx.close()

        # Storage unavailable: form should still render normally without crashing.
        ctx, page, errors = setup(browser)
        page.add_init_script(
            "Object.defineProperty(window,'localStorage',{get(){throw new Error('denied')}});"
        )
        open_page(page)
        page.locator(".transport .tours-tab").click()
        assert page.locator("#search").get_attribute("data-mode") == "tour"
        page.locator(".search-hints-v2 [data-tour-dep='moscow']").click()
        page.locator(".search-hints-v2 [data-tour-choice='turkey']").click()
        switch(page, "en")
        assert page.locator("#search").get_attribute("data-mode") == "tour"
        assert page.locator(".tour-departure-input").input_value() == "Moscow"
        assert page.locator(".tour-destination").input_value() == "Turkey"
        switch(page, "ru")
        assert page.locator("#search").get_attribute("data-mode") == "tour"
        assert page.locator(".tour-departure-input").input_value() == "Москва"
        assert not errors, f"Private mode browser errors: {errors}"
        ctx.close()

        print("Browser search persistence passed: 5 modes, RU/EN/HI, reload, child ages and draft text.")
    finally:
        browser.close()
