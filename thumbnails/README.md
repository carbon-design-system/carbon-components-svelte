# Thumbnails

Every component with a docs page gets a 320×180 SVG here, named after
the page in kebab case (`ToggleButtonGroup.svx` →
`toggle-button-group.svg`). `carbon.yml` points at these through
`thumbnailPath`, and they're the preview a catalog shows next to the
component name.

New components usually ship without one. Check before each release.

## Find what's missing

```sh
bun run thumbnails missing
```

It keys off the docs pages, not `src/`. Pages like `ClickableTile` live
inside another folder (`src/Tile/`), and folders like `ListBox` or
`FormItem` have no page. It also lists thumbnails with no page, except
`skeleton.svg` and `tabs-vertical.svg`, which back `carbon.yml` entries.

`scripts/thumbnails.ts` has three more commands, used in the
[recipe](#recipe): `audit` checks the mechanical rules below, `sheet`
renders a contact sheet, and `themes` renders the files in all five
themes.

## Design principles

A thumbnail is a glyph, not a screenshot. People see it at a fraction
of its size in a grid of ninety others, so it has one job: make the
component recognizable and tell it apart from its neighbors.

**One idea per thumbnail.** Pick the single trait that defines the
component and draw only that. Meter is a track with a fill in a status
color. It isn't three meters in three states with threshold ticks. If
you're listing features, cut. The first draft is almost always too
busy.

**Abstract by default.** Text is a flat bar, not words. Media is a
filled block. Icons appear only when they carry the meaning (bold,
italic, and underline in ToggleButtonGroup, chevrons on Carousel
controls).

**Real text only when the text is the component.** Link, Text,
RelativeTime, and Truncate show literal words, because "2 days ago"
says more than any shape could. Keep it to a short phrase. A list is
not its text: OrderedList is bars with numbers, not "Ordered List"
four times.

**Distinguish from look-alikes.** Before drawing, find the existing
thumbnail it could be mistaken for and pick the trait that separates
them. Meter and ProgressBar are both a labeled track. Meter's warning
yellow fill is the difference, and ProgressBar keeps the blue. The
likeliest look-alikes sit in the same docs category, so render that
category's sheet (`bun run thumbnails sheet --category Layout`).

**Show invisible structure with dashed outlines.** Some components are
about something you can't see: rows that aren't rendered
(VirtualList), padding that content breaks out of (Bleed). A dashed
`text-disabled` outline marks a boundary or a thing that isn't there.
Solid shapes are things that render.

**Nothing cut off, no chrome.** Draw every element whole. Leave out
scrollbars, window frames, and partial rows, even when the real
component has them. A clipped shape reads as a rendering bug at
thumbnail size.

**Spend color on the point.** Stay in greys and use one accent, either
`interactive-01` blue or a status color, on the element that carries
the idea: the selected tab, the pressed button, the meter fill. Two
accents compete.

**Shadows mean "floats above".** Only layers that float get a shadow:
menus, popovers, tooltips, modals, toasts. Draw it with the
[elevation recipe](#elevation) so every floating layer casts the same
one.

**Match the family.** Separator rules are 1px `border-subtle`, the
same as Divider and DescriptionList. Text bars are 6px or 8px tall.
Keep stroke weights, bar heights, and spacing consistent with the
existing set so the grid reads as one system. Reuse the
[visual vocabulary](#visual-vocabulary) for states instead of
inventing a new cue.

**Draw symbols at the weight of the bars.** The set is flat fills.
A symbol drawn as an outlined illustration, or at twice the size of
the bars beside it, looks pasted in. The first LocalStorage draft had
a 48px stroked database cylinder and read as clip art; outlined
braces at the same weight as the key/value bars fit. Strokes are for
1px borders and dashed boundaries, not for drawing objects.

**Fill the safe area.** A lone 16px icon in the middle of the canvas
disappears in the grid. A thumbnail that is one control (CopyButton,
BadgeIndicator, Loading) scales it up; see the sizes under
[Canvas and geometry](#canvas-and-geometry).

**Twins share one design.** Components that come in a pair or family
look alike on purpose and differ in one place. LocalStorage and
SessionStorage are the same braces, with the session one inside a
browser tab. The skeleton family shares one shimmer. The tooltip
family shares one bubble and differs by trigger.

**No cursors.** A pointer or hand says "interactive" about everything,
so it says nothing. Show the component's own cue instead: an arrow
icon on ClickableTile, a chevron on ExpandableTile. The exception is
ContextMenu, whose idea is a menu that opens at the pointer.

**When a symbol doesn't land, change direction.** Don't nudge the
size or color of a symbol that reads wrong. Draft three or four
different directions in `.context/`, render them side by side with
`sheet`, and pick one. Draft twins as pairs so you judge the
difference between them too.

**Break a rule only when breaking it is the idea.** ScrollGradient is
about content that runs past the edge, so its rows are cut off.
TagSet is about color variety, so it uses several. If the exception
isn't the component's one idea, the rule holds.

## Canvas and geometry

| Rule | Value |
| :--- | :--- |
| Canvas | `width="320px" height="180px" viewBox="0 0 320 180"` |
| Safe area | roughly x 64–256, y 28–152 |
| Default content width | 168 (x 76–244), centered |
| Text bars | height 8 for labels and values, 6 for body text |
| Fields | 32 tall, `field-01` with a 1px `border-strong` bottom edge; label bar 8 above, 16 to the field |
| Menus and lists | rows 18–22 apart; a highlighted row is a 22-tall `border-subtle` band |
| Buttons | 24 tall when secondary to the idea, 32 when they are the idea |
| Icons | 16px (`scale(0.5)`) inline; 20px for standalone arrows; 24–28px inside a lone control |
| Lone control | about 56×56, centered (CopyButton, BadgeIndicator) |
| Rings and spinners | radius 28, stroke 4 |
| Rules | `height="1"` rect, not a stroked line |
| 1px strokes | offset by 0.5 (`x="76.5"`) so edges stay crisp |
| Coordinates | whole numbers, except the 0.5 stroke offset |

Center the composition both ways. Measure the bounding box of
everything you drew, not just the main shape.

## Visual vocabulary

The same state should look the same in every thumbnail.

| Meaning | Draw it as | Seen in |
| :--- | :--- | :--- |
| Selected | 1px `icon-primary` outline on the tile, plus a filled control | RadioTile, SelectableTile |
| Pressed | `border-subtle` fill with a 2px `interactive-01` bottom bar | ToggleButtonGroup |
| Current or active | 2px `interactive-01` underline or fill | Tabs, PaginationNav, PageHeader |
| Typing | 1×14 `icon-primary` caret after the text bar | ComboBox |
| Filter match | the start of each row's bar dark, the rest light | ComboBox |
| Open | floating panel under the field, chevron pointing up | Dropdown, MultiSelect |
| Not rendered, or a boundary | 1px dashed `text-disabled` outline | VirtualList, Bleed, Breakpoint, FloatingPortal |
| Composed of parts | 1px dashed `interactive-01` outline around each part | ComposedModal |
| Loading | shimmer gradient from `text-disabled` to `border-subtle` | Skeleton family |
| Stored data | outlined `{` `}` around key/value bars | LocalStorage, SessionStorage |
| Status | support color on the icon and a 3px left edge | InlineNotification, ToastNotification |
| Focus | don't draw it | |

Look-alike pairs and the trait that separates them:

| Pair | Separating trait |
| :--- | :--- |
| ComboBox / Dropdown | typing and filtered matches / a checked selection |
| ComboButton / MenuButton | a split action and trigger / one button with a menu |
| FloatingPortal / Popover | escapes a clipped container / caret on a trigger |
| RadioTile / SelectableTile | stacked radios, one selected / a row of checkboxes, several checked |
| ClickableTile / ExpandableTile / Tile | arrow / revealed section and chevron / neither |
| Modal / ComposedModal | plain / dashed outlines around header, body, and footer |
| Form / FluidForm | labels above fields / labels inside joined fields |
| Tooltip / TooltipIcon / TooltipDefinition / Toggletip | icon with a bubble above / icon button with a side label / underlined term / pressed trigger with a link inside |
| Skeleton / SkeletonText / SkeletonPlaceholder / SkeletonIcon | card / paragraph / block / small square |
| Meter / ProgressBar | status-colored fill / blue fill |

## Color tokens

Every fill and stroke uses `var(--cds-<token>, <hex>)` so the
thumbnail follows the host theme. The hex is the white-theme value
and is what renders anywhere the variable isn't defined, including
GitHub and `rsvg-convert`. Reuse these pairs exactly:

| Token | Hex | Use for |
| :--- | :--- | :--- |
| `--cds-ui-02` | `#ffffff` | Raised surfaces, containers |
| `--cds-field-01` | `#f4f4f4` | Fields, tiles, unpressed buttons |
| `--cds-border-subtle` | `#e0e0e0` | Rules, tracks, pressed or selected fills, media blocks |
| `--cds-text-disabled` | `#c6c6c6` | Secondary text bars, dashed outlines |
| `--cds-text-placeholder` | `#a8a8a8` | Primary text bars |
| `--cds-border-strong` | `#8d8d8d` | Strong borders, emphasized blocks |
| `--cds-text-secondary` | `#525252` | Headings, terms, labels with weight |
| `--cds-button-secondary` | `#393939` | Secondary buttons, dark selected segments |
| `--cds-icon-primary` | `#161616` | Icons, real text |
| `--cds-icon-inverse` | `#ffffff` | Marks on `icon-primary` or inverse fills (checkbox checks, notification titles); flips with them |
| `--cds-text-04` | `#ffffff` | Labels and icons on blue, status, or secondary-button fills; white in every theme |
| `--cds-interactive-01` | `#0f62fe` | The one accent: selected, active, links |
| `--cds-support-success` | `#198038` | Success status |
| `--cds-support-warning` | `#f1c21b` | Warning status |
| `--cds-support-error` | `#da1e28` | Error status |
| `--cds-background-inverse` | `#393939` | Tooltips, notifications, inverse surfaces |
| `--cds-text-inverse` | `#ffffff` | Text bars on inverse surfaces |

The thumbnails theme only when they're inlined into a page that
defines the tokens. Loaded through `<img>` or on GitHub, an SVG is its
own document, so every `var()` falls back to the hex.

Pick tokens by what they sit on, because some flip in dark themes and
some don't. `icon-inverse`, `ui-02`, and `background-inverse` flip;
`text-04` stays white. A label on a blue button is `text-04`: with
`icon-inverse` it turns dark on g80, g90, and g100. A check on an
`icon-primary` checkbox is `icon-inverse`, so the two flip together.

`bun run thumbnails audit` fails on any other token or a mismatched
hex. Raw colors fail too, except in thumbnails whose idea is literal
color (tag, tag-set, theme, user-avatar-group; see
`RAW_COLOR_EXCEPTIONS` in `scripts/lib/thumbnails.ts`).

To match what the component really renders, read its partial in
`css/_<component>.scss` and map the Sass token to the closest row
above. For example, `_meter.scss` fills the warning state with
`$support-03`, which is `--cds-support-warning`.

## File template

```svg
<?xml version="1.0" encoding="UTF-8"?>
<svg width="320px" height="180px" viewBox="0 0 320 180" version="1.1" xmlns="http://www.w3.org/2000/svg">
    <title>component-name</title>
    <g id="component-name" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <rect id="label" fill="var(--cds-text-disabled, #c6c6c6)" x="76" y="74" width="60" height="8"></rect>
    </g>
</svg>
```

Give each part an `id` that names what it is (`track`, `fill`,
`selected`). The ids make the file reviewable without rendering it.

Draw plain shapes. No `<use>`, `<image>`, or `xlink:href`: they're
how design-tool exports reuse geometry, and they make the file harder
to read and edit. Keep each file under 8 KB; a bigger one is usually
outlined text or exported cruft.

## Elevation

A floating layer is two rects with the same geometry: a black one
under the shadow filter, then the surface on top.

```svg
<defs>
    <filter id="component-name-shadow" filterUnits="userSpaceOnUse" x="0" y="0" width="320" height="180">
        <feOffset dy="2" in="SourceAlpha" result="offset"></feOffset>
        <feGaussianBlur stdDeviation="3" in="offset" result="blur"></feGaussianBlur>
        <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.3 0"></feColorMatrix>
    </filter>
</defs>
<rect id="shadow" fill="black" filter="url(#component-name-shadow)" x="100" y="48" width="120" height="44"></rect>
<rect id="surface" fill="var(--cds-ui-02, #ffffff)" x="100" y="48" width="120" height="44"></rect>
```

The filter region covers the whole canvas on purpose. A region in
percentages of a short shape is too small for the blur and clips it
into a smear, which is what broke `tooltip-icon.svg`. The `fill="black"`
under a filter is the one raw color `audit` allows.

## Recipe

1. Run `bun run thumbnails missing` to list missing thumbnails.
2. For each one, read the page's frontmatter `description:` and its
   `## Basic` example. Write down the one trait you'll draw before
   opening an editor.
3. Render the sheet for its docs category
   (`bun run thumbnails sheet --category <label>`, labels from
   `docs/src/component-categories.ts`). Note what the neighbors look
   like so the new one doesn't.
4. Copy the closest existing thumbnail as a starting point. The shared
   layout, tokens, and sizes come along for free.
5. Draw it. Check colors against the component's SCSS partial. Keep
   drafts and alternatives in `.context/drafts/`, not `thumbnails/`.
   `sheet` takes paths too:
   `bun run thumbnails sheet meter .context/drafts/meter-b.svg`.
6. Check the mechanics: `bun run thumbnails audit <name>…` and
   `xmllint --noout thumbnails/<name>.svg`.
7. Check themes: `bun run thumbnails themes <name>…` renders the
   files in white, g10, g80, g90, and g100 to
   `.context/thumbnails-themes.png`. It needs a built `css/all.css`
   (`bun run build:css`). Look for marks that vanish or invert against
   their fill.
8. Review: `bun run thumbnails sheet <name>…` writes
   `.context/thumbnails-sheet.png`. Seeing the new ones side by side
   catches inconsistent weight and spacing that a single render hides.
   Check each against the principles above, and cut whatever isn't
   the one idea.
9. Commit as `chore: add thumbnail SVGs for <components>`.

For a cleanup that shouldn't change the picture (renaming ids,
inlining `<use>`, swapping a raw hex for its token), render every
touched file before and after and compare the pixels. Visual review
misses one-pixel shifts and dropped shadows; a diff doesn't.

## Gotchas

| Gotcha | Why it matters |
| :--- | :--- |
| Prefix every id that's defined in `<defs>` or referenced through `url(#…)` or `href` with the component name (`scroll-gradient-clip`) | A page that inlines several thumbnails shares one id namespace, so a bare `clip` or `shadow` id makes one SVG pick up another's definition. `sheet` rasterizes each file first for the same reason. |
| Draw floating layers without a `transform` | A `userSpaceOnUse` filter region is measured in the element's own coordinates. On a rotated or translated element the canvas-sized region moves with it and can clip the shadow. `tooltip-icon.svg` had a rotated bubble path for this reason; it's now a plain rect and a caret polygon. |
| Don't keep drafts in `thumbnails/` | A cleanup glob like `rm thumbnails/v*-*.svg` matches `virtual-list.svg` too. Drafts go in `.context/drafts/`. |
| The root `<g>` sets `stroke="none"` | Outlined shapes need an explicit `stroke` and `stroke-width`, or they render with no border. |
| Real text: outline it, don't use `<text>` | `<text>` falls back to Helvetica or Arial wherever Plex isn't installed. Link, Text, Truncate, RelativeTime, and the numerals in OrderedList and PaginationNav are outlined paths instead: IBM Plex Sans Regular (from `@ibm/plex-sans`, drawn with Python `fontTools`), 12px by default, baseline at y 95 and centered on x 160 for a single phrase. Round coordinates to one or two decimals and keep phrases short; outlined glyphs cost about 500 B each against the 8 KB budget. |
| Icons are 32-unit paths | Copy the `<path d>` from `node_modules/carbon-icons-svelte/lib/<Icon>.svelte` and apply `transform="translate(x, y) scale(0.5)"` for a 16px icon. |
| `sheet` needs `rsvg-convert` | `brew install librsvg`. No ImageMagick needed. |
| A new thumbnail doesn't add a catalog entry | `carbon.yml` is a separate edit (`thumbnailPath: './thumbnails/<name>.svg'` plus `demoLinks`). Thumbnail PRs so far (#3800, #4186) left it alone. |
