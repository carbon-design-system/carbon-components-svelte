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

  $: toStyle = (value) => (typeof value === "number" ? `${value}px` : value);

  $: resolvedWidth =
    width == null ? (size == null ? undefined : toStyle(size)) : toStyle(width);
  $: resolvedHeight =
    height == null
      ? size == null
        ? undefined
        : toStyle(size)
      : toStyle(height);
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--skeleton__placeholder={true}
  style:width={resolvedWidth}
  style:height={resolvedHeight}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
></div>
