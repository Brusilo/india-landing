#!/usr/bin/env python3
"""Read date-specific minimum bookable prices in an ordinary public Tutu browser.

This job does not use internal APIs, accounts, hidden endpoints, CAPTCHA bypass,
or ambiguous undated/SEO prices. At most one page is open at a time.

The next-day price is preferred. If no ticket or room is bookable for that
date, check subsequent dates up to a week ahead and select the earliest
available offer. Always publish the actual booking date with a fallback price.
Missing, unavailable, or mismatched offers are never fabricated.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from time import monotonic
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
# Normalize spaces instead of deleting them: the same non-breaking spaces can
# separate both digits in a fare and the day/month in a calendar cell.
SPACES = str.maketrans({
    "\u00a0": " ", "\u202f": " ", "\u2009": " ",
    "\u200a": " ", "\u2007": " ", "\u2060": None, "\u200b": None,
})
CURRENCY_RE = re.compile(r"(?<!\d)(\d{1,3}(?:[ \t]\d{3})+|\d{3,7})[ \t]*₽")
MAX_PER_CARD = 2_000_000
WEEKDAYS = "пн|вт|ср|чт|пт|сб|вс"
# The visible Tutu date navigation has a date on one line and the minimum
# fare immediately underneath. Never infer the date from other prices nearby.
CALENDAR_DATE_RE = re.compile(
    rf"(?P<day>\d{{1,2}})[ \t]+(?P<month>{'|'.join(MONTHS)})\.?"
    rf"(?:[ \t]*,[ \t]*(?:{WEEKDAYS}))?", re.I
)
CALENDAR_PRICE_RE = re.compile(
    r"(?:от[ \t]+)?(?P<amount>\d{1,3}(?:[ \t]+\d{3})+|\d{3,7})[ \t]*₽", re.I
)


def clean(text: str) -> str:
    return str(text).translate(SPACES)


def rubles(text: str) -> list[int]:
    amounts = [int(num.replace(" ", "").replace("\t", ""))
               for num in CURRENCY_RE.findall(clean(text))]
    return [value for value in amounts if 100 <= value <= MAX_PER_CARD]


def stamp(day: date) -> str:
    return f"{day.day} {MONTHS[day.month - 1]}"


def route_minimum(text: str, day: date, kind: str) -> int | None:
    """Extract only the minimum fare printed in the target day's calendar cell.

    Do not use the global "Авиа от", "Ж/д от", ticket prices, filter prices
    or any adjacent calendar day. The browser may render the calendar well
    before "Выбрать билет" appears, and that button is not a prerequisite.
    """
    if kind not in ("flight", "train"):
        return None
    lines = clean(text).splitlines()
    matches: set[int] = set()
    for i, line in enumerate(lines):
        label = CALENDAR_DATE_RE.fullmatch(line.strip())
        if not label or int(label.group("day")) != day.day or (
            label.group("month").casefold() != MONTHS[day.month - 1]
        ):
            continue
        # Price must be the next nonempty line of THIS date cell. Never scan
        # through text until the next price, which could belong to another day.
        for next_line in lines[i + 1:i + 4]:
            candidate = next_line.strip()
            if not candidate:
                continue
            price = CALENDAR_PRICE_RE.fullmatch(candidate)
            if price:
                amount = int(price.group("amount").replace(" ", ""))
                if 100 <= amount <= MAX_PER_CARD:
                    matches.add(amount)
            break
    # Conflicting same-day labels are ambiguous; refuse to publish.
    return next(iter(matches)) if len(matches) == 1 else None


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
    """Read the exact-day calendar fare, or a date-matched hotel room price."""
    from playwright.sync_api import TimeoutError as PlaywrightTimeoutError

    kind = "hotel" if group == "hotels" else target["kind"]
    url = dated_link(kind, target, day)
    try:
        response = page.goto(url, wait_until="domcontentloaded", timeout=35000)
        if response is None or response.status != 200:
            print("::warning::Non-200 public search", kind,
                  response.status if response else None)
            return None

        if kind in ("flight", "train"):
            # Calendar prices usually render before the ticket list. Waiting
            # for a booking button incorrectly discards already visible fares.
            deadline = monotonic() + (45 if kind == "flight" else 30)
            while monotonic() < deadline:
                body = page.locator("body").inner_text(timeout=10000)
                found = route_minimum(body, day, kind)
                if found is not None:
                    # Confirm that React has finished replacing initial data.
                    page.wait_for_timeout(750)
                    confirmed = route_minimum(
                        page.locator("body").inner_text(timeout=10000), day, kind
                    )
                    if confirmed == found:
                        print(f"CALENDAR {kind}: {stamp(day)} = {found} RUB")
                        return found
                if (kind == "train" and "Нет прямых билетов на" in body) or (
                    kind == "flight" and re.search(
                        r"на выбранную дату нет билетов|ничего не найдено", body, re.I
                    )
                ):
                    if kind == "train":
                        print("DIAG route soldout:", stamp(day),
                              re.sub(r"\s+", " ", clean(body))[:380])
                    return None
                page.wait_for_timeout(850)
            print("::warning::No exact-day calendar fare appeared:",
                  kind, day.isoformat(), page.url[:170])
            return None

        try:
            page.wait_for_function(
                """() => {
                  const text = document.body?.innerText || '';
                  return text.includes('Забронировать') ||
                    /выбранныедаты.{0,20}всёраспродано/i.test(text.replace(/\s/g,''));
                }""",
                timeout=25000
            )
        except PlaywrightTimeoutError:
            print("::warning::Hotel search did not finish loading:", day.isoformat())
            return None

        text = page.locator("body").inner_text(timeout=12000)
        if "Забронировать" not in text:
            head = clean(text)
            pos = head.find("Доступные варианты")
            print("DIAG hotel no booking action:", target["name"],
                  re.sub(r"\s+", " ", head[max(0, pos):max(0, pos) + 600]))
            return None
        page.wait_for_timeout(650)
        text = page.locator("body").inner_text(timeout=12000)
        if not name_ok(target["name"], page.title()):
            print("::warning::Hotel name mismatch; refusing quote:",
                  target["name"], page.title()[:100])
            return None
        rate = hotel_minimum(text)
        if rate is None:
            head = clean(text)
            pos = head.find("Доступные варианты")
            print("DIAG hotel offer parser:", target["name"],
                  re.sub(r"\s+", " ", head[max(0, pos):max(0, pos) + 600]))
        return rate
    except Exception as exc:
        print("::warning::Public booking search unavailable:", kind,
              type(exc).__name__, str(exc).split("\n")[0][:180])
        return None


MAX_NEARBY_DAYS = 7


def first_available(day: date, lookup, max_nearby_days: int = MAX_NEARBY_DAYS) -> tuple[date, int] | None:
    """Prefer the requested date, else the nearest verified date in one week."""
    if not 0 <= max_nearby_days <= MAX_NEARBY_DAYS:
        raise ValueError("Booking fallback window is outside the supported range")
    for offset in range(max_nearby_days + 1):
        check_day = day + timedelta(days=offset)
        value = lookup(check_day)
        if value is not None:
            if not isinstance(value, int) or not 100 <= value <= MAX_PER_CARD:
                raise ValueError("Price lookup returned an invalid fare")
            return check_day, value
    return None


def scrape(day: date, only: set[str] | None = None) -> dict:
    from playwright.sync_api import sync_playwright

    targets = json.loads(TARGETS.read_text(encoding="utf-8"))
    routes, hotels = targets["routes"], targets["hotels"]
    prices = {"routes": {}, "hotels": {}}
    dates = {"routes": {}, "hotels": {}}
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
                def lookup(check_day: date) -> int | None:
                    page = context.new_page()
                    try:
                        return extract_page(page, group, target, check_day)
                    finally:
                        page.close()

                found = first_available(day, lookup)
                if found is None:
                    print(f"SKIP {key}: no verified bookable offer within "
                          f"{MAX_NEARBY_DAYS + 1} days from {day.isoformat()}")
                    continue

                check_day, value = found
                prices[group][key] = value
                if check_day != day:
                    dates[group][key] = check_day.isoformat()
                    print(f"NEARBY {key}: {day.isoformat()} not available; "
                          f"using {check_day.isoformat()} for {value} RUB")
                print(f"FOUND {key}: {value} RUB on {check_day.isoformat()}")
        finally:
            context.close()
            browser.close()
    prices["dates"] = dates
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
    # Tutu flight calendar as shown for Moscow -> Delhi on 13 Oct 2026.
    # The cheaper fares for 14/15/16 Oct must never replace the 13 Oct fare.
    sample_flight = (
        "Откуда\nМосква\nКуда\nДели\nКогда\n13 окт, вт\nОбратно\n"
        "Авиа\nот 44 269 ₽\nЖ/д\nНет билетов\n"
        "Прямой\nот 44 269 ₽\n"
        "12 окт, пн\n39 475 ₽\n"
        "13 окт, вт\n44 269 ₽\n"
        "14 окт, ср\n31 835 ₽\n"
        "15 окт, чт\n26 051 ₽\n"
        "16 окт, пт\n31 835 ₽\n"
    )
    target_day = date(2026, 10, 13)
    assert route_minimum(sample_flight, target_day, "flight") == 44269
    assert route_minimum(sample_flight, date(2026, 10, 14), "flight") == 31835
    assert route_minimum(sample_flight, date(2026, 10, 15), "flight") == 26051
    assert route_minimum(sample_flight, date(2026, 10, 17), "flight") is None
    # Date header and top-level transport summary are NOT calendar quotes.
    no_target_tile = sample_flight.replace(
        "13 окт, вт\n44 269 ₽", "13 окт, вт\nНет билетов"
    )
    assert route_minimum(no_target_tile, target_day, "flight") is None
    # Nonbreaking spaces must not erase the separator in the date label.
    assert route_minimum(
        "13\u00a0окт, вт\n44\u202f269\u00a0₽", target_day, "flight"
    ) == 44269
    assert route_minimum(
        "13 окт, вт\n44 269 ₽\n13 окт, вт\n45 269 ₽",
        target_day, "flight"
    ) is None
    sample_train = (
        "Ж/д\nот 2 526 ₽\n"
        "12 окт, пн\n2 526 ₽\n"
        "13 окт, вт\n3 000 ₽\n"
        "14 окт, ср\n1 800 ₽\n"
        "Купе\nот 8 700 ₽\nВыбрать места"
    )
    assert route_minimum(sample_train, date(2026, 10, 12), "train") == 2526
    assert route_minimum(sample_train, target_day, "train") == 3000
    assert route_minimum(sample_train, date(2026, 10, 15), "train") is None
    # Stavropol -> Moscow: 13 Oct has no ticket, but the 14 Oct tile has 9,736 RUB.
    sample_stavropol = (
        "Ж/д\nНет прямых\nНет прямых билетов на эту дату\n"
        "12 окт, пн\n5 607 ₽\n"
        "13 окт, вт\n"
        "14 окт, ср\n9 736 ₽\n"
        "15 окт, чт\n"
        "16 окт, пт\n5 356 ₽\n"
    )
    assert route_minimum(sample_stavropol, target_day, "train") is None
    assert route_minimum(sample_stavropol, date(2026, 10, 14), "train") == 9736
    assert first_available(
        target_day, lambda d: route_minimum(sample_stavropol, d, "train")
    ) == (date(2026, 10, 14), 9736)
    assert first_available(target_day, lambda d: None) is None
    assert first_available(target_day, lambda d: 44269 if d == target_day else 9736) == (target_day, 44269)
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
        "routes": prices["routes"], "hotels": prices["hotels"],
        "dates": prices["dates"]
    }
    output = Path(args.out)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Public search: {total} dated price quotes from {len(prices['routes'])} routes"
          f" and {len(prices['hotels'])} hotels; checked {day}")
    if not total:
        print("::warning::No bookable prices confirmed; do not publish sample prices.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
