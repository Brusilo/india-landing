# Tutu — India landing (stage 1)

A single-page marketing landing for Tutu, aimed at Indian students living in Russia.
The page exists in three languages — Russian (`index.html`), English (`index-en.html`) and
Hindi (`index-hi.html`) — linked from the language switcher in the header. This is a **demand test**, not a working product — every CTA
will eventually link out to tutu.ru.

**Stage 1 is a static layout: everything is visible and styled, nothing is interactive.**

## Running it

Open `index.html` in a browser. It needs no build step and no npm.

Fonts and logos are loaded by relative path, so if you open the file straight from disk
some browsers may block them — serving the folder over any local HTTP server avoids that.

## Structure

```
index.html                  Russian page: markup + inline CSS + CONFIG (prices in ₽)
index-en.html               English page, same structure (prices in ₹)
index-hi.html               Hindi page, same structure (prices in ₹)
fonts/                      Tutu Sans (WOFF2) — regular 400, medium 500, demibold 600, bold 700
assets/
  logo-tutu-white.png       wordmark used in the header and footer
  logo-tutu-lavender.png    not used yet, kept for light backgrounds
  icon-bus / train / flight / hotel .png   transport tab icons
  qr.png                    app download QR code
  favicon.png, apple-touch-icon.png   browser tab and home-screen icon
  icons/                    brand icons taken from «Иконки для оформления.pptx» (tiles, panels, socials, stores); store-apple.png was generated separately
```

Fonts are declared with `@font-face` at the top of the `<style>` block. To swap a weight,
drop the new `.woff2` into `fonts/` and keep the file name, or update the `src` path.

## Everything that is a placeholder

All route and hotel data lives in the `CONFIG` object at the top of the `<script>` block at
the bottom of `index.html`. The cards are generated from it, so real values can be swapped in
without touching any markup.

| What | Where | Note |
|---|---|---|
| Route prices («от N ₽») | `CONFIG.routes` | **approximate — refresh from live search before launch** |
| Route dates and durations | `CONFIG.routes` | **approximate — replace before launch** |
| Hotels, ratings, reviews, prices | `CONFIG.hotels` | real listings from tutu.ru on 15.09.2026 — refresh prices before launch |
| Card images | `.card-media` gradients | no real photos yet, see below |

The footer carries a line stating that prices shown are sample values, so nothing on the page
reads as a real offer. Remove it once real prices are in.

### Swapping in real images

Each card image is a CSS gradient in brand colors with the city or hotel name on it:

```html
<div class="card-media" style="background:...">...</div>
```

Replace that element with an image of the same box — the class is already styled:

```html
<img class="card-img" src="assets/routes/kazan.jpg" alt="">
```

The rating chip and media label are positioned inside the media box, so if you keep them,
wrap the `<img>` and the chip in a `.card-media` without the inline gradient.

### QR code

`assets/qr.png` is the real app code and carries its own white rounded background.
To change the code, overwrite the file.

## Fonts

- **Tutu Sans** — brand face, loaded locally from `fonts/`. A system sans stack is set as fallback.
- **Lora Italic** (Google Fonts) — **stand-in** for PT Cooper Light Italic, the brand accent face,
  which was not supplied. It is used in exactly one word — «Дешёвые» in the H1 — and nowhere else.
  When the real file arrives, add it as an `@font-face` and change `--font-accent`.

## Brand colors in use

| Token | Value | Used for |
|---|---|---|
| `--deep-blue` | `#0D0B68` | hero and footer background, headings |
| `--berry-purple` | `#7D71FF` | primary button, active states, multimodal panel |
| `--cloud-white` | `#EDEFFF` | alternating section backgrounds, tiles |
| `--orange` | `#FF872E` | not used at the moment — discount badges were removed |
| `--green` | `#00C95E` | hotel rating chips only |
| `--blue` | `#5F94FF` | card image gradients |
| `--lilac` | `#BA61FF` | card image gradients, hotel panel gradient |
| `--magenta` | `#FF45E3` | ring on the dark price panel, hotel panel gradient |

No other brand colors are used. Body text is neutral grey.

## Not wired up yet (stage 2)

Styled but inert on purpose:

- transport tabs (Buses / Trains / Flights / Hotels) and route filters (All / Buses / Trains)
- the search form — the inputs accept typing but nothing is submitted
- FAQ cards render expanded; no collapse behaviour
- every CTA, the store buttons and the footer `tutu.ru` line — no links, no UTM, no tracking

Route cards already carry `data-cta` (`route_r3_combined`, `hotel_h1`, …), which is the
identifier stage 2 needs for `utm_content` and `dataLayer`.

## Deploying to GitHub Pages

Push to `main`, then in the repository open **Settings → Pages** and set
**Source: Deploy from a branch**, **Branch: `main` / `root`**. The page goes live at
`https://<user>.github.io/india-landing/` a minute or so later.
