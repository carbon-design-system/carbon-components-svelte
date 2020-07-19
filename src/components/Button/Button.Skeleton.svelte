<script>
  export let href = undefined;
  export let small = false;
</script>

{#if href}
  <a
    {href}
    role="button"
    class:bx--skeleton={true}
    class:bx--btn={true}
    class:bx--btn--sm={small}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave>
    {''}
  </a>
{:else}
  <div
    class:bx--skeleton={true}
    class:bx--btn={true}
    class:bx--btn--sm={small}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave />
{/if}
