<script>
  import { ComboButton, MenuItem } from "carbon-components-svelte";

  let primaryClicks = 0;
  let selectedAction = "";

  const aligns = /** @type {const} */ (["start", "center", "end"]);
</script>

<div style="padding-inline-start: 20rem">
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

<!-- Each alignment with room on both sides, then at the window's inline
  start and end. The menus are wider than their group, so at a side of
  the window they run past it unless they line up with that side's group
  edge. -->
{#each aligns as align}
  <div style="padding-inline-start: 20rem">
    <ComboButton
      labelText="Export"
      intrinsicAlign={align}
      iconDescription="{align} room"
      data-testid="{align}-room"
    >
      <MenuItem>As comma-separated values</MenuItem>
      <MenuItem>As a spreadsheet</MenuItem>
    </ComboButton>
  </div>
  <div style="display: flex; justify-content: space-between">
    {#each ["inline-start", "inline-end"] as side}
      <ComboButton
        labelText="Export"
        intrinsicAlign={align}
        iconDescription="{align} {side}"
        data-testid="{align}-{side}"
      >
        <MenuItem>As comma-separated values</MenuItem>
        <MenuItem>As a spreadsheet</MenuItem>
      </ComboButton>
    {/each}
  </div>
{/each}
