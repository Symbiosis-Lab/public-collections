# tools/tokaido

Generator and inputs for the `hiroshige-tokaido` site. Standard library Python 3 only; every path is relative to this folder.

## What owns what

- **The print pages** (`hiroshige-tokaido/Prints/*.md`) own the facts: `ri`, `lat`, `lng`, `ja`, `station`, `place` and `weather` live in each page's frontmatter, next to the prose. Edit them there.
- **`generate.py blocks`** reads those pages and rewrites the derived blocks between `<!-- generated:NAME -->` markers: the map and the list of 55 on The Road, the home strip, weather, stretches and mini map, the weather strip on the six weather prints, the filter chips, the stretch pages' rows, the Browse table, and `assets/road.json` (read by `.moss/theme/script.js` for the ruler and the map panel). Run it before every build.
- **`generate.py seed`** wrote the print pages and the five stretch pages once, from `seed/stations.json`. It overwrites those pages, so run it only on an empty checkout; after that the pages are the source of truth.
- **`map.json`** holds the hand-drawn coast and Lake Biwa outline (longitude, latitude), used only by the map.
- **`fetch_fonts.py`** downloads the Google Fonts slices the site needs into `.moss/theme/fonts/` (Newsreader, Zen Kaku Gothic New, Shippori Mincho for the 55 station names) and writes `fonts.css`.
- **`friction-run2.md`** is the build log for this run.

## Regenerate

```
python3 tools/tokaido/generate.py blocks
moss-cli build hiroshige-tokaido --strict
```

Map labels are placed by the generator (`build_map`): each label takes the first of 32 offsets that touches no marker, tick, route segment, landmark or other label. It raises if a label has no free slot, so a collision cannot ship silently.

`seed/stations.json` is the curated text (notes, "what to look for" lines, weather words) and station table; the notes and look-for lines were written for this site, not taken from the museum.
