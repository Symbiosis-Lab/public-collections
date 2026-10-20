#!/usr/bin/env python3
"""List style rules with no design-reason comment: on the rule's own line, or ending the line above it."""
import re, sys, pathlib
css = pathlib.Path(__file__).resolve().parent.parent.parent / "hiroshige-tokaido/.moss/theme/style.css"
lines = css.read_text().split("\n")
bad = []
for i, l in enumerate(lines):
    st = l.strip()
    if not st or st.startswith(("/*", "*", "@import")) or "{" not in st:
        continue
    if st.startswith("@media"):
        # a media block carries its reason above it or on its own line; rules inside need their own too
        inner = st[st.index("{") + 1:].strip()
        if not inner:
            if not (lines[i - 1].strip().endswith("*/") or "/*" in st):
                bad.append((i + 1, st[:90]))
            continue
        st = inner
    if "/*" in l:
        continue
    j = i - 1
    while j >= 0 and not lines[j].strip():
        j -= 1
    if lines[j].strip().endswith("*/"):
        continue
    bad.append((i + 1, st[:90]))
for n, t in bad:
    print(n, t)
print(len(bad), "rules without a comment", file=sys.stderr)
sys.exit(1 if bad else 0)
