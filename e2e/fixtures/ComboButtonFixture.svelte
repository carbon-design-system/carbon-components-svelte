<script>
  import { ComboButton, MenuItem } from "carbon-components-svelte";

  let primaryClicks = 0;
  let selectedAction = "";
</script>

<!-- Room on the inline start side, so the menu keeps its default
  `intrinsicAlign="end"`. -->
<div data-testid="room" style="padding-inline-start: 20rem">
  <ComboButton labelText="Save" on:click={() => primaryClicks++}>
    <MenuItem on:click={() => (selectedAction = "Save as")}>Save as</MenuItem>
    <MenuItem on:click={() => (selectedAction = "Save a copy")}>
      Save a copy
    </MenuItem>
  </ComboButton>
</div>

<p data-testid="primary-clicks">Primary clicks: {primaryClicks}</p>
{#if selectedAction}
  <p data-testid="selected-action">Selected: {selectedAction}</p>
{/if}

<!-- At the window's inline start, where an end-aligned menu, wider than
  the group, would run past the window's side. -->
<div data-testid="edge">
  <ComboButton labelText="Export" iconDescription="More export actions">
    <MenuItem>As comma-separated values</MenuItem>
    <MenuItem>As a spreadsheet</MenuItem>
  </ComboButton>
</div>
