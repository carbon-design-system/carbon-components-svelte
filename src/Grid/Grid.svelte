<script>
  /**
   * @restProps {div}
   * @slot {{ props: { class: string; [key: string]: any; } }}
   */

  /**
   * Set to `true` to render a custom HTML element
   * Props are destructured as `props` in the default slot (e.g., <Grid let:props><header {...props}>...</header></Grid>)
   */
  export let as = false;

  /** Set to `true` to use the condensed variant */
  export let condensed = false;

  /** Set to `true` to use the narrow variant */
  export let narrow = false;

  /** Set to `true` to use the fullWidth variant */
  export let fullWidth = false;

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
      "bx--grid",
      condensed && "bx--grid--condensed",
      narrow && "bx--grid--narrow",
      fullWidth && "bx--grid--full-width",
      noGutter && "bx--no-gutter",
      noGutterLeft && "bx--no-gutter--left",
      noGutterRight && "bx--no-gutter--right",
      padding && "bx--row-padding",
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
