<script>
  /**
   * Set to `true` to render a custom HTML element
   * Props are destructured as `props` in the default slot (e.g. <Column let:props><article {...props}>...</article></Column>)
   * @type {boolean} [as=false]
   */
  export let as = false;

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

  /**
   * Specify the aspect ratio of the column
   * @type {"2x1" | "16x9" | "9x16" | "1x2" | "4x3" | "3x4" | "1x1"} [aspectRatio]
   */
  export let aspectRatio = undefined;

  /**
   * @typedef {boolean | number} ColumnSize
   * @typedef {{span?: ColumnSize; offset: number;}} ColumnSizeDescriptor
   * @typedef {ColumnSize | ColumnSizeDescriptor} ColumnBreakpoint
   */

  /**
   * Set the small breakpoint
   * @type {ColumnBreakpoint} [sm]
   */
  export let sm = undefined;

  /**
   * Set the medium breakpoint
   * @type {ColumnBreakpoint} [md]
   */
  export let md = undefined;

  /**
   * Set the large breakpoint
   * @type {ColumnBreakpoint} [lg]
   */
  export let lg = undefined;

  /**
   * Set the extra large breakpoint
   * @type {ColumnBreakpoint} [xlg]
   */
  export let xlg = undefined;

  /**
   * Set the maximum breakpoint
   * @type {ColumnBreakpoint} [max]
   */
  export let max = undefined;

  /**
   * Column breakpoints
   * @constant
   * @type {string[]}
   */
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
      !columnClass && "bx--col",
      noGutter && "bx--no-gutter",
      noGutterLeft && "bx--no-gutter--left",
      noGutterRight && "bx--no-gutter--right",
      aspectRatio && `bx--aspect-ratio bx--aspect-ratio--${aspectRatio}`,
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
