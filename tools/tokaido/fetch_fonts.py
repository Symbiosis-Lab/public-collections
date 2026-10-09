#!/usr/bin/env python3
"""Self-host the three typefaces: download only the Google Fonts slices the site uses.

Writes woff2 files and fonts.css to ../../hiroshige-tokaido/.moss/theme/fonts/;
style.css pulls them in with one @import. Run again only when the type or the
station names change.
"""
import json, re, sys, urllib.request, pathlib

HERE = pathlib.Path(__file__).parent
OUT = HERE.parent.parent / "hiroshige-tokaido/.moss/theme/fonts"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
FAMILIES = [  # (css2 query, slice names to keep or None = by used characters)
    ("Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400", {"latin", "latin-ext"}),
    ("Zen+Kaku+Gothic+New:wght@400;500;700", {"latin", "latin-ext"}),
    ("Shippori+Mincho:wght@500", None),
]
used = set("".join(s["ja"] for s in json.load(open(HERE / "seed/stations.json"))) + "東海道五十三次")

def fetch(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=30).read()

def covers(rng):
    for part in rng.split(","):
        part = part.strip()[2:]
        lo, _, hi = part.partition("-")
        lo, hi = int(lo, 16), int(hi or lo, 16)
        if any(lo <= ord(c) <= hi for c in used):
            return True
    return False

OUT.mkdir(parents=True, exist_ok=True)
css_out = []
for query, keep in FAMILIES:
    css = fetch(f"https://fonts.googleapis.com/css2?family={query}&display=swap").decode()
    for label, block in re.findall(r"/\* ([\w-]+) \*/\s*(@font-face \{.*?\})", css, re.S):
        rng = re.search(r"unicode-range: ([^;]+);", block).group(1)
        if keep is not None and label not in keep:
            continue
        if keep is None and not covers(rng):
            continue
        url = re.search(r"url\((https://[^)]+\.woff2)\)", block).group(1)
        name = url.rsplit("/", 1)[1]
        (OUT / name).write_bytes(fetch(url))
        css_out.append(re.sub(r"url\([^)]+\)", f"url({name})", block))
(OUT / "fonts.css").write_text("\n".join(css_out) + "\n")
print(f"{len(css_out)} slices -> {OUT}")
