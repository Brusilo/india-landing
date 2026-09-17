# Mobile hero and carousel proportions

Baseline: 843fb4be312b898fa6c6d9a83798e35e821e1506.
Scope: responsive CSS and its cache version in RU / EN / HI only.
No changes to page copy, section order, images, prices, JavaScript,
city data, search logic or destination URLs.

## Visual change
The headline uses the full available width and a 36-48px fluid size.
The larger suitcase is a translucent background accent on the right,
with a vertical fade and the existing horizontal containment retained.
Phone carousels show one card and half of the next. On tablets cards
remain 300px wide. Media panels and internal padding are more compact.
At a 390px viewport the first RU route card changed from approximately
289x351px to 241x300px. Title and price font sizes remain unchanged.

## Checks completed before publishing
Chromium/Playwright, local build assets rendered offline.
30 layout cases: three locales at 320, 360, 390, 414, 480, 599,
600, 768, 1024 and 1100 CSS px. No document horizontal overflow or
clipped card titles/prices; quick city/date chips remain hidden.
On phone widths the visible fraction of the second card is 0.5.
24 form cases: all four modes, all locales, at 390 and 768px.
Checked persistent autocomplete, mixed-script city entry, selection,
swapping cities, single and hotel-range calendars and passenger panels.
Six emulated touch swipes moved both carousels in all locales.
Six full-page desktop comparisons at 1101 and 1440px were pixel-identical
to baseline. Page HTML differs only in the responsive stylesheet version.
All existing JavaScript files are byte-identical to baseline.

These checks are browser emulation, not physical-device or Safari tests.
External Google Fonts were blocked for offline comparison; bundled
Tutu fonts and local system script fallbacks were used in both versions.
