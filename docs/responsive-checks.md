# Responsive layout verification

Baseline: 599fe345610e2f69faf748a52f84848d098bac3f.
Scope: presentation and compact-screen interaction only. Existing sections,
copy, city data, prices, link builders and destinations are unchanged.

## Breakpoints
- 320-599 CSS px: phone layout, vertical search, swipeable carousels.
- 600-1100 CSS px: compact/tablet layout with a two-column search.
- Above 1100 CSS px: original desktop layout and original header/footer DOM.
No user-agent redirects and no separate mobile URLs.

## Browser checks run locally before publishing
Chromium with Playwright, actual project assets rendered offline.
132 form scenarios: RU / EN / HI x hotel / flight / train / bus x
320, 360, 375, 390, 414, 480, 600, 768, 820, 1024 and 1100 CSS px.

Verified: viewport containment, empty grey date placeholders, six initial
suggestions remaining open after tap, search in all three scripts, city
selection, swapping cities, single/range dates, adults and child age,
service class, and form state passed to the unchanged URL builder.
Navigation was intercepted; this was not a new live Tutu availability test.

Real emulated touch swipes moved both carousels in all three locales.
Header menus and footer accordions work. Resizing restores the original
desktop DOM without losing selected search values.

Full-page desktop screenshots at 1440 px were pixel-identical to the
baseline for RU, EN and HI. Original page copy and card contents were
also compared after mobile-to-desktop resizing.

These are Chromium browser-emulation checks, not physical iOS/Android
device or Safari/WebKit testing.
