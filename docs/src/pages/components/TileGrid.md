---
components: ["TileGrid"]
description: Tile grids lay out a gallery of equal tiles, such as icons, images or templates, that the keyboard moves through as one control.
keywords: ["gallery"]
---

<script>
  import { EmptyState, TileGrid } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Archive from "carbon-icons-svelte/lib/Archive.svelte";
  import Bookmark from "carbon-icons-svelte/lib/Bookmark.svelte";
  import Calendar from "carbon-icons-svelte/lib/Calendar.svelte";
  import Chat from "carbon-icons-svelte/lib/Chat.svelte";
  import Cloud from "carbon-icons-svelte/lib/Cloud.svelte";
  import CloudSatelliteConfig from "carbon-icons-svelte/lib/CloudSatelliteConfig.svelte";
  import Code from "carbon-icons-svelte/lib/Code.svelte";
  import DataBase from "carbon-icons-svelte/lib/DataBase.svelte";
  import Deploy from "carbon-icons-svelte/lib/Deploy.svelte";
  import Email from "carbon-icons-svelte/lib/Email.svelte";
  import Folder from "carbon-icons-svelte/lib/Folder.svelte";

  const icons = [
    { id: "Add", component: Add },
    { id: "Archive", component: Archive },
    { id: "Bookmark", component: Bookmark },
    { id: "Calendar", component: Calendar },
    { id: "Chat", component: Chat },
    { id: "Cloud", component: Cloud },
    { id: "Code", component: Code },
    { id: "Email", component: Email },
    { id: "Folder", component: Folder },
  ];

  const actions = new Set(["Add", "Archive", "Bookmark"]);
  const grouped = icons.map((icon) => ({
    ...icon,
    group: actions.has(icon.id) ? "Actions" : "Objects",
  }));

  const dashboards = [
    { id: "revenue", text: "Revenue overview" },
    { id: "latency", text: "Service latency by region" },
    { id: "capacity", text: "Cluster capacity planning for the next quarter" },
  ];

  const WORD_START = /(?=[A-Z])/;

  const services = [
    { slug: "code-engine", displayName: "Code Engine", icon: Code },
    { slug: "event-notifications", displayName: "Event Notifications", icon: Email },
    { slug: "object-storage", displayName: "Object Storage", icon: DataBase },
    { slug: "schematics", displayName: "Schematics", icon: Deploy },
  ];

  const templates = [
    { id: "pipeline", text: "Deployment pipeline", component: Deploy },
    { id: "database", text: "Managed database with read replicas", component: DataBase },
    { id: "edge", text: "Cloud Satellite location for edge workloads in a customer data center", component: CloudSatelliteConfig },
  ];
</script>

## Basic

Pass `items` and render each tile's media in the default slot with `let:item`. Name the grid with `labelText`, adding `hideLabel` to hide it visually, or with `aria-label`. Each tile is labeled with `itemToString`, which reads `text`, then `id`, by default. The grid is one tab stop: <DocKbd label="Tab" /> moves into it, the arrow keys move between tiles, and <DocKbd label="Home" /> and <DocKbd label="End" /> move to the first and last tile. Up and down follow the layout, so they land on the tile in the same column at any width.

<TileGrid items={icons} labelText="Icons" let:item>
  <svelte:component this={item.component} size={24} />
</TileGrid>

## Custom data

Items can have any shape. Set `itemToId` to return each item's unique id and `itemToString` to return its label, so the data doesn't need reshaping. `itemToGroup` reads groups the same way. In TypeScript, the item type flows from `items` to these functions, the default slot's `item` and the `click:tile` detail.

<TileGrid items={services} itemToId={(service) => service.slug} itemToString={(service) => service.displayName} labelText="Services" let:item>
  <svelte:component this={item.icon} size={24} />
</TileGrid>

## Click event

The `click:tile` event fires when a tile is clicked, or when <DocKbd label="Enter" /> or <DocKbd label="Space" /> is pressed on it, with the item's `id` and `item` as the detail.

<FileSource src="/framed/TileGrid/TileGridClick" />

## Layout

### Tile width

Set `minTileWidth` to the narrowest a tile may be. Columns fill the container, each at least that wide, so the column count follows the width. The default is `"8rem"`.

<TileGrid items={icons} labelText="Icons" minTileWidth="12rem" let:item>
  <svelte:component this={item.component} size={32} />
</TileGrid>

### Aspect ratio

Set `ratio` to shape each tile. It takes the same values as [AspectRatio](/components/AspectRatio): a named ratio such as `"16x9"`, or any `"WxH"` string. The media fills the space above the label. The default is `"1x1"`.

<TileGrid items={templates} labelText="Templates" minTileWidth="14rem" ratio="16x9" let:item>
  <svelte:component this={item.component} size={32} />
</TileGrid>

### Label lines

Labels wrap to `labelLines` lines, then end in an ellipsis, and the full text shows on hover. Every tile reserves the lines, so the media lines up across tiles. The default is `2`.

<TileGrid items={templates} labelText="Templates" minTileWidth="10rem" labelLines={1} let:item>
  <svelte:component this={item.component} size={24} />
</TileGrid>

### Alignment

Set `align` to `"center"` to center the media and the label, as in an icon gallery. The default, `"start"`, puts both at the start.

<TileGrid items={icons} labelText="Icons" align="center" let:item>
  <svelte:component this={item.component} size={32} />
</TileGrid>

### Small

Set `size` to `"sm"` for dense galleries. Tiles have less padding, and labels use smaller, secondary text.

<TileGrid items={icons} labelText="Icons" size="sm" align="center" minTileWidth="7rem" let:item>
  <svelte:component this={item.component} size={32} />
</TileGrid>

### Cover media

Set `mediaFit` to `"cover"` to stretch the media to the tile's edges and crop it, as for photos and previews. The label keeps its padding.

<TileGrid items={dashboards} labelText="Dashboards" mediaFit="cover" ratio="4x3" minTileWidth="14rem">
  <img src="/card-media.svg" alt="" />
</TileGrid>

## Groups

Set `itemToGroup` to show the tiles in titled groups, in the order each group first appears in `items`. Each title is a heading, so screen reader users can jump between groups, and each group is a list named by it. The grid stays one tab stop: the arrow keys cross from one group to the next. Inside a [Section](/components/Heading), titles are one level below the section's heading; otherwise they are `h3`s. Set `groupHeadingLevel` to fit the page outline, and fill the `group` slot to replace a title's text.

<TileGrid items={grouped} itemToGroup={(item) => item.group} labelText="Icons by category" size="sm" align="center" minTileWidth="7rem" let:item>
  <svelte:component this={item.component} size={32} />
</TileGrid>

## Custom labels

Fill the `itemLabel` slot to replace a tile's label. Mark where a long name may break with `<wbr>`, so a name like "CloudSatelliteConfig" wraps between words. Keep it to text, since it names the tile.

<TileGrid items={[{ id: "CloudSatelliteConfig", component: CloudSatelliteConfig }, { id: "DataBase", component: DataBase }, { id: "Deploy", component: Deploy }]} labelText="Icons" size="sm" align="center" minTileWidth="7rem" let:item>
  <svelte:component this={item.component} size={32} />
  <svelte:fragment slot="itemLabel" let:item>{#each item.id.split(WORD_START) as word, i}{#if i}<wbr />{/if}{word}{/each}</svelte:fragment>
</TileGrid>

## Empty state

Fill the `empty` slot to show something in place of the grid when `items` is empty.

<TileGrid items={[]} labelText="Templates">
  <EmptyState
    slot="empty"
    titleText="No templates yet"
    subtitleText="Save a project as a template to start new projects from it."
  />
</TileGrid>
