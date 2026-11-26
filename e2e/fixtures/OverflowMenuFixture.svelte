<script>
  import { OverflowMenu, OverflowMenuItem } from "carbon-components-svelte";

  let selectedAction = "";
</script>

<div data-testid="outside-area" class="outside-click-area">
  Click here to close menu
</div>

<OverflowMenu
  data-testid="overflow-menu"
  iconDescription="Actions"
  on:close={({ detail }) => {
    if (detail?.text) selectedAction = detail.text;
  }}
>
  <OverflowMenuItem text="Action 1" />
  <OverflowMenuItem text="Action 2" />
  <OverflowMenuItem text="Action 3" />
</OverflowMenu>

<OverflowMenu
  data-testid="wide-overflow-menu"
  iconDescription="Links"
  menuOptionsClass="wide-menu"
>
  <OverflowMenuItem text="Copy import" />
  <OverflowMenuItem href="#docs" text="Open the docs" />
</OverflowMenu>

{#if selectedAction}
  <p data-testid="selected-action">Selected: {selectedAction}</p>
{/if}

<!-- Down the page, so opening scrolls nothing unless something forces it. -->
<div style="block-size: 150vh"></div>
<OverflowMenu portalMenu iconDescription="Portal menu">
  <OverflowMenuItem text="Portal item" />
</OverflowMenu>
<div style="block-size: 50vh"></div>

<style>
  :global(.wide-menu) {
    width: 16rem;
  }

  .outside-click-area {
    padding: 1rem;
    background: #e0e0e0;
    cursor: pointer;
    border-radius: 4px;
  }
</style>
