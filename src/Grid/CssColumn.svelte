<script>
  /**
   * @typedef {"25%" | "50%" | "75%" | "100%"} CssColumnPercent
   * @typedef CssColumnDescriptor
   * @property {number | CssColumnPercent} [span] Columns to span
   * @property {number} [offset] Columns to skip before this one
   * @property {number} [start] Grid line to start at
   * @property {number} [end] Grid line to end at
   * @typedef {boolean | number | CssColumnPercent | CssColumnDescriptor} CssColumnBreakpoint
   * @restProps {div}
   * @slot {{ props: { class: string; [key: string]: any; } }}
   */

  /**
   * Set to `true` to render a custom HTML element.
   * Props are destructured as `props` in the default slot.
   * @example
   * ```svelte
   * <CssColumn let:props>
   *   <article {...props}>Content</article>
   * </CssColumn>
   * ```
   */
  export let as = false;

  /**
   * Set the span, offset, start or end at every breakpoint.
   * @type {CssColumnBreakpoint | undefined}
   */
  export let span = undefined;

  /**
   * Set the small breakpoint (4 columns).
   * @type {CssColumnBreakpoint | undefined}
   */
  export let sm = undefined;

  /**
   * Set the medium breakpoint (8 columns).
   * @type {CssColumnBreakpoint | undefined}
   */
  export let md = undefined;

  /**
   * Set the large breakpoint (16 columns).
   * @type {CssColumnBreakpoint | undefined}
   */
  export let lg = undefined;

  /**
   * Set the extra large breakpoint (16 columns).
   * @type {CssColumnBreakpoint | undefined}
   */
  export let xlg = undefined;

  /**
   * Set the maximum breakpoint (16 columns).
   * @type {CssColumnBreakpoint | undefined}
   */
  export let max = undefined;

  /**
   * Set the block-axis alignment of the column in its row, as on `Column`.
   * A column stretches to the height of its row by default.
   * @type {"start" | "center" | "end" | "stretch" | undefined}
   */
  export let align = undefined;

  /**
   * Classes for one breakpoint, as Carbon React builds them. `true` places
   * the column automatically, one column wide. A percent strips its `%`,
   * and an offset of N starts the column at grid line N + 1. An offset or
   * start of 0 is auto.
   *
   * Each breakpoint spells its class prefixes in full, so a build that
   * prunes Carbon's CSS by the classes source spells keeps their rules.
   * @param {CssColumnBreakpoint | undefined} value
   * @param {[span: string, start: string, end: string]} prefixes
   * @returns {string[]}
   */
  function classesFor(value, [span, start, end]) {
    if (value === true) return [`${span}auto`];
    if (typeof value === "number") return [`${span}${value}`];
    if (typeof value === "string") {
      return [`${span}${value.slice(0, -1)}`];
    }
    if (!value || typeof value !== "object") return [];

    const classes = [];
    if (typeof value.offset === "number") {
      classes.push(`${start}${value.offset > 0 ? value.offset + 1 : "auto"}`);
    }
    if (typeof value.start === "number") {
      classes.push(`${start}${value.start || "auto"}`);
    }
    if (typeof value.end === "number") {
      classes.push(`${end}${value.end}`);
    }
    if (typeof value.span === "number") {
      classes.push(`${span}${value.span}`);
    } else if (typeof value.span === "string") {
      classes.push(`${span}${value.span.slice(0, -1)}`);
    }
    return classes;
  }

  $: props = {
    ...$$restProps,
    class: [
      $$restProps.class,
      "bx--css-grid-column",
      ...classesFor(span, ["bx--col-span-", "bx--col-start-", "bx--col-end-"]),
      ...classesFor(sm, [
        "bx--sm:col-span-",
        "bx--sm:col-start-",
        "bx--sm:col-end-",
      ]),
      ...classesFor(md, [
        "bx--md:col-span-",
        "bx--md:col-start-",
        "bx--md:col-end-",
      ]),
      ...classesFor(lg, [
        "bx--lg:col-span-",
        "bx--lg:col-start-",
        "bx--lg:col-end-",
      ]),
      ...classesFor(xlg, [
        "bx--xlg:col-span-",
        "bx--xlg:col-start-",
        "bx--xlg:col-end-",
      ]),
      ...classesFor(max, [
        "bx--max:col-span-",
        "bx--max:col-start-",
        "bx--max:col-end-",
      ]),
      // Shared with Column. In a grid, flex-start and flex-end act as start
      // and end, so the column lines up with the block start or end.
      align && `bx--col--align-${align}`,
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
