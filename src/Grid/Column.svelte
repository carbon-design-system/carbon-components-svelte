<script>
  export let as = false;
  export let noGutter = false;
  export let noGutterLeft = false;
  export let noGutterRight = false;

  /**
   * Aspect ratio of the column
   * @type {"2x1" | "16x9" | "9x16" | "1x2" | "4x3" | "3x4" | "1x1"} [aspectRatio]
   */
  export let aspectRatio = undefined;

  /**
   * @typedef {boolean | number} ColumnSize
   * @typedef {{span?: ColumnSize: offset: number}} ColumnSizeDescriptor
   */

  /** @type {ColumnSize | ColumnSizeDescriptor} [sm] */
  export let sm = undefined;

  /** @type {ColumnSize | ColumnSizeDescriptor} [md] */
  export let md = undefined;

  /** @type {ColumnSize | ColumnSizeDescriptor} [lg] */
  export let lg = undefined;

  /** @type {ColumnSize | ColumnSizeDescriptor} [xlg] */
  export let xlg = undefined;

  /** @type {ColumnSize | ColumnSizeDescriptor} [max] */
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
