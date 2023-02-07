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
    class:cds--skeleton="{true}"
    class:cds--btn="{true}"
    class:cds--btn--field="{size === 'field'}"
    class:cds--btn--sm="{size === 'small'}"
    class:cds--btn--lg="{size === 'lg'}"
    class:cds--btn--xl="{size === 'xl'}"
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
    class:cds--skeleton="{true}"
    class:cds--btn="{true}"
    class:cds--btn--field="{size === 'field'}"
    class:cds--btn--sm="{size === 'small'}"
    class:cds--btn--lg="{size === 'lg'}"
    class:cds--btn--xl="{size === 'xl'}"
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  ></div>
{/if}
