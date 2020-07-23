<script>
  export let as = false;
  export let condensed = false;
  export let fullWidth = false;

  $: props = {
    ...$$restProps,
    class: [
      $$restProps.class,
      "bx--grid",
      condensed && "bx--grid--condensed",
      fullWidth && "bx--grid--full-width"
    ]
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
