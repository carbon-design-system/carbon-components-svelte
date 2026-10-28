<script>
  // Loading's spinner without the overlay. Button, Search and InlineLoading
  // render it directly, so they don't ship the overlay's focus trap.

  /** Set to `true` to use the small variant */
  export let small = false;

  /** Set to `false` to disable the active state */
  export let active = true;

  /** Specify the description to describe the loading state */
  export let description = "loading";

  $: spinnerRadius = small ? "42" : "44";
</script>

<div
  aria-atomic="true"
  aria-live={active ? "assertive" : "off"}
  class:bx--loading={true}
  class:bx--loading--small={small}
  class:bx--loading--stop={!active}
  {...$$restProps}
>
  <!-- The <title> names the image; aria-label too would be read twice. -->
  <svg class:bx--loading__svg={true} viewBox="0 0 100 100" role="img">
    <title>{description}</title>
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
