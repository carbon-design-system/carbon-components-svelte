<script>
  import { FloatingPortal } from "carbon-components-svelte";

  let open = false;
  let anchor;
</script>

<button type="button" data-testid="toggle" on:click={() => (open = !open)}>
  Toggle
</button>
<div data-testid="anchor" bind:this={anchor}>Anchor element</div>

<FloatingPortal {anchor} {open} direction="bottom">
  <span data-testid="floating-inner">Floating content</span>
</FloatingPortal>
