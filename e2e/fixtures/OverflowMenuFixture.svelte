<script>
  import { OverflowMenu, OverflowMenuItem } from "carbon-components-svelte";

  let selectedAction = "";
</script>

<div class="fixture-container">
  <div data-testid="outside-area" class="outside-click-area">
    Click here to close menu
  </div>

  <OverflowMenu
    data-testid="overflow-menu"
    aria-label="Actions"
    iconDescription="Open menu"
    on:close={({ detail }) => {
      if (detail?.text) selectedAction = detail.text;
    }}
  >
    <OverflowMenuItem text="Action 1" />
    <OverflowMenuItem text="Action 2" />
    <OverflowMenuItem text="Action 3" />
  </OverflowMenu>

  {#if selectedAction}
    <p data-testid="selected-action">Selected: {selectedAction}</p>
  {/if}
</div>

<style>
  .fixture-container {
    padding: 2rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .outside-click-area {
    padding: 1rem;
    background: #e0e0e0;
    cursor: pointer;
    border-radius: 4px;
  }
</style>
