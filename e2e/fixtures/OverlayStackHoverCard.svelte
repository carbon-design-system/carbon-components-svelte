<script>
  // A stand-in for a HoverCard draft: a card that opens on hover or focus and
  // is a layer in the overlay stack while it shows.
  import { focusQuietly, isQuietFocus } from "../../src/utils/focus.js";
  import { createOverlay } from "../../src/utils/overlay-stack.js";

  export let label = "Priya";

  let open = false;
  let trigger;
  let card;

  const layer = createOverlay({
    kind: "hovercard",
    element: () => card,
    anchors: () => [trigger],
    // Taken before any widget in the card sees the key, like a tooltip.
    capture: true,
    onDismiss: (kind) => {
      const focusInside = card?.contains(document.activeElement);
      open = false;
      if (kind === "escape-key" && focusInside) focusQuietly(trigger);
    },
  });

  $: layer.sync(open);
</script>

<span
  role="presentation"
  on:mouseenter={() => (open = true)}
  on:mouseleave={() => (open = false)}
>
  <a
    href="#profile"
    bind:this={trigger}
    data-testid="hovercard-trigger"
    on:focus={() => {
      if (!isQuietFocus(trigger)) open = true;
    }}
  >
    {label}
  </a>
  {#if open}
    <div
      bind:this={card}
      role="dialog"
      aria-label="{label} profile"
      tabindex="-1"
      data-testid="hovercard"
    >
      <p>{label} works on design systems.</p>
      <button type="button">Follow</button>
    </div>
  {/if}
</span>
