<script>
  import { Button, Menu, MenuItem } from "carbon-components-svelte";

  let anchor;
  let open = false;

  const actions = [
    "Assign to me",
    "Assign to team",
    "Change priority",
    "Change status",
    "Add label",
    "Remove label",
    "Add to sprint",
    "Remove from sprint",
    "Duplicate",
    "Convert to task",
    "Link related issue",
    "Move to project",
    "Watch",
    "Stop watching",
    "Export as CSV",
    "Export as JSON",
    "Print",
    "Archive",
    "Restore",
    "Delete",
  ];
</script>

<Button bind:ref={anchor} on:click={() => (open = !open)}>Actions</Button>

<Menu {anchor} bind:open labelText="Actions menu" maxHeight={240}>
  {#each actions as action (action)}
    <MenuItem on:click={() => console.log(action)}>{action}</MenuItem>
  {/each}
</Menu>
