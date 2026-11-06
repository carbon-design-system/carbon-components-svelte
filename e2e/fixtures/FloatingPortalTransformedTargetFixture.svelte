<script>
  import { FloatingPortal } from "carbon-components-svelte";

  let anchor;
  let target;
</script>

<div style="padding: 1rem">
  <button type="button" data-testid="anchor" bind:this={anchor}>Anchor</button>
</div>

<!-- A positioned box the transform moves: a `fixed` box inside it is placed
     from the box's corner, not the window's. -->
<div
  bind:this={target}
  data-testid="target"
  style="position: absolute; top: 120px; left: 88px; transform: translate(0, 0)"
></div>

{#if target}
  <FloatingPortal {anchor} {target} open direction="bottom">
    <span data-testid="floating-inner">Floating content</span>
  </FloatingPortal>
{/if}
