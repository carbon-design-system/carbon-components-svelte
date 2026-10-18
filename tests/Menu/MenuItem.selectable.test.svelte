<script lang="ts">
  import Menu from "carbon-components-svelte/Menu/Menu.svelte";
  import MenuItem from "carbon-components-svelte/Menu/MenuItem.svelte";
  import MenuItemGroup from "carbon-components-svelte/Menu/MenuItemGroup.svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import type { ComponentProps } from "svelte";

  export let selectedIds: ComponentProps<MenuItemGroup>["selectedIds"] = [];
  export let nested = false;

  let anchor: HTMLButtonElement;
  let open = false;
</script>

<button type="button" bind:this={anchor} on:click={() => (open = !open)}>
  Trigger
</button>

<Menu {anchor} bind:open labelText="Example menu">
  <MenuItem>Plain</MenuItem>
  {#if nested}
    <MenuItem labelText="View">
      <MenuItemGroup labelText="Columns" bind:selectedIds>
        <MenuItem id="size" labelText="Size" selected />
      </MenuItemGroup>
    </MenuItem>
  {:else}
    <MenuItemGroup labelText="Columns" bind:selectedIds>
      <MenuItem id="name" labelText="Name" />
      <MenuItem id="size" labelText="Size" icon={Add} selected />
      <MenuItem
        id="date"
        labelText="Date"
        on:click={(e) => e.preventDefault()}
      />
    </MenuItemGroup>
  {/if}
</Menu>

<div data-testid="selected-ids">{JSON.stringify(selectedIds)}</div>
