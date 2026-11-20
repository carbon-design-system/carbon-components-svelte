---
components: ["Masonry"]
description: Masonry packs cards of uneven height into columns without gaps, and keeps the tab and reading order the same as the source order.
keywords: ["waterfall", "pinterest", "gallery", "grid lanes", "cards"]
---

<script>
  import { Masonry, Text, Tile } from "carbon-components-svelte";
</script>

## Basic

Place the cards as direct children. Each card goes in the shortest column, so the columns end at about the same depth. The number of columns follows the width of the container.

<Masonry>
  <Tile>
    <Text type="heading-compact-01">Rotate the staging certificates</Text>
    <Text type="body-compact-01">Expire on the 14th. Renew through the internal CA and restart the ingress pods.</Text>
  </Tile>
  <Tile>
    <Text type="body-compact-01">Standup moved to 9:30 on Thursdays.</Text>
  </Tile>
  <Tile>
    <Text type="heading-compact-01">Capacity review</Text>
    <Text type="body-compact-01">Object storage grew 12% last quarter. Compare against the forecast before the planning meeting, and flag the two regions that are over 80% full.</Text>
  </Tile>
  <Tile>
    <Text type="heading-compact-01">On call</Text>
    <Text type="body-compact-01">Hand off to Priya on Monday.</Text>
  </Tile>
  <Tile>
    <Text type="heading-compact-01">Postmortem follow-ups</Text>
    <Text type="body-compact-01">Add an alert for queue depth. Document the failover runbook. Remove the manual step from the deploy checklist.</Text>
  </Tile>
  <Tile>
    <Text type="body-compact-01">Notes on consistency models.</Text>
  </Tile>
</Masonry>

## Columns

### Column width

Set `columnWidth` to the narrowest a column may be. As many columns fit as the container allows, and they share the space. The default is `16rem`.

<Masonry columnWidth="9rem">
  <Tile>Deployments</Tile>
  <Tile>Open incidents, grouped by service and by severity</Tile>
  <Tile>Builds</Tile>
  <Tile>Pull requests waiting on review</Tile>
  <Tile>Uptime</Tile>
  <Tile>Error budget remaining for the quarter, by region</Tile>
  <Tile>Latency</Tile>
  <Tile>Cost</Tile>
</Masonry>

### Fixed columns

Set `columns` for a fixed number of columns, whatever the width.

<Masonry columns={3}>
  <Tile>Deployments</Tile>
  <Tile>Open incidents, grouped by service and by severity</Tile>
  <Tile>Builds</Tile>
  <Tile>Pull requests waiting on review</Tile>
  <Tile>Uptime</Tile>
  <Tile>Error budget remaining for the quarter, by region</Tile>
</Masonry>

## Gap

Set `gap` to a step of the same scale as [Stack](/components/Stack), or to any CSS length as a string. The gap applies between columns and between cards. The default is `5` (`1rem`).

<Masonry columnWidth="9rem" gap={3}>
  <Tile>Deployments</Tile>
  <Tile>Open incidents, grouped by service and by severity</Tile>
  <Tile>Builds</Tile>
  <Tile>Pull requests waiting on review</Tile>
  <Tile>Uptime</Tile>
  <Tile>Error budget remaining for the quarter, by region</Tile>
</Masonry>

## Reading order

The cards stay in the order you write them, and so does the tab order. Each card goes in the shortest column, which is never above the card before it, so reading across and then down gives the source order. A card is next in order when it is lower, or level and further along the inline direction. In a right-to-left page the columns start at the right.

CSS columns (`column-count`) fill the first column to the bottom before the second one, so card 2 lands under card 1 and not beside it. A keyboard or screen reader user follows the source order while a sighted user scans across, and WCAG 1.3.2 and 2.4.3 fail.

<Masonry columns={3}>
  <Tile><Text type="heading-compact-01">1</Text><Text type="body-compact-01">First in the source.</Text></Tile>
  <Tile><Text type="heading-compact-01">2</Text></Tile>
  <Tile><Text type="heading-compact-01">3</Text><Text type="body-compact-01">The tallest of the first row, so the next card does not go under it.</Text></Tile>
  <Tile><Text type="heading-compact-01">4</Text></Tile>
  <Tile><Text type="heading-compact-01">5</Text><Text type="body-compact-01">Goes where the column ends first.</Text></Tile>
  <Tile><Text type="heading-compact-01">6</Text></Tile>
  <Tile><Text type="heading-compact-01">7</Text><Text type="body-compact-01">Tab reaches the cards in this order.</Text></Tile>
</Masonry>

| Do | Why |
| --- | --- |
| Put the cards in the order they should be read. | The source order is the reading order and the tab order. Masonry never reorders the DOM. |
| Sort or filter the data, not the layout. | A reorder in the data repacks the columns and moves the focus order with it. |
| Keep one focusable element, or a few, in each card. | Tab visits every card in turn, so a long board costs a keypress per control. Make the card one link when you can. |
| Use CSS columns only for text that reads down one column and then the next. | The columns fill top to bottom, which is the wrong order for cards that read across. |

## Examples

### Image gallery

Give each image an [AspectRatio](/components/AspectRatio) so its box exists before the file arrives. Photos that load late then do not move the ones below them, and the columns settle on the first layout. A photo whose box is not reserved resizes its card when it arrives, and the cards under it move.

<FileSource src="/framed/Masonry/ImageGallery" />

### Notes board

A card added at the front, removed, or resized repacks the columns, and the tab order follows.

<FileSource src="/framed/Masonry/NotesBoard" />

### Mixed cards

Any block can be a card: [Tile](/components/Tile), [ClickableTile](/components/ClickableTile) and [Card](/components/Card).

<FileSource src="/framed/Masonry/MixedCards" />

## Browser support

Where the browser has `display: grid-lanes`, the browser packs the cards and no script runs. Elsewhere a script measures each card, finds the shortest column and places the card there. Both use the same rule, so the layout is the same in either, and the DOM is the same in both.

| Engine | Packing |
| --- | --- |
| Safari (shipped in 26.4) | `display: grid-lanes` |
| Chrome, Edge, Firefox | Script. They have an earlier form of the feature behind a flag. |

Set `native` to `false` to always use the script, for example to get one layout across all browsers.

## Server rendering

Before the script runs, and when it never does, the cards sit in rows of a plain grid with the same columns, in source order. The script then moves each card up into its column. Where the browser has `display: grid-lanes` the server's markup is already packed.

Set `hideUntilPlaced` to keep the cards out of sight until they are placed, so they do not move on screen. The cards then appear when the script runs, so a slow script delays them. A page with scripting turned off shows the rows.

## Usage

| Do | Why |
| --- | --- |
| Use Masonry for cards of uneven height that are read in order, such as galleries and boards of notes. | It packs without gaps and keeps the source order. |
| Use a [CssGrid](/components/CssGrid) or [Grid](/components/Grid) when the cards share a height or must line up in rows. | Masonry has no rows to line up. |
| Reserve the space of images with an [AspectRatio](/components/AspectRatio) or `width` and `height`. | The script repacks when a card changes height, and the cards below move. |
| Pass the cards as direct children, and leave `position` alone on them. | The script places each direct child. |
| Do not set `grid-column` on a card. | A card spans one column. |
