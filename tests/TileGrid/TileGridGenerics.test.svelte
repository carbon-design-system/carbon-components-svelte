<script lang="ts">
  import TileGrid from "carbon-components-svelte/TileGrid/TileGrid.svelte";

  type Pictogram = { name: string; title: string; category: string };

  const pictograms: Pictogram[] = [
    { name: "cloud-satellite", title: "Cloud Satellite", category: "Cloud" },
    { name: "data-backup", title: "Data backup", category: "Data" },
    { name: "cloud-pak", title: "Cloud Pak", category: "Cloud" },
  ];

  export let onClick: (detail: {
    id: unknown;
    item: Pictogram;
  }) => void = () => {};
</script>

<TileGrid
  items={pictograms}
  itemToId={(item) => item.name}
  itemToString={(item) => item.title}
  itemToGroup={(item) => item.category}
  labelText="Pictograms"
  on:click:tile={(event) => onClick(event.detail)}
  let:item
>
  <span aria-hidden="true">{item.name}</span>
</TileGrid>
