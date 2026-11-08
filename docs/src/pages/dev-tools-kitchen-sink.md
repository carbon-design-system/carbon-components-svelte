---
title: Dev tools kitchen sink
layout: guide
description: Try every dev tool on one realistic app page built from Carbon components, with seeded layout bugs and a stress mode.
---

<script>
  import DocKbd from "../components/DocKbd.svelte";
  import Preview from "../components/Preview.svelte";
</script>

This page is a full app screen built from real Carbon components: a UI Shell, a page header, KPI tiles, a DataTable with a toolbar and pagination, a long form, lists, an accordion, and more. Use it to see what the [dev tools](/components/DevToolbar) find, and what they cost, on a page that looks like yours.

Open it in a new tab with the link above the preview. The tools draw over the whole viewport, so a full window shows them best.

<FileSource src="/framed/DevToolbar/DevToolbarKitchenSink" />

## What to try

Turn on tools from the toolbar at the bottom of the page. Each row says what the tool should show here.

| Tool | What to look for |
| :--- | :--- |
| Grid columns | The 16 columns line up with the KPI tiles and the form. The badge shows the breakpoint as you resize. |
| Baseline rows | The rows start below the 48px header, because the example sets `baselineOffset: 48`. |
| Text baselines | Text set on Carbon's type scale lands on or near the rows. The 15/22 paragraph in **Seeded bugs** drifts. The header's text marks stay put while you scroll. |
| Inspect on hover | Hover a KPI tile, a table cell, or a form field. The card names the spacing, type, and color tokens. Hold <DocKbd label="Alt" /> and hover another element to measure between them. |
| Off-scale spacing | Only the seeded card is flagged: 13px padding and a 20px gap. Everything else is Carbon's. |
| Low contrast text | Only the faint helper text in the seeded card, at about 1.9:1. |
| Small targets | Only the three 16px icon buttons, which sit 4px apart. They share one label, "16 × 16 · +2 more", so the labels do not print over each other. |
| Overflow | The ellipsis-truncated URL, and the 1600px banner that scrolls the page sideways. |
| Right-to-left | The shell, the grid, and the form mirror. Measurements in the tools still read left to right. |

The checks scan the viewport and one screen above and below, so the summary counts change as you scroll. Scroll to **Seeded bugs** to see them all at once.

## Seeded bugs

Turn off **Seeded bugs** to see the page with nothing but Carbon parts. The page checks then find nothing, which is the point: they skip Carbon's own components and look only at your code.

## Check Carbon too

Turn on **Check Carbon too** to run the checks on Carbon's components as well. This is what `checkCarbon` does. Expect real findings, because this library uses Carbon v10 component styles, and some of them predate the v11 spacing scale:

- DataTable cells have 14px vertical padding.
- Some menus and list items have 10px or 11px padding.

The collapsed side nav menu is not flagged for overflow. It clips its items, but they are hidden anyway.

Use this mode to check a custom theme or your own overrides of Carbon styles, not to fix Carbon itself.

## Stress mode

Turn on **Stress mode** to add 1,000 rows to the activity list and a clock that changes ten times a second. Then turn on every check. The checks scan again at most a few times a second, when the browser is idle, and only near the viewport, so scrolling and typing stay smooth.

In stress mode this page has about 4,000 elements. With text baselines and all four checks on, the tools cost about 0.4 seconds of script time per 5 seconds of constant change, and no task blocks the page for long.

## Known limits

- Labels of different checks can still overlap. Labels of the same check merge when they would collide.
- The checks see the page as it is now. A menu that is closed, or a tab that is not selected, is not checked until it opens.
