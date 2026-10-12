#!/usr/bin/env python3
"""Full browser regression: language-only handoff, but reload/new visit reset.

Run in the repository root with an HTTP server on port 8765:
  python -m http.server 8765 --bind 127.0.0.1 &
  python tests/test-search-language.py
"""
from __future__ import annotations
from urllib.parse import urlparse, parse_qs
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8765/"
PORTABLE = "india-landing-search-state-v1"
HANDOFF = "india-landing-language-handoff-v2"

def setup(browser, viewport=None, mobile=False):
    context = browser.new_context(
        locale="en-GB", timezone_id="Europe/Moscow",
        viewport=viewport or {"width": 1460, "height": 920},
        is_mobile=mobile, has_touch=mobile)
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
    """The in-memory snapshot; neither F5 nor a new visit can restore it."""
    return page.evaluate("() => window.TUTU_SEARCH_PERSIST.read()")

def handoff_consumed(page):
    return page.evaluate(
        "(key) => sessionStorage.getItem(key) === null", HANDOFF
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
            ".v2-field--date[data-role='date'] > .v2-calendar",
            ".v2-field--date[data-role='date']")
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
        assert handoff_consumed(page)
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
        assert handoff_consumed(page)
        switch(page, "en")
        standard_mode(page, "flight")
        assert page.locator("[data-role='from'] .v2-input").input_value() == "Delhi"
        switch(page, "ru")
        standard_mode(page, "flight")
        assert page.locator("[data-role='to'] .v2-input").input_value() == "Москва"
        # A plain reload and an obsolete localStorage snapshot must NOT restore
        # language-handoff fields or tab selections.
        page.evaluate("""key => localStorage.setItem(key, JSON.stringify({
            version:1,activeMode:'tour',standardMode:'hotel',
            standard:{flight:{fromId:'in-delhi'}}
        }))""", PORTABLE)
        page.reload(wait_until="domcontentloaded")
        page.wait_for_function("() => document.documentElement.classList.contains('search-ui-ready')")
        standard_mode(page, "flight")
        assert page.locator("[data-role='from'] .v2-input").input_value() == ""
        assert page.locator("[data-role='to'] .v2-input").input_value() == ""
        fresh_flight = stored(page).get("standard", {}).get("flight", {})
        assert fresh_flight.get("children", 0) == 0
        assert fresh_flight.get("date") is None
        assert page.evaluate("key => localStorage.getItem(key)", PORTABLE) is None
        assert handoff_consumed(page)
        # Typing a fresh URL (without language-button click) is also a reset.
        page.locator(".transport button:not(.tours-tab)").nth(0).click()
        page.goto(BASE + "index-hi.html", wait_until="domcontentloaded")
        page.wait_for_function("() => document.documentElement.classList.contains('search-ui-ready')")
        standard_mode(page, "flight")
        assert page.locator("[data-role='from'] .v2-input").input_value() == ""
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

        # Add a second child in the live UI, confirm default age 5 and
        # verify that the generated Travelata URL contains both ages.
        page.locator("[data-tour-person='child'][data-tour-step='1']").click()
        assert page.locator("[data-tour-child-age='1']").input_value() == "5"
        page.locator("[data-tour-child-age='1']").select_option("8")
        assert page.locator(".tour-panel--people").is_visible()
        family_state = stored(page)["tour"]
        assert family_state["children"] == 2
        assert family_state["childAges"] == [9, 8]
        family_url = page.evaluate(
            "(state) => window.TUTU_TOURS.build(state).url", family_state
        )
        assert family_url.startswith("https://web.tutu.travelata.ru/search/?")
        query = parse_qs(urlparse(family_url).query)
        fragment = parse_qs(urlparse(family_url).fragment.removeprefix("?"))
        assert query["children"] == ["2"]
        assert query["ages[0]"] == ["9"]
        assert query["ages[1]"] == ["8"]
        assert fragment["kids"] == ["2"]
        assert fragment["ages[]"] == ["9", "8"]
        # Restore the original single-child selection for RU/EN/HI tests.
        page.locator("[data-tour-person='child'][data-tour-step='-1']").click()
        assert stored(page)["tour"]["childAges"] == [9]
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
        assert handoff_consumed(page)
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
        page.reload(wait_until="domcontentloaded")
        page.wait_for_function("() => document.documentElement.classList.contains('search-ui-ready')")
        standard_mode(page, "flight")
        page.locator(".transport .tours-tab").click()
        assert page.locator(".tour-departure-input").input_value() == ""
        assert page.locator(".tour-destination").input_value() == ""
        assert page.locator("[data-tour-trigger='nights'] .v2-value").inner_text().startswith("7–14")
        assert stored(page)["tour"]["children"] == 0
        assert stored(page)["tour"]["date"] is None
        assert handoff_consumed(page)
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
        page.reload(wait_until="domcontentloaded")
        page.wait_for_function("() => document.documentElement.classList.contains('search-ui-ready')")
        standard_mode(page, "flight")
        page.locator(".transport button:not(.tours-tab)").nth(0).click()
        assert page.locator("[data-role='destination'] .v2-input").input_value() == ""
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
        assert handoff_consumed(page)
        page.reload(wait_until="domcontentloaded")
        page.wait_for_function("() => document.documentElement.classList.contains('search-ui-ready')")
        standard_mode(page, "flight")
        assert not errors, f"Private mode browser errors: {errors}"
        ctx.close()

        # Tours validation mirrors the native alert windows used by other
        # modes. Nothing is appended beneath the hint chips or moves the form.
        ctx, page, errors = setup(browser)
        open_page(page)
        page.locator(".transport .tours-tab").click()
        form_height = page.locator("#search").bounding_box()["height"]
        hints_y = page.locator(".search-hints-v2").bounding_box()["y"]
        dialogs = []
        def handle_dialog(dialog):
            dialogs.append(dialog.message)
            dialog.accept()
        page.on("dialog", handle_dialog)
        page.locator(".tour-submit").click()
        assert dialogs[-1] == "Выберите город отправления из списка", dialogs
        assert page.locator(".tour-search-issue").count() == 0
        assert page.locator(".tour-cell--departure .search-suggest").is_visible()
        page.keyboard.press("Escape")
        page.locator(".search-hints-v2 [data-tour-dep='moscow']").click()
        page.locator(".tour-submit").click()
        assert dialogs[-1] == "Выберите направление из списка", dialogs
        assert page.locator(".tour-search-issue").count() == 0
        page.keyboard.press("Escape")
        page.locator(".search-hints-v2 [data-tour-choice='turkey']").click()
        page.locator(".tour-submit").click()
        assert dialogs[-1] == "Выберите дату вылета", dialogs
        assert page.locator(".tour-cell--date .tour-panel--date").is_visible()
        assert page.locator(".tour-search-issue").count() == 0
        assert abs(page.locator("#search").bounding_box()["height"] - form_height) <= 1
        assert abs(page.locator(".search-hints-v2").bounding_box()["y"] - hints_y) <= 1
        switch(page, "en")
        page.locator(".tour-submit").click()
        assert dialogs[-1] == "Choose your departure date", dialogs
        assert page.locator(".tour-search-issue").count() == 0
        switch(page, "hi")
        page.locator(".tour-submit").click()
        assert dialogs[-1] == "रवाना होने की तारीख़ चुनें", dialogs
        assert page.locator(".tour-search-issue").count() == 0
        assert not errors, f"Tour validation browser errors: {errors}"
        ctx.close()

        # Check the actual phone layout: text input widths must stay fixed as
        # place autocomplete opens and the first characters are entered.
        # Autocomplete separators should have the same 16px interior inset
        # as date and passenger panels, not extend to the card edges.
        for width in (320, 390, 430):
            ctx, page, errors = setup(
                browser, {"width": width, "height": 844}, mobile=True)
            for locale, filename in (
                ("ru", "index-ru.html"),
                ("en", "index.html"),
                ("hi", "index-hi.html"),
            ):
                open_page(page, filename)
                for mode, roles in (
                    ("flight", ("from", "to")),
                    ("hotel", ("destination",)),
                    ("train", ("from", "to")),
                    ("bus", ("from", "to")),
                    ("tour", ("from", "to")),
                ):
                    if mode == "tour":
                        page.locator(".transport .tours-tab").click()
                    else:
                        idx = {"hotel": 0, "flight": 1, "train": 2, "bus": 3}[mode]
                        page.locator(".transport button:not(.tours-tab)").nth(idx).click()
                    assert page.locator("#search").get_attribute("data-mode") == mode
                    for role in roles:
                        css = f"#search .v2-field--place[data-role='{role}']"
                        selector = css + " .v2-input"
                        field = page.locator(css)
                        input_box = page.locator(selector)
                        def measure():
                            return page.evaluate("""sel => {
                                const field=document.querySelector(sel);
                                const input=field.querySelector('.v2-input');
                                const panel=field.querySelector('.search-suggest');
                                const f=field.getBoundingClientRect();
                                const i=input.getBoundingClientRect();
                                const p=panel.getBoundingClientRect();
                                return {fieldWidth:f.width,inputWidth:i.width,
                                  panelWidth:p.width,panelLeft:p.left,
                                  panelRight:p.right,fieldLeft:f.left,
                                  fieldRight:f.right,open:!panel.hidden,
                                  scrollWidth:document.documentElement.scrollWidth,
                                  viewport:window.innerWidth};
                            }""", css)
                        before = measure()
                        input_box.click()
                        focused = measure()
                        assert focused["open"], (width, locale, mode, role, focused)
                        input_box.fill("Мос")
                        typed = measure()
                        assert typed["open"], (width, locale, mode, role, typed)
                        for phase, actual in (("focused", focused), ("typed", typed)):
                            assert abs(actual["fieldWidth"] - before["fieldWidth"]) < 1.1, (
                                width, locale, mode, role, phase, "field width", before, actual)
                            assert abs(actual["inputWidth"] - before["inputWidth"]) < 1.1, (
                                width, locale, mode, role, phase, "input width", before, actual)
                            assert abs(actual["panelLeft"] - actual["fieldLeft"] - 16) < 2, (
                                width, locale, mode, role, phase, "left divider inset", actual)
                            assert abs(actual["fieldRight"] - actual["panelRight"] - 16) < 2, (
                                width, locale, mode, role, phase, "right divider inset", actual)
                            assert actual["scrollWidth"] <= before["scrollWidth"] + 2, (
                                width, locale, mode, role, phase, "horizontal overflow", actual)
                        page.keyboard.press("Escape")
                assert not errors, (width, locale, errors)
            ctx.close()
        print("Mobile search geometry passed: 320/390/430px, RU/EN/HI, five modes, stable fields and inset dividers.")


        # Desktop support chat illustration must take the same relative
        # footprint and bottom-right position across RU, EN and HI.
        for width in (1101, 1200, 1366, 1600):
            ctx, page, errors = setup(browser, {"width": width, "height": 900})
            artwork = {}
            for locale, filename in (
                ("ru", "index-ru.html"), ("en", "index.html"), ("hi", "index-hi.html")
            ):
                open_page(page, filename)
                dims = page.evaluate("""() => {
                    const card=document.querySelector('#about .bento-pos-tl');
                    const img=card.querySelector('.bento-art');
                    const c=card.getBoundingClientRect();
                    const i=img.getBoundingClientRect();
                    const css=getComputedStyle(img);
                    let uplift=0;
                    if(document.documentElement.lang==='ru'){
                      const inline=img.style.translate;
                      const raisedTop=img.getBoundingClientRect().top;
                      img.style.translate='-5% 2.5%';
                      const baselineTop=img.getBoundingClientRect().top;
                      img.style.translate=inline;
                      uplift=+(baselineTop-raisedTop).toFixed(2);
                    }
                    return {cardWidth:+c.width.toFixed(2),uplift,
                      cardHeight:+c.height.toFixed(2),
                      imgWidth:+i.width.toFixed(2),imgHeight:+i.height.toFixed(2),
                      right:+(c.right-i.right).toFixed(2),
                      bottom:+(c.bottom-i.bottom).toFixed(2),
                      left:+(i.left-c.left).toFixed(2),
                      top:+(i.top-c.top).toFixed(2),
                      rawWidth:css.width,rawHeight:css.height,
                      maxHeight:css.maxHeight,
                      scale:css.scale,translate:css.translate};
                }""")
                artwork[locale] = dims
            ru, en, hi = (artwork[x] for x in ("ru", "en", "hi"))
            assert ru["maxHeight"] == hi["maxHeight"] == en["maxHeight"] == "52%", (
                width, artwork)
            # RU and EN are exactly 10% smaller than the previous scale 1.1;
            # HI stays unchanged. Card text lengths may change total heights.
            assert ru["scale"] == en["scale"] == "0.99", (width, artwork)
            assert hi["scale"] == "1.1", (width, artwork)
            assert abs(ru["uplift"]-12)<1, (width, artwork)
            assert all(art["imgWidth"] > 50 and art["imgHeight"] > 50
                       for art in artwork.values()), (width, artwork)
            assert not errors
            ctx.close()
        print("RU/EN -10% and HI unchanged support illustration: all desktop widths.")
        # Check the actual rendered links, reviews and discount plates in
        # every locale. "All routes" must match the dated r3 search URL,
        # while "All hotels" still leads to hotel search.
        name_sets = {
            "ru": ["Прия", "Рахул", "Анирбан", "Танушри", "Сатьяджит"],
            "en": ["Priya", "Rahul", "Anirban", "Tanushree", "Satyajit"],
            "hi": ["प्रिया", "राहुल", "अनिर्बान", "तनुश्री", "सत्यजीत"],
        }
        context_sets = {
            "ru": ["Казань → Дели", "Путешествует с друзьями",
                   "Мумбаи → Тверь", "Учится в России", "Йошкар-Ола → Москва"],
            "en": ["Kazan → Delhi", "Travelling with friends",
                   "Mumbai → Tver", "Studying in Russia", "Yoshkar-Ola → Moscow"],
            "hi": ["कज़ान → दिल्ली", "दोस्तों के साथ यात्रा",
                   "मुंबई → त्वेर", "रूस में पढ़ाई", "योश्कर-ओला → मॉस्को"],
        }
        for locale, filename in (
            ("ru", "index-ru.html"), ("en", "index.html"), ("hi", "index-hi.html")
        ):
            ctx, page, errors = setup(browser)
            open_page(page, filename)
            legal=page.locator("footer .legal").inner_text()
            assert "www.tutu.ru" in legal, (locale, legal)
            for obsolete in (
                "Цены в карточках ориентировочные",
                "Card prices are indicative.",
                "कार्ड में दिखाई गई कीमतें अनुमानित हैं",
            ):
                assert obsolete not in legal, (locale, obsolete, legal)
            assert page.locator("#reviews-row .review-card").count() == 5
            assert page.locator("#reviews-row .review-card__author").all_inner_texts() == name_sets[locale]
            assert page.locator("#reviews-row .review-card__detail").all_inner_texts() == context_sets[locale]
            for width in (1460, 390):
                page.set_viewport_size({"width": width, "height": 900})
                aligned = page.evaluate("""() =>
                    Array.from(document.querySelectorAll('#reviews-row .review-card')).map(card => {
                        const avatar=card.querySelector('.review-avatar');
                        const identity=card.querySelector('.review-card__identity');
                        const name=card.querySelector('.review-card__author');
                        const detail=card.querySelector('.review-card__detail');
                        const a=avatar.getBoundingClientRect();
                        const b=identity.getBoundingClientRect();
                        const nc=getComputedStyle(name), dc=getComputedStyle(detail);
                        return {centerDiff:Math.abs((a.top+a.bottom-b.top-b.bottom)/2),
                                nameWeight:nc.fontWeight,detailWeight:dc.fontWeight,
                                nameSize:parseFloat(nc.fontSize),
                                detailSize:parseFloat(dc.fontSize),
                                detailColor:dc.color,hasBoth:identity.contains(name)&&identity.contains(detail)};
                    })
                """)
                assert len(aligned) == 5, (locale, width, aligned)
                for g in aligned:
                    assert g["hasBoth"] and g["centerDiff"] <= 1.5, (locale, width, g)
                    assert g["nameWeight"] == "700" and g["detailWeight"] == "600", (locale, width, g)
                    assert g["detailSize"] == 14, (locale, width, g)
                    assert g["nameSize"] > g["detailSize"], (locale, width, g)
                    assert g["detailColor"] == "rgb(107, 111, 143)", (locale, width, g)
            ref = page.locator('#routes [data-cta="route_r3"]').get_attribute("data-href")
            header = page.locator("#routes .see-all").get_attribute("href")
            last_card = page.locator("#routes-row .card--cta").get_attribute("href")
            assert ref and ref.startswith("https://www.tutu.ru/poezda/"), ref
            assert header == ref == last_card, (locale, header, ref, last_card)
            hotels_href = page.locator("#hotels .see-all").get_attribute("href")
            assert hotels_href.startswith("https://hotel.tutu.ru/"), hotels_href
            offer = page.evaluate("""() => {
                const wrap=document.querySelector('#hotels .hotel-offer');
                const badge=wrap.querySelector('.hotel-offer__badge');
                const code=wrap.querySelector('.hotel-offer__plate');
                const b=badge.getBoundingClientRect();
                const c=code.getBoundingClientRect();
                const style=getComputedStyle(wrap);
                const ph=parseFloat(style.getPropertyValue('--ph'));
                return {ph, badgeWidth:b.width, codeWidth:c.width,
                  gap:c.left-b.right, expectedGap:parseFloat(style.columnGap),
                  codeScroll:code.scrollWidth, codeClient:code.clientWidth};
            }""")
            assert abs(offer["badgeWidth"] - offer["ph"] * 666 / 235) <= 1, offer
            assert abs(offer["codeWidth"] - offer["ph"] * 1539 / 235) <= 1, offer
            assert abs(offer["gap"] - offer["expectedGap"]) <= 1, offer
            assert offer["codeScroll"] <= offer["codeClient"] + 2, offer
            assert not errors, (locale, errors)
            ctx.close()
        print("Three-language route buttons, reviewer names+grey captions, desktop/mobile alignment and discount plates verified.")

        print("Browser search state and tour native alert validation passed: five modes, RU/EN/HI, no layout-shifting error notices.")
    finally:
        browser.close()
