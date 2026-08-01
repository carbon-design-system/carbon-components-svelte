<script>
  import {
    MenuButton,
    MenuItem,
    MenuItemGroup,
    Stack,
  } from "carbon-components-svelte";

  let selectedIds = ["name"];

  $: visibleColumns = selectedIds.join(", ") || "None";
</script>

<Stack gap={5}>
  <MenuButton labelText="View">
    <MenuItemGroup labelText="Columns" bind:selectedIds>
      <MenuItem id="name" labelText="Name" />
      <MenuItem id="size" labelText="Size" />
      <MenuItem id="modified" labelText="Last modified" />
    </MenuItemGroup>
  </MenuButton>

  <p>Visible columns: {visibleColumns}</p>
</Stack>
