---
description: Where the images come from, how their licence was established, and what the curators chose, checked and left open.
uid: "7f5bcc5e"
---

> A catalogue is only as good as its record of where things came from. This page is that record.

## The series

*Fifty-three Stations of the Tōkaidō* (東海道五十三次, Tōkaidō gojūsan tsugi no uchi) is the first edition of Utagawa Hiroshige's (歌川広重, 1797–1858) series of colour woodblock prints, published by Hōeidō (保永堂) in 1833–34. It has fifty-five designs: Nihonbashi, the fifty-three post stations of the Tōkaidō, and Kyoto. Museums often catalogue it as the "Hoeido Tokaido" to tell it from Hiroshige's later Tōkaidō series.

## Where the images come from

All fifty-five images come from the Art Institute of Chicago, which releases them under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) through its Open Access programme. For every print the record's own `is_public_domain` field was read from the museum's public API, and that quotation is printed on the print's page as "Licence evidence". The artist died in 1858 and the prints date from 1833–34, so they would be in the public domain regardless of the museum's grant.

The images were fetched from the museum's IIIF service at 1600 pixels on the long edge and re-encoded as JPEG. The museum holds two to four impressions of most designs; one was chosen for each, generally the one with the lowest accession number.

## What was checked and what was not

- **Edition.** The museum record has no separate edition field, so the Hōeidō edition was confirmed from the catalogue title, which contains "also known as the Hoeido Tokaido". The full title is on every page. Exactly 55 distinct designs matched, which is the canonical size of the set.
- **Coordinates.** Station positions come from the route table of the Japanese Wikipedia article on the [Tōkaidō gojūsan-tsugi](https://ja.wikipedia.org/wiki/東海道五十三次) and were cross-checked against 38 of the 55 individual station articles; all agreed within 1.4 km, most within 300 m. Three positions that had been entered from memory were corrected by 5 to 9 km. Treat pins as good to about a kilometre.
- **Distances.** The distance in ri is the running sum of inter-station distances in that table, which cites the Edo-period register 宿村大概帳. The total to Kyoto is 126.16 ri against the article's 126.17.
- **Captions.** The museum's description field is empty for these prints. The one-sentence captions on each page are written for this site from the title and the print's well-known subject; they are not museum text and each page says so.
- **Japanese.** The Japanese given is the station name as it appears in the series. The full Japanese title of each print is not in the source record and is not supplied here.

## What is not here

The Metropolitan Museum was searched first and yielded no usable Tōkaidō prints: its search returned unrelated objects. No other impressions, no later editions, and no information on the prints' dimensions or condition are included, because the curated record does not carry them.

## About this site

The site is a folder of markdown files built with moss. Each print is one page; the map, the sequence, the author page and the browse-by-place pages are generated from the front matter of those pages, not hand-built. The curated source is the `hiroshige-tokaido` collection in `moss-commons`, which holds the manifest, the fetch log and the curation notes this page summarises.
