<script>
  /**
   * Set the `href` to use an anchor link
   * @type {string}
   */
  export let href = undefined;

  /**
   * Specify the size of button skeleton
   * @type {"sm" | "md" | "lg" | "xl" | "2xl"}
   */
  export let size = "lg";
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
{#if href}
  <a
    href="{href}"
    rel="{$$restProps.target === '_blank' ? 'noopener noreferrer' : undefined}"
    role="button"
    class:bx--skeleton="{true}"
    class:bx--btn="{true}"
    class:bx--layout--size-sm="{size === 'sm'}"
    class:bx--layout--size-md="{size === 'md'}"
    class:bx--layout--size-lg="{size === 'lg'}"
    class:bx--layout--size-xl="{size === 'xl'}"
    class:bx--layout--size-2xl="{size === '2xl'}"
    {...$$restProps}
    on:click
    on:focus
    on:blur
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    {""}
  </a>
{:else}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class:bx--skeleton="{true}"
    class:bx--btn="{true}"
    class:bx--layout--size-sm="{size === 'sm'}"
    class:bx--layout--size-md="{size === 'md'}"
    class:bx--layout--size-lg="{size === 'lg'}"
    class:bx--layout--size-xl="{size === 'xl'}"
    class:bx--layout--size-2xl="{size === '2xl'}"
    {...$$restProps}
    on:click
    on:focus
    on:blur
    on:mouseover
    on:mouseenter
    on:mouseleave
  ></div>
{/if}
