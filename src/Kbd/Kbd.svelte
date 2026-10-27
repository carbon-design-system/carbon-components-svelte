<script>
  /**
   * @restProps {kbd}
   * @slot {{}}
   */

  /**
   * Set the size of the key.
   * - `"default"`: a 24px key
   * - `"sm"`: a 20px key, for dense rows and buttons
   * @type {"sm" | "default"}
   */
  export let size = "default";

  /**
   * Set how the key looks.
   * - `"keycap"`: a flat key with a heavier bottom edge
   * - `"muted"`: no box, semibold text in the secondary color, the way
   *   `Menu` shows shortcuts
   * @type {"keycap" | "muted"}
   */
  export let variant = "keycap";

  /**
   * Obtain a reference to the `kbd` element.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let ref = null;
</script>

<kbd
  bind:this={ref}
  class:bx--kbd={true}
  class:bx--kbd--sm={size === "sm"}
  class:bx--kbd--muted={variant === "muted"}
  {...$$restProps}><slot /></kbd
>
