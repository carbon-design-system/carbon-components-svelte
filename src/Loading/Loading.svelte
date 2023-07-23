<script>
  /** Set to `true` to use the small variant */
  export let small = false;

  /** Set to `false` to disable the active state */
  export let active = true;

  /** Set to `false` to disable the overlay */
  export let withOverlay = true;

  /** Specify the description to describe the loading state */
  export let description = "loading";

  $: spinnerRadius = small ? "42" : "44";
</script>

{#if withOverlay}
  <div
    class:bx--loading-overlay="{true}"
    class:bx--loading-overlay--stop="{!active}"
    {...$$restProps}
  >
    <div
      aria-atomic="true"
      aria-live="{active ? 'assertive' : 'off'}"
      class:bx--loading="{true}"
      class:bx--loading--small="{small}"
      class:bx--loading--stop="{!active}"
    >
      <svg class:bx--loading__svg="{true}" viewBox="0 0 100 100">
        <title>{description}</title>
        {#if small}
          <circle
            class:bx--loading__background="{true}"
            cx="50%"
            cy="50%"
            r="{spinnerRadius}"></circle>
        {/if}
        <circle
          class:bx--loading__stroke="{true}"
          cx="50%"
          cy="50%"
          r="{spinnerRadius}"></circle>
      </svg>
    </div>
  </div>
{:else}
  <div
    aria-atomic="true"
    aria-live="{active ? 'assertive' : 'off'}"
    class:bx--loading="{true}"
    class:bx--loading--small="{small}"
    class:bx--loading--stop="{!active}"
    {...$$restProps}
  >
    <svg class:bx--loading__svg="{true}" viewBox="0 0 100 100">
      <title>{description}</title>
      {#if small}
        <circle
          class:bx--loading__background="{true}"
          cx="50%"
          cy="50%"
          r="{spinnerRadius}"></circle>
      {/if}
      <circle
        class:bx--loading__stroke="{true}"
        cx="50%"
        cy="50%"
        r="{spinnerRadius}"></circle>
    </svg>
  </div>
{/if}
