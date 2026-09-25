<script>
  /**
   * @typedef {number | boolean} CssColumnSpan
   * @typedef {"25%" | "50%" | "75%" | "100%"} CssColumnPercent
   * @typedef CssColumnDescriptor
   * @property {CssColumnSpan | CssColumnPercent} [span]
   * @property {number} [offset]
   * @property {number} [start]
   * @property {number} [end]
   * @typedef {CssColumnSpan | CssColumnPercent | CssColumnDescriptor} CssColumnBreakpoint
   * @restProps {div}
   * @slot {{ props: { class: string; [key: string]: any; } }}
   */

  import { setContext } from "svelte";

  // Any CssGrid nested inside this column, at any depth, renders as a
  // subgrid. Set unconditionally: every column provides it.
  setContext("carbon:CssColumn", true);

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
   * Set a constant span that does not change per breakpoint. Same shape as
   * sm/md/lg/xlg/max — the only difference is which class family it emits
   * (unprefixed vs. breakpoint-prefixed).
   * @type {CssColumnBreakpoint | undefined}
   */
  export let span = undefined;

  /**
   * Set the small breakpoint.
   * @type {CssColumnBreakpoint | undefined}
   */
  export let sm = undefined;

  /**
   * Set the medium breakpoint.
   * @type {CssColumnBreakpoint | undefined}
   */
  export let md = undefined;

  /**
   * Set the large breakpoint.
   * @type {CssColumnBreakpoint | undefined}
   */
  export let lg = undefined;

  /**
   * Set the extra large breakpoint.
   * @type {CssColumnBreakpoint | undefined}
   */
  export let xlg = undefined;

  /**
   * Set the maximum breakpoint.
   * @type {CssColumnBreakpoint | undefined}
   */
  export let max = undefined;

  /**
   * Builds classes for one breakpoint (or the constant `span` prop, via
   * `prefix = "bx--"`). Mirrors Carbon React's
   * `getClassNameForBreakpoints` CSS-grid branch exactly: same field
   * check order (offset, then start, then end, then span), same `0`
   * handling (`offset: 0` and `start: 0` both fall back to
   * `col-start-auto` — upstream's ternaries are falsy-checks, not
   * `typeof`/`undefined` checks), same `offset` math (`offset > 0 ?
   * offset + 1 : "auto"` — an offset counts columns, a grid line number
   * is one more than the count before it). If a descriptor sets both
   * `offset` and `start`, both classes are pushed, same as upstream — do
   * not collapse that to one.
   * @param {string} prefix
   * @param {CssColumnBreakpoint | undefined} value
   */
  function classesFor(prefix, value) {
    if (value === undefined || value === false) return [];
    if (value === true) return [`${prefix}col-span-auto`];
    if (typeof value === "number") return [`${prefix}col-span-${value}`];
    if (typeof value === "string") {
      // Percent spans ("25%"|"50%"|"75%"|"100%"), matching upstream's
      // `span.slice(0, -1)` (strip the trailing "%"). Valid on span AND
      // every breakpoint prop — bx--md:col-span-50 etc. are real classes.
      return [`${prefix}col-span-${value.slice(0, -1)}`];
    }
    // Descriptor: { span?, offset?, start?, end? }.
    const classes = [];
    if (typeof value.offset === "number") {
      classes.push(
        `${prefix}col-start-${value.offset > 0 ? value.offset + 1 : "auto"}`,
      );
    }
    if (typeof value.start === "number") {
      classes.push(`${prefix}col-start-${value.start ? value.start : "auto"}`);
    }
    if (typeof value.end === "number") {
      classes.push(`${prefix}col-end-${value.end}`);
    }
    if (typeof value.span === "number") {
      classes.push(`${prefix}col-span-${value.span}`);
    } else if (typeof value.span === "string") {
      classes.push(`${prefix}col-span-${value.span.slice(0, -1)}`);
    }
    // No `value.span === true` branch: upstream's own object-branch never
    // checks for it either — a boolean auto-span is only read from the
    // top-level breakpoint value (the `value === true` case above), not
    // from inside a descriptor. `{ span: true, start: 2 }` silently drops
    // the span half, same as upstream. Do not add a branch here to "fix"
    // that gap.
    return classes;
  }

  $: columnClasses = [
    ...classesFor("bx--", span),
    ...classesFor("bx--sm:", sm),
    ...classesFor("bx--md:", md),
    ...classesFor("bx--lg:", lg),
    ...classesFor("bx--xlg:", xlg),
    ...classesFor("bx--max:", max),
  ];

  $: props = {
    ...$$restProps,
    class: [$$restProps.class, "bx--css-grid-column", ...columnClasses]
      .filter(Boolean)
      .join(" "),
  };
</script>

{#if as}
  <slot {props} />
{:else}
  <div {...props}><slot /></div>
{/if}
