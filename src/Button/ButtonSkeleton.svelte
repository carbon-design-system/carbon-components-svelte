<script>
  /**
   * Set the `href` to use an anchor link
   * @type {string}
   */
  export let href = undefined;

  /**
   * Specify the size of button skeleton
   * @type {"default" | "field" | "small" | "lg" | "xl"}
   */
  export let size = "default";
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
{#if href}
  <a
    href="{href}"
    rel="{$$restProps.target === '_blank' ? 'noopener noreferrer' : undefined}"
    role="button"
    class:bx--skeleton="{true}"
    class:bx--btn="{true}"
    class:bx--btn--field="{size === 'field'}"
    class:bx--btn--sm="{size === 'small'}"
    class:bx--btn--lg="{size === 'lg'}"
    class:bx--btn--xl="{size === 'xl'}"
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    {""}
  </a>
{:else}
  <div
    class:bx--skeleton="{true}"
    class:bx--btn="{true}"
    class:bx--btn--field="{size === 'field'}"
    class:bx--btn--sm="{size === 'small'}"
    class:bx--btn--lg="{size === 'lg'}"
    class:bx--btn--xl="{size === 'xl'}"
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  ></div>
{/if}
