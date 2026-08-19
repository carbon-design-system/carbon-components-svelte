<script>
  import {
    Button,
    Menu,
    MenuDivider,
    MenuItem,
    MenuItemRadioGroup,
    Stack,
  } from "carbon-components-svelte";

  let anchor;
  let open = false;
  let selectedId = "comfortable";
</script>

<Stack gap={5}>
  <Button bind:ref={anchor} on:click={() => (open = !open)}>View</Button>

  <Menu {anchor} bind:open labelText="View menu">
    <MenuItem on:click={() => console.log("Reset")}>Reset</MenuItem>
    <MenuDivider />
    <MenuItemRadioGroup labelText="Density" bind:selectedId>
      <MenuItem id="compact" labelText="Compact" />
      <MenuItem id="comfortable" labelText="Comfortable" />
      <MenuItem id="spacious" labelText="Spacious" />
    </MenuItemRadioGroup>
  </Menu>

  <p>Density: {selectedId}</p>
</Stack>
