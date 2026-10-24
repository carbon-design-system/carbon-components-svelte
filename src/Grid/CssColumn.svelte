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
   * Classes for one breakpoint, as Carbon React builds them. `true` spans
   * the remaining columns, a percent strips its `%`, and an offset of N
   * starts the column at grid line N + 1. An offset or start of 0 is auto.
   * @param {string} prefix
   * @param {CssColumnBreakpoint | undefined} value
   * @returns {string[]}
   */
  function classesFor(prefix, value) {
    if (value === true) return [`${prefix}col-span-auto`];
    if (typeof value === "number") return [`${prefix}col-span-${value}`];
    if (typeof value === "string") {
      return [`${prefix}col-span-${value.slice(0, -1)}`];
    }
    if (!value || typeof value !== "object") return [];

    const classes = [];
    if (typeof value.offset === "number") {
      classes.push(
        `${prefix}col-start-${value.offset > 0 ? value.offset + 1 : "auto"}`,
      );
    }
    if (typeof value.start === "number") {
      classes.push(`${prefix}col-start-${value.start || "auto"}`);
    }
    if (typeof value.end === "number") {
      classes.push(`${prefix}col-end-${value.end}`);
    }
    if (typeof value.span === "number") {
      classes.push(`${prefix}col-span-${value.span}`);
    } else if (typeof value.span === "string") {
      classes.push(`${prefix}col-span-${value.span.slice(0, -1)}`);
    }
    return classes;
  }

  $: props = {
    ...$$restProps,
    class: [
      $$restProps.class,
      "bx--css-grid-column",
      ...classesFor("bx--", span),
      ...classesFor("bx--sm:", sm),
      ...classesFor("bx--md:", md),
      ...classesFor("bx--lg:", lg),
      ...classesFor("bx--xlg:", xlg),
      ...classesFor("bx--max:", max),
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
