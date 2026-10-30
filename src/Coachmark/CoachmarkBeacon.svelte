<script>
  /**
   * @restProps {button}
   * @event {WindowEventMap["click"]} click
   */

  /**
   * Specify the accessible name of the beacon.
   * A consumer `aria-label` or `aria-labelledby` wins.
   * @type {string}
   */
  export let iconDescription;

  /**
   * Set to `true` to place the beacon on the end/top corner of its
   * positioned parent, so it can decorate an existing control without
   * nesting a button inside a button.
   */
  export let overlay = false;

  /**
   * Obtain a reference to the button HTML element.
   * @bindable readonly
   * @type {null | HTMLButtonElement}
   */
  export let ref = null;
</script>

<button
  bind:this={ref}
  type="button"
  class:bx--coachmark-beacon={true}
  class:bx--coachmark-beacon--overlay={overlay}
  aria-label={iconDescription}
  {...$$restProps}
  on:click
>
  <span class:bx--coachmark-beacon__ring={true} aria-hidden="true"></span>
  <span class:bx--coachmark-beacon__core={true} aria-hidden="true"></span>
</button>
