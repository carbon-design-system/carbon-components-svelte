<svelte:options accessors />

<script lang="ts">
  import Resizer from "carbon-components-svelte/Resizer/Resizer.svelte";
  import type { ComponentProps } from "svelte";

  export let orientation: ComponentProps<Resizer>["orientation"] = "vertical";
  export let thickness: ComponentProps<Resizer>["thickness"] = undefined;
  export let controlled = false;
  export let preventReset = false;
  export let ref: ComponentProps<Resizer>["ref"] = null;

  // Correct controlled-mode pattern: capture the baseline once per
  // resizestart, then add delta to *that* baseline, not to the latest
  // controlledWidth, since delta is cumulative from resizestart.
  export let controlledWidth = 200;
  let baseline = controlledWidth;
</script>

<div>
  <div data-testid="prev"></div>
  <Resizer
    bind:ref
    {orientation}
    {thickness}
    data-testid="resizer"
    {...$$restProps}
    on:resizestart={() => {
      console.log("resizestart");
      baseline = controlledWidth;
    }}
    on:resize={(event) => {
      console.log("resize", event.detail.delta);
      if (controlled) {
        event.preventDefault();
        controlledWidth = Math.max(80, baseline + event.detail.delta);
      }
    }}
    on:resizeend={() => console.log("resizeend")}
    on:dblclick={(event) => {
      console.log("dblclick");
      if (preventReset) event.preventDefault();
    }}
  />
  <div data-testid="next"></div>
</div>
