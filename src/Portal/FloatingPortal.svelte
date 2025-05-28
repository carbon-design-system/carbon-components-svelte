<script>
  import { onMount } from "svelte";
  import { computePosition, autoUpdate } from "@floating-ui/dom";
  import Portal from "./Portal.svelte";

  /** @type {null | HTMLButtonElement} */
  let button = null;

  /** @type {null | HTMLDivElement} */
  let tooltip = null;

  let togglePortal = false;
  let padding = 10;

  /** @type {null | ReturnType<typeof autoUpdate>} */
  let cleanup = null;

  function updatePosition() {
    if (!button || !tooltip) return;
    computePosition(button, tooltip).then(({ x, y }) => {
      if (!tooltip) return;
      Object.assign(tooltip.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });
  }

  onMount(() => {
    updatePosition();

    if (button && tooltip) {
      cleanup = autoUpdate(button, tooltip, updatePosition);
    }

    return () => {
      return cleanup?.();
    };
  });
</script>

<button
  type="button"
  style="padding: {padding}px"
  bind:this={button}
  on:click={() => (padding += 2)}
>
  Click to increase padding
</button>

<button
  on:click={() => {
    togglePortal = !togglePortal;
  }}
>
  Toggle portal
</button>
{#if togglePortal}
  <Portal>
    <div bind:this={tooltip}>Floating menu</div>
  </Portal>
{/if}
