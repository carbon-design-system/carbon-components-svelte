<script lang="ts">
  import Menu from "carbon-components-svelte/Menu/Menu.svelte";
  import MenuItem from "carbon-components-svelte/Menu/MenuItem.svelte";
  import MenuItemRadioGroup from "carbon-components-svelte/Menu/MenuItemRadioGroup.svelte";

  let anchor: HTMLButtonElement;
  let open = false;
  export let selectedId = "";
</script>

<button type="button" bind:this={anchor} on:click={() => (open = !open)}>
  Trigger
</button>

<Menu {anchor} bind:open labelText="Example menu">
  <MenuItemRadioGroup labelText="Alignment" bind:selectedId>
    <MenuItem id="left" labelText="Left" />
    <MenuItem id="center" labelText="Center" />
    <MenuItem id="right" labelText="Right" />
  </MenuItemRadioGroup>
</Menu>
