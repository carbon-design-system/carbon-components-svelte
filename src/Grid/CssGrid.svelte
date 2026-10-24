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

  /**
   * Set to `true` to drop the leading gutter of each column, so content
   * hangs 16px into it. Takes precedence over `condensed`.
   */
  export let narrow = false;

  /** Set to `true` to collapse the gutter to 1px */
  export let condensed = false;

  /**
   * Set to `true` to remove the maximum width.
   * Ignored on a nested grid.
   */
  export let fullWidth = false;

  /** Set to `true` to add a row gap that matches the gutter */
  export let withRowGap = false;

  /**
   * Set the inline alignment of a grid narrower than its container.
   * Ignored on a nested grid.
   * @type {"start" | "center" | "end"}
   */
  export let align = "center";

  import { getContext, setContext } from "svelte";

  // A CssGrid inside another CssGrid is a subgrid. It lines its columns up
  // with the parent's and takes its gutter mode from narrow and condensed.
  const subgrid = getContext("carbon:CssGrid") !== undefined;

  setContext("carbon:CssGrid", {});

  $: mode = narrow ? "narrow" : condensed ? "condensed" : "wide";

  $: props = {
    ...$$restProps,
    class: [
      $$restProps.class,
      ...(subgrid
        ? [
            "bx--subgrid",
            `bx--subgrid--${mode}`,
            withRowGap && "bx--subgrid--with-row-gap",
          ]
        : [
            "bx--css-grid",
            mode === "narrow" && "bx--css-grid--narrow",
            mode === "condensed" && "bx--css-grid--condensed",
            fullWidth && "bx--css-grid--full-width",
            align === "start" && "bx--css-grid--start",
            align === "end" && "bx--css-grid--end",
            withRowGap && "bx--css-grid--with-row-gap",
          ]),
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
