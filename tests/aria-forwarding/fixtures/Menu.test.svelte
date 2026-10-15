<script lang="ts">
  import Menu from "carbon-components-svelte/Menu/Menu.svelte";
  import MenuItem from "carbon-components-svelte/Menu/MenuItem.svelte";

  let anchor: HTMLButtonElement;
</script>

<button type="button" bind:this={anchor}>Actions</button>

<Menu {anchor} open {...$$restProps}>
  <MenuItem>Copy</MenuItem>
</Menu>
