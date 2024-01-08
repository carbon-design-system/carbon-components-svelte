<script>
  /**
   * @restProps {div}
   * @slot {{ props: { class: string; [key: string]: any; } }}
   */

  /**
   * Set to `true` to render a custom HTML element
   * Props are destructured as `props` in the default slot (e.g., <Row let:props><section {...props}>...</section></Row>)
   */
  export let as = false;

  /** Set to `true` to use the condensed variant */
  export let condensed = false;

  /** Set to `true` to use the narrow variant */
  export let narrow = false;

  /** Set to `true` to remove the gutter */
  export let noGutter = false;

  /** Set to `true` to remove the left gutter */
  export let noGutterLeft = false;

  /** Set to `true` to remove the right gutter */
  export let noGutterRight = false;

  /** Set to `true` to add top and bottom padding to all columns */
  export let padding = false;

  $: props = {
    ...$$restProps,
    class: [
      $$restProps.class,
      "cds--row",
      condensed && "cds--row--condensed",
      narrow && "cds--row--narrow",
      noGutter && "cds--no-gutter",
      noGutterLeft && "cds--no-gutter--left",
      noGutterRight && "cds--no-gutter--right",
      padding && "cds--row-padding",
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
