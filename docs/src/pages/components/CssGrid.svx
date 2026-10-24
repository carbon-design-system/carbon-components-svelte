---
components: ["CssGrid", "CssColumn"]
description: CssGrid lays out a page on Carbon's 2x grid with CSS Grid, so columns can span, start and end on any grid line at each breakpoint.
---

## Basic

`CssGrid` is the CSS Grid mode of the [Carbon grid](https://carbondesignsystem.com/elements/2x-grid/overview/). It uses the same breakpoints, column counts, gutters and margins as the flexbox [Grid](/components/Grid). Each `CssColumn` is a grid item, so there is no `Row`. Columns wrap to a new row when the current one is full.

Set `sm`, `md`, `lg`, `xlg` or `max` to the number of columns to span from that breakpoint up.

<FileSource src="/framed/CssGrid/CssGrid" />

| Breakpoint | Viewport width | Columns |
| :--- | :--- | :--- |
| `sm` | 0–671px | 4 |
| `md` | 672–1055px | 8 |
| `lg` | 1056–1311px | 16 |
| `xlg` | 1312–1583px | 16 |
| `max` | 1584px and above | 16 |

Put each `CssColumn` directly inside a `CssGrid`. A wrapper element between them takes the column's place on the grid. Do not mix the two grids: a `Column` inside a `CssGrid`, or a `CssColumn` inside a `Row`, is not sized by the grid around it.

## Spans

### Percentage

Set a span to `"25%"`, `"50%"`, `"75%"` or `"100%"` of the current column count. `span="50%"` is 2 of 4 columns at `sm`, 4 of 8 at `md` and 8 of 16 from `lg` up.

<FileSource src="/framed/CssGrid/CssGridPercent" />

### Responsive

Each breakpoint prop takes the same values as `span`: a number, a percentage, `true` to fill the remaining space, or a placement object. A value holds from its breakpoint up until a larger breakpoint changes it. Set `0` to hide the column, as `sm={0}` does here below `md`.

<FileSource src="/framed/CssGrid/CssGridResponsive" />

## Placement

Pass an object with `span`, `start`, `end` or `offset` to `span` or a breakpoint prop to place a column on specific grid lines. Lines count from 1, so a 16-column grid has lines 1 to 17.

### Start and end

Set `start` and `end` to grid line numbers. Combine `start` with `span` to set the start line and the width, or with `end` to set both edges. A `start` of `0` returns the column to automatic placement.

<FileSource src="/framed/CssGrid/CssGridStartEnd" />

### Offset

Set `offset` to the number of columns to skip. `offset: 2` starts the column on line 3. Set `offset` or `start`, not both.

<FileSource src="/framed/CssGrid/CssGridOffset" />

### Right-to-left

Grid lines count from the inline start. Under `dir="rtl"`, line 1 is at the right edge and the gutters swap sides, so the whole layout mirrors. Set the direction with [LayoutDirection](/components/LayoutDirection) or `dir` on `<html>`.

<FileSource src="/framed/CssGrid/CssGridRtl" />

### Vertical alignment

A column stretches to the height of the tallest column in its row. Set `align` to `"start"`, `"center"` or `"end"` to fit a column to its content and move it to the top, middle or bottom of the row. `"stretch"` is the default. The values are the same as `align` on the flexbox `Column`. Alignment is vertical, so `dir="rtl"` does not change it.

<FileSource src="/framed/CssGrid/CssGridAlign" />

## Variants

### Narrow

Set `narrow` to `true` to remove the gutter on the leading side of each column. Content hangs 16px into the gutter.

<FileSource src="/framed/CssGrid/NarrowCssGrid" />

### Condensed

Set `condensed` to `true` to collapse the gutter to 1px, for dense layouts such as image grids or data displays.

<FileSource src="/framed/CssGrid/CondensedCssGrid" />

### Column hang

Add the `bx--grid-column-hang` class to content inside a narrow or condensed column to line it up with content in a wide grid.

<FileSource src="/framed/CssGrid/CssGridColumnHang" />

### Row gap

Set `withRowGap` to `true` to add space between rows that matches the gutter. A narrow grid gets half of it.

<FileSource src="/framed/CssGrid/CssGridRowGap" />

### Full width and alignment

The grid stops growing at 1584px and centers itself in wider containers. Set `fullWidth` to `true` to remove that maximum width. Set `align` to `"start"` or `"end"` to keep the grid at one side of a wider container instead.

```svelte
<CssGrid fullWidth>
  <CssColumn span="100%">Full width</CssColumn>
</CssGrid>

<CssGrid align="start">
  <CssColumn span="100%">Starts at the inline start</CssColumn>
</CssGrid>
```

## Subgrid

### Nested grid

Nest a `CssGrid` inside a `CssColumn` to split that column into its own grid. The nested grid is a subgrid: it has one track for each column the parent spans, and it pulls back the parent's gutters so its columns line up with the outer grid. Below, the subgrid's columns sit on the same tracks as the outer columns in the next row.

<FileSource src="/framed/CssGrid/CssSubgrid" />

Give the parent `CssColumn` a span at every breakpoint. Without one, the subgrid gets the full grid's column count. Use numbers, not percentages, for columns inside a subgrid: a percentage resolves against the page grid, so `"50%"` is 8 tracks at `lg` even in a 12-track subgrid.

### Gutter modes

A subgrid has wide gutters by default, whatever the grid around it uses. Set `narrow` or `condensed` on the nested `CssGrid` to change them. `fullWidth` and `align` have no effect on a subgrid.

<FileSource src="/framed/CssGrid/CssSubgridModes" />

## Custom properties

The grid reads Carbon v11's custom properties. Set them on `:root`, on any parent element, or on the `CssGrid` itself. The nearest value wins, whatever order the stylesheets load in.

| Property | Default | Sets |
| :--- | :--- | :--- |
| `--cds-grid-gutter` | `2rem` | The gutter between columns |
| `--cds-grid-columns` | `4`, `8`, then `16` from `lg` | The column count |
| `--cds-grid-margin` | `0`, `1rem`, then `1.5rem` at `max` | The space at each side of the grid |

`--cds-grid-gutter` sets the wide gutter. A narrow grid keeps the trailing half of it. A condensed grid keeps its 1px gutter, and its column hang moves so content still lines up with a wide grid. Subgrids follow it too, whatever mode the grid around them uses. Percentage spans count the default columns, so use numbers with a custom `--cds-grid-columns`.

Set a value on `:root` to change every grid on the page, or on a parent element to change only the grids inside it.

```css
:root {
  --cds-grid-gutter: 3rem;
}

.flush {
  --cds-grid-margin: 0;
}
```

```svelte
<div class="flush">
  <CssGrid>
    <CssColumn span="100%">3rem gutter, no outer margin</CssColumn>
  </CssGrid>
</div>
```

Set it on one grid with `style`.

```svelte
<CssGrid style="--cds-grid-columns: 12">
  <CssColumn span={4}>4 of 12 columns</CssColumn>
</CssGrid>
```
