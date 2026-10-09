#!/usr/bin/env python3
"""Generator for the hiroshige-tokaido site. Standard library only. See README.md.

  generate.py seed    write the 55 print pages and 5 stretch pages from seed/stations.json
                      (run once; afterwards the pages are the source of truth)
  generate.py blocks  read every print page's frontmatter and rewrite the derived blocks:
                      the map and station list on The Road, the home strip, weather,
                      stretch and mini-map blocks, the Browse table, the chips, and
                      assets/road.json (read by theme/script.js)
"""
import difflib, json, math, pathlib, re, sys, unicodedata

HERE = pathlib.Path(__file__).resolve().parent
SITE = HERE.parent.parent / "hiroshige-tokaido"
PRINTS = SITE / "Prints"
KM_PER_RI = 3.927
STRETCHES = [  # key, name, first station, last station, featured print (station number)
    ("tokyo-kanagawa", "Tokyo & Kanagawa", 0, 10, 0),
    ("shizuoka", "Shizuoka", 11, 32, 18),
    ("aichi", "Aichi", 33, 41, 36),
    ("mie", "Mie", 42, 48, 42),
    ("shiga-kyoto", "Shiga & Kyoto", 49, 54, 54),
]
WEATHER_INTRO = "Hiroshige lets the weather set the mood. Six stations, in the order of the road."


def stretch_of(n):
    return next(s for s in STRETCHES if s[2] <= n <= s[3])


def fmt_ri(r):
    r = round(r * 10) / 10
    return str(int(r)) if r == int(r) else str(r)


def km(r):
    return round(r * KM_PER_RI)


# ---------------------------------------------------------------- frontmatter
def read_page(path):
    text = path.read_text()
    m = re.match(r"---\n(.*?)\n---\n(.*)", text, re.S)
    fm = {}
    for line in m.group(1).splitlines():
        k, _, v = line.partition(":")
        v = v.strip()
        fm[k.strip()] = json.loads(v) if v[:1] in '"[' else v
    return fm, m.group(2)


def load_prints():
    """The stations, in road order, from the print pages' own frontmatter."""
    out = []
    for p in sorted(PRINTS.glob("*.md")):
        if p.stem == "Prints":
            continue
        fm, _ = read_page(p)
        n = int(fm["weight"]) - 1
        out.append(dict(
            n=n, file=p.stem, title=fm["title"], ja=fm["ja"], ri=float(fm["ri"]),
            lat=float(fm["lat"]), lng=float(fm["lng"]), place=fm["place"],
            cover=fm["cover"].split("/")[-1], desc=fm["description"],
            station=fm["station"], weather=fm.get("weather"),
        ))
    out.sort(key=lambda s: s["n"])
    assert [s["n"] for s in out] == list(range(55)), "print pages must carry weights 1..55"
    return out


def splice(path, name, body):
    """Replace the text between generated markers; the markers are the contract."""
    text = path.read_text()
    a, b = f"<!-- generated:{name} -->", f"<!-- /generated:{name} -->"
    i, j = text.index(a) + len(a), text.index(b)
    path.write_text(text[:i] + "\n" + body.strip("\n") + "\n" + text[j:])


# ------------------------------------------------------------------- seed
def fold(s):
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()


BREAKS = {"as", "while", "with", "near", "at", "on", "in", "into", "across", "beneath", "above", "outside", "from", "over", "toward", "after", "before", "by", "for", "and", "beyond", "marking", "towering"}


ALT_OVERRIDE = {"Ejiri": "Ejiri, Distant View of Miho: boats sail Suruga Bay off Ejiri"}  # the cut rule leaves this one dangling
STOP = {"a", "an", "the", "of", "on", "in", "at", "to", "and", "by", "with", "as", "while", "from", "over", "near", "its", "their", "his", "her", "into", "across", "beneath", "above"}


def alt_for(h1, note, limit=13):
    """Title plus what the print shows: the note cut at its last natural break within `limit` words."""
    words = note.rstrip(".").split()
    if len(words) > limit:
        cuts = [i for i, w in enumerate(words[:limit + 1]) if i >= 5 and (w in BREAKS or words[i - 1].endswith(","))]
        words = words[:cuts[-1] if cuts else limit]
    text = " ".join(words)
    head, comma, tail = text.rpartition(",")
    if comma and len(tail.split()) <= 3 and len(head.split()) >= 5:
        words = head.split()  # a short dangling clause after the last comma reads as cut off
    while words[-1].rstrip(",") in STOP:
        words.pop()
    return f"{h1.replace(': ', ', ', 1)}: {' '.join(words).rstrip(',.;')}"


def seed():
    rows = json.load(open(HERE / "seed/stations.json"))
    old = {}  # cover id -> (existing file, uid)
    for p in PRINTS.glob("*.md"):
        if p.stem == "Prints":
            continue
        fm, _ = read_page(p)
        old[fm["cover"].split("/")[-1]] = (p, fm["uid"])
    for s in rows:
        n = s["n"]
        path, uid = old[f"{s['id']}.jpg"]
        title, _, romaji = s["title"].partition(" (")
        romaji = romaji.rstrip(")")
        prefix, sep, rest = title.partition(": ")
        if sep and prefix != s["en"] and difflib.SequenceMatcher(None, fold(prefix), fold(s["en"])).ratio() > 0.8:
            title = f"{s['en']}: {rest}"
        stretch = stretch_of(n)
        img = f"../assets/{s['id']}.jpg"
        ri = s["ri"]
        place = s["modern"]
        pos = "The start of the road" if n == 0 else "The end of the road" if n == 54 else f"Station {n}"
        numeral, of = ("Start", "") if n == 0 else ("End", "") if n == 54 else (str(n), "of 53")
        line = (
            "The start of the road, nothing to walk yet." if n == 0 else
            f"{fmt_ri(ri)} ri, about {km(ri)} km from Nihonbashi: the end of the road." if n == 54 else
            f"{fmt_ri(ri)} ri, about {km(ri)} km from Nihonbashi.")
        fm = [
            "---", f"title: {json.dumps(title, ensure_ascii=False)}", f'uid: "{uid}"',
            f"description: {json.dumps(f'{pos} · {place} · {fmt_ri(ri)} ri', ensure_ascii=False)}",
            "author: Utagawa Hiroshige", f"weight: {n + 1}", f"cover: {img}",
            f"tags: [{json.dumps(stretch[1], ensure_ascii=False)}]",
            f"station: {json.dumps(s['en'], ensure_ascii=False)}", f"ja: {s['ja']}",
            f"ri: {ri}", f"lat: {s['lat']}", f"lng: {s['lng']}",
            f"place: {json.dumps(place, ensure_ascii=False)}",
        ]
        if "weather" in s:
            fm.append(f"weather: {json.dumps(s['weather'])}")
        fm.append("---")
        body = [
            "::: {.trail}", f"[[places|The Road]] / [[{stretch[1]}]] / {s['en']}", ":::", "",
            f"![{ALT_OVERRIDE.get(s['en']) or alt_for(title, s['note'])}]({img})",
            f"*Utagawa Hiroshige, 1833–34, colour woodblock. [Full size]({img})*", "",
            "::: {.eyebrow}", f"{pos} · {place}", ":::", "",
            "::: {.numeral}", numeral, *(["", of] if of else []), ":::", "",
            "::: {.slip}", s["ja"], ":::", "",
            "::: {.subtitle}", f"*{romaji}*", ":::", "",
            f"> {s['note']}", "",
        ]
        if "look" in s:
            body += ["::: {.look}", "### What to look for", "", s["look"], ":::", ""]
        body += ["### Where it falls on the road", "", "::: {.ruler}", line, ":::", ""]
        if "weather" in s:
            body += ["### Rain, snow and mist", "", "<!-- generated:weather -->", "<!-- /generated:weather -->", ""]
        body += ["::: {.credit}",
                 f"Art Institute of Chicago · Public domain (CC0) · [Source record](https://www.artic.edu/artworks/{s['id'].removeprefix('aic-')})",
                 ":::", ""]
        target = PRINTS / f"{path.stem}.md"
        target.write_text("\n".join(fm) + "\n" + "\n".join(body))
        (SITE / "Prints" / f"{path.stem}.md")
    # stretch pages: real pages that claim the tag, so each has its own listing and a cover
    (SITE / "places").mkdir(exist_ok=True)
    byn = {s["n"]: s for s in rows}
    for key, name, a, b, feat in STRETCHES:
        ri_a = 0 if a == 0 else byn[a]["ri"]
        text = "\n".join([
            "---", f"title: {json.dumps(name, ensure_ascii=False)}", f"tag_page: {json.dumps(name, ensure_ascii=False)}",
            f"description: {json.dumps(f'{b - a + 1} prints · {byn[a]['en']} to {byn[b]['en']} · {fmt_ri(ri_a)}–{fmt_ri(byn[b]['ri'])} ri', ensure_ascii=False)}",
            f"cover: ../assets/{byn[feat]['id']}.jpg", f"url: {key}", "weight: " + str(a + 1), "---",
            "<!-- generated:chips -->", "<!-- /generated:chips -->", ""])
        (SITE / "places" / f"{name}.md").write_text(text)


# --------------------------------------------------------------------- map
LNG0, LNG1, LAT0, LAT1 = 135.45, 140.35, 35.85, 34.45
COS = math.cos(35.2 * math.pi / 180)
W = 1200
K = W / ((LNG1 - LNG0) * COS)
H = round((LAT0 - LAT1) * K)


def px(lng, lat):
    return ((lng - LNG0) * COS * K, (LAT0 - lat) * K)


def pts(arr):
    return " ".join(f"{x:.1f},{y:.1f}" for x, y in (px(*p) for p in arr))


LABELLED = [0, 3, 10, 15, 19, 29, 38, 42, 54]
FONT = 13


def text_box(x, y, anchor, en, ja, size=FONT):
    w = 0.64 * size * len(en) + (size * 1.05 * len(ja) + 4 if ja else 0)
    h = size * 1.15
    x0 = x if anchor == "start" else x - w if anchor == "end" else x - w / 2
    return (x0, y - size * 0.85, x0 + w, y - size * 0.85 + h)


def rect_hits_circle(r, c, rad):
    cx = min(max(c[0], r[0]), r[2]); cy = min(max(c[1], r[1]), r[3])
    return (cx - c[0]) ** 2 + (cy - c[1]) ** 2 < rad * rad


def rect_hits_seg(r, a, b, pad=2):
    n = max(2, int(math.dist(a, b) / 2))
    return any(r[0] - pad <= a[0] + (b[0] - a[0]) * i / n <= r[2] + pad and r[1] - pad <= a[1] + (b[1] - a[1]) * i / n <= r[3] + pad for i in range(n + 1))


def rects_hit(a, b, pad=3):
    return not (a[2] + pad < b[0] or b[2] + pad < a[0] or a[3] + pad < b[1] or b[3] + pad < a[1])


def milestones(P, S):
    out = []
    last = S[-1]["ri"]
    r = 25
    while r < last:
        i = next(k for k, s in enumerate(S) if s["ri"] >= r)
        t = (r - S[i - 1]["ri"]) / (S[i]["ri"] - S[i - 1]["ri"])
        A, B = P[i - 1], P[i]
        x, y = A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t
        dx, dy = B[0] - A[0], B[1] - A[1]
        l = math.hypot(dx, dy) or 1
        out.append(dict(r=r, x=x, y=y, nx=dy / l, ny=-dx / l))
        r += 25
    return out


def build_map(S, compact=False):
    mp = json.load(open(HERE / "map.json"))
    P = [px(s["lng"], s["lat"]) for s in S]
    route = [(P[i], P[i + 1]) for i in range(len(P) - 1)]
    ms = milestones(P, S)
    fuji = px(138.73, 35.36)
    biwa = px(136.0, 35.42)
    obstacles_c = [(p, 7.5) for p in P]
    placed = []  # label rects already taken
    fixed = [  # landmark text and the Fuji glyph
        text_box(fuji[0] + 22, fuji[1] + 5, "start", "Fuji", "富士山"),
        text_box(biwa[0] + 16, biwa[1], "start", "Lake Biwa", ""),
        (fuji[0] - 18, fuji[1] - 12, fuji[0] + 18, fuji[1] + 9),
    ]
    placed += fixed
    labels = []

    def free(rect):
        if rect[0] < 4 or rect[1] < 4 or rect[2] > W - 4 or rect[3] > H - 4:
            return False
        if any(rect_hits_circle(rect, c, rad) for c, rad in obstacles_c):
            return False
        if any(rect_hits_seg(rect, a, b) for a, b in route):
            return False
        return not any(rects_hit(rect, o) for o in placed)

    # milestone ticks and their "25 ri" labels first, so station labels route around them
    tick_html = []
    if not compact:
        for m in ms:
            x1, y1, x2, y2 = m["x"] - m["nx"] * 7, m["y"] - m["ny"] * 7, m["x"] + m["nx"] * 7, m["y"] + m["ny"] * 7
            tick_html.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" class="tick"/>')
            placed.append((min(x1, x2) - 3, min(y1, y2) - 3, max(x1, x2) + 3, max(y1, y2) + 3))
        for m in ms:
            for side in (1, -1):
                for d in (17, 22, 28):
                    x, y = m["x"] + side * m["nx"] * d, m["y"] + side * m["ny"] * d + 4
                    r = text_box(x, y, "middle", f"{m['r']} ri", "", 11.5)
                    if free(r):
                        placed.append(r)
                        tick_html.append(f'<text class="lbl-s" x="{x:.1f}" y="{y:.1f}" text-anchor="middle">{m["r"]} ri</text>')
                        break
                else:
                    continue
                break
    # station labels: first free candidate, near to far
    cand = []
    for d in (11, 18, 26, 36):
        cand += [(d, -3, "start"), (-d, -3, "end"), (0, -d, "middle"), (0, d + 9, "middle"),
                 (d, -d, "start"), (-d, -d, "end"), (d, d + 9, "start"), (-d, d + 9, "end")]
    for n in LABELLED:
        if compact and n not in (0, 10, 54):
            continue
        s, (x, y) = S[n], P[n]
        for dx, dy, anchor in cand:
            r = text_box(x + dx, y + dy, anchor, s["station"], s["ja"])
            if free(r):
                placed.append(r)
                lead = ""
                if max(abs(dx), abs(dy)) > 20:
                    lead = f'<line x1="{x:.1f}" y1="{y:.1f}" x2="{x + dx * .8:.1f}" y2="{y + dy * .8 - 4:.1f}" class="leader"/>'
                labels.append(lead + f'<text class="lbl" x="{x + dx:.1f}" y="{y + dy:.1f}" text-anchor="{anchor}">{s["station"]} <tspan class="lbl-ja" lang="ja">{s["ja"]}</tspan></text>')
                break
        else:
            raise SystemExit(f"no free label slot for {s['station']}")
    gid = "c" if compact else "f"
    g = [f'<svg viewBox="0 0 {W} {H}" role="img" aria-label="Schematic map of the Tōkaidō from Edo (right) to Kyoto (left), with fifty-five station points" focusable="false">',
         f'<defs><linearGradient id="sea-{gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--road-sea)"/><stop offset="1" stop-color="var(--road-sea-deep)"/></linearGradient></defs>',
         f'<rect width="{W}" height="{H}" fill="url(#sea-{gid})"/>',
         '<g class="shore">' + "".join(f'<polyline points="{pts(mp["coast"])}" stroke-width="{w}" opacity="{o}"/>' for w, o in ((34, .06), (22, .08), (11, .1))) + "</g>",
         f'<polygon class="land" points="{pts(mp["coast"])}"/>',
         f'<polygon class="lake" points="{pts(mp["biwa"])}"/>',
         f'<g class="fuji" transform="translate({fuji[0]:.1f},{fuji[1]:.1f})" aria-hidden="true"><path d="M-17 7 L-4 -8 L0 -10 L4 -8 L17 7 Z"/><path d="M-6 -6 L-2 -3 L1 -6 L3 -3 L6 -6"/></g>']
    if not compact:
        g.append(f'<text class="lbl-s" x="{fuji[0] + 22:.0f}" y="{fuji[1] + 5:.0f}">Fuji <tspan lang="ja">富士山</tspan></text><text class="lbl-s" x="{biwa[0] + 16:.0f}" y="{biwa[1]:.0f}">Lake Biwa</text>')
        s1, s2 = px(137.3, 34.52), px(139.4, 34.62)
        g.append(f'<text class="lbl-sea" x="{s1[0]:.0f}" y="{s1[1]:.0f}">PACIFIC OCEAN</text><text class="lbl-sea" x="{s2[0]:.0f}" y="{s2[1]:.0f}">Sagami Bay</text>')
    # route line, with the Ise Bay sea crossing (Miya to Kuwana) drawn dashed
    seg = lambda a, b: " ".join(f"{P[i][0]:.1f},{P[i][1]:.1f}" for i in range(a, b + 1))
    g.append(f'<polyline class="route" points="{seg(0, 41)}"/><polyline class="route sea" points="{seg(41, 42)}"/><polyline class="route" points="{seg(42, 54)}"/>')
    g += tick_html
    for i, s in enumerate(S):
        x, y = P[i]
        if compact:
            g.append(f'<circle class="dot-c" cx="{x:.1f}" cy="{y:.1f}" r="3.2"/>')
        else:
            label = ("Start" if i == 0 else "End" if i == 54 else f"Station {i}") + f": {s['station']} {s['ja']}, {fmt_ri(s['ri'])} ri"
            g.append(f'<a class="st" data-n="{i}" href="/prints/{s["file"].lower()}/" aria-label="{label}"><circle class="hit" cx="{x:.1f}" cy="{y:.1f}" r="11"/><circle class="ring" cx="{x:.1f}" cy="{y:.1f}" r="12"/><circle class="dot" cx="{x:.1f}" cy="{y:.1f}" r="4.2"/></a>')
    g += labels
    g.append("</svg>")
    return "".join(g)


# ----------------------------------------------------------------- blocks
def card(s, title=None):
    return f"[[{s['file']}|{title}]]" if title else f"[[{s['file']}]]"


def chips(current):
    S = load_prints()
    items = [("All 55", "Prints", current == "all")] + [
        (f"{name} {b - a + 1}", name, current == key) for key, name, a, b, _ in STRETCHES]
    return "\n".join(f"- [[{t}|{label}]]" if not cur else f"- **{label}**" for label, t, cur in items)


def blocks():
    S = load_prints()
    road = [dict(n=s["n"], file=s["file"].lower(), name=s["station"], ja=s["ja"], ri=s["ri"], km=km(s["ri"]),
                 place=s["place"], img=s["cover"], title=s["title"], note=read_page(PRINTS / f"{s['file']}.md")[1].split("\n> ")[1].split("\n")[0],
                 stretch=stretch_of(s["n"])[1]) for s in S]
    (SITE / "assets/road.json").write_text(json.dumps(dict(
        last=S[-1]["ri"], stretches=[dict(key=k, name=n, a=a, b=b) for k, n, a, b, _ in STRETCHES], stations=road),
        ensure_ascii=False, separators=(",", ":")))
    # chips on Prints and every stretch page
    splice(PRINTS / "Prints.md", "chips", "::: {.chips}\n" + chips("all") + "\n:::")
    for key, name, *_ in STRETCHES:
        splice(SITE / "places" / f"{name}.md", "chips", "::: {.chips}\n" + chips(key) + "\n:::")
    # home
    splice(SITE / "index.md", "strip", ":::grid 4 {scroll .strip}\n" + "\n+++\n".join(card(s) for s in S) + "\n:::")
    wx = [s for s in S if s["weather"]]
    splice(SITE / "index.md", "weather", ":::grid 3 {.weather}\n" + "\n+++\n".join(card(s, s["weather"]) for s in wx) + "\n:::")
    splice(SITE / "index.md", "stretches", ":::grid 3 {.stretches}\n" + "\n+++\n".join(f"[[{n}]]" for _, n, *_ in STRETCHES) + "\n:::")
    splice(SITE / "index.md", "minimap", '<figure class="road-map road-map-compact">' + build_map(S, compact=True) + "</figure>")
    # weather strip on the six weather prints
    for s in wx:
        cells = []
        for t in wx:
            cells.append(card(t, t["weather"]) if t is not s else f"**{t['weather']}**  \nThis print")
        splice(PRINTS / f"{s['file']}.md", "weather", ":::grid 3 {.weather .weather-strip}\n" + "\n+++\n".join(cells) + "\n:::")
    # the road
    splice(SITE / "places/index.md", "map", '<figure class="road-map">' + build_map(S) + "</figure>")
    rows = []
    for key, name, a, b, _ in STRETCHES:
        rows += [f"### {name}", "", "| No. | Station | Distance |", "|---|---|---|"]
        for s in S[a:b + 1]:
            no = "Start" if s["n"] == 0 else "End" if s["n"] == 54 else s["n"]
            rows.append(f"| {no} | [{s['station']}](../Prints/{s['file']}.md) {s['ja']} | {fmt_ri(s['ri'])} ri |")
        rows.append("")
    splice(SITE / "places/index.md", "list", "::: {.roll}\n" + "\n".join(rows) + "\n:::")
    # browse
    rows = ["| No. | Station | Print | Where it is now |", "|---|---|---|---|"]
    for s in S:
        no = "Start" if s["n"] == 0 else "End" if s["n"] == 54 else s["n"]
        rows.append(f"| {no} | [{s['station']}](Prints/{s['file']}.md) {s['ja']} | {s['title'].split(': ', 1)[-1]} | {s['place']} |")
    splice(SITE / "Browse.md", "table", "\n".join(rows))


if __name__ == "__main__":
    {"seed": seed, "blocks": blocks}[sys.argv[1]]()
