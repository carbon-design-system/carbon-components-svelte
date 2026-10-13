<script>
  /**
   * @restProps {any}
   * @slot {{}}
   */

  /**
   * Set the type scale and spacing for the copy inside.
   * - `"default"`: 16px body copy and productive headings, for reading pages
   * - `"condensed"`: 14px body copy with a shorter line height and tighter
   *   spacing than compact, for side panels and inspectors
   * - `"compact"`: 14px body copy and tighter spacing, for dense product UI
   * - `"spacious"`: 16px body copy with larger headings and more room
   * - `"expressive"`: expressive headings that scale with the viewport and
   *   wider spacing, for editorial and marketing pages
   * @type {"condensed" | "compact" | "default" | "spacious" | "expressive"}
   */
  export let variant = "default";

  /**
   * Set the link color.
   * - `"default"`: links and heading anchors in the link color
   * - `"muted"`: links in the text color, underlined, and heading anchors in
   *   the secondary text color; both take the link color on hover. For copy
   *   dense with links, such as reference docs.
   *
   * Links have no visited color, like `Link` by default.
   * @type {"default" | "muted"}
   */
  export let linkTone = "default";

  /**
   * Set how tables size. Either way, the first and last columns line up
   * with the copy.
   * - `"fit"`: columns at their content width with a gap between them, so
   *   a short table reads with the copy around it
   * - `"full"`: the table spans the line length with padded cells, for wide
   *   or data-heavy tables
   * @type {"fit" | "full"}
   */
  export let tableWidth = "fit";

  /**
   * Set how `kbd` keys look. Either way, keys never change line spacing.
   * - `"keycap"`: a flat key with a heavier bottom edge
   * - `"muted"`: no box, semibold text in the secondary color, the way
   *   `Menu` shows shortcuts; for dense copy and long key sequences
   * @type {"keycap" | "muted"}
   */
  export let kbd = "keycap";

  /** Set to `true` to draw a rule above each `h2`, to set sections apart */
  export let dividers = false;

  /**
   * Override the max width. Each variant caps the line length: 80 characters
   * (condensed and compact), 68 (default), 64 (spacious), or 60
   * (expressive). Numbers are treated as pixels; strings accept any CSS
   * length, or `"none"` to fill the container.
   * @type {number | string | undefined}
   */
  export let maxWidth = undefined;

  /**
   * Specify the tag name.
   * @type {keyof HTMLElementTagNameMap}
   */
  export let tag = "div";

  /**
   * Obtain a reference to the HTML element.
   * @type {null | HTMLElement}
   * @bindable readonly
   */
  export let ref = null;

  import { toCssLength } from "../utils/css-length.js";

  $: proseClass = [
    "bx--prose",
    variant === "condensed" && "bx--prose--condensed",
    variant === "compact" && "bx--prose--compact",
    variant === "spacious" && "bx--prose--spacious",
    variant === "expressive" && "bx--prose--expressive",
    linkTone === "muted" && "bx--prose--link-muted",
    dividers && "bx--prose--dividers",
    tableWidth === "full" && "bx--prose--table-full",
    kbd === "muted" && "bx--prose--kbd-muted",
    $$restProps.class,
  ]
    .filter(Boolean)
    .join(" ");
</script>

<svelte:element
  this={tag}
  bind:this={ref}
  {...$$restProps}
  class={proseClass}
  style:max-width={toCssLength(maxWidth)}
>
  <slot />
</svelte:element>
