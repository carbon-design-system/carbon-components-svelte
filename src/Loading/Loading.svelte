<script>
  /**
   * Set to `true` to use the small variant
   * @type {boolean} [small=false]
   */
  export let small = false;

  /**
   * Set to `false` to disable the active state
   * @type {boolean} [active=true]
   */
  export let active = true;

  /**
   * Set to `false` to disable the overlay
   * @type {boolean} [withOverlay=false]
   */
  export let withOverlay = true;

  /**
   * Specify the label description
   * @type {string} [description="Active loading indicator"]
   */
  export let description = "Active loading indicator";

  /**
   * Set an id for the label element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);

  $: spinnerRadius = small ? "26.8125" : "37.5";
</script>

{#if withOverlay}
  <div
    class:bx--loading-overlay={true}
    class:bx--loading-overlay--stop={!active}
    {...$$restProps}>
    <div
      aria-atomic="true"
      aria-labelledby={id}
      aria-live={active ? 'assertive' : 'off'}
      class:bx--loading={true}
      class:bx--loading--small={small}
      class:bx--loading--stop={!active}>
      <label class:bx--visually-hidden={true} {id}>{description}</label>
      <svg class:bx--loading__svg={true} viewBox="-75 -75 150 150">
        <title>{description}</title>
        {#if small}
          <circle
            class:bx--loading__background={true}
            cx="0"
            cy="0"
            r={spinnerRadius} />
        {/if}
        <circle
          class:bx--loading__stroke={true}
          cx="0"
          cy="0"
          r={spinnerRadius} />
      </svg>
    </div>
  </div>
{:else}
  <div
    aria-atomic="true"
    aria-labelledby={id}
    aria-live={active ? 'assertive' : 'off'}
    class:bx--loading={true}
    class:bx--loading--small={small}
    class:bx--loading--stop={!active}
    {...$$restProps}>
    <label class:bx--visually-hidden={true} {id}>{description}</label>
    <svg class:bx--loading__svg={true} viewBox="-75 -75 150 150">
      <title>{description}</title>
      {#if small}
        <circle
          class:bx--loading__background={true}
          cx="0"
          cy="0"
          r={spinnerRadius} />
      {/if}
      <circle
        class:bx--loading__stroke={true}
        cx="0"
        cy="0"
        r={spinnerRadius} />
    </svg>
  </div>
{/if}
