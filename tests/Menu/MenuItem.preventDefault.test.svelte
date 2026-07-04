<script lang="ts">
  import Menu from "carbon-components-svelte/Menu/Menu.svelte";
  import MenuItem from "carbon-components-svelte/Menu/MenuItem.svelte";

  let anchor: HTMLButtonElement;
  export let open = true;
</script>

<button type="button" bind:this={anchor} on:click={() => (open = !open)}>
  Trigger
</button>

<Menu
  {anchor}
  bind:open
  labelText="Example menu"
  on:close={() => console.log("close")}
>
  <MenuItem
    on:click={(event) => {
      console.log("click", "Stay open");
      event.preventDefault();
    }}
  >
    Stay open
  </MenuItem>
  <MenuItem on:click={() => console.log("click", "Close menu")}>
    Close menu
  </MenuItem>
</Menu>
