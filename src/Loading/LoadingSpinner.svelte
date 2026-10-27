<script>
  /**
   * Internal. The spinner graphic of a `Loading`, shared by its animated and
   * plain roots.
   */

  /** @type {boolean} */
  export let small = false;

  /** @type {string} */
  export let description = "loading";

  /**
   * Delay of the CSS reveal while the spinner waits, set on the SVG of a
   * spinner without an overlay.
   * @type {string | undefined}
   */
  export let revealAfter = undefined;
</script>

<svg
  class:bx--loading__svg={true}
  viewBox="0 0 100 100"
  role="img"
  style:animation-duration={revealAfter}
>
  <!-- The <title> names the image; aria-label too would be read twice. -->
  <title>{description}</title>
  {#if small}
    <circle class:bx--loading__background={true} cx="50%" cy="50%" r="42"
    ></circle>
  {/if}
  <circle
    class:bx--loading__stroke={true}
    cx="50%"
    cy="50%"
    r={small ? "42" : "44"}
  ></circle>
</svg>
