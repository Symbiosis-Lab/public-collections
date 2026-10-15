# Friction log, theme round 1

Format: wanted / looked / found / did / confidence / would have helped.

## F1 Header lacks Partners and Projects
- Wanted: header pages Projects, Partners, About the sources.
- Looked: build output, `describe` frontmatter (`nav`, `listed`, `nav_label`).
- Found: only "About the sources" is in the nav. `partners/` is a generated folder with no source file, so no frontmatter can set `nav: true`; Projects has no single page (the home page is the name link).
- Did: nothing; cannot be done without a page or HTML. Confidence high.
- Helped: a config-level nav list (`[nav]` in config.toml), or generated folders honouring a stub.

## F2 No breadcrumb on project pages
- Wanted: Projects > Housing above the title.
- Looked: `breadcrumb` frontmatter (home page: `true` shows the trail in the header).
- Found: needs a `.md` edit on the home page, which is forbidden this round. Not done. Confidence high.
- Helped: say in `describe` whether `breadcrumb: label` (parent as small link above title) fits this need; it probably does, so the home page should get it in a content round.

## F3 Area badge is a CSS-generated guess (CEILING)
- Wanted: a coloured badge with the area and, beside it, the kind (`kind: Building` in frontmatter).
- Looked: `describe --json` scope_attributes, frontmatter, built HTML.
- Found: nothing carries the area or custom frontmatter (`kind`, `years`, `figure`, folder `color:`, `icon:`) into the HTML; only `data-path`. Folder `color:` is not a documented field and did not reach the page.
- Did: area colours scoped by `body[data-path^="/housing/"]` and the badge as `article::before { content: var(--a-name) }`. The name lives in CSS, is not announced the same way, and the kind is missing. Confidence medium: it works, but is a workaround.
- Helped: expose frontmatter as `data-*` on body/article, or a `children_style`-like slot for custom fields; honour the folder's `color:` as `--moss-section-color`.

## F4 Area colour cannot come from the area folder's page (CEILING)
- Wanted: each area folder's `color:` drives its pages.
- Found: the five values are copied into the theme. Renaming a folder breaks them (the `data-path` warning in the guide). Confidence high.
- Helped: a body attribute with the section's folder name or its `color` value.

## F5 Partner page: projects after Sources, no role line
- Wanted: role line above the name, project cards before the Sources list.
- Found: `description:` is not printed on the page (only in cards and meta). The cards block is generated after the body, so Sources comes first; the Sources `h2`+`ul` have no wrapper, so CSS cannot reorder them. Confidence high.
- Helped: render `description` under the title (as `byline` does); a slot or `order` for generated listings.

## F6 Footer credit line missing
- Wanted: the prototype's credit footer.
- Found: it needs `footer.md` (a content file, forbidden). Only the moss colophon shows. Confidence high.

## F7 KERN as a kit does not fit the themes layer
- Wanted: load kern.min.css.
- Looked: guide "packaging API".
- Found: it would sit nested in the themes layer with its own resets (340 KB). Chose to copy resolved token values and the Fira Sans files only. Not tested loading the kit. Confidence medium.
- Helped: a sentence on whether an `@import` of a third-party kit is supported or discouraged.

## F8 Overriding moss's card clamps needed three properties
- Wanted: full text in partner cards.
- Found: `describe --css .moss-card-description` shows a two-line clamp set with five properties; had to unset all. Worked first time after reading it. Helped: a custom property for the clamp count (`--moss-card-lines`).

## F9 Phone header order needed a media query against moss's `data-nav-split`
- Wanted: name and switch on line one, pages on line two.
- Found: moss's split puts the name alone on row 1; I re-ordered `.nav-right` with `display: contents`. Confidence medium: it depends on moss's inner structure, which `describe` lists only as class names.
- Helped: documented `--moss-header-layout` or nav order custom property.

## F10 Playwright output path
- The screenshot tool refused the scratchpad path (allowed roots are the repo tree only); saved to its default folder and copied with `cp`. Tool config, not moss.

## Not done
- Key figure squares, dateline, fact column, previous/next pager (plugin round or content).
- Home page listing (not touched).
- Light/dark switch is moss's own button, not KERN's switch pattern.
