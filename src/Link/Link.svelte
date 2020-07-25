<script>
  /**
   * Set to `true` to use the inline variant
   * @type {boolean} [inline=false]
   */
  export let inline = false;

  /**
   * Set to `true` to disable the checkbox
   * @type {boolean} [disabled=false]
   */
  export let disabled = false;

  /**
   * Obtain a reference to the top-level HTML element
   * @type {null | HTMLElement} [ref=null]
   */
  export let ref = null;
</script>

{#if disabled}
  <p
    bind:this={ref}
    class:bx--link={true}
    class:bx--link--disabled={disabled}
    class:bx--link--inline={inline}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave>
    <slot />
  </p>
{:else}
  <!-- svelte-ignore a11y-missing-attribute -->
  <a
    bind:this={ref}
    class:bx--link={true}
    class:bx--link--disabled={disabled}
    class:bx--link--inline={inline}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave>
    <slot />
  </a>
{/if}
