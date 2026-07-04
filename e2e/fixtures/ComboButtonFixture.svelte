<script>
  import { ComboButton, MenuItem } from "carbon-components-svelte";

  let primaryClicks = 0;
  let selectedAction = "";
</script>

<ComboButton labelText="Save" on:click={() => primaryClicks++}>
  <MenuItem on:click={() => (selectedAction = "Save as")}>Save as</MenuItem>
  <MenuItem on:click={() => (selectedAction = "Save a copy")}>
    Save a copy
  </MenuItem>
</ComboButton>

<p data-testid="primary-clicks">Primary clicks: {primaryClicks}</p>
{#if selectedAction}
  <p data-testid="selected-action">Selected: {selectedAction}</p>
{/if}
