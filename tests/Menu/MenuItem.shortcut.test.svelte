<script lang="ts">
  import Menu from "carbon-components-svelte/Menu/Menu.svelte";
  import MenuItem from "carbon-components-svelte/Menu/MenuItem.svelte";
  import Star from "carbon-icons-svelte/lib/Star.svelte";

  let anchor: HTMLButtonElement;
  let open = false;
</script>

<button type="button" bind:this={anchor} on:click={() => (open = !open)}>
  Trigger
</button>

<Menu {anchor} bind:open labelText="Example menu">
  <MenuItem labelText="Save" shortcutText="Ctrl+S" />
  <MenuItem labelText="Custom icon">
    <svelte:fragment slot="icon">
      <Star data-testid="custom-icon" />
    </svelte:fragment>
  </MenuItem>
</Menu>
