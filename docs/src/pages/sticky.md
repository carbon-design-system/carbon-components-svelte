---
title: Sticky bars
layout: guide
description: Know when a sticky toolbar, page header or action set is pinned, stack sticky bars below each other, and keep links clear of them.
---

## Stuck state

A sticky component reports when it is stuck: pinned at its offset with content scrolling under it. Bind `stuck` to style it only then, such as a border or a shadow that shows while it floats. While stuck, the component also has a `--stuck` modifier class.

| Component | Sticks to | Class while stuck |
| :--- | :--- | :--- |
| [`Toolbar`](/components/DataTable#sticky) | The top, at `stickyOffset` | `bx--table-toolbar--stuck` |
| [`PageHeader`](/components/PageHeader#stuck-state) | The top, at `stickyOffset` | `bx--page-header--stuck` |
| [`ActionSet`](/components/ActionSet#sticky) | The bottom | `bx--action-set--stuck` |

```svelte
<PageHeader sticky bind:stuck={headerStuck} title="Databases" />
<Toolbar sticky bind:stuck={toolbarStuck}>...</Toolbar>
```

A component that starts where it sticks, such as a header at the top of the page, counts as stuck once the page scrolls. An action set at the end of its container counts as stuck until the container scrolls to the end. `stuck` is `false` on the server and until the component sticks.

## Your own bars

Use the `sticky` action on a bar of your own, such as a filter bar that isn't a `Toolbar`. Give the element `position: sticky` and an offset in CSS, and the action calls `onChange` with `true` when it sticks and `false` when it lets go.

<FileSource src="/framed/Sticky/StickyAction" />

| Option | Default | Use |
| :--- | :--- | :--- |
| `onChange` | | Called with the stuck state each time it changes |
| `edge` | `"top"` | The edge the element sticks to: `"top"` or `"bottom"` |
| `offset` | The element's computed `top` or `bottom` | The distance from that edge while stuck: pixels for a number, any CSS length for a string, or `"stack"` (see [Offsets that stack](#offsets-that-stack)) |
| `enabled` | `true` | Set to `false` to stop reporting |

The action adds a hidden, zero-height sentinel element that marks where the bar sits. In a block parent, the sentinel goes before the bar, or after it for the bottom edge. In a flex or grid parent, a sibling would take a gap or a grid cell, so the sentinel is the bar's first child. There it moves with the bar, so a bar that starts where it sticks reads as stuck from the start. Every bar on the page shares one `IntersectionObserver`.

## Offsets that stack

Set `stickyOffset="stack"` on a `PageHeader` or a `Toolbar`, or pass `offset: "stack"` to the `sticky` action, to stick below everything already pinned above it: the UI Shell `Header`, when the page scrolls, and every sticky bar before it in the same scroll container. The offsets follow the bars' heights as they change, so nothing needs measuring by hand.

<FileSource src="/framed/Sticky/StickyStack" />

Stacking is opt-in, so existing offsets stay where they are: a `Toolbar` without `stickyOffset` still clears the `Header` alone, and a `PageHeader` still sticks at `0`. A bar with a fixed offset still counts toward the bars after it. The browser measures the stack after mount, so the server renders a stacked bar with no offset; it takes its place before it can stick.

## Links that clear the bars

While one of its bars stacks, the bars' scroll container publishes the height they cover as `--ccs-sticky-offset`, in pixels: the bottom of the lowest bar, including the `Header`. When the page scrolls, it's on the root element. Inside a scroll container of their own, such as a modal body, it's on that container, so each scroller describes its own bars. A page whose bars all keep fixed offsets publishes nothing, so it reads as it did before.

Set `scroll-padding-top` from it once, and links to a section, focused fields and find-in-page land below the bars instead of under them:

```css
html {
  scroll-padding-top: var(--ccs-sticky-offset);
}
```

`TableOfContents` reads it too: `scrollOffset` defaults to the larger of the scroller's `scroll-padding-top` and `--ccs-sticky-offset`.
