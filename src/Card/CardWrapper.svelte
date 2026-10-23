<script>
  /**
   * Internal. Wraps a card when it has a `decorator`, so the decorator
   * sits beside a clickable card instead of inside its link or button.
   * It sits at the header's corner, as upstream's does in `CardHeader`.
   */

  /** Set to `true` to wrap the card and render the decorator */
  export let decorated = false;

  /**
   * Receives the state of an `AILabel` in the decorator.
   * @type {import("svelte/store").Writable<undefined | "active" | "revert">}
   */
  export let state;

  /**
   * Receives the shape of the card's `CardMedia`: its height as a share of
   * its width, and its width when `horizontal`.
   * @type {import("svelte/store").Readable<null | { block: number; inline: string }>}
   */
  export let media;

  /** Set to `true` when the media sits beside the content */
  export let horizontal = false;

  /** @type {"start" | "end"} */
  export let mediaPosition = "start";

  import Decorator from "../AILabel/Decorator.svelte";

  /**
   * Moves the decorator off the media, to the header's corner: below
   * media on top, or clear of media at the inline end. Called from the
   * markup, not a `$:` block, so a server render reads the shape that
   * `CardMedia` reported earlier in the same render.
   * @param {null | { block: number; inline: string }} shape
   * @param {boolean} horizontal
   * @param {"start" | "end"} mediaPosition
   * @returns {string | undefined}
   */
  function mediaOffset(shape, horizontal, mediaPosition) {
    if (!shape) return undefined;
    if (!horizontal) return `--ccs-card-media-block: ${shape.block}`;
    if (mediaPosition === "end")
      return `--ccs-card-media-inline: ${shape.inline}`;
    return undefined;
  }
</script>

{#if decorated}
  <div class:bx--card__wrapper={true}>
    <slot />
    <Decorator
      class="bx--card__decorator"
      style={mediaOffset($media, horizontal, mediaPosition)}
      {state}
      labelSize="xs"
    >
      <slot name="decorator" />
    </Decorator>
  </div>
{:else}
  <slot />
{/if}
