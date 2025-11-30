<script>
  import { Button, FloatingPortal } from "carbon-components-svelte";

  let buttonRef = null;
  let showPortal = false;
</script>

<Button bind:this={buttonRef} on:click={() => (showPortal = !showPortal)}>
  Toggle Floating Portal
</Button>

{#if showPortal && buttonRef}
  <FloatingPortal reference={buttonRef} placement="bottom" offset={8}>
    <div style="padding: 1rem; background: var(--cds-layer-01); border: 1px solid var(--cds-border-subtle-01); box-shadow: var(--cds-shadow-03); border-radius: 4px; min-width: 200px;">
      <p style="margin: 0 0 0.5rem 0;">Floating portal content</p>
      <p style="margin: 0; font-size: 0.875rem; color: var(--cds-text-secondary);">
        This content is positioned relative to the button above.
      </p>
    </div>
  </FloatingPortal>
{/if}

