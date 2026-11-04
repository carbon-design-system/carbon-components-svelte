<script>
  import { Box, PickerGrid } from "carbon-components-svelte";

  const sizes = [
    "Nano",
    "Micro",
    "Small",
    "Medium",
    "Large",
    "XLarge",
    "2XLarge",
    "4XLarge",
  ].map((label) => ({ id: label.toLowerCase(), label }));

  let selectedId = "medium";
</script>

<Box maxWidth="22rem">
  <PickerGrid
    items={sizes}
    searchable={false}
    preview={false}
    labelText="Instance sizes"
    bind:selectedId
    columns={4}
    height={96}
  />
</Box>
<p>Chosen: {selectedId}</p>
