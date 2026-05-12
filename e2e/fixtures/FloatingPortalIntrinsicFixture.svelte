<script>
  import { FloatingPortal } from "carbon-components-svelte";

  let open = false;
  let anchor;
</script>

<button type="button" data-testid="toggle" on:click={() => (open = !open)}>
  Toggle
</button>
<div data-testid="anchor" bind:this={anchor} style="width: 320px;">
  Wide anchor
</div>

<FloatingPortal
  {anchor}
  {open}
  direction="bottom"
  intrinsicWidth={true}
  intrinsicAlign="start"
>
  <span data-testid="floating-inner">Intrinsic width content</span>
</FloatingPortal>
