<script lang="ts">
  import Menu from "carbon-components-svelte/Menu/Menu.svelte";
  import MenuItem from "carbon-components-svelte/Menu/MenuItem.svelte";

  let anchor: HTMLButtonElement;
  let open = false;
</script>

<button type="button" bind:this={anchor} on:click={() => (open = !open)}>
  Trigger
</button>

<Menu {anchor} bind:open labelText="Example menu">
  <MenuItem>
    Save
    <svelte:fragment slot="shortcutText">
      <kbd>⌘S</kbd>
    </svelte:fragment>
  </MenuItem>
  <MenuItem labelText="Export as">
    <svelte:fragment slot="labelChildren">
      <strong>Custom label content</strong>
    </svelte:fragment>
    <MenuItem>PDF</MenuItem>
  </MenuItem>
</Menu>
