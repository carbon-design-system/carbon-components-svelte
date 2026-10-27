<script lang="ts">
  import Menu from "carbon-components-svelte/Menu/Menu.svelte";
  import MenuItem from "carbon-components-svelte/Menu/MenuItem.svelte";

  export let open = false;

  let anchor: HTMLButtonElement;
</script>

<button type="button" bind:this={anchor} on:click={() => (open = !open)}>
  Trigger
</button>

<Menu {anchor} bind:open labelText="Example menu">
  <MenuItem shortcut="mod+shift+p">Palette</MenuItem>
  <MenuItem shortcut="mod+s" shortcutText="Save it">Save</MenuItem>
  <MenuItem shortcut="mod+n" disabled>New</MenuItem>
  <MenuItem>Plain</MenuItem>
</Menu>
