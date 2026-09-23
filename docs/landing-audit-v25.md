# Landing audit - 17 September 2026

Production baseline: `ea84ee0ef2484798d2cc8d0176418e8d57bd6b39`.
Scope: RU / EN / HI search, destination links, responsive layout and the requested desktop ticket position. Yandex Metrika was not installed.

## Changes

- Desktop decorative ticket moved another 40 CSS px upward: top -37px, or -35px at 1101-1200px. Its dimensions and rotation are unchanged. Mobile artwork is unchanged.
- Desktop horizontal overflow from decorative artwork is contained, without clipping vertical search popovers.
- Exact city names take priority over aliases. Adler no longer loses to Sochi in hotel/ground-transport searches; flight mode can still use the Sochi airport alias.
- Multiword aliases such as New Delhi and St Petersburg are retained. Exact complete names on any of the three languages are accepted even without clicking a suggestion. Case, common dash/space variations and Russian yo/e variants are normalized. Hindi vowel marks are preserved.
- A unique canonical city record is used for links regardless of input/page language. Partial, ambiguous and unknown input is not silently converted into a different city; the search goes to the official Tutu home page instead.
- Fixed the desktop child-age select being cancelled by a click handler. Added keyboard suggestion selection, Escape handling and accessible combobox/listbox state. Form submission is handled once.
- Hotel URLs pass adults and each child's age in room[0], rather than adding children to the adult count.
- Flight URLs now have confirmed numeric city IDs for every one of the 219 flight-eligible records and include the selected date in route[0].
- Direct bus URLs use confirmed bus IDs, date, adult/child-age token and total passenger count. Where bus IDs are unavailable, the previously agreed verified train fallback is used; otherwise the official Tutu home page is used.
- Links only use the new explicit confirmed destination registry. Unverified transliterations are never emitted as production route URLs.
- Card links use the same canonical resolver and URL builder as the form. Existing prices, text, images, section order and Grifon rating 9.1 were retained.

## Automated checks completed

Local Chromium browser emulation, using project assets with external font requests blocked and outgoing navigation recorded rather than executed:

- 276 city records; 2,484 name/case variants; 2,817 locale-invariant link comparisons.
- 13,748 data/builder assertions passed. This includes validation of dates, passenger counts, ages, same-city requests, malformed input, safe fallbacks and generated query parameters.
- 120 form scenarios / 2,802 assertions: three locales, four modes and ten viewport widths (320, 360, 390, 414, 600, 768, 1024, 1101, 1280, 1440 CSS px). No failures in the final run.
- 99 additional edge-case assertions: six real emulated touch swipes, no accidental card navigation while swiping, input escaping, responsive state preservation, card destinations, desktop link hit-testing and the exact 40px ticket displacement.
- 60 calendar/passenger assertions: month boundaries, check-in/check-out order, same-day rejection, incomplete range feedback, ages 0 and 6 retained across rerenders and the nine-person limit.
- All three pages have no duplicate HTML IDs or missing local assets. JavaScript syntax checks passed. No unhandled page exceptions occurred in tested interaction paths.

The reproducible test sources are in tests/. Counts and the registry coverage are also recorded in landing-audit-v25-results.json.

## Public URL verification

Separate GitHub Actions jobs made read-only HTTP requests to official Tutu pages. No bookings, logins or personal data were submitted.

The initial full city-path sweep checked 939 candidate paths and returned 619 HTTP 200 responses, 305 HTTP 404 responses and 15 read/transport errors. These are BEFORE-fix results, not a claim that the original links all worked. Further bounded passes inspected official directories and verified candidate corrections. Only confirmed city paths and IDs were put into the production registry.

Final registry coverage:

| Mode | Confirmed entries | Behaviour outside confirmed coverage |
| --- | ---: | --- |
| Flights | 219 of 219 flight-eligible city records | Unsupported/unknown input goes to Tutu home |
| Hotels | 273 of 276 city records | Tutu home instead of an unverified hotel path |
| Trains | 141 of 222 ground-transport-eligible city records | Tutu home instead of an unverified train path |
| Buses | 119 city records with bus IDs (2026-09-23: 81 added from Tutu's own /raspisanie/ city index) | Verified train fallback, then Tutu home |

The three hotel records without a confirmed city path are ru-petropavlovsk-kamchatsky, ru-sovetskaya-gavan and kg-issyk-kul. They remain searchable, but do not produce a guessed hotel URL.

Flight IDs were extracted from the destination metadata of official flight pages. Hotel paths/geo IDs were checked against official hotel pages or city directories. Bus IDs were read from official search-page state and matched by common locality ID or unique city name, not fabricated. Sanitized source URLs are in destination-sources-v25.json.

## Limits of this audit

A confirmed city path or HTTP 200 does not guarantee inventory, a direct service or every possible origin/destination combination. The GET checks cover city endpoints and selected complete routes, not every pair of the 276 cities and not checkout/payment. Prices remain the existing illustrative 'from' values; this task did not refresh live availability or prices.

Browser checks used Chromium emulation, not physical iOS/Android devices or Safari/WebKit. External Google Fonts were not tested in the offline fixture. Unknown/unconfirmed destinations intentionally use the fallback instead of claiming full direct-link coverage. Yandex Metrika and analytics events are reserved for the next task.
