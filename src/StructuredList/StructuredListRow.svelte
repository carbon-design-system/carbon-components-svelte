<script>
  export let head = false;
  export let label = false;
  export let tabindex = "0";
</script>

{#if label}
  <label
    role="presentation"
    {tabindex}
    class:bx--structured-list-row={true}
    class:bx--structured-list-row--header-row={head}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:keydown>
    <slot />
  </label>
{:else}
  <div
    class:bx--structured-list-row={true}
    class:bx--structured-list-row--header-row={head}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave>
    <slot />
  </div>
{/if}
