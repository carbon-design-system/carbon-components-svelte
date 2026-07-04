<script lang="ts">
  import Menu from "carbon-components-svelte/Menu/Menu.svelte";
  import MenuItem from "carbon-components-svelte/Menu/MenuItem.svelte";

  let anchor: HTMLButtonElement;
  let open = false;
  export let selected = false;
</script>

<button type="button" bind:this={anchor} on:click={() => (open = !open)}>
  Trigger
</button>

<Menu {anchor} bind:open labelText="Example menu">
  <MenuItem
    selectable
    bind:selected
    labelText="Show grid"
    on:click={() => console.log("click", "Show grid")}
  />
  <MenuItem labelText="Plain" />
</Menu>
