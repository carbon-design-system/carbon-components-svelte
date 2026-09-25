<script>
  /**
   * @restProps {div}
   * @slot {{ props: { class: string; [key: string]: any; } }}
   */

  import { getContext } from "svelte";

  // A CssGrid nested inside a CssColumn (at any depth) renders as a
  // subgrid: bx--subgrid instead of bx--css-grid.
  const isSubgrid = !!getContext("carbon:CssColumn");

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

  /**
   * Set to `true` to use the narrow variant (the container hangs into the gutter).
   * Ignored on a subgrid; use `mode` instead.
   */
  export let narrow = false;

  /**
   * Set to `true` to collapse the gutter to 1px.
   * Ignored on a subgrid; use `mode` instead.
   */
  export let condensed = false;

  /**
   * Set to `true` to remove the default max-width.
   * Ignored on a subgrid.
   */
  export let fullWidth = false;

  /** Set to `true` to add a row gap matching the current gutter. */
  export let withRowGap = false;

  /**
   * Set the subgrid gutter mode. Only applies when this CssGrid is nested
   * inside a CssColumn, where it renders as a subgrid and `narrow`,
   * `condensed`, and `fullWidth` are ignored. Ignored on a top-level grid.
   * @type {"wide" | "narrow" | "condensed" | undefined}
   */
  export let mode = undefined;

  $: props = {
    ...$$restProps,
    class: [
      $$restProps.class,
      isSubgrid ? "bx--subgrid" : "bx--css-grid",
      !isSubgrid && narrow && "bx--css-grid--narrow",
      !isSubgrid && condensed && "bx--css-grid--condensed",
      !isSubgrid && fullWidth && "bx--css-grid--full-width",
      isSubgrid && mode && `bx--subgrid--${mode}`,
      withRowGap &&
        (isSubgrid
          ? "bx--subgrid--with-row-gap"
          : "bx--css-grid--with-row-gap"),
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
