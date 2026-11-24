<script lang="ts">
  import TileGrid from "carbon-components-svelte/TileGrid/TileGrid.svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Archive from "carbon-icons-svelte/lib/Archive.svelte";
  import Bookmark from "carbon-icons-svelte/lib/Bookmark.svelte";
  import Calendar from "carbon-icons-svelte/lib/Calendar.svelte";
  import Chat from "carbon-icons-svelte/lib/Chat.svelte";
  import Cloud from "carbon-icons-svelte/lib/Cloud.svelte";
  import CloudSatelliteConfig from "carbon-icons-svelte/lib/CloudSatelliteConfig.svelte";
  import Code from "carbon-icons-svelte/lib/Code.svelte";
  import Copy from "carbon-icons-svelte/lib/Copy.svelte";
  import Document from "carbon-icons-svelte/lib/Document.svelte";
  import Download from "carbon-icons-svelte/lib/Download.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";
  import Email from "carbon-icons-svelte/lib/Email.svelte";
  import Filter from "carbon-icons-svelte/lib/Filter.svelte";
  import Folder from "carbon-icons-svelte/lib/Folder.svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";
  import Locked from "carbon-icons-svelte/lib/Locked.svelte";

  const icons = [
    { id: "Add", component: Add },
    { id: "Archive", component: Archive },
    { id: "Bookmark", component: Bookmark },
    { id: "Calendar", component: Calendar },
    { id: "Chat", component: Chat },
    { id: "Cloud", component: Cloud },
    {
      id: "CloudSatelliteConfig",
      text: "Cloud Satellite configuration for edge locations",
      component: CloudSatelliteConfig,
    },
    { id: "Code", component: Code },
    { id: "Copy", component: Copy },
    { id: "Document", component: Document },
    { id: "Download", component: Download },
    { id: "Edit", component: Edit },
    { id: "Email", component: Email },
    { id: "Filter", component: Filter },
    { id: "Folder", component: Folder },
    { id: "Launch", component: Launch },
    { id: "Locked", component: Locked },
  ];

  const arrows = new Set(["Add", "Launch", "Download"]);
  const grouped = icons.map((icon) => ({
    ...icon,
    group: arrows.has(icon.id) ? "Actions" : "Objects",
  }));

  const media = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80"><rect width="120" height="80" fill="#d0e2ff"/><rect x="10" y="40" width="20" height="40" fill="#4589ff"/><rect x="40" y="25" width="20" height="55" fill="#4589ff"/><rect x="70" y="50" width="20" height="30" fill="#4589ff"/></svg>',
  )}`;
  const dashboards = [
    { id: "revenue", text: "Revenue overview" },
    { id: "latency", text: "Service latency by region" },
    { id: "capacity", text: "Cluster capacity planning for the next quarter" },
  ];

  const WORD_START = /(?=[A-Z])/;

  let clicked = "";
</script>

<div data-testid="grid-container">
  <TileGrid
    items={icons}
    labelText="Icons"
    minTileWidth="7rem"
    data-testid="tile-grid"
    on:click:tile={(event) => {
      clicked = event.detail.id;
    }}
    let:item
  >
    <svelte:component this={item.component} size={24} />
  </TileGrid>
</div>
<p data-testid="clicked">{clicked}</p>

<TileGrid items={[]} labelText="Templates" hideLabel>
  <p slot="empty" data-testid="empty">No templates yet</p>
</TileGrid>

<div data-testid="icons-container">
  <TileGrid
    items={grouped}
    itemToGroup={(item) => item.group}
    labelText="Icons by category"
    size="sm"
    align="center"
    minTileWidth="7rem"
    data-testid="grouped-grid"
    let:item
  >
    <svelte:component this={item.component} size={32} />
    <svelte:fragment slot="itemLabel" let:item
      >{#each (item.text ?? item.id).split(WORD_START) as word, i}{#if i}<wbr
          />{/if}{word}{/each}</svelte:fragment
    >
  </TileGrid>
</div>

<div data-testid="cover-container">
  <TileGrid
    items={dashboards}
    labelText="Dashboards"
    mediaFit="cover"
    ratio="4x3"
    minTileWidth="14rem"
    data-testid="cover-grid"
  >
    <img src={media} alt="" />
  </TileGrid>
</div>
