<script>
  import {
    Button,
    Menu,
    MenuItem,
    MenuItemGroup,
    Stack,
  } from "carbon-components-svelte";

  let anchor;
  let open = false;
  let selectedIds = ["name"];

  $: visibleColumns = selectedIds.join(", ") || "None";
</script>

<Stack gap={5}>
  <Button bind:ref={anchor} on:click={() => (open = !open)}>View</Button>

  <Menu {anchor} bind:open labelText="View menu">
    <MenuItemGroup labelText="Columns" bind:selectedIds>
      <MenuItem id="name" labelText="Name" />
      <MenuItem id="size" labelText="Size" />
      <MenuItem id="modified" labelText="Last modified" />
    </MenuItemGroup>
  </Menu>

  <p>Visible columns: {visibleColumns}</p>
</Stack>
