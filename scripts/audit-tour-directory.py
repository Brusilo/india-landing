#!/usr/bin/env python3
"""Audit Tutu public tour links against its own live directories.

This is an advisory audit: network outages or bot blocks are reported explicitly.
It does not invent Travelata partner IDs or overwrite the production catalogue.
Run from repo root: python scripts/audit-tour-directory.py --output /tmp/tour-audit.json
"""
import argparse
import concurrent.futures
import json
import subprocess
import sys
from collections import Counter
from html.parser import HTMLParser
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlsplit, urlunsplit
from urllib.request import Request, urlopen

ROOT = "https://tours.tutu.ru"
COUNTRY_INDEX = ROOT + "/strana/"
RUSSIA_INDEX = ROOT + "/strana/rossiya/kurort/"
REQUEST_TIMEOUT = 16
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; TutuToursLandingQAAudit/1.0; +https://github.com/Brusilo/india-landing)",
    "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ru-RU,ru;q=0.9",
}


class AnchorParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []
    def handle_starttag(self, tag, attrs):
        if tag.lower() != "a":
            return
        for attr, value in attrs:
            if attr == "href" and value:
                self.urls.append(value)


def canonical(url):
    try:
        p = urlsplit(url)
        if p.scheme not in ("http", "https") or not p.netloc:
            return None
        base = p.path.rstrip("/") or "/"
        return urlunsplit(("https", p.netloc.lower(), base + ("" if base == "/" else "/"), "", ""))
    except ValueError:
        return None


def fetch(url):
    try:
        with urlopen(Request(url, headers=HEADERS), timeout=REQUEST_TIMEOUT) as response:
            body = response.read(5_000_000)
            return {
                "url": url,
                "status": response.status,
                "final_url": response.geturl(),
                "html": body.decode("utf-8", "replace"),
                "length": len(body),
            }
    except HTTPError as e:
        return {"url": url, "status": e.code, "error": str(e)}
    except (URLError, OSError, TimeoutError) as e:
        return {"url": url, "status": None, "error": str(e)[:250]}


def directory(url):
    result = fetch(url)
    links = set()
    if "html" in result:
        parser = AnchorParser()
        parser.feed(result["html"])
        for href in parser.urls:
            candidate = canonical(urljoin(url, href))
            if candidate and candidate.startswith(ROOT + "/"):
                links.add(candidate)
    return {
        "url": url,
        "status": result["status"],
        "length": result.get("length", 0),
        "number_links": len(links),
        "links": links,
        "error": result.get("error"),
    }


def load_destinations():
    code = (
        "const fs=require('fs'),vm=require('vm');"
        "const ctx={window:{},URLSearchParams};"
        "vm.runInNewContext(fs.readFileSync('assets/tour-catalog.js','utf8'),ctx);"
        "process.stdout.write(JSON.stringify(ctx.window.TUTU_TOURS.destinations))"
    )
    return json.loads(subprocess.check_output(["node", "-e", code], text=True))


def load_departure_destination_routes():
    code = (
        "const fs=require('fs'),vm=require('vm');"
        "const ctx={window:{},URLSearchParams};"
        "vm.runInNewContext(fs.readFileSync('assets/tour-catalog.js','utf8'),ctx);"
        "process.stdout.write(JSON.stringify(ctx.window.TUTU_TOURS.murmanskFromPages))"
    )
    return json.loads(subprocess.check_output(["node", "-e", code], text=True))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="/tmp/tutu-tour-directory-audit.json")
    args = parser.parse_args()

    destinations = load_destinations()
    countries = [d for d in destinations if d["kind"] == "country"]
    winter = [d for d in destinations if d["kind"] == "winter"]
    resorts = [d for d in destinations if d["kind"] == "resort"]
    parents = sorted({d["parent"] for d in resorts})
    by_key = {d["key"]: d for d in countries}
    pages = [
        COUNTRY_INDEX,
        RUSSIA_INDEX,
    ] + [by_key[key]["browse"] for key in parents]

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        fetched = list(pool.map(directory, pages))

    all_dirs = {}
    for entry in fetched:
        cat = "country" if entry["url"] == COUNTRY_INDEX else (
            "winter" if entry["url"] == RUSSIA_INDEX else "resort")
        all_dirs.setdefault(cat, []).append(entry)

    allowed = {
        "country": set().union(*(d["links"] for d in all_dirs.get("country", []))),
        "winter": set().union(*(d["links"] for d in all_dirs.get("winter", []))),
    }
    # A foreign resort is confirmed only if listed under its parent country's page.
    parent_links = {key: next((entry["links"] for entry in fetched if entry["url"] == by_key[key]["browse"]), set()) for key in parents}
    output = []
    for d in destinations:
        url = canonical(d["browse"])
        if d["kind"] == "resort":
            listed = url in parent_links.get(d["parent"], set())
            src = by_key[d["parent"]]["browse"]
        else:
            listed = url in allowed.get(d["kind"], set())
            src = COUNTRY_INDEX if d["kind"] == "country" else RUSSIA_INDEX
        output.append({
            "key": d["key"],
            "kind": d["kind"],
            "url": d["browse"],
            "listed_in_parent": listed,
            "parent_directory": src,
        })

    # Only probe links missing from an otherwise accessible directory; a
    # directory being blocked must never be mistaken for proof of broken URLs.
    status_by_directory = {entry["url"]: entry["status"] for entry in fetched}
    to_probe = [
        item for item in output
        if not item["listed_in_parent"] and status_by_directory[item["parent_directory"]] == 200
    ][:36]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        probed = list(pool.map(lambda item: fetch(item["url"]), to_probe))
    for item, response in zip(to_probe, probed):
        item["direct_status"] = response["status"]
        item["final_url"] = response.get("final_url")
        item["direct_error"] = response.get("error")
        item["final_matches"] = canonical(response.get("final_url", "")) == canonical(item["url"])

    counts = Counter(
        "listed" if item["listed_in_parent"] else (
            "reachable_unlisted" if item.get("direct_status") == 200 and item.get("final_matches") else
            "different_target" if item.get("direct_status") == 200 and not item.get("final_matches") else
            "http_error" if isinstance(item.get("direct_status"), int) else
            "unknown")
        for item in output
    )
    # City-of-departure Tutu SEO links use their own path IDs. Verify
    # every resulting page instead of assuming these IDs match Travelata's.
    city_routes = load_departure_destination_routes()
    def probe_city_route(url):
        first = fetch(url)
        # Tutu SEO pages can sporadically return 502/503/504 from an edge;
        # a second independent attempt distinguishes a brief glitch from a
        # reproducible failure. Do not interpret stale search-engine cache as
        # proof of current HTTP availability.
        if first.get("status") not in (429, 502, 503, 504):
            return {"response": first, "attempts": 1}
        second = fetch(url)
        return {"response": second, "attempts": 2, "first_status": first.get("status")}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        route_attempts = list(pool.map(probe_city_route, city_routes.values()))
    route_responses = [entry["response"] for entry in route_attempts]
    seo_routes = []
    for (city, route), attempt in zip(city_routes.items(), route_attempts):
        res = attempt["response"]
        seo_routes.append({
            "departure": city, "requested": route, "status": res["status"],
            "attempts": attempt["attempts"], "first_status": attempt.get("first_status"),
            "final_url": res.get("final_url"), "bytes": res.get("length", 0),
            "exact_target": canonical(res.get("final_url", "")) == canonical(route),
            "error": res.get("error")
        })
    seo_summary = dict(Counter(
        "matched" if row["status"] == 200 and row["exact_target"] else
        "redirected" if row["status"] == 200 else
        "http_error" if isinstance(row["status"], int) else "network_unknown"
        for row in seo_routes
    ))
    report = {
        "departure_city_murmansk_seo_routes": seo_routes,
        "departure_city_seo_summary": seo_summary,
        "source": "public live Tutu HTML; advisory only, not a Travelata API",
        "directories": [{k: v for k, v in d.items() if k != "links"} for d in fetched],
        "summary": dict(counts),
        "total_destinations": len(output),
        "destinations": output,
    }
    with open(args.output, "w", encoding="utf-8") as file:
        json.dump(report, file, ensure_ascii=False, indent=2)
    print("Audit:", json.dumps(report["summary"], ensure_ascii=False))
    print("MURMANSK SEO ROUTES:", json.dumps(seo_summary, ensure_ascii=False))
    for row in seo_routes:
        if row["status"] != 200 or not row["exact_target"]:
            print("SEO ROUTE WARN", row["departure"], row["status"], row["requested"], "resolved", row.get("final_url"))
    for d in fetched:
        print("DIR", d["status"], d["number_links"], d["url"], d.get("error") or "")
    for d in output:
        if not d["listed_in_parent"]:
            print("UNLISTED", d["key"], d["url"], "status", d.get("direct_status"),
                  "final", d.get("final_url"))
    # Fail this script only for programming errors; the advisory will be
    # reviewed before any changes to actual public-facing links.
    return 0


if __name__ == "__main__":
    sys.exit(main())
