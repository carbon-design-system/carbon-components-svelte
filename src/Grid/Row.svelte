<script>
  /**
   * Set to `true` to render a custom HTML element
   * Props are destructured as `props` in the default slot (e.g. <Row let:props><section {...props}>...</section></Row>)
   * @type {boolean} [as=false]
   */
  export let as = false;

  /**
   * Set to `true` to use the condensed variant
   * @type {boolean} [condensed=false]
   */
  export let condensed = false;

  /**
   * Set to `true` to use the narrow variant
   * @type {boolean} [narrow=false]
   */
  export let narrow = false;

  /**
   * Set to `true` to remove the gutter
   * @type {boolean} [noGutter=false]
   */
  export let noGutter = false;

  /**
   * Set to `true` to remove the left gutter
   * @type {boolean} [noGutterLeft=false]
   */
  export let noGutterLeft = false;

  /**
   * Set to `true` to remove the right gutter
   * @type {boolean} [noGutterRight=false]
   */
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
  <slot props="{props}" />
{:else}
  <div {...props}>
    <slot />
  </div>
{/if}
