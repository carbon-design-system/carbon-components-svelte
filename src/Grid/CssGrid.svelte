<script>
  /**
   * @restProps {div}
   * @slot {{ props: { class: string; [key: string]: any; } }}
   */

  /**
   * Set to `true` to render a custom HTML element.
   * Props are destructured as `props` in the default slot.
   * @example
   * ```svelte
   * <CssGrid let:props>
   *   <main {...props}>Content</main>
   * </CssGrid>
   * ```
   */
  export let as = false;

  /** Set to `true` to use the narrow variant (the container hangs into the gutter). */
  export let narrow = false;

  /** Set to `true` to collapse the gutter to 1px. */
  export let condensed = false;

  /** Set to `true` to remove the default max-width. */
  export let fullWidth = false;

  /** Set to `true` to add a row gap matching the current gutter. */
  export let withRowGap = false;

  $: props = {
    ...$$restProps,
    class: [
      $$restProps.class,
      "bx--css-grid",
      narrow && "bx--css-grid--narrow",
      condensed && "bx--css-grid--condensed",
      fullWidth && "bx--css-grid--full-width",
      withRowGap && "bx--css-grid--with-row-gap",
    ]
      .filter(Boolean)
      .join(" "),
  };
</script>

{#if as}
  <slot {props} />
{:else}
  <div {...props}><slot /></div>
{/if}
