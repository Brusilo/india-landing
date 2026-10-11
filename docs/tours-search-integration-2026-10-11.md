# India landing — tours search (work in progress, 11 October 2026)

## Sources of truth

- Live tours catalogue: https://tours.tutu.ru/ (lists 45 countries).
- Russia resort list: https://tours.tutu.ru/strana/rossiya/kurort/
- Travelata partner API (2026-06 version): https://support.travelpayouts.com/hc/ru/articles/360022674591-API-%D0%BE%D1%82-Travelata
- User-supplied branded search examples: `web.tutu.travelata.ru/search/?departure=2&arrival_id=92...` for Turkey from Moscow and `departure=1&arrival_id=29...` for Egypt from Saint Petersburg.

## Current model

`assets/tour-catalog.js` maintains:

1. **14 departure cities** relevant to residents and visitors travelling within Russia; **13 of 14 have numeric Travelata departure IDs** from the public link-constructor `fromCity` and `departureCity` selections. Moscow=2 and Saint Petersburg=1 match the originally supplied branded URLs. Rostov-on-Don was absent from the public city directory and remains browse-only. Data source: https://traff.travelata.ru/constructor.php
2. Country and Russia-winter destination choices, multilingual RU/EN/HI names and search aliases.
3. All **45 current Tutu country browse pages**, **27 Russia/winter locations**, and **9 foreign resorts** (Antalya, Alanya, Istanbul, Hurghada, Sharm El Sheikh, Phuket, Goa, Bali, Dubai). Each has an evidenced Tutu country/resort landing URL, not a guarantee of live tour inventory.
4. Numeric `arrival_id` only when independently sourced: **37 of 45 countries** have validated Travelata IDs. Eight countries and all 36 specific resort/city choices keep unverified IDs null. Never substitute Tutu SEO slug numbers.

**Originally confirmed branded-link examples** (not a guarantee of live inventory):

| Kind | Selection | ID | Evidence |
| --- | --- | ---: | --- |
| Departure | Moscow | 2 | User-provided branded search example |
| Departure | Saint Petersburg | 1 | User-provided branded search example |
| Country | Turkey | 92 | User-provided branded search and 2026 API example |
| Country | Egypt | 29 | User-provided branded search example |
| Country | Abkhazia | 1 | 2026 partner API countries example |
| Country | Belarus | 11 | 2026 partner API countries example |

Eight countries, all 36 specific resort/city choices, and Rostov-on-Don as a departure city deliberately have `id:null`. Their public Tutu links are *not* full branded search URLs. A fallback opens the matching destination page **only after warning users** that departure city, dates, nights and guests may need to be re-entered; no invented IDs are inserted.

Teriberka is a **separate user intent** with no verified separate Tutu landing; the form warns users and opens Murmansk instead. For **Murmansk**, a curated table of existing Tutu SEO pages preserves some city-of-departure intent (including Moscow, Saint Petersburg, Kazan, Yekaterinburg, Novosibirsk, Samara, Nizhny Novgorod, Irkutsk, Perm, Krasnodar and Rostov-on-Don). Examples:
- Kazan → Murmansk: https://tours.tutu.ru/rossiya/murmansk/iz/33_kazan/
- Moscow → Murmansk: https://tours.tutu.ru/rossiya/murmansk/iz/491_moskva/

**Crucial:** the numeric IDs in these Tutu SEO URL paths are **not interchangeable** with the departure IDs required by the branded Travelata search form. SEO pages do not pass the chosen nights, date or guest count; the form discloses this instead of implying a fully filtered search.

## Verified departure IDs from the public Travelata city selector

The public Travelata widget/link-constructor's `fromCity` and `departureCity` options were loaded in Chromium and yielded the same values for 13 of the 14 departure cities on our landing. These are **Travelata departure IDs**, distinct from the Tutu SEO path numbers.

| Destination city | Travelata departure ID | Tutu winter SEO city slug (different namespace) |
| --- | ---: | --- |
| Moscow | 2 | 491_moskva |
| Saint Petersburg | 1 | 75_sankt-peterburg |
| Kazan | 29 | 33_kazan |
| Yekaterinburg | 25 | 29_ekaterinburg |
| Novosibirsk | 53 | 58_novosibirsk |
| Samara | 64 | 74_samara |
| Nizhny Novgorod | 50 | 55_nijniy_novgorod |
| Irkutsk | 28 | 31_irkutsk |
| Perm | 61 | 68_perm |
| Krasnodar | 36 | 39_krasnodar |
| Ufa | 79 | Not whitelisted |
| Cheboksary | 83 | Not whitelisted |
| Sochi | 67 | Not whitelisted |
| Rostov-on-Don | **Not listed** | 72_rostov-na-donu |

The IDs for Moscow and Saint Petersburg also matched supplied co-branded Travelata links. The other 11 IDs have the same official public-dropdown provenance. **Four additional cities were independently live-tested on the branded results page: Kazan (29), Yekaterinburg (25), Novosibirsk (53), Samara (64), all 4/4 passed**, retaining the city, country, date, URL fields and an automatically generated `sid`. Evidence: https://github.com/Brusilo/india-landing/actions/runs/38157085243 . The remaining seven publicly sourced city IDs have not each been end-to-end tested yet; live acceptance for those pairs remains recommended. The probe code is in `tests/probe-live-departures.py`. Missing IDs must never be inferred from Tutu SEO numbers.

## Verified country IDs from the public Travelata link constructor

On 11 October 2026 we fetched https://traff.travelata.ru/constructor.php (public, unauthenticated). Its `defaultCountry` field contains the same numeric values as the authenticated partner country's dictionary. The previously confirmed Turkey (92), Abkhazia (1), Belarus (11) values match it; Russia (76), India (33), Maldives (56) and 30 further named countries were sourced from the official public options.

**37/45 Tutu-listed countries have supported IDs**: 36 from the public Travelata link constructor plus Egypt (29) from the user's co-branded search example. **8 countries do not have sufficiently verified IDs and retain browse-only links**: Uzbekistan, Kazakhstan, Azerbaijan, Kyrgyzstan, Japan, South Korea, Tanzania and Switzerland. All 27 Russia/winter destinations and nine foreign resorts also remain browse-only; a country ID cannot select an individual resort.

Run `scripts/probe-public-travelata-directory.py` to inspect the public option source again. The official Tutu directory audit `scripts/audit-tour-directory.py` confirmed all **81/81** country/resort links are listed in the Tutu site directory. These results validate IDs and browse pages, **not live tour availability or filtered partner search results**.

## Additional verified winter city-to-resort pages

On 11 October 2026, public Tutu pages were checked for **28/28 exact city-to-winter-destination routes**: Moscow, Saint Petersburg, Kazan and Yekaterinburg as starting cities, combined with Baikal, Karelia, Krasnaya Polyana, Sheregesh, Altai, Sochi and Veliky Ustyug. Every route returned HTTP 200 on its expected URL, and its HTML title or H1 confirmed both the origin and the intended destination. Evidence: https://github.com/Brusilo/india-landing/actions/runs/38156832823

The application uses these 28 whitelisted combinations, plus 11 separately verified Murmansk city routes (**39 distinct winter-tour city pairs total**), so a visitor choosing, for example, Kazan → Baikal opens the corresponding Tutu route page instead of a country-wide or Russia-wide catalog. Unknown pairs still fall back to the chosen destination's public Tutu page, with a warning before navigating.

**Important limits:** Tutu SEO page route IDs are not Travelata IDs; the booking dates, number of nights, travellers, and child ages are **not transferred** into those pages. The user is informed before the redirect. No route page confirms live booking availability for a chosen date. The 28-pair audit is scripted in `scripts/probe-winter-pairs.py` (the public directory audit workflow). The fallback text for Teriberka explicitly explains that it opens Murmansk instead.

## Public Travelata Russia resort directory: candidate IDs (research only)

On 11 October 2026 the public, unauthenticated affiliate link constructor at https://traff.travelata.ru/constructor.php was opened and the `Конструктор ссылок` tab selected. Choosing `toCountry=76` (Russia) populated **532 distinct public `toCity` options**. An earlier static source inspection was insufficient because the list is loaded dynamically. The evidence and selector diagnostics are in the automated report `tests/probe-public-resorts.py` and [public resort options artifact](https://github.com/Brusilo/india-landing/actions/runs/38157140467).

| India-winter relevant Tutu selection | Exact public Travelata `toCity` label | Public ID |
| --- | --- | ---: |
| Murmansk / Northern Lights | Мурманск | 1726 |
| Lake Baikal | Байкал | 3997 |
| Karelia | Карелия | 3981 |
| Sheregesh | Шерегеш | 1615 |
| Krasnaya Polyana | Красная Поляна | 1691 |
| Altai | Алтай | 3114 |
| Sochi | Сочи | 3097 |
| Veliky Ustyug | Великий Устюг | 1589 |
| Rosa Khutor | Красная Поляна: Роза Хутор | 3158 |
| Listvyanka | Байкал: Листвянка | 3998 |
| Olkhon Island | Байкал: остров Ольхон | 1757 |
| Irkutsk | Иркутск | 1647 |
| Arkhyz | Карачаево-Черкессия: Архыз | 1660 |
| Dombay | Карачаево-Черкессия: Домбай | 1624 |

**Teriberka is absent as its own public `toCity` selection.** The existing explicit Teriberka → Murmansk warning remains necessary.

**These are research IDs, NOT enabled filtered search routes.** Before mapping any `kind:'winter'` entry to `arrival_type` / `arrival_id`, verify the exact Tutu-branded search URL schema using a live result page, and assert that the resort field—not merely the country—is populated with the requested destination. Probes are in `tests/probe-branded-resort-search.py` and are run manually through the read-only `.github/workflows/tour-live-partner-qa.yml`. Until then the 39 confirmed Tutu city-specific SEO pages remain the safest usable links.

## URL algorithm

For supported **country** IDs only:

- Path: `https://web.tutu.travelata.ru/search/`.
- Query: `departure`, `arrival_id`, `arrival_type=country`, `arrival_text` (Russian name), `date_begin`, `date_end` (DD.MM.YYYY), `adults`, `nights_min`, `nights_max`, attribution `utm_source=tutu_main&utm_medium=internal&utm_content=tours_search_form`.
- Hash (Travelata's client-side search state): `#?fromCity=...&toCountry=...&dateFrom=...&dateTo=...&nightFrom=...&nightTo=...&adults=...&hotelClass=all&meal=all&priceFrom=6000&priceTo=21000000&sort=recommend`.
- Never reuse `sid`: it is per-session and generated by the provider. It should not be copied from somebody else's URL.
- Do not invent `arrival_type=resort` or `toResort` until co-branded end-to-end behaviour has been verified against genuine partner links.
- Validation: valid departure date (today through about 11 months ahead), 1–29 nights with min≤max, 1–6 adults, up to 3 children with explicit ages 0–17 (total group ≤9), and known selections. Because the co-branded child-age URL format is not verified, family searches use the safe Tutu browse fallback and explain that ages must be selected again.

For **browse-only** locations, return the **exact Tutu public page** without fabricated filters; ask confirmation and clearly say the parameters will need to be selected on that page.

## Extending safely

Travelata's private partner API (updated 2026-06-05) still requires **HTTP Basic Auth**, even though the public link constructor exposes many country IDs. Obtain authorized credentials from the partnerships team, and fetch:

- `GET /partners/directory/countries`
- `GET /partners/directory/resorts?country[]=COUNTRY_ID`
- `GET /partners/directory/departureCities`

Base URL: `https://api-gateway.travelata.ru`. Filter `disabled=false`, verify IDs and link variants on the Tutu-branded frontend, and publish only confirmed IDs to the static `tour-catalog.js` (never put login or password in frontend JS, HTML or GitHub). Resort, hotel, more departure cities and child age support are future steps.

## Responsive / functional QA

**Browser QA passed: 27/27 scenarios across English, Russian and Hindi at 9 widths (320–1440px), including the child-age controls and fallback links.** Final expanded-search GitHub Actions run on 11 October 2026: https://github.com/Brusilo/india-landing/actions/runs/38153562247 — **27 passed, 0 failed**, after adding family traveller ages, 14 departure cities, 81 destinations and correcting popover clipping at 600px. Six screenshots (RU/EN/HI at 390px and 1440px) were visually reviewed.

The PR contains `tests/tours-browser.py`, `tests/tours-cross-browser.py`, `tests/tours-live-provider.py`, and related CI workflows. Chromium/Firefox/WebKit checks passed for EN/RU/HI at 375/768/1440 px, with 27/27 successful scenarios in https://github.com/Brusilo/india-landing/actions/runs/38154808519. Physical iOS Safari and Android Chrome remain untested. The original browser suite is also checked by `.github/workflows/tour-search-qa.yml`. Chromium loads the actual EN, RU and HI pages with local assets and intercepts external navigation; tests cover nine widths (320, 360, 390, 600, 768, 1024, 1101, 1280, 1440), destination dropdown, calendar month navigation, night range, adults, winter fallback, numeric search links, and switching back to other transport modes. These are **offline smoke tests**. They do not verify live Travelata results, payment, availability or Android/iOS-specific rendering; release should remain a draft until live QA is finished.

## India-audience language limitation

The public Tutu × Travelata results pages were visually opened with working searches on 11 October 2026. The search controls and tour-card information are in **Russian**, even when the referring India landing is EN/HI. Checkout language was **not** tested. We have **not** verified an English or Hindi locale option in this co-branded partner flow.

The EN and HI tours search tabs now disclose that the destination page will be in Russian before the user leaves. This is a temporary transparency measure, **not a localization fix**. For production aimed at Indian travellers, the partner team should confirm the supported checkout languages and payment instruments, ideally provide an English search/checkout or an officially supported locale parameter. Do not invent a `lang=en` query parameter without live partner evidence.

## Open issues before release

- Obtain/verify eight missing country IDs, precise partner resort IDs (especially Russian winter destinations), and Rostov-on-Don if it becomes supported. The public Travelata `fromCity` directory now grounds 13/14 departure IDs; confirm newly enabled city searches against rendered live results and partner availability. Verify child-age parameters before supporting direct family searches.
- Live branded search was confirmed for **6/6 tested combinations**: Moscow → Turkey, Russia, India, UAE; Saint Petersburg → Egypt, Thailand. In each, the search page displayed the selected city, country, date 25 October 2026, 7–14 nights and one adult, and the partner generated its own `sid`. See https://github.com/Brusilo/india-landing/actions/runs/38155093070 . Confirm remaining country/departure combinations separately; country IDs alone do not guarantee inventory.
- Run live QA in mobile Safari and Android Chrome, plus desktop browser sessions. Official Travelata limits as of 18 June 2026: up to 29 nights, 6 adults and 3 children: https://travelata.ru/faq/ru/articles/11552685-%D0%BA%D0%B0%D0%BA%D0%BE%D0%B5-%D0%BC%D0%B0%D0%BA%D1%81%D0%B8%D0%BC%D0%B0%D0%BB%D1%8C%D0%BD%D0%BE%D0%B5-%D0%BA%D0%BE%D0%BB%D0%B8%D1%87%D0%B5%D1%81%D1%82%D0%B2%D0%BE-%D0%B4%D0%BD%D0%B5%D0%B9-%D0%B8-%D1%82%D1%83%D1%80%D0%B8%D1%81%D1%82%D0%BE%D0%B2-%D0%BC%D0%BE%D0%B6%D0%BD%D0%BE-%D0%B7%D0%B0%D0%B1%D1%80%D0%BE%D0%BD%D0%B8%D1%80%D0%BE%D0%B2%D0%B0%D1%82%D1%8C
- Decide whether winter regions should open curated product pages or partner-funnel results; avoid advertising a tour as available before inventory is confirmed.

## URL and data evidence (11 October 2026)

- Official country catalogue: https://tours.tutu.ru/strana/
- Official Russia resort index: https://tours.tutu.ru/strana/rossiya/kurort/
- Travelata documented country IDs include Abkhazia 1 and Belarus 11; branded user samples confirm Turkey 92 and Egypt 29, Moscow departure 2 and Saint Petersburg departure 1. Official auth flow: https://support.travelpayouts.com/hc/ru/articles/360022674591-API-%D0%BE%D1%82-Travelata
- Tutu exposes SEO routes with city-dependent IDs that should never be interpreted as partner IDs, e.g. https://tours.tutu.ru/rossiya/murmansk/iz/33_kazan/
- Indian tourists' visa and entry requirements **must not** be copied from Tutu's generic Russian-traveller pages; those visa snippets are not tailored to the India audience.

## Final stage verification

- `node tests/tour-catalog.cjs`: **PASS** (45 countries + 27 winter locations + 9 international resorts + 14 departure cities; checked canonical Tutu SEO slugs, date and guest validations, verified partner IDs, safety fallbacks).
- `python tests/tours-browser.py`: **27/27 PASS** (3 languages × 9 viewport widths), with no missing local assets or JavaScript exceptions and no horizontal overflow.
- Public example pages tested by retrieval: Tutu Altai, Listvyanka, Goa, Antalya, and Kazan → Murmansk. These are landing pages, not guarantees of hotel/tour availability.
- **Live branded search validation 6/6 cases passed** on 11 October 2026. Moscow → Turkey, Russia, India, UAE and Saint Petersburg → Egypt, Thailand each preserved city, country, selected date, 7–14 nights, one adult and a generated `sid`. Tour-card screenshots were reviewed. See https://github.com/Brusilo/india-landing/actions/runs/38155093070 . This is not proof of available tours for every date, or checkout/payment functionality. `tests/tours-live-provider.py` runs these as advisory partner smoke tests.
- Screenshots from the successful run were reviewed for form layout at 390px and 1440px in EN, RU and HI. A real mobile Safari / Android Chrome acceptance test is still required.

## Expanded live verification and SEO city routes (11 October 2026)

- Run https://github.com/Brusilo/india-landing/actions/runs/38155093070 completed six branded searches successfully (HTTP 200, six form fields verified, partner-created `sid` without one in the incoming URL). Confirmed destinations: Turkey, Egypt, Russia, India, UAE and Thailand. This does not validate every combination of the 37 known country IDs with the two departure cities.
- `scripts/audit-tour-directory.py` tests all 11 Murmansk-from-city Tutu SEO links for direct HTTP status and unexpected redirects. The first audit saw transient HTTP 504 on 4 routes; a second attempt confirmed **11/11 exact target pages HTTP 200**: https://github.com/Brusilo/india-landing/actions/runs/38155539951 . The audit retries 429/502/503/504 once. These SEO IDs are **not** Travelata partner IDs and pages still require the visitor to re-enter dates and guests.
- The partner interface is currently in Russian, despite EN/HI landing pages. English/Hindi language disclosure is shown before users follow the search link. Checkout, payment, and multilingual support remain open to partner verification.
