<script context="module">
  /** Explicit dimension wins; otherwise fall back to `size`. */
  function resolveDimension(explicit, fallback) {
    if (explicit != null) return toCssLength(explicit);
    return fallback == null ? undefined : toCssLength(fallback);
  }
</script>

<script>
  /**
   * Shorthand size that sets both width and height.
   * Accepts a number (px) or string (e.g., "12rem").
   * @type {number | string}
   */
  export let size = undefined;

  /**
   * Width of the placeholder.
   * Accepts a number (px) or string (e.g., "12rem").
   * @type {number | string}
   */
  export let width = undefined;

  /**
   * Height of the placeholder.
   * Accepts a number (px) or string (e.g., "12rem").
   * @type {number | string}
   */
  export let height = undefined;

  import { toCssLength } from "../utils/css-length.js";

  $: resolvedWidth = resolveDimension(width, size);
  $: resolvedHeight = resolveDimension(height, size);
</script>

<div
  aria-hidden="true"
  class:bx--skeleton__placeholder={true}
  style:width={resolvedWidth}
  style:height={resolvedHeight}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
></div>
