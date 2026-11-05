<script lang="ts">
  import { FloatingPortal } from "carbon-components-svelte";

  let open = false;
  let anchor;
  // Content above the anchor, to move it without a scroll or a resize.
  let shifted = false;
</script>

<button type="button" data-testid="toggle" on:click={() => (open = !open)}>
  Toggle
</button>
<button type="button" data-testid="shift" on:click={() => (shifted = !shifted)}>
  Shift
</button>
{#if shifted}
  <div data-testid="spacer" style:height="80px"></div>
{/if}
<div data-testid="anchor" bind:this={anchor}>Anchor element</div>

<FloatingPortal {anchor} {open} direction="bottom">
  <span data-testid="floating-inner">Floating content</span>
</FloatingPortal>
