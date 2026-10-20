---
title: "Starter notes"
draft: true
---
# Intro

The Organisation starter: a society that publishes a programme — a course of reading, a calendar of days, local chapters on a map, a season of gatherings at a place — in the body's own collective voice, with many pages that are notices and reports rather than essays. This copy is filled with the Chautauqua Literary and Scientific Circle's own editorial department from *The Chautauquan* (1882–85) and its first Assembly years, so every sentence on a page is the Circle's and our words are frontmatter only (`title`, `date`, `source`, `description`, `location`).

This file lives at `.moss/STARTER.md`, not at the site root, so it is never built as a page.

# Who writes, and why

Who writes: the unsigned editorial department of the magazine, speaking as the Circle. Anything signed carries `author:` and `source:`; John H. Vincent, the Founder, is credited by name as the Founder's voice and used only from his own book (*The Chautauqua Movement*, 1886).

Why it publishes: to keep a scattered membership on one course of reading, to tell local circles what others do, and to call them to the memorial days and to the August Assembly.

Cadence: a monthly magazine, a yearly course of reading, an Assembly each August.

# Sections and the moss feature each shows

The nav holds five one-word items: Home, Reading, Circles, Calendar, About. Home is automatic under `[site] header = "nav"`. A section's `title:` is its nav label, so the titles are short and each section's full name ("Course of Reading", "Local Circles") is the `#` heading in its folder page's body.

- Home: one still photograph as a full-width `:::hero` with nothing written on it, the Circle's name and its three mottoes beneath it in a fenced div (`::: {.masthead}`), stat tiles as a `:::grid 3 {.stats}`, and the three latest notices as a folder embed (`![[/Notices/|style:summary,sort:date,limit:3,more:Notices]]`)
- Reading (`Course of Reading/`): a series, with prev/next between its pages
- Circles (`Local Circles/`): `location:` on every page, and a `:::buttons` link to the places map at `/places/`
- Calendar: the Circle's own list of its days as the folder page's body; the Memorial Days and the August Assembly as dated pages at day precision, oldest first through `sort: date-asc`; the Assembly pages are located, and one carries its own map (`map: true`)
- Notices: not in the nav; the home page lists the latest and links to the rest
- About: the photographs as a `:::gallery`, then a plain metadata list
- Search and RSS come for free

# Not shown here, and why

Math, notebooks and film are absent: no public-domain film of Chautauqua exists before 1931, so the banner is one still photochrom. moss's `:::hero` can crossfade several images (one `![[image]]` per line), which this site leaves unused, because the pictures would change without changing what the page says. A second language is absent too, since starters are English-only.
