---
components: ["ListDetailLayout", "ListDetailItem"]
description: A list beside the details of its selected item, for an inbox, a ticket queue or a resource browser. On a narrow screen it shows one pane at a time.
keywords: ["master detail", "split view", "inbox", "reading pane"]
---

## Basic

Put the list in the `list` slot and the details in the `detail` slot, and give the layout a height. A `ContainedList` of `ListDetailItem` works as the list: each item is a link that selects it. `bind:selectedId` holds the id of the selected item, and `""` means none.

Beside the list the panes sit side by side, and the details show an empty state until an item is selected. Below the breakpoint one pane shows. Picking an item opens its details, a Back button returns to the list, and focus follows: it moves to the first heading in the details, and back to the item on return.

The list is one Tab stop. Use <DocKbd label="ArrowUp" />, <DocKbd label="ArrowDown" />, <DocKbd label="Home" /> and <DocKbd label="End" /> to move between items and <DocKbd label="Enter" /> to open one. Tab then moves into the details. Name the regions with `listLabel` and `detailLabel`; name the details after the selected item.

The examples on this page set `syncUrl` to `false`, because the docs site owns this page's URL. See [URL](#url) for the default.

<FileSource src="/framed/ListDetailLayout/ListDetailLayoutInbox" />

## Layout

### Resizable

Set `resizable` to let the user drag the divider between the panes, or focus it and use the arrow keys. `listSize` is the list's share as a percentage and takes `bind:`, and `listMin` and `listMax` bound it. The divider hides when one pane shows.

<FileSource src="/framed/ListDetailLayout/ListDetailLayoutResizable" />

### Breakpoint

Set `breakpoint` to `"md"`, `"lg"` or `"xlg"` to choose the width at which the panes sit side by side. These are the Carbon grid breakpoints, 672px, 1056px and 1312px, because CSS cannot read a custom width in a container query.

By default the breakpoint measures the layout's own width, so a layout in a panel or a dashboard tile stacks when its box is narrow, whatever the window is. The server renders both panes and the stylesheet picks one, so the first paint has the right layout without script. Resize across the breakpoint with an item selected and the selection stays: the details show, and focus moves to them if the list held it.

A container ignores its content when it sizes itself, so the layout needs a width from its parent, such as a block or a flex or grid item with a width. In a shrink-to-fit parent, such as an inline block, it collapses to nothing. Set `responsiveTo` to `"viewport"` to measure the window instead. It has no such limit, and a layout that fills the page behaves the same either way.

<FileSource src="/framed/ListDetailLayout/ListDetailLayoutContainer" />

## States

### Empty

The details show `emptyText` until something is selected. Use the `empty` slot for a richer message, such as an `EmptyState` with an action. Beside one pane the list is the empty state: nothing shows until a selection.

### Loading

Set `loading` to `true` while the details load. The pane shows a skeleton, or the `loadingChildren` slot, and is marked busy. If the user opened the details on a narrow screen, focus waits on the pane and moves to the heading once the content arrives.

<FileSource src="/framed/ListDetailLayout/ListDetailLayoutLoading" />

## URL

The selection is the `id` query parameter, so a reload, a shared link and the browser's Back and Forward all restore it. Set `urlParam` to use another name. Each item's link is `?id=4821`, kept beside the other parameters and the hash, so it can be opened in a new tab; a plain click selects in place.

`historyMode` sets how a selection enters the history. `"auto"` adds an entry when one pane shows or nothing was selected, and replaces the entry when the user moves from one item to the next beside the list, so Back does not step through every item they looked at. Set it to `"push"` or `"replace"` to always do one.

The Back button is the browser's Back when the layout added the entry, so the history does not grow as the user goes back and forth. On a deep link there is no entry to go back to; the button clears the id in place and the user stays on the page.

```svelte
<ListDetailLayout bind:selectedId listLabel="Tickets" detailLabel={ticket?.subject}>
  <ContainedList slot="list" labelText="Tickets" hideLabel>
    {#each tickets as ticket (ticket.id)}
      <ListDetailItem id={ticket.id}>{ticket.subject}</ListDetailItem>
    {/each}
  </ContainedList>
  <TicketDetails slot="detail" {ticket} />
</ListDetailLayout>
```

Under a router that owns the URL, such as SvelteKit, set `syncUrl` to `false`, give `ListDetailItem` an `href` for the route, and navigate in `on:change`.

`syncSelectionToUrl` is the helper behind the layout, for your own controls. It reads and links to the id, pushes or replaces history, and reports back and forward navigation.

```js
import { syncSelectionToUrl } from "carbon-components-svelte";

const url = syncSelectionToUrl({ param: "id" });

url.read(); // "4821", or "" when the parameter is missing
url.hrefFor("4819"); // "?id=4819", keeping other parameters
url.push("4819"); // a new history entry
url.replace("4819"); // the current entry
url.back(); // steps back over an entry it pushed, else clears the id
const stop = url.listen((id) => (selectedId = id)); // back and forward
```

## Server rendering

The layout renders both panes on the server. Read the id from the request URL and pass it as `selectedId`, so the first paint has the selected item, its details and the stacked layout's choice of pane.

```svelte
<script>
  export let data;
</script>

<ListDetailLayout selectedId={data.url.searchParams.get("id") ?? ""}>
  ...
</ListDetailLayout>
```

On mount the URL's id wins over `selectedId`, so a link shared from another page restores.

## Accessibility

The list and the details are regions named by `listLabel` and `detailLabel`. The selected item has `aria-current="true"`. The list is a list of links rather than a listbox, so every item is a real link that can be opened in a new tab.

Beside the list, picking an item leaves focus in the list so the user can keep moving, and a status message announces the new heading. On one pane, focus moves to the heading, which is what a screen reader reads first.

| Do | Why |
| --- | --- |
| Put a heading in the details | It takes focus on one pane and is what the status message announces |
| Name `detailLabel` after the selected item | A screen reader lists the details region by that name |
| Keep each item's text short and put the status in it | A screen reader reads the whole link when the user moves |
| Give the layout a height or a scrolling parent | Each pane scrolls on its own; without one the page does |
