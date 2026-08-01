<script>
  import {
    MenuButton,
    MenuDivider,
    MenuItem,
    MenuItemRadioGroup,
    Stack,
  } from "carbon-components-svelte";

  let selectedId = "comfortable";
</script>

<Stack gap={5}>
  <MenuButton labelText="View">
    <MenuItem on:click={() => console.log("Reset")}>Reset</MenuItem>
    <MenuDivider />
    <MenuItemRadioGroup labelText="Density" bind:selectedId>
      <MenuItem id="compact" labelText="Compact" />
      <MenuItem id="comfortable" labelText="Comfortable" />
      <MenuItem id="spacious" labelText="Spacious" />
    </MenuItemRadioGroup>
  </MenuButton>

  <p>Density: {selectedId}</p>
</Stack>
