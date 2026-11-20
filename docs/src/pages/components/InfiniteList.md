---
components: ["InfiniteList"]
description: InfiniteList loads a long list a page at a time, with a Load more button, loading as the reader scrolls if you want it, and the reader's place kept on Back.
---

<script>
  import { Box, InfiniteList, Text } from "carbon-components-svelte";

  const lastPage = {
    items: [
      { id: 1, name: "deploy-0001" },
      { id: 2, name: "deploy-0002" },
      { id: 3, name: "deploy-0003" },
    ],
  };
</script>

## Basic

Pass `load`, a function that fetches one page. It receives the `cursor` the last page returned (`undefined` for the first page) and an `AbortSignal` for `fetch`, and returns `items`, the next `nextCursor`, and the `total` if the source knows it. A missing `nextCursor` ends the list.

Each item renders through the default slot with `let:item` and `let:index`. Give the list a name with `aria-label`; it lands on the list. A `Load more` button follows the last item, with "Showing 20 of 400" above it.

The list loads its first page when it mounts. Pass the first page as `initial` to render it on the server instead; see [Server rendering](#server-rendering).

<FileSource src="/framed/InfiniteList/InfiniteListBasic" />

## Mode

Set `mode` to choose how the next page loads. The default, `"button"`, waits for a click. The button stays in the page in every mode: it is the way to load a page with a keyboard, and the way past a failure.

| `mode` | Next page loads | Use for |
| --- | --- | --- |
| `"button"` | On click | Tasks: a reader looking for one thing, or a page with a footer that matters |
| `"auto-then-button"` | As the reader nears the end, for `autoPages` pages, then on click | Browsing: search results, a catalog |
| `"auto"` | As the reader nears the end, every time | A feed with no footer worth reaching |

### Auto then button

The first `autoPages` pages after the first (2 by default) load as the reader scrolls. After that the list waits for a click, so the reader can reach what is below it. `rootMargin` sets how early the next page starts: 400px before the end by default.

Auto-loading pauses while keyboard focus is in the list. A reader tabbing through the results would otherwise have a page arrive under them each time they reached the end, and never get past it. They use the button instead. It resumes when focus leaves.

<FileSource src="/framed/InfiniteList/InfiniteListSearchResults" />

### Auto

Set `mode="auto"` for a list that always loads as the reader scrolls. Use it only where nothing below the list matters, because the page never stops growing. Keep `maxItems` set so it does.

## Pattern

### List

The default is a plain list: a `ul` with an `li` for each item. Each item has `aria-posinset` and `aria-setsize`, so a screen reader says "3 of 4,000" while only 20 are loaded. With no `total`, `aria-setsize` is `-1`, which tells the reader the size is unknown.

### Feed

Set `pattern="feed"` for a stream of articles: posts, comments, activity. The list gets `role="feed"` and each item `role="article"`, and `aria-busy` is set while a page loads. Move between articles with <DocKbd label="PageDown" /> and <DocKbd label="PageUp" />. <DocKbd label="PageDown" /> on the last article loads the next page and moves focus to its first item.

Use a feed only when each item stands alone as an article. A search result or a table row is a list item.

<FileSource src="/framed/InfiniteList/InfiniteListFeed" />

## Scrolling

### Page

By default the page scrolls, and the next page loads as the end of the list nears the bottom of the window. Everything on this page's examples works this way.

### Container

Set `scroll="container"` and a `height` to make the list its own scroll area, such as in a panel or a card. The list takes keyboard focus so the arrow keys and <DocKbd label="PageDown" /> scroll it. `rootMargin` is measured from the edge of the container.

<FileSource src="/framed/InfiniteList/InfiniteListContainer" />

## Depth cap

Set `maxItems` to stop the list after that many items. A reader who has scrolled through 200 results is not going to find what they want on page 11, and every page adds to the page's memory and layout cost. At the cap the button goes, and the `cap` slot says why. Say what to do next: add a filter, narrow the search.

A page that crosses the cap is kept whole, so a cap of 50 with pages of 20 stops at 60. The slot gets `count` and `total`; the default text reads "Showing 60 of 4,000. Refine your search to see more."

<FileSource src="/framed/InfiniteList/InfiniteListDepthCap" />

## States

### Empty

A first page with no items shows `emptyText`, or the `empty` slot for something richer such as an [EmptyState](/components/EmptyState).

<InfiniteList initial={{ items: [] }} emptyText="No deployments match your filters." />

### End

When `nextCursor` is missing, the button goes and `endText` takes its place. Fill the `end` slot to replace it.

<InfiniteList initial={lastPage} aria-label="Deployments" let:item>
  <Box paddingY={3} paddingX={5} border="subtle" borderSide="bottom">
    <Text type="body-compact-01">{item.name}</Text>
  </Box>
</InfiniteList>

### Error

A page that fails keeps every item already loaded and shows an alert with a `Try again` button, in place of the `Load more` button. The `error` event carries the error. `errorText`, `retryText` and the `error` slot replace the message and the button. Loading stops, even in `"auto"` mode, until the reader retries.

The second page of this list fails the first time it is asked for.

<FileSource src="/framed/InfiniteList/InfiniteListError" />

### Loading

The first page shows the `loading` slot, an `InlineLoading` by default. A later page puts the `Load more` button in its loading state, which keeps focus, and sets `aria-busy` on the list. A screen reader hears "20 more results loaded" when it arrives. Set `loadedText` to change the message, and `locale` for the numbers in it.

## Keeping the place

Set `restore` and the list remembers where the reader was. As they scroll, and when they leave, it saves the cursor of each loaded page and the first item in view, with its distance from the top. Back, Forward and reload then load those pages together and scroll the same item back to the same place. The item is the anchor, not a pixel offset, so it still holds if the items above it changed height or the column count changed.

```svelte
<InfiniteList {load} restore let:item>
  <ResultCard {item} />
</InfiniteList>
```

`restore` is `true` or a name. The default name is the page's path and query. Give each list its own name when more than one list shares a URL: `restore="open-issues"`.

| What is saved | Where | Why |
| --- | --- | --- |
| The cursors, the first item in view, and its offset | `sessionStorage`, per history entry | A new visit to the URL is a new entry and starts at the top. Back, Forward and reload are the same entry |
| Nothing about the items | | The pages are fetched again, so the items are fresh. A page that fails shows the pages before it and an error |

While a restoring list is on the page, it sets `history.scrollRestoration` to `"manual"`, so the browser does not scroll the page to a position that no longer fits, and puts it back when the list leaves. Key each item with `getKey` (the default is `item.id`): the anchor is found by key.

A browser that keeps the whole page for Back (the back-forward cache) needs none of this, and the list does nothing then. The list adds no `unload` listener, so it does not stop that cache.

## Server rendering

Pass the first page as `initial`. The server renders it with the count, the button and the skip link. The browser takes it over without a request, and without rebuilding it. With `restore`, the client then loads the rest.

```svelte
<script>
  export let data;
</script>

<InfiniteList initial={data.firstPage} load={fetchPage} restore let:item>
  <ResultCard {item} />
</InfiniteList>
```

Without `initial`, the server renders the `loading` slot and the browser loads the first page after mount.

## Long lists

Appending a page costs as much as the page, however long the list: each item's slot is created once, and the items already there are not touched. What grows with depth is the page itself. Measured in Chromium at 50 pages of 20 items, once with a light item of 5 elements and once with a card of 30 elements:

| 50 pages, 1,000 items | Light item | Card |
| --- | --- | --- |
| Elements in the page | 5,068 | 27,068 |
| Main thread to add one page | 4 ms (12 ms on a 4x slower CPU) | 6 ms (21 ms) |
| Lay out the whole page again, such as on a resize | 5 ms (13 ms) | 19 ms (65 ms) |
| Same with `lazyItems` | 1 ms (2 ms) | 1 ms (3 ms) |
| Restore at depth 50, with 100 ms requests | 1.4 s | |

Set `lazyItems` to let the browser skip layout and paint for the items that are off screen. Each item is clipped to its own box, so a focus ring or a shadow that spills out of it is cut off. An item the browser has not drawn yet takes `--ccs-infinite-list-item-size` (6rem) of height until it is, so set the property to a typical item height.

Start with `maxItems`: most readers narrow the search before page 10. Past about 1,000 cards, or a few thousand light items, use a [VirtualList](/components/VirtualList) with the same loader instead. Those two limits are where the layout cost of a full relayout on a slow phone passes one frame, and the page's memory grows with every item; both are estimated from the table, not measured.

## Usage

| Do | Why |
| --- | --- |
| Start with `mode="button"`, and add `"auto-then-button"` for browsing. | A button is the only way to load a page that a keyboard, a switch or a screen reader can rely on. Auto-loading is a convenience on top. |
| Keep something worth reaching below the list, and keep `autoPages` small. | An endless list takes the footer away. After a few pages, the reader decides. |
| Set `maxItems` and say what to do at the cap. | A reader on page 20 needs a filter, not another page. |
| Return `total` when the source knows it. | The count, the cap message and `aria-setsize` use it. |
| Return a stable `id` for each item, or set `getKey`. | A page that repeats an item is dropped, and the restored place is found by key. |
| Pass `signal` to `fetch`. | A reset or a removed list cancels the request. |
| Use `restore` on lists that lead to a detail page. | The reader who comes back is at the same result, not at the top. |
| Put the controls that change the query outside the list, and call `reset()` on the list (`bind:this`) when they change. | The list drops its items and starts over from the first page. |

## Keyboard

| Key | Action |
| --- | --- |
| <DocKbd label="Tab" /> | Moves through the items, then to `Load more`, then past the list. |
| <DocKbd label="Enter" /> or <DocKbd label="Space" /> on `Load more` | Loads the next page and moves focus to its first item. |
| <DocKbd label="PageDown" /> and <DocKbd label="PageUp" /> in a feed | Move to the next and previous article. |

The link before the list, "Skip to end of results", moves focus past it, to the next thing on the page. Set `skipLink` to `false` to remove it. In `scroll="container"` the scroll area takes a tab stop of its own before it.
