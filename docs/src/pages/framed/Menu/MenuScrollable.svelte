<script>
  import { Button, Menu, MenuItem } from "carbon-components-svelte";

  let anchor;
  let open = false;

  const actions = Array.from(
    { length: 20 },
    (_, index) => `Action ${index + 1}`,
  );
</script>

<Button bind:ref={anchor} on:click={() => (open = !open)}>Actions</Button>

<Menu {anchor} bind:open labelText="Actions menu" maxHeight={240}>
  {#each actions as action (action)}
    <MenuItem on:click={() => console.log(action)}>{action}</MenuItem>
  {/each}
</Menu>
