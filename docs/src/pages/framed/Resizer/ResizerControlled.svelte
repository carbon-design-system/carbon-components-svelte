<script>
  import { Resizer } from "carbon-components-svelte";

  let leftWidth = 200;
  let baseline = leftWidth;
</script>

<div
  style="display: flex; height: 200px; border: 1px solid var(--cds-border-subtle);"
>
  <div
    style="width: {leftWidth}px; padding: 1rem; background: var(--cds-layer);"
  >
    {Math.round(leftWidth)}px
  </div>
  <Resizer
    orientation="vertical"
    on:resizestart={() => {
      // delta on the resize events below is cumulative from this point,
      // not incremental since the last event, so the baseline has to be
      // captured once here rather than re-read from the latest width.
      baseline = leftWidth;
    }}
    on:resize={(event) => {
      // Fully controlled: prevent the default sibling-DOM resize and own
      // the width ourselves.
      event.preventDefault();
      leftWidth = Math.max(80, baseline + event.detail.delta);
    }}
  />
  <div style="flex: 1; padding: 1rem;">Right panel</div>
</div>
