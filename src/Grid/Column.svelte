<script>
  export let as = false;

  /**
   * Types for `sm`, `md`, `lg`, `xlg`, `max`:
   * true
   * Number
   * { span: Number | true; offset?: Number }
   */
  export let sm = undefined;
  export let md = undefined;
  export let lg = undefined;
  export let xlg = undefined;
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
    class: [$$restProps.class, columnClass, !columnClass && "bx--col"]
      .filter(Boolean)
      .join(" ")
  };
</script>

{#if as}
  <slot {props} />
{:else}
  <div {...props}>
    <slot />
  </div>
{/if}
