<script>
  import { Box, PickerGrid, Stack } from "carbon-components-svelte";

  const regions = [
    { id: "us-east", label: "Washington DC" },
    { id: "us-south", label: "Dallas" },
    { id: "eu-de", label: "Frankfurt" },
    { id: "eu-gb", label: "London" },
    { id: "jp-tok", label: "Tokyo" },
    { id: "au-syd", label: "Sydney" },
  ];

  let selectedIds = ["us-south", "eu-gb"];
</script>

<Stack gap={5}>
  <Box maxWidth="22rem">
    <PickerGrid
      items={regions}
      selectionMode="multiple"
      bind:selectedIds
      labelText="Regions"
      columns={3}
      cellSize={56}
      height={112}
    />
  </Box>
  <p>Chosen: {selectedIds.join(", ") || "none"}</p>
</Stack>
