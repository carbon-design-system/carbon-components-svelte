---
description: VirtualList renders only the rows in view for long lists of arbitrary data, with optional measured row heights and a load-more signal.
---

<script>
  import { Box, VirtualList } from "carbon-components-svelte";

  const regions = ["us-south", "us-east", "eu-de", "eu-gb", "jp-tok", "au-syd"];

  const instances = Array.from({ length: 5000 }, (_, i) => ({
    id: i,
    name: `web-prod-${String(i + 1).padStart(4, "0")}`,
    region: regions[i % regions.length],
  }));

  const authors = ["Aisha Khan", "Mateo García", "Priya Patel", "Chen Wei", "Olivia Brown", "Kwame Mensah"];

  const messages = [
    "Approved.",
    "Can we ship this behind a feature flag first?",
    "Rolled back the canary. The error rate on checkout-api jumped from 0.2% to 4.1% within five minutes of the deploy.",
    "LGTM once the migration has a down step.",
    "The nightly export has been timing out since Tuesday. Moving it to the batch queue and raising the worker memory limit to 2 GB fixed it in staging. The production rollout is scheduled for Thursday's maintenance window.",
    "Duplicate of #4821.",
    "Added dashboards for p95 latency and queue depth.",
    "A customer reports that invoices generated before their currency change still show USD totals. Reproduced with account 7731: the PDF renderer reads the account's current currency instead of the one stored on the invoice.",
  ];

  const comments = Array.from({ length: 2000 }, (_, i) => ({
    id: i,
    author: authors[i % authors.length],
    message: messages[(i * 5) % messages.length],
  }));
</script>

## Basic

`VirtualList` renders each item through its default slot with `let:item` and `let:index`, but only mounts the items inside the scroll viewport plus `overscan` extra on each side. While scrolling, it also mounts items ahead of the viewport, as far as the last scroll moved and up to one `containerHeight`, so a fast scroll does not show blank space. `index` is the item's position in the full `items` array, not in the rendered window.

Set `containerHeight` for the viewport and `itemHeight` for each row, both in pixels. Every row must render at exactly `itemHeight` for the scroll position to line up.

<VirtualList items={instances} itemHeight={40} containerHeight={240} let:item let:index>
  <Box display="flex" align="center" justify="space-between" height="40px" paddingX={5} border="subtle" borderSide="bottom">
    <span>{index + 1}. {item.name}</span>
    <span>{item.region}</span>
  </Box>
</VirtualList>

## Fast scrolling

During a scroll faster than the list can render, such as a quick drag of the scrollbar, the rows can briefly disappear. Set `optimizeFastScroll` to keep the rows already rendered in view until the new ones arrive.

The rows then follow the scroll a frame behind, and pause while the page is busy running scripts. Leave it off when the list sits on a page that often does heavy work. `optimizeFastScroll` has no effect with [`scrollElement`](#scroll-container).

<VirtualList optimizeFastScroll items={instances} itemHeight={40} containerHeight={240} let:item let:index>
  <Box display="flex" align="center" justify="space-between" height="40px" paddingX={5} border="subtle" borderSide="bottom">
    <span>{index + 1}. {item.name}</span>
    <span>{item.region}</span>
  </Box>
</VirtualList>

## Item height

### Measured

Set `measured` to `true` when rows vary in height, such as wrapping text. Each rendered row is measured with `ResizeObserver` and `itemHeight` becomes the estimate for rows not yet measured.

<VirtualList items={comments} itemHeight={72} containerHeight={320} measured let:item>
  <Box display="flex" direction="column" gap={2} paddingX={5} paddingY={4} border="subtle" borderSide="bottom">
    <strong>{item.author}</strong>
    <p>{item.message}</p>
  </Box>
</VirtualList>

| Do | Why |
| --- | --- |
| Set `itemHeight` close to the typical row height | The scrollbar is sized from estimates until rows are measured; a close guess keeps it from jumping. |
| Pass `getKey` when items are reordered or removed | Rows are keyed by position by default, which is only stable when items are appended. Measured heights are always stored by position. |

## Windowing threshold

Every list is windowed by default. Set `threshold` to render lists shorter than it in full, which keeps every row in the DOM for find-in-page.

<VirtualList items={instances.slice(0, 20)} itemHeight={40} containerHeight={240} threshold={100} let:item>
  <Box display="flex" align="center" justify="space-between" height="40px" paddingX={5} border="subtle" borderSide="bottom">
    <span>{item.name}</span>
    <span>{item.region}</span>
  </Box>
</VirtualList>

## Load more

`scrollend` fires once when the list is scrolled near the bottom, with `{ scrollTop, scrollHeight, clientHeight }` as its detail. Append the next page of `items` in the handler; the event re-arms when `items` grows. It is a load-more signal, not the browser's native `scrollend`.

<FileSource src="/framed/VirtualList/VirtualListLoadMore" />

## Scroll container

### With ScrollGradient

Set `scrollElement` to scroll the list from an ancestor instead of its own container. Bind a [ScrollGradient](/components/ScrollGradient)'s `scrollElementRef` and pass it in so the gradients track the list. Keep `containerHeight` equal to the `ScrollGradient` height.

<FileSource src="/framed/VirtualList/VirtualListScrollGradient" />

## In a list

Set `spacerTag` to `"li"` to render items straight into a list. The list keeps only `li` children: an empty `li` above and below the items holds the scroll height. Each item must render exactly one element, and each `li` gets `aria-posinset` and `aria-setsize` so screen readers announce its place in the full list.

The list has no scroll container of its own. Wrap the list in a [ScrollGradient](/components/ScrollGradient), pass its `scrollElementRef` as `scrollElement`, and set `containerHeight` to its height. The gradients show that more items lie past each edge.

### With ContainedList

Render each item as a `ContainedListItem` inside a [ContainedList](/components/ContainedList). Each item overlaps the one above by 1px, so set `itemHeight` to the item height less 1px: 47 for the default size. Set `measured` too, since items wrap onto more lines on narrow screens. Measured heights include the overlap. The list header stays pinned to the top, so set `hideStartGradient` to keep the top gradient off it. Set `background` and `color` to `"background"` to match the header.

<FileSource src="/framed/VirtualList/VirtualListContainedList" />

### With UnorderedList

Render each item as a `ListItem` inside an [UnorderedList](/components/UnorderedList). Pad the list on the left so the scroll container does not clip the bullets. Set `measured`, since items wrap onto more lines on narrow screens.

<FileSource src="/framed/VirtualList/VirtualListUnorderedList" />

### With OrderedList

Only the rendered items are in the DOM, so an [OrderedList](/components/OrderedList) would number them from 1. Set `native` on the `OrderedList` and pass `value={index + 1}` to each `ListItem`. Set `measured`, since items wrap onto more lines on narrow screens.

<FileSource src="/framed/VirtualList/VirtualListOrderedList" />

### With RecursiveList

A [RecursiveList](/components/RecursiveList) renders every node, so window its top level instead. Render each top-level node as a `ListItem` with a `nested` `RecursiveList` of its children. Set `measured`, since each item is as tall as its subtree.

<FileSource src="/framed/VirtualList/VirtualListRecursiveList" />
