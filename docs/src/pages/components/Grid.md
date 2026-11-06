---
components: ["Grid", "Row", "Column", "GridOverlay"]
description: The Carbon grid system provides a responsive layout structure using row and column components.
---

## Basic

The [Carbon grid system](https://carbondesignsystem.com/elements/2x-grid/overview/) uses a responsive column structure where the total number of columns changes based on screen size. Column spans are relative to the total columns at each breakpoint — to create a full-width column, use `sm={4} md={8} lg={16}` instead of the same value across all breakpoints.

Create a basic grid layout with equal-width columns.

<FileSource src="/framed/Grid/Grid" />

| Breakpoint        | Viewport width   | Columns |
| ----------------- | ---------------- | ------- |
| **Small (`sm`)**  | 0–671px          | 4       |
| **Medium (`md`)** | 672–1055px       | 8       |
| **Large (`lg`)**  | 1056–1311px      | 16      |
| **X-Large (`xlg`)** | 1312–1583px    | 16      |
| **Max (`max`)**   | 1584px and above | 16      |

## Variants

Adjust grid width and column spacing.

### Full width

Use the full-width grid variant for layouts that span the entire viewport width.
This removes the default max-width constraint.

<FileSource src="/framed/Grid/FullWidthGrid" />

### Narrow

Create a more compact grid layout using the narrow variant. This reduces the
spacing between columns.

<FileSource src="/framed/Grid/NarrowGrid" />

### Condensed

Use the condensed variant for even tighter spacing between columns. This is ideal
for dense data displays.

<FileSource src="/framed/Grid/CondensedGrid" />

### Per-row

`condensed`, `narrow`, `noGutter`, and `padding` are also available directly on
`Row`, so you can mix densities within a single grid instead of applying a
variant to every row.

```svelte
<Grid>
  <Row condensed>
    <Column>Condensed row</Column>
    <Column>Condensed row</Column>
  </Row>
  <Row>
    <Column>Default row</Column>
    <Column>Default row</Column>
  </Row>
</Grid>
```

## Columns

Build responsive layouts by setting a different column width per breakpoint.
Each breakpoint has a different total column count, so scale spans
proportionally.

### Full width column

```svelte
<Column sm={4} md={8} lg={16} />
```

### Half width (50/50 split)

```svelte
<Column sm={2} md={4} lg={8} />
<Column sm={2} md={4} lg={8} />
```

### Two-thirds / one-third split

```svelte
<Column sm={4} md={6} lg={11} />
<Column sm={4} md={2} lg={5} />
```

### Extra-large and max breakpoints

`lg`, `xlg`, and `max` all share the same 16-column grid, but the viewport
keeps growing past `lg`. Set `xlg` and `max` independently when a layout needs
a different span on very wide screens instead of stretching the `lg` value.

```svelte
<Column sm={4} md={8} lg={8} xlg={6} max={4} />
```

<FileSource src="/framed/Grid/ResponsiveGrid" />

### Offset

Create space between columns using the offset feature for more flexible layouts
without empty columns.

<FileSource src="/framed/Grid/OffsetColumns" />

### Aspect ratio

Maintain consistent column heights using aspect ratio columns. This ensures
content alignment across different column widths.

<FileSource src="/framed/Grid/AspectRatioColumns" />

## Alignment

`Row` stretches its columns to an equal height by default. Set `align` on
`Row` to change how columns align along the cross axis (`start`, `center`,
`end`, or `stretch`), or set `align` on an individual `Column` to override the
row's alignment for that column alone.

<FileSource src="/framed/Grid/RowAlignment" />

### Equal height columns

A stretched `Column` does not stretch the content inside it. Set `fullHeight`
on `Tile` so a tile fills its column instead of sizing to its own content.

<FileSource src="/framed/Grid/EqualHeightColumns" />

## Spacing

Control vertical rhythm and horizontal gutters at the grid, row, or column
level.

### Padding

Add vertical padding (top/bottom) with `padding`. Apply it at the grid, row, or column level to control spacing between rows
of content. This is useful for creating vertical rhythm without manually adding margins.

<FileSource src="/framed/Grid/PaddedGrid" />

### Gutter

Remove the horizontal gutter with `noGutter`, or remove just one side with
`noGutterLeft` / `noGutterRight`. These props are available on `Grid`, `Row`,
and `Column`, so you can drop the gutter globally or flush a single column
against an edge or divider.

<FileSource src="/framed/Grid/NoGutterColumns" />

## Custom element

Set `as` to `true` on `Grid`, `Row`, or `Column` to render a semantic element
instead of the default `<div>`. Props are destructured as `props` in the
default slot and must be spread onto the custom element to keep the Carbon
grid classes.

```svelte
<Grid as let:props>
  <main {...props}>
    <Row as let:props>
      <section {...props}>
        <Column as let:props>
          <article {...props}>Content</article>
        </Column>
      </section>
    </Row>
  </main>
</Grid>
```

## GridOverlay

Draw the real breakpoint grid over the page to check content against the
actual columns instead of eyeballing it. `GridOverlay` renders a fixed,
`pointer-events: none` layer of 16 columns — hidden or shown per breakpoint
the same way a regular `Column`'s numeric span does — so it lines up with
`sm`/`md`/`lg`/`xlg`/`max` exactly.

`GridOverlay` never toggles its own visibility; the caller owns `open`.

<FileSource src="/framed/Grid/GridOverlay" />

| Do                                                  | Why                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------------------- |
| Gate `open` behind a dev-only control, then remove it before shipping | The overlay has no built-in toggle or guard, so anything left wired to `open` renders in production |
| Match `condensed` / `narrow` / `fullWidth` to the `Grid` underneath | The overlay's columns only line up with a mismatched `Grid`'s columns by coincidence |

### Gutters

Set `gutters` to shade each column's padding a step darker than its content area, so you can check that content sits inside the columns rather than in the gutters.

<FileSource src="/framed/Grid/GridOverlayGutters" />

### Condensed

Set `condensed` to match a condensed `Grid`. The columns sit in the same place, but the gutters shrink to 1px (0.5px of padding on each side). This example also sets `gutters`: compared with the Gutters example, the 32px bands all but disappear.

<FileSource src="/framed/Grid/GridOverlayCondensed" />

### Narrow

Set `narrow` to match a narrow `Grid`, where each column drops its 16px left padding so its content hangs into the gutter. This example also sets `gutters`, so only the right-hand 16px of each gutter is shaded.

<FileSource src="/framed/Grid/GridOverlayNarrow" />

### Full width

Set `fullWidth` to match a full-width `Grid`. It only differs from the default at the `max` breakpoint (1584px and above), where the default grid stops growing and the full-width grid keeps spanning the viewport.

<FileSource src="/framed/Grid/GridOverlayFullWidth" />

## Breakpoints reference

Understanding [breakpoints](/components/Breakpoint) is critical for creating responsive layouts. Each breakpoint
has specific pixel ranges and column counts:

| Breakpoint          | Viewport width   | Columns | Typical use              |
| ------------------- | ---------------- | ------- | ------------------------ |
| **Small (`sm`)**    | 0–671px          | 4       | Mobile phones            |
| **Medium (`md`)**   | 672–1055px       | 8       | Tablets, small laptops   |
| **Large (`lg`)**    | 1056–1311px      | 16      | Desktop monitors, laptops |
| **X-Large (`xlg`)** | 1312–1583px      | 16      | Large desktop monitors   |
| **Max (`max`)**     | 1584px and above | 16      | Extra-large displays     |

When designing responsive layouts, start with mobile (sm) and work your
way up to ensure your content works well at all sizes.
