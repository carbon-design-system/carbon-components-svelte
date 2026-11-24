<script>
  import { Stack, TileGrid } from "carbon-components-svelte";
  import Archive from "carbon-icons-svelte/lib/Archive.svelte";
  import Calendar from "carbon-icons-svelte/lib/Calendar.svelte";
  import Cloud from "carbon-icons-svelte/lib/Cloud.svelte";
  import Document from "carbon-icons-svelte/lib/Document.svelte";
  import Download from "carbon-icons-svelte/lib/Download.svelte";
  import Folder from "carbon-icons-svelte/lib/Folder.svelte";

  const icons = [
    { id: "Archive", component: Archive },
    { id: "Calendar", component: Calendar },
    { id: "Cloud", component: Cloud },
    { id: "Document", component: Document },
    { id: "Download", component: Download },
    { id: "Folder", component: Folder },
  ];

  let picked = "None";
</script>

<Stack gap={5}>
  <TileGrid
    items={icons}
    labelText="Icons"
    on:click:tile={(e) => (picked = e.detail.id)}
    let:item
  >
    <svelte:component this={item.component} size={24} />
  </TileGrid>
  <div>Picked: {picked}</div>
</Stack>
