#!/usr/bin/env python3
"""Read date-specific minimum bookable prices in an ordinary public Tutu browser.

This job does not use internal APIs, accounts, hidden endpoints, CAPTCHA bypass,
or ambiguous undated/SEO prices. At most one page is open at a time.

A missing/unavailable/mismatched offer is omitted from the JSON snapshot.
The website keeps an illustrative fallback instead of manufacturing a price.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timedelta, date
from pathlib import Path
from urllib.parse import urlencode, urlparse
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
TARGETS = ROOT / "scripts" / "price-targets.json"
MOSCOW = ZoneInfo("Europe/Moscow")
MONTHS = ("янв", "фев", "мар", "апр", "мая", "июн", "июл",
          "авг", "сен", "окт", "ноя", "дек")
VALID_HOSTS = {"www.tutu.ru", "avia.tutu.ru", "hotel.tutu.ru"}
# Tutu displays number grouping with nonbreaking spaces and word joiners.
INVISIBLE = str.maketrans("", "", "\u2009\u2060\u00a0\u202f\u200b\u200a\u2007")
CURRENCY_RE = re.compile(r"(?<!\d)(\d{1,3}(?:[ \t]\d{3})+|\d{3,7})\s*₽")
MAX_PER_CARD = 2_000_000


def clean(text: str) -> str:
    return str(text).translate(INVISIBLE)


def rubles(text: str) -> list[int]:
    amounts = [int(num.replace(" ", "").replace("\t", ""))
               for num in CURRENCY_RE.findall(clean(text))]
    return [value for value in amounts if 100 <= value <= MAX_PER_CARD]


def stamp(day: date) -> str:
    return f"{day.day} {MONTHS[day.month - 1]}"


def route_minimum(text: str, day: date, kind: str) -> int | None:
    """Read the minimum summary of the SELECTED day's booking results.

    The search page also contains unavailable "~" fares, other-day prices,
    partner hotels and ancillary fees. Never take a global regex minimum.
    """
    text = clean(text)
    if stamp(day) not in text:
        return None
    if kind == "flight":
        if "Выбрать билет" not in text:
            return None
        match = re.search(r"Авиа\s*от\s*(\d{3,7})\s*₽", text, re.I)
    elif kind == "train":
        if "Выбрать места" not in text:
            return None
        match = re.search(r"Ж/д\s*от\s*(\d{3,7})\s*₽", text, re.I)
    else:
        return None
    value = int(match.group(1)) if match else None
    return value if value and 100 <= value <= MAX_PER_CARD else None


def hotel_minimum(text: str) -> int | None:
    """Read room offers only, for ONE guest and ONE night.

    Ancillary charges in the 'About hotel' section and crossed-out original
    prices are excluded. Extract only amounts preceding a bookable room button.
    """
    body = clean(text)
    begin = body.find("Доступные варианты")
    if begin < 0:
        return None
    end = body.find("Об отеле и заселении", begin)
    offers = body[begin:end if end >= 0 else len(body)]
    if not re.search(r"Доступные варианты\s*на\s*1\s*ночь", offers):
        return None
    hits = []
    for match in re.finditer(r"1\s*ночь,\s*1\s*гость", offers):
        if "Забронировать" not in offers[match.end():match.end() + 95]:
            continue
        # Each rate has one or two listed amounts: bookable and original.
        # Adjacent rooms, breakfast charges and cashback figures are ignored.
        adjacent = rubles(offers[max(0, match.start() - 105):match.start()])
        if adjacent:
            hits.append(min(adjacent[-2:]))
    return min(hits) if hits else None


def name_ok(expected: str, title: str) -> bool:
    norm = lambda value: re.sub(r"[^\w]+", "", value.casefold().replace("ё", "е"))
    # Avoid accidentally assigning another property's price to this card.
    # A booking title may add a locality/brand qualifier between name words,
    # e.g. "Novotel Москва Аэропорт Шереметьево" for "Novotel Шереметьево".
    words = [norm(word) for word in expected.split() if len(norm(word)) >= 4]
    title_normalized = norm(title)
    return bool(words and all(word in title_normalized for word in words))


def dated_link(kind: str, target: dict, day: date) -> str:
    url = str(target["url"])
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.hostname not in VALID_HOSTS:
        raise ValueError("Target URL must be on a supported HTTPS Tutu host")
    if parsed.query or parsed.fragment:
        raise ValueError("Unverified query/fragment in configured base URL")
    if kind == "flight":
        if parsed.hostname != "avia.tutu.ru":
            raise ValueError("Flight must use avia.tutu.ru")
        params = {"class": "Y", "travelers": "1",
                  "route[0]": f"{target['fromId']}-{day:%d%m%Y}-{target['toId']}"}
    elif kind == "train":
        if parsed.hostname != "www.tutu.ru":
            raise ValueError("Train must use www.tutu.ru")
        params = {"date": day.strftime("%d.%m.%Y"), "travelers": "1"}
    elif kind == "hotel":
        if parsed.hostname != "hotel.tutu.ru":
            raise ValueError("Hotel must use hotel.tutu.ru")
        params = {"check_in": day.isoformat(),
                  "check_out": (day + timedelta(days=1)).isoformat(),
                  "room[0]": "1"}
    else:
        raise ValueError(f"Unknown search kind: {kind}")
    return url + "?" + urlencode(params)


def extract_page(page, group: str, target: dict, day: date) -> int | None:
    """Wait for rendered, date-specific booking results and parse only their prices."""
    from playwright.sync_api import TimeoutError as PlaywrightTimeoutError

    kind = "hotel" if group == "hotels" else target["kind"]
    url = dated_link(kind, target, day)
    try:
        response = page.goto(url, wait_until="domcontentloaded", timeout=30000)
        if response is None or response.status != 200:
            return None
        if kind == "hotel":
            ready = "Забронировать"  # wait until at least one rate actually loads
        elif kind == "flight":
            ready = "Выбрать билет"
        else:
            ready = "Выбрать места"
        try:
            page.wait_for_function(
                "marker => document.body && document.body.innerText.includes(marker)",
                arg=ready, timeout=15000
            )
        except PlaywrightTimeoutError:
            return None
        page.wait_for_timeout(650)  # allow the last price tiles to finish rendering
        text = page.locator("body").inner_text(timeout=12000)
        if kind == "hotel":
            if not name_ok(target["name"], page.title()):
                print("::warning::Hotel name mismatch; refusing to use quote:", target["name"])
                return None
            return hotel_minimum(text)
        return route_minimum(text, day, kind)
    except Exception as exc:
        # Any network failure, anti-bot screen or script problem is a miss.
        print("::warning::Public booking search unavailable:", kind,
              type(exc).__name__, str(exc).split("\n")[0][:180])
        return None


def scrape(day: date, only: set[str] | None = None) -> dict:
    from playwright.sync_api import sync_playwright

    targets = json.loads(TARGETS.read_text(encoding="utf-8"))
    routes = targets["routes"]
    hotels = targets["hotels"]
    prices = {"routes": {}, "hotels": {}}
    tasks = [(group, key, conf) for group, table in
             (("routes", routes), ("hotels", hotels))
             for key, conf in table.items()
             if only is None or key in only]
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        context = browser.new_context(
            locale="ru-RU", timezone_id="Europe/Moscow",
            viewport={"width": 1440, "height": 1000}
        )
        try:
            for group, key, target in tasks:
                page = context.new_page()
                try:
                    value = extract_page(page, group, target, day)
                    if value is None:
                        print(f"SKIP {key}: dated bookable minimum not established")
                    else:
                        prices[group][key] = value
                        print(f"FOUND {key}: {value} RUB for {day.isoformat()}")
                finally:
                    page.close()
        finally:
            context.close()
            browser.close()
    return prices


def self_test() -> None:
    day = date(2026, 10, 12)
    group = "5\u2009\u2060301\u2009\u2060₽"
    sample_hotel = (
        "Доступные варианты на\u00a01\u00a0ночь\n"
        "Кешбэк 159\n" + group +
        "\n5\u2009\u2060890\u2009\u2060₽\n1\u00a0ночь, 1\u00a0гость\nЗабронировать\n"
        "Кешбэк 300\n8 400 ₽\n1 ночь, 1 гость\nЗабронировать\n"
        "Об отеле и заселении\nСтоимость парковки 200 ₽"
    )
    assert rubles(group) == [5301]
    assert hotel_minimum(sample_hotel) == 5301
    assert hotel_minimum("Доступные варианты Уточните даты проживания") is None
    sample_train = (
        "Ж/д\nот 2\u2009526\u00a0₽\nАвтобусы\nот 1 495 ₽\n"
        "12 окт, пн\nПлацкарт\nМест нет\n~ 100 ₽\n"
        "Купе\nот 8 700 ₽\nВыбрать места\n"
        "Отель в Москве 500 ₽"
    )
    assert route_minimum(sample_train, day, "train") == 2526
    assert route_minimum(sample_train, date(2026, 10, 13), "train") is None
    sample_flight = (
        "Авиа\nот 32\u2009090\u00a0₽\n"
        "12 окт, пн\nШереметьево Москва\nДели\n"
        "Доплата за багаж +1000 ₽\n"
        "32 090 ₽\nбез багажа, за одного\nВыбрать билет"
    )
    assert route_minimum(sample_flight, day, "flight") == 32090
    assert route_minimum(sample_flight, day, "train") is None
    assert name_ok("Альфа Измайлово", "Альфа Измайлово 4* в городе Москва")
    assert name_ok("Novotel Шереметьево", "Отель Novotel Москва Аэропорт Шереметьево 4*")
    assert not name_ok("Альфа Измайлово", "Venera в городе Казань")
    targets = json.loads(TARGETS.read_text(encoding="utf-8"))
    assert len(targets["routes"]) == 14 and len(targets["hotels"]) == 13
    print("Public Tutu browser pricing parser tests: OK")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--out", default="/tmp/tutu-public-price-feed.json")
    parser.add_argument("--only", default="",
                        help="Optional comma-separated card IDs for a smoke test")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return 0
    now = datetime.now(MOSCOW)
    day = now.date() + timedelta(days=1)
    requested = {x.strip() for x in args.only.split(",") if x.strip()} or None
    prices = scrape(day, requested)
    total = len(prices["routes"]) + len(prices["hotels"])
    doc = {
        "quote_date": day.isoformat(), "currency": "RUB",
        "source": "Public Tutu date-specific booking search (one adult; hotels one room/night)",
        "routes": prices["routes"], "hotels": prices["hotels"]
    }
    output = Path(args.out)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Public search: {total} dated price quotes from {len(prices['routes'])} routes"
          f" and {len(prices['hotels'])} hotels; checked {day}")
    if not total:
        print("::warning::No bookable prices confirmed; retain illustrative fallback.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
