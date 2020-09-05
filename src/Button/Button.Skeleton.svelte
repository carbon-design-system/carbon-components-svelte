<script>
  /**
   * Set the `href` to use an anchor link
   * @type {string} [href]
   */
  export let href = undefined;

  /**
   * Set to `true` to use the small variant
   * @type {boolean} [small=false]
   */
  export let small = false;
</script>

{#if href}
  <a
    href="{href}"
    role="button"
    class:bx--skeleton="{true}"
    class:bx--btn="{true}"
    class:bx--btn--sm="{small}"
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave>
    {''}
  </a>
{:else}
  <div
    class:bx--skeleton="{true}"
    class:bx--btn="{true}"
    class:bx--btn--sm="{small}"
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave></div>
{/if}
