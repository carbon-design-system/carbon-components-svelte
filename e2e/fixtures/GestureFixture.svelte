<script>
  import { gesture, Stack } from "carbon-components-svelte";
  import GestureLog from "../../docs/src/pages/framed/Gestures/GestureLog.svelte";
  import ImageZoom from "../../docs/src/pages/framed/Gestures/ImageZoom.svelte";
  import LongPressReorder from "../../docs/src/pages/framed/Gestures/LongPressReorder.svelte";
  import SwipeToDismiss from "../../docs/src/pages/framed/Gestures/SwipeToDismiss.svelte";
  import { pointerDrag } from "../../src/utils/pointer-drag.js";

  let stripPan = "none";
  let stripSwipe = "none";
  let unpreventedMenus = 0;
  let cardTaps = 0;
  let cardPans = 0;
  let handleDrags = 0;
</script>

<svelte:window
  on:contextmenu={(event) => {
    if (!event.defaultPrevented) unpreventedMenus += 1;
  }}
/>

<main>
  <Stack gap={7}>
    <h1>Gestures</h1>
    <section aria-label="Gesture log"><GestureLog /></section>
    <section aria-label="Image zoom"><ImageZoom /></section>
    <section aria-label="Reorder"><LongPressReorder /></section>
    <section aria-label="Dismiss"><SwipeToDismiss /></section>
    <section aria-label="Pannable area in a scroller">
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <div
        class="scroller"
        data-testid="scroller"
        tabindex="0"
        role="region"
        aria-label="Scrolling area"
      >
        <div
          class="strip"
          data-testid="strip"
          use:gesture={{
            pan: {
              axis: "x",
              onEnd: (event) => (stripPan = `${event.deltaX | 0}`),
            },
            swipe: {
              axis: "x",
              onSwipe: (event) => (stripSwipe = event.direction),
            },
          }}
        >
          A strip that pans sideways and lets the page scroll up and down.
        </div>
      </div>
      <p data-testid="strip-pan">{stripPan}</p>
      <p data-testid="strip-swipe">{stripSwipe}</p>
      <p data-testid="unprevented-menus">{unpreventedMenus}</p>
    </section>
    <section aria-label="Handle in a card">
      <div
        class="card"
        data-testid="card"
        use:gesture={{
          tap: () => (cardTaps += 1),
          pan: { onEnd: () => (cardPans += 1) },
        }}
      >
        Card body
        <div
          class="handle"
          data-testid="handle"
          use:pointerDrag={{ onEnd: () => (handleDrags += 1) }}
        >
          Handle
        </div>
      </div>
      <p data-testid="card-taps">{cardTaps}</p>
      <p data-testid="card-pans">{cardPans}</p>
      <p data-testid="handle-drags">{handleDrags}</p>
    </section>
  </Stack>
</main>

<style>
  main {
    max-width: 40rem;
    padding: var(--cds-spacing-05);
  }

  .scroller {
    height: 10rem;
    overflow-y: auto;
    border: 1px solid var(--cds-border-subtle-01);
  }

  .card {
    padding: var(--cds-spacing-05);
    background: var(--cds-layer-01);
  }

  .handle {
    width: 8rem;
    margin-block-start: var(--cds-spacing-05);
    padding: var(--cds-spacing-04);
    background: var(--cds-layer-selected-01);
    touch-action: none;
  }

  .strip {
    height: 40rem;
    padding: var(--cds-spacing-05);
    background: var(--cds-layer-01);
  }
</style>
