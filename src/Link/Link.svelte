<script>
  export let inline = false;
  export let disabled = false;
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
