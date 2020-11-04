<script>
  /** Set to `true` to use as a header */
  export let head = false;

  /** Set to `true` to render a label slot */
  export let label = false;

  /** Specify the tabindex */
  export let tabindex = "0";
</script>

{#if label}
  <!-- svelte-ignore a11y-label-has-associated-control -->
  <label
    role="presentation"
    tabindex="{tabindex}"
    class:bx--structured-list-row="{true}"
    class:bx--structured-list-row--header-row="{head}"
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:keydown
  >
    <slot />
  </label>
{:else}
  <div
    class:bx--structured-list-row="{true}"
    class:bx--structured-list-row--header-row="{head}"
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <slot />
  </div>
{/if}
