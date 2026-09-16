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

  function toStyle(value) {
    return typeof value === "number" ? `${value}px` : value;
  }

  /** Explicit dimension wins; otherwise fall back to `size`. */
  function resolveDimension(explicit, fallback) {
    if (explicit != null) return toStyle(explicit);
    return fallback == null ? undefined : toStyle(fallback);
  }

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
