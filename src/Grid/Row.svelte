<script>
  export let as = false;
  export let condensed = false;
  export let narrow = false;
  export let noGutter = false;
  export let noGutterLeft = false;
  export let noGutterRight = false;

  $: props = {
    ...$$restProps,
    class: [
      $$restProps.class,
      "bx--row",
      condensed && "bx--row--condensed",
      narrow && "bx--row--narrow",
      noGutter && "bx--no-gutter",
      noGutterLeft && "bx--no-gutter--left",
      noGutterRight && "bx--no-gutter--right",
    ]
      .filter(Boolean)
      .join(" "),
  };
</script>

{#if as}
  <slot {props} />
{:else}
  <div {...props}>
    <slot />
  </div>
{/if}
