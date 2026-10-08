# City base expansion — 8 October 2026

All IDs and paths below were read from Tutu's own public services and then
re-checked against the live pages. Nothing was guessed from a transliteration.

## Sources

| Mode | Where the data came from | How it was confirmed |
| --- | --- | --- |
| Flights | `suggester-avia.tutu.ru/api/location_suggest/v2` (city `id`, `seo_id`, IATA `code`, `geo_id`) | `avia.tutu.ru/f/<from>/<seo>/?route[0]=…` returns 200 and names the city |
| Trains | `www.tutu.ru/suggest/railway/` (station code), then `poezda/rasp_d.php?nnst1=2000000&nnst2=<code>`, whose redirect gives Tutu's own path | `poezda/Moskva/<path>/?date=…` returns 200 with the city in the title |
| Buses | `bus.tutu.ru/bus/v1/geo/suggest/` (geopoint `id`, `ru@translit` name), exact name + country + region match | `raspisanie/gorod_Moskva/gorod_<name>/?from=…&to=…&date=…&travelers=1&amount=1` names the city (with full parameters the page returns 200 even for a wrong ID, so the name check is what proves it) |
| Hotels | `hotel.tutu.ru/c_<country>/<city>/` | 200 and the page's `initSearchParams.geoId` equals the stored geo ID |

Where a name matched several places (Mirny, Krasnaya Polyana, Listvyanka,
Svetlogorsk, Dombay…), the one in the right region was chosen by hand.
Partial matches offered by the suggesters were rejected (Kyzyl → Kyzylorda,
Sukko → Sukkozero, Vityazevo → Anapa, Mirny → the Arkhangelsk-region Mirny).

## What changed

- 55 new cities: 36 Indian airports (Madurai, Bhopal, Vadodara, Udaipur, Jodhpur,
  Dehradun, Ranchi, Leh, Bagdogra, Imphal, Tirupati, Vijayawada, Aurangabad,
  Rajkot, Agra, Jammu, Dibrugarh, Hubballi, Prayagraj, Gorakhpur, Kanpur, Mysuru,
  Jabalpur, Gwalior, Agartala, Jaisalmer, Ayodhya, Nashik, Kolhapur, Dharamshala,
  Shirdi, Darbhanga, Silchar, Belagavi, Rajahmundry, Thoothukudi) and 19 Russian
  cities without airports (Novorossiysk, Vyborg, Suzdal, Sergiev Posad, Kolomna,
  Obninsk, Nizhny Tagil, Sterlitamak, Maykop, Cherkessk, Derbent, Volzhsky,
  Engels, Syzran, Novocherkassk, Armavir, Rybinsk, Uglich, Murom).
- Existing cities: 33 new train paths, 72 new bus IDs, hotel pages for
  Rostov-on-Don and Issyk-Kul (Cholpon-Ata), geo IDs for Kostroma and Istanbul.

| Mode | Before | After |
| --- | ---: | ---: |
| Cities | 276 | 332 |
| Flights | 219 | 255 |
| Trains | 141 | 191 |
| Buses | 119 | 210 |
| Hotels | 273 | 330 |

## Live check (8 October 2026)

Every stored link was opened in the landing's own URL format:
191 train, 255 flight, 210 bus and 330 hotel links — 986 in total, all working.
`tests/landing-data.cjs`: 16,866 assertions on 332 cities, all passed.

## Known quirks

- Rajkot's flights go to Tutu's "Hirasar" (the new Rajkot airport, HSR); its
  hotels use Tutu's Rajkot city page.
- Tutu names Bengaluru and Kolkata "Бангалор" and "Калькутта" on flight pages;
  the links are correct.
- Jalal-Abad was renamed Manas; the record is now Manas (kg-manas) and keeps
  Jalal-Abad / Джалал-Абад / जलाल-अबाद as alternative names. "Manas" in flight
  mode still finds Bishkek, whose airport bears that name.
- Salekhard trains go to Labytnangi, which Tutu itself lists as Salekhard's station.
- Still without a link (Tutu has no page): trains for 51 cities without a railway
  or without a Tutu route page, buses for 32, hotels for Petropavlovsk-Kamchatsky
  and Sovetskaya Gavan. These send the search to the Tutu home page as before.

## 9 October 2026

- Khimki and Kotelniki added (Moscow-region towns with steady hotel bookings
  in 2025–2026): hotels and buses for both, trains for Khimki
  (`/poezda/Moskva/Khimki/`). Kotelniki has no railway station.
- Popular routes rebuilt from Tutu purchases in 2025–2026: 14 cards, Moscow →
  Delhi kept second. Prices are Tutu's own "from" prices on 9 October; cards
  without a destination photo show the gradient with a transport icon.
- `tests/landing-data.cjs`: 16,964 assertions on 334 cities, all passed.
