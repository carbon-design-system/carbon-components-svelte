<script>
  export let small = false;
  export let active = true;
  export let withOverlay = true;
  export let description = "Active loading indicator";
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
