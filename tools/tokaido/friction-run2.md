# Friction log, Tōkaidō redesign, run 2

Learned from `moss-cli guide all`, `guide import-and-redesign`, `describe --json` and `describe --css <selector>` only. Fields: wanted, looked up, found, did, confidence, what would have helped, then FLOOR or CEILING. FLOOR means something simple needed more than markdown, folders and conventions other tools read. CEILING means the design could not ship through moss, or only through a workaround.

## Run-1 frictions no longer hit

- **C4, plate alt text (fixed in moss).** `:::hero {.plate image=… alt="…"}` and a hero with an image embed both emit the alt now (checked in built HTML), and an image followed by an italic line is a figure with real alt plus caption. Run 1 had to wrap the image in a link. Still open from C4: image `sizes` (see C6 below).
- **F1, no heading on nav pages (documented).** A body that opens with `# Heading` supplies the heading, so About got its visible title with no CSS override. The guide now says so.
- **F3/F4, home and place-root child lists.** `children: false` is now stated in the guide ("on a place page it also drops the place's term listing"), and I never hit the place-root list because this build dropped moss places entirely.
- **F2, nested fences.** Avoided: every wrapper is a single-level named div, and the one grid I classed uses `{.weather .weather-strip}` on the fence (works).
- **F5, margin on linked images.** Not hit; figures and cards carry no such margin.
- **F9, YAML colon quoting.** Not hit; the generator quotes every value.
- **C2, station data lived in a generator outside the repo.** Improved but not gone: the facts now sit in each page's frontmatter (inert custom keys), the generator is in `tools/tokaido/` with a README, and it only splices derived blocks. Still C-grade because no template or CSS can read those keys (see C3 below).
- **F7, fonts.** Still self-hosted by hand, but the relative `@import url("fonts/fonts.css")` inside `style.css` resolves, so the font block stays out of the stylesheet.
- **Still hit from run 1:** C1 (bespoke map), C3 series nav (titles only, no thumbnails, bottom only, "11 of 55" counts the start), C5 (per-element data needs a script), C7 (search is an icon button), F6 (header split).

## CEILING

### C1. Bespoke schematic road map with hover preview, selection panel, keyboard and touch
- wanted: schematic route (Fuji and Lake Biwa only, ticks at 25 ri steps, the Ise Bay crossing as a line across water, sea grading pale to deep), a label per major station, hover or focus showing the print, Enter opening it, a panel under the map.
- looked up: guide "Places" (locator, `route: true`, `style:map`, `explorer`), `describe --css .moss-place-map`.
- found: moss draws its own relief map from `places.toml`. I built the site once with the native places map and looked at `/places/`: it frames all of Japan, clusters stations into numbered badges, draws no route, no ticks, no crossing, and has no label control (screenshot kept at scratchpad `tokaido-run2/tmp/native-places.png`). `route: true` draws a dashed route only on an authored article's own locator; a listing map never draws one, and `/places/` is a listing. I did not test a route on an authored page because the page would still have no ticks, labels, sea crossing or hover preview.
- did: removed `location:` and `places.toml`, turned the places term off, and generate an inline SVG per page (`generate.py build_map`) with `<a class="st">` per station, so one tab stop and Enter come from plain links. A 40-line `script.js` fills the panel on hover or focus and treats a first touch tap as preview.
- confidence: high that it works (checks: 55 tab stops, Enter lands on the right print, no label overlaps). Medium that the generator-owned SVG in `places/index.md` is the right surface: a non-developer cannot edit the map.
- what would have helped: a documented schematic map component (an SVG outline plus stations, with label offsets, ticks and a selection panel), or at least a way to restyle the native map's frame and draw a route on a listing map.
- CEILING.

### C2. Plate sizing: image `sizes` ignores the page width
- wanted: the print plate sharp at 1040 px on a 1240 column.
- looked up: guide "Embedding media" and the hero `.plate` paragraph.
- found: a body image's `sizes` is always `(min-width: 48rem) 47.25rem, 100vw`, whatever `content_width` is, so at 1x the browser takes the 800 px webp and stretches it to about 1040 px (read from the built HTML). The hero `.plate` gets `sizes="2400px"` and sharp pixels, but it renders before `<main>`, so the breadcrumb cannot sit above it and its caption cannot carry a "Full size" link.
- did: figure with an italic caption line (native, correct alt), accepting the softer 1x image; DPR 2 screens load the 1600 px file.
- confidence: high (measured from markup, not from a screenshot).
- what would have helped: `sizes` following `content_width`, or a sizing hint on the image (`![alt|1040w](x.jpg)`).
- CEILING.

### C3. Station facts as data
- wanted: ri, km, numeral, Japanese name and coordinates stored once per print, used by the page, the map, the lists and the ruler.
- looked up: `describe` frontmatter list (unknown keys are inert), guide "Content structure".
- found: no custom field reaches a template or CSS. Facts in frontmatter can be read by a script outside moss, nothing else.
- did: frontmatter on each print page is the source; `generate.py blocks` writes the map, the road list, the home blocks, the Browse table and `assets/road.json`. The ruler on each print is drawn by `script.js` from that JSON, and the page keeps a one-sentence fallback ("25 ri, about 98 km from Nihonbashi.").
- confidence: medium. The generator is still the real author of five pages' blocks.
- what would have helped: custom frontmatter exposed as `data-*` on the article and a partial that takes arguments, or a documented data folder a page can loop over.
- CEILING.

### C4. Previous and next with the neighbour's plate, above the page
- wanted: previous and next beside the breadcrumb, and "before and after" cards with the neighbour's plate and ri.
- looked up: `describe --css .moss-series-nav`.
- found: series nav is titles only, below the article, with a "11 of 55" count that includes the start. It cannot go above the plate, and the credit line cannot be placed after it (the nav sits outside the article).
- did: styled the native nav as two ruled cells with the whole title, wrapping to two lines (checked at 390 on all 55 pages); dropped the top buttons and thumbnails; the credit sits above the nav, not last.
- confidence: high.
- what would have helped: series-nav options for cover, label and position; a slot to place it before the article.
- CEILING.

### C5. "The Road / stretch / print" trail
- wanted: a trail on every print page at every width.
- looked up: guide breadcrumb paragraph, `series:`, folders.
- found: moss breadcrumbs follow folders. A stretch folder would move prints to `/prints/<stretch>/hakone/`, breaking the required `/prints/hakone/` addresses; folders also cannot hold the same print under both a stretch and the flat index.
- did: an authored line per page: `[[places|The Road]] / [[Mie]] / Shōno`, written by the seed script. It is correct today and goes stale if a print changes stretch. The nearest moss-native form would be folders.
- confidence: medium.
- what would have helped: a breadcrumb that follows a declared group (a `stretch:` field) rather than only the folder tree.
- CEILING.

### C6. Filter chips, and listing order of a term page
- wanted: five chips that filter 55 plates by stretch, and each stretch's prints in road order.
- looked up: guide "Term kinds" and `sort:`.
- found: no client-side filter. A claimed tag page (`tag_page:`) lists its prints sorted by title (`sort: weight` on the claiming page had no effect), which scrambled road order: Arai, Ejiri, Fuchū, not Mishima, Numazu, Hara.
- did: dropped `tags:`; each stretch has its own page whose rows come from the generator in road order, and the chips are links to those pages.
- confidence: high.
- what would have helped: `sort:` honoured on term listings, and a documented filter chip block.
- CEILING.

### C7. Ruler and other attribute-driven bits
- wanted: a ruler of 55 ticks with this print marked at its true position, and a stretch-banded ruler on The Road.
- looked up: guide styling rungs, `describe` scope attributes.
- found: markdown carries no position (no inline style, no declared way to put a custom property on a fenced div).
- did: `script.js` draws both from `road.json`; without script the sentence remains and the ruler is absent. One page-scoped script is not possible, so the theme script runs on every page and returns at once if no `.ruler` exists.
- confidence: medium.
- what would have helped: attributes or custom properties on a fenced div, or a page-scoped script.
- CEILING.

### C8. Weather strip "current" state and numbering from the order
- wanted: six plates with the current print outlined, and "No. 3" on strip cards.
- looked up: grid cell rules, `describe --css .moss-grid`.
- found: nothing marks a card that links to the current page. A card has no number field.
- did: the current print is a non-link cell (`**Driving rain**` / `This print`) styled as an outlined box; strip numbers come from a CSS counter over the card order.
- confidence: high. The strip drops "ri" because a card carries only title and description.
- what would have helped: `aria-current` on a card for the current page; a card slot for a frontmatter value.
- CEILING.

### C9. Search field and phone Menu button
- wanted: a visible search field ("Search 55 prints") and, on a phone, Menu, search, toggle.
- looked up: `describe --css .nav-links`, `.nav-content`.
- found: search is an icon button; the menu collapses only under 320 px.
- did: kept the icon, tightened the links so four fit one row at 390 px (row 2 is links, search, toggle).
- confidence: high.
- what would have helped: a nav layout option for the menu breakpoint and a search field variant.
- CEILING.

### C10. A card's link name is longer than the print's title
- wanted: link names on cards equal to the print's title (addendum).
- looked up: `describe --css .moss-card`, the built card markup, and the computed accessible name in Playwright (`ariaSnapshot`).
- found: a card is one `<a>` around cover, title and description, so its name reads "Rain cover Rain Station 8 · Ōiso, Kanagawa · 16.8 ri" on a weather card and "Nihon Bridge: Morning Scene cover Nihon Bridge: Morning Scene The start of the road · Chūō, Tokyo · 0 ri" on the index. The cover alt is "<title> cover", so the title is read twice, and the one-line description is read after it. The description is the short caption, not the whole note, but the name is still not the title alone.
- did: nothing; moss gives no way to scope a card's link name (no `aria-labelledby` on the title, no way to hide the description or cover alt from the name). Reported as a fail against the addendum.
- confidence: high (read from the accessibility tree, not guessed).
- what would have helped: card links named by the title only (`aria-labelledby` on the title), with the description as `aria-describedby`.
- CEILING.

## FLOOR

### F1. Always-two-row header
- wanted: row 1 site name alone, row 2 links left and tools right.
- looked up: `describe --css .nav-content`.
- found: moss has this layout (`data-nav-split`), applied by script only when the links overflow.
- did: copied its four layout rules onto `.nav-content` so the split is unconditional. Patches a default.
- confidence: medium (relies on class names from `describe --css`).
- what would have helped: a declared setting to force the split.
- FLOOR.

### F2. Page width: `wide` ignores `--moss-width-wide`
- wanted: a 1240 px column.
- looked up: tokens list, `describe --css data-content-width`.
- found: `--moss-width-wide` is listed as a token but `content_width: wide` resolves to `50 * reading-size`, so overriding the token does nothing (measured: article stayed 800 px). `full` uses `--moss-site-max-width`.
- did: `--moss-site-max-width: 1240px` and `cascade: content_width: full` on the home page.
- confidence: high.
- what would have helped: the token documented as unused, or `wide` reading it.
- FLOOR.

### F3. Grids stop at four columns, and the guide does not say so
- wanted: five stretches in a row, a six-plate strip, and a scrolling strip of 55 cards.
- looked up: guide grid paragraph, `describe` example for `moss-grid`.
- found: `:::grid 5` and `:::grid 6` silently produce one column; `{scroll}` is dropped for N above 4. Only `data-columns` 1 to 4 have rules (read with `describe --css .moss-grid`).
- did: `:::grid 4 {scroll .strip}` plus a fixed `grid-auto-columns: 190px`; `--moss-grid-ratio` for the five and six column rows. Patches a default.
- confidence: high.
- what would have helped: say "1 to 4" in the guide and warn on larger N.
- FLOOR.

### F4. Grid cells are separated by `+++`, found only in `describe`
- wanted: 55 cards in a grid.
- looked up: guide ("a `:::grid` cell holding nothing but a page reference becomes a card").
- found: the guide never says how cells are separated; the example in `describe --json` does (`+++`). Without it all 55 links landed in one cell.
- did: `+++` between cells.
- confidence: high.
- what would have helped: one sentence and example in the guide's grid paragraph.
- FLOOR.

### F5. A body `# Heading` does not replace the auto title unless it opens the body
- wanted: the plate above the title.
- looked up: guide ("write a `# Heading` in the body: moss keeps it as written and it is then the page's heading").
- found: with the body opening on other content, both rendered: two `<h1>` per page (seen in the HTML).
- did: kept the auto title in the DOM and moved it under the plate with CSS grid rows (`article:has(> .numeral)`). Visual order differs from source order.
- confidence: high.
- what would have helped: the guide stating the "must open the body" condition.
- FLOOR.

### F6. Cards carry a surface, tint, radius and lift that a plate does not want
- wanted: plates on paper with a serif name and a grey line.
- looked up: `describe --css .moss-card`, `--item-cover-color`.
- found: `.moss-grid .moss-card` paints a surface, 6 px radius and a hover lift; `[data-cover-color] .moss-card-content` paints the cover's dominant colour with white text; `--moss-cover-color` is the documented override.
- did: `--moss-cover-color: transparent`, `color: inherit`, and resets for background, radius, shadow and the empty date slot. Patches a default.
- confidence: high.
- what would have helped: a "plain" card variant for artwork.
- FLOOR.

### F7. moss forces one column under 768 px, even for authored columns
- wanted: two or three columns on a tablet for the weather grids.
- looked up: `describe --css .moss-grid`.
- found: `@media (max-width: 768px) { .moss-grid[data-columns] { --_grid-wrap: 1fr } }`; `--moss-grid-ratio` cannot win.
- did: set `grid-template-columns` directly on my classes in the phone media blocks. Patches a default.
- confidence: high.
- what would have helped: let `--moss-grid-ratio` win at every width.
- FLOOR.

### F8. Series nav links are halved and use a narrow title box
- wanted: the full neighbour title on a phone.
- looked up: `describe --css .moss-series-nav`.
- found: each link has a maximum width; titles wrap but sat in a half-width cell at 390 px.
- did: `max-inline-size: none; inline-size: 100%` on the links. Patches a default.
- confidence: high.
- FLOOR.

### F9. Footer: spacer pseudo-element, and the moss mark outside the footer
- wanted: footer text on the page column; the small moss mark in line with it, not floating.
- looked up: `describe --css footer`, `.moss-colophon`.
- found: `footer.container::before` is a spacer that becomes a 24 px flex item once the footer is a flex row; the colophon is a centred sibling after the footer.
- did: hid the pseudo-element, aligned footer, series nav and colophon to one column width, and pulled the colophon up by a fixed negative margin. The negative margin is fragile: a taller footer needs the number changed.
- confidence: medium.
- what would have helped: a footer slot for the mark, or the mark inside the footer element.
- FLOOR.

### F10. Heading permalinks and buttons
- found: every `h3` gets a permalink anchor (an extra tab stop on a catalogue); `.moss-btn` fills with the text colour.
- did: `display: none` on `.moss-heading-anchor`; button colours set by `data-role`. Patches a default.
- what would have helped: a switch for heading anchors.
- confidence: high.
- FLOOR.

### F11. Fonts
- wanted: Newsreader, Zen Kaku Gothic New, Shippori Mincho, self-hosted.
- looked up: guide "The `.moss/theme/` packaging API".
- found: drop files next to `style.css`; no helper to fetch or subset.
- did: `fetch_fonts.py` takes only the Google Fonts slices that cover the 55 Japanese names and latin plus latin-ext (macrons), writes `fonts.css`; `style.css` begins with `@import url("fonts/fonts.css")` and it resolves.
- confidence: high.
- FLOOR.

### F12. Per-page-kind styling has one declared hook
- wanted: print pages, The Road and the home page styled differently.
- looked up: `describe` scope attributes.
- found: only `body[data-page="home"]` exists.
- did: scoped with `article:has(> .numeral)`, `article:has(> .map-hint)`, `article:has(> .vertical-title)`; these depend on the body markup of each kind, a hidden coupling.
- what would have helped: a declared per-page class or kind attribute.
- confidence: medium.
- FLOOR.

### F13. Wikilinks with an alias inside a table cell
- wanted: `[[Hakone|Hakone]]` in the Browse and Road tables.
- found: the pipe is read as a cell separator and the raw `[[…]]` text printed.
- did: standard markdown links with `.md` paths in tables.
- confidence: high.
- FLOOR.

### F15. moss gives the article a bottom margin that stacks into a 120px band above the footer
- wanted: no empty band above the footer on any page (addendum).
- looked up: measured the gap from the last visible element in `main` to the footer's top on eight pages at three widths.
- found: 120px on index, list and text pages (56px footer margin plus the article's own 64px bottom margin, read from computed styles), 56px on print pages where the series nav ends `main`.
- did: `main > article { margin-block-end: 0 }`. Patches a default. My first guess, padding on `main`, was wrong and changed nothing.
- confidence: high.
- FLOOR.

### F14. The card description is the meta description
- wanted: a card caption "Station 10 · Hakone, Kanagawa · 25 ri".
- found: a card shows the page's `description:`, so the same text is the page's meta description and share text.
- did: used a short factual description. Home, strip, weather and stretch cards all show it.
- what would have helped: a separate `caption:` field for cards.
- confidence: medium.
- FLOOR.

## Rules that only patch a moss default (all also listed above)

Header split (F1), `content_width: full` and the site max-width token (F2), grid column ratio overrides, the 190 px scroll track and phone `grid-template-columns` (F3, F7), card surface, tint, radius, hover and date slot (F6), series-nav link width (F8), footer pseudo-element, shared column and colophon pull-up (F9), heading-anchor hide and button colours (F10), the article bottom margin (F15).

## Counts

CEILING 10 (C1 to C10), FLOOR 15 (F1 to F15). Top five: C1 (no editable schematic map; generated SVG plus script), C2 (image `sizes` ignores page width, so plates are soft at 1x), C3 (facts cannot reach templates), F3/F4 (grids silently capped at four columns and cells separated by an undocumented `+++`), C4/C5 (series nav and breadcrumb cannot carry the road trail and neighbour plates).
