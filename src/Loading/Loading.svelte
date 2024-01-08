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
    class:cds--loading-overlay="{true}"
    class:cds--loading-overlay--stop="{!active}"
    {...$$restProps}
  >
    <div
      aria-atomic="true"
      aria-live="{active ? 'assertive' : 'off'}"
      class:cds--loading="{true}"
      class:cds--loading--small="{small}"
      class:cds--loading--stop="{!active}"
    >
      <svg class:cds--loading__svg="{true}" viewBox="0 0 100 100">
        <title>{description}</title>
        {#if small}
          <circle
            class:cds--loading__background="{true}"
            cx="50%"
            cy="50%"
            r="{spinnerRadius}"></circle>
        {/if}
        <circle
          class:cds--loading__stroke="{true}"
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
    class:cds--loading="{true}"
    class:cds--loading--small="{small}"
    class:cds--loading--stop="{!active}"
    {...$$restProps}
  >
    <svg class:cds--loading__svg="{true}" viewBox="0 0 100 100">
      <title>{description}</title>
      {#if small}
        <circle
          class:cds--loading__background="{true}"
          cx="50%"
          cy="50%"
          r="{spinnerRadius}"></circle>
      {/if}
      <circle
        class:cds--loading__stroke="{true}"
        cx="50%"
        cy="50%"
        r="{spinnerRadius}"></circle>
    </svg>
  </div>
{/if}
