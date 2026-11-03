<script>
  import { Box, LocalStorage, PickerGrid } from "carbon-components-svelte";

  const regions = [
    { id: "us-east", label: "Washington DC", category: "Americas" },
    { id: "us-south", label: "Dallas", category: "Americas" },
    { id: "ca-tor", label: "Toronto", category: "Americas" },
    { id: "eu-de", label: "Frankfurt", category: "Europe" },
    { id: "eu-gb", label: "London", category: "Europe" },
    { id: "eu-es", label: "Madrid", category: "Europe" },
    { id: "jp-tok", label: "Tokyo", category: "Asia Pacific" },
    { id: "au-syd", label: "Sydney", category: "Asia Pacific" },
  ];

  let selectedId;
  let recent = [];
</script>

<LocalStorage key="picker-grid-recent-regions" bind:value={recent} />
<Box maxWidth="22rem">
  <PickerGrid
    items={regions}
    bind:selectedId
    bind:recent
    recentLimit={4}
    labelText="Regions"
    columns={3}
    cellSize={56}
    height={192}
  />
</Box>
<p>Recent: {recent.join(", ") || "none"}</p>
