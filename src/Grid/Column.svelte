<script>
  /**
   * @typedef {boolean | number} ColumnSize
   * @typedef {{span?: ColumnSize; offset: number;}} ColumnSizeDescriptor
   * @typedef {ColumnSize | ColumnSizeDescriptor} ColumnBreakpoint
   * @restProps {div}
   */

  /** Specify the element tag */
  export let tag = "div";

  /** Set to `true` to remove the gutter */
  export let noGutter = false;

  /** Set to `true` to remove the left gutter */
  export let noGutterLeft = false;

  /** Set to `true` to remove the right gutter */
  export let noGutterRight = false;

  /** Set to `true` to add top and bottom padding to the column */
  export let padding = false;

  /**
   * Specify the aspect ratio of the column
   * @type {"2x1" | "16x9" | "9x16" | "1x2" | "4x3" | "3x4" | "1x1"}
   */
  export let aspectRatio = undefined;

  /**
   * Set the small breakpoint
   * @type {ColumnBreakpoint}
   */
  export let sm = undefined;

  /**
   * Set the medium breakpoint
   * @type {ColumnBreakpoint}
   */
  export let md = undefined;

  /**
   * Set the large breakpoint
   * @type {ColumnBreakpoint}
   */
  export let lg = undefined;

  /**
   * Set the extra large breakpoint
   * @type {ColumnBreakpoint}
   */
  export let xlg = undefined;

  /**
   * Set the maximum breakpoint
   * @type {ColumnBreakpoint}
   */
  export let max = undefined;

  const breakpoints = ["sm", "md", "lg", "xlg", "max"];

  $: columnClass = [sm, md, lg, xlg, max]
    .map((breakpoint, i) => {
      const name = breakpoints[i];

      if (breakpoint === true) {
        return `bx--col-${name}`;
      } else if (typeof breakpoint === "number") {
        return `bx--col-${name}-${breakpoint}`;
      } else if (typeof breakpoint === "object") {
        let bp = [];

        if (typeof breakpoint.span === "number") {
          bp = [...bp, `bx--col-${name}-${breakpoint.span}`];
        } else if (breakpoint.span === true) {
          bp = [...bp, `bx--col-${name}`];
        }

        if (typeof breakpoint.offset === "number") {
          bp = [...bp, `bx--offset-${name}-${breakpoint.offset}`];
        }

        return bp.join(" ");
      }
    })
    .filter(Boolean)
    .join(" ");
  $: props = {
    ...$$restProps,
    class: [
      $$restProps.class,
      columnClass,
      aspectRatio && `bx--aspect-ratio--${aspectRatio}`,
    ]
      .filter(Boolean)
      .join(" "),
  };
</script>

<svelte:element
  this="{tag}"
  {...props}
  class:bx--col="{!columnClass}"
  class:bx--no-gutter="{noGutter}"
  class:bx--no-gutter--left="{noGutterLeft}"
  class:bx--no-gutter--right="{noGutterRight}"
  class:bx--row-padding="{padding}"
  class:bx--aspect-ratio="{aspectRatio}"
>
  <slot />
</svelte:element>
