<script>
  // Loading's spinner, without the overlay's focus trap or the delay timer.
  // Button, Search, InlineLoading and Filename render it directly, so an app
  // that never renders Loading ships neither. Loading times a delay and
  // passes `revealAfter` while the spinner waits.

  /** Set to `true` to use the small variant */
  export let small = false;

  /** Set to `false` to play the stop animation */
  export let active = true;

  /** Specify the description to describe the loading state */
  export let description = "loading";

  /** Set to `true` to hide the spinner from assistive technology. */
  export let decorative = false;

  /**
   * Set by Loading while a delayed spinner waits: CSS reveals it after
   * `revealAfter` (for example "300ms").
   * @type {string | undefined}
   */
  export let revealAfter = undefined;

  $: spinnerRadius = small ? "42" : "44";
</script>

<div
  class:bx--loading={true}
  class:bx--loading--small={small}
  class:bx--loading--stop={!active}
  class:bx--loading--delayed={revealAfter !== undefined}
  {...$$restProps}
>
  <!-- The <title> names the image; aria-label too would be read twice. -->
  <svg
    class:bx--loading__svg={true}
    viewBox="0 0 100 100"
    role={decorative ? undefined : "img"}
    aria-hidden={decorative ? "true" : undefined}
    style:animation-duration={revealAfter}
  >
    {#if !decorative}
      <title>{description}</title>
    {/if}
    {#if small}
      <circle
        class:bx--loading__background={true}
        cx="50%"
        cy="50%"
        r={spinnerRadius}
      ></circle>
    {/if}
    <circle class:bx--loading__stroke={true} cx="50%" cy="50%" r={spinnerRadius}
    ></circle>
  </svg>
</div>
