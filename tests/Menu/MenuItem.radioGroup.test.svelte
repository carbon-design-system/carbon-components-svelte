<script lang="ts">
  import Menu from "carbon-components-svelte/Menu/Menu.svelte";
  import MenuItem from "carbon-components-svelte/Menu/MenuItem.svelte";
  import MenuItemRadioGroup from "carbon-components-svelte/Menu/MenuItemRadioGroup.svelte";
  import type { ComponentProps } from "svelte";

  export let selectedId: ComponentProps<MenuItemRadioGroup>["selectedId"] = "";

  let anchor: HTMLButtonElement;
  let open = false;
</script>

<button type="button" bind:this={anchor} on:click={() => (open = !open)}>
  Trigger
</button>

<Menu {anchor} bind:open labelText="Example menu">
  <MenuItem>Plain</MenuItem>
  <MenuItemRadioGroup labelText="Density" bind:selectedId>
    <MenuItem id="compact" labelText="Compact" />
    <MenuItem id="comfortable" labelText="Comfortable" selected />
  </MenuItemRadioGroup>
  <MenuItem labelText="View">
    <MenuItemRadioGroup labelText="Theme" selectedId="light">
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
</Menu>

<div data-testid="selected-id">{selectedId}</div>
