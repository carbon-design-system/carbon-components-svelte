<script>
  export let as = false;
  export let condensed = false;

  $: props = {
    ...$$restProps,
    class: [$$restProps.class, "bx--row", condensed && "bx--row--condensed"]
      .filter(Boolean)
      .join(" ")
  };
</script>

{#if as}
  <slot {props} />
{:else}
  <div {...props}>
    <slot />
  </div>
{/if}
