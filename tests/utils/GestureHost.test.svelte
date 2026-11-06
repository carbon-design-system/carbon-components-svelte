<script lang="ts">
  import { gesture } from "../../src/utils/gesture.js";

  export let enabled = true;
  export let onSwipe: (direction: string | undefined) => void = () => {};

  let taps = 0;
  let held = false;
  let dx = 0;
</script>

<div
  data-testid="surface"
  use:gesture={{
    enabled,
    tap: () => (taps += 1),
    longPress: {
      onLongPress: () => (held = true),
      onEnd: () => (held = false),
    },
    pan: {
      touch: "afterLongPress",
      onMove: (event) => (dx = event.deltaX),
      onEnd: () => (held = false),
    },
    swipe: (event) => onSwipe(event.direction),
  }}
>
  <span data-testid="taps">{taps}</span>
  <span data-testid="held">{held}</span>
  <span data-testid="dx">{dx}</span>
</div>
