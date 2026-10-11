---
title: Performance
layout: guide
description: When to virtualize large lists and tables, how to defer costly content, and how to measure rendering cost.
---

What slows a page down is usually volume: a table that renders every row, dozens of live widgets mounted at load, or content laid out long before anyone scrolls to it.

## Large data

Every rendered row costs time to mount, sort, and filter. The list boxes window their menus on their own. Tables and trees leave it to you, because windowing changes their layout.

| Component | Default | When to change it |
| :--- | :--- | :--- |
| [ComboBox](/components/ComboBox#virtualization), [Dropdown](/components/Dropdown#virtualization), [MultiSelect](/components/MultiSelect#virtualization) | Virtualizes lists of 100 items or more | Leave it on. With `virtualize={false}`, the menu renders every item when it opens. |
| [DataTable](/components/DataTable#when-to-virtualize) | Renders every row | Set `virtualize` or `pageSize` past a few hundred rows. Sorting 1,000 rows takes about 30 ms with every row rendered, and under 2 ms virtualized. |
| [ToolbarSearch](/components/DataTable#debounced) | Filters on every keystroke | Set `debounce` to filter once typing pauses, or `deferFilter` to paint the input before the rows re-render. |
| [TreeView](/components/TreeView#virtualization) | Builds a collapsed branch on its first expand | Set `virtualize` for large trees, such as file trees with thousands of rows. |
| [VirtualList](/components/VirtualList#windowing-threshold) | Windows every list | Set `threshold` to render short lists in full, which keeps their rows in find in page. |

## Closed content

A collapsed accordion item and a hidden tab panel still build all their content. Set `lazy` on an [AccordionItem](/components/Accordion#lazy-loading) or a [TabContent](/components/Tabs#lazy-content) to build it the first time it opens. It then stays built. On `TabContent`, `unmountOnHide` also removes the content when another tab is selected.

## Deferring work

A long page can hold dozens of live widgets. Defer the costly ones until they near the viewport, and let the browser skip rendering static content offscreen.

| Technique | Keeps find in page and the accessibility tree | Use it for |
| :--- | :--- | :--- |
| [LazyMount](/components/LazyMount) | No, until it mounts | Live examples, charts, large tables, and other widgets that are costly to mount |
| [Prose](/components/Prose#offscreen-code-blocks) `deferOffscreen` | Yes | Pages with many code blocks or figures |
| CSS `content-visibility: auto` | Yes | Other static content that is costly to lay out. Pair it with `contain-intrinsic-size` so the scrollbar stays steady. |
| [ImageLoader](/components/ImageLoader#lazy-loading) `lazy` | Yes | Images below the fold. Loading starts when the image is within `rootMargin` (600px by default) of the viewport. |
| Native `loading="lazy"` | Yes | Plain images below the fold. Set `width` and `height` so the page doesn't shift when they load. |

| Do | Why |
| :--- | :--- |
| Leave text, headings, and links out of `LazyMount`. | Text is cheap to lay out. Content that hasn't mounted isn't in find in page, anchor links, or server-rendered HTML. |
| Don't set `content-visibility: auto` on content that overflows its box, such as a wide table. | It adds paint containment, which clips the overflow. |

## Measuring

Numbers from a development build or a jsdom test say little about what users feel.

| Do | Why |
| :--- | :--- |
| Measure in a production build. | Svelte 5's development mode captures a stack trace on every state change. That made re-renders 5 to 10 times slower in this library's audits. |
| Measure interactions from input to the next paint, with the Event Timing API or the browser's Performance panel. | That's the delay people feel. |
| Repeat the timing at 4x CPU throttling. | A 120 ms hitch on a laptop took 464 ms on a slow phone. |
