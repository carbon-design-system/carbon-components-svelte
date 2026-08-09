<script>
  import {
    MenuButton,
    MenuDivider,
    MenuItem,
    MenuItemGroup,
    MenuItemRadioGroup,
    Stack,
  } from "carbon-components-svelte";

  let selectedIds = ["name"];
  let theme = "light";
</script>

<Stack gap={5}>
  <MenuButton labelText="View">
    <MenuItemGroup labelText="Columns" bind:selectedIds>
      <MenuItem
        id="name"
        labelText="Name"
        on:click={(e) => e.preventDefault()}
      />
      <MenuItem
        id="size"
        labelText="Size"
        on:click={(e) => e.preventDefault()}
      />
      <MenuItem
        id="modified"
        labelText="Last modified"
        on:click={(e) => e.preventDefault()}
      />
    </MenuItemGroup>
    <MenuDivider />
    <MenuItem labelText="Theme">
      <MenuItemRadioGroup bind:selectedId={theme}>
        <MenuItem
          id="light"
          labelText="Light"
          on:click={(e) => e.preventDefault()}
        />
        <MenuItem
          id="dark"
          labelText="Dark"
          on:click={(e) => e.preventDefault()}
        />
      </MenuItemRadioGroup>
    </MenuItem>
  </MenuButton>

  <p>Visible columns: {selectedIds.join(", ") || "None"}</p>
  <p>Theme: {theme}</p>
</Stack>
