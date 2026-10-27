<script lang="ts">
  import {
    Button,
    ExpandableTile,
    OverflowMenu,
    OverflowMenuItem,
    Tearsheet,
  } from "carbon-components-svelte";
</script>

<div data-testid="tile" style="width: 14rem; padding: 1rem;">
  <ExpandableTile>
    <div slot="above">Storage</div>
    <div slot="below">2.4 TB of 5 TB used across 12 buckets.</div>
  </ExpandableTile>
</div>

<div
  data-testid="menu"
  style="position: relative; height: 10rem; padding: 1rem;"
>
  <OverflowMenu open iconDescription="More">
    <OverflowMenuItem text="Edit" />
    <OverflowMenuItem text="Delete" />
  </OverflowMenu>
</div>

<Tearsheet open titleText="Create integration" size="narrow">
  <div data-testid="tearsheet-body" style="height: 120vh">
    A body taller than the window scrolls.
  </div>
  <svelte:fragment slot="actions">
    <Button kind="secondary">Cancel</Button>
    <Button>Next</Button>
  </svelte:fragment>
</Tearsheet>
