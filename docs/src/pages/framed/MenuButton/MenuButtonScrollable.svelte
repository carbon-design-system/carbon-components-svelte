<script>
  import { MenuButton, MenuItem } from "carbon-components-svelte";

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

<MenuButton labelText="Actions" maxHeight={240}>
  {#each actions as action (action)}
    <MenuItem on:click={() => console.log(action)}>{action}</MenuItem>
  {/each}
</MenuButton>
