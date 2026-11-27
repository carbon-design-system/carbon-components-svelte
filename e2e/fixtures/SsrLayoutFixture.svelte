<script lang="ts">
  import {
    DurationInput,
    ExpandableTile,
    OverflowMenu,
    OverflowMenuItem,
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

<div data-testid="duration" style="max-width: 24rem; padding: 1rem;">
  <DurationInput labelText="Length" value={5_400_000} />
</div>
