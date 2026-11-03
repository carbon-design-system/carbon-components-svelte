<script>
  import { Box, IconPicker, toIconItems } from "carbon-components-svelte";

  // Pictograms are separate files, loaded as they come into view.
  const items = toIconItems(
    import.meta.glob(
      "../../../../node_modules/carbon-pictograms-svelte/lib/*.svelte",
    ),
    { category: (id) => id[0] },
  );

  let value = "Accessibility";
</script>

<Box maxWidth="20rem">
  <IconPicker
    labelText="Pictogram"
    {items}
    iconSize={48}
    bind:value
    placeholder="Choose a pictogram"
    searchLabelText="Search pictograms"
    searchPlaceholder="Search pictograms"
  />
</Box>
