<script>
  import { MenuButton, MenuItem } from "carbon-components-svelte";

  const actions = Array.from(
    { length: 20 },
    (_, index) => `Action ${index + 1}`,
  );
</script>

<MenuButton labelText="Actions" maxHeight={240}>
  {#each actions as action (action)}
    <MenuItem on:click={() => console.log(action)}>{action}</MenuItem>
  {/each}
</MenuButton>
