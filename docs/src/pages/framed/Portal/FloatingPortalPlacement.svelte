<script>
  import { Button, FloatingPortal } from "carbon-components-svelte";

  let buttonRefs = {};
  let openPlacements = {};

  const placements = [
    "top",
    "top-start",
    "top-end",
    "right",
    "right-start",
    "right-end",
    "bottom",
    "bottom-start",
    "bottom-end",
    "left",
    "left-start",
    "left-end",
  ];

  function togglePlacement(placement) {
    openPlacements[placement] = !openPlacements[placement];
    openPlacements = { ...openPlacements };
  }
</script>

<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; padding: 4rem;">
  {#each placements as placement}
    <div style="display: flex; justify-content: center; align-items: center;">
      <Button
        bind:this={buttonRefs[placement]}
        on:click={() => togglePlacement(placement)}
      >
        {placement}
      </Button>
      {#if openPlacements[placement] && buttonRefs[placement]}
        <FloatingPortal
          reference={buttonRefs[placement]}
          placement={placement}
          offset={8}
        >
          <div
            style="padding: 0.75rem; background: var(--cds-layer-01); border: 1px solid var(--cds-border-subtle-01); box-shadow: var(--cds-shadow-03); border-radius: 4px; white-space: nowrap;"
          >
            {placement}
          </div>
        </FloatingPortal>
      {/if}
    </div>
  {/each}
</div>

