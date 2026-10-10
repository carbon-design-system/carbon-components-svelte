<script>
  /**
   * @restProps {any}
   * @slot {{}}
   */

  /**
   * Set the type scale and spacing for the copy inside.
   * - `"default"`: 16px body copy and productive headings, for reading pages
   * - `"condensed"`: 12px body copy with a 1.5 line height and compact's
   *   spacing, for inspectors, side panels, and notes in dense consoles
   * - `"compact"`: 14px body copy and tighter spacing, for dense product UI
   * - `"spacious"`: 16px body copy with larger headings and more room
   * - `"expressive"`: expressive headings that scale with the viewport and
   *   wider spacing, for editorial and marketing pages
   * @type {"condensed" | "compact" | "default" | "spacious" | "expressive"}
   */
  export let variant = "default";

  /**
   * Override the max width. Each variant caps the line length: 96 characters
   * (condensed), 80 (compact), 68 (default), 64 (spacious), or 60
   * (expressive). Numbers are treated as pixels; strings accept any CSS
   * length, or `"none"` to fill the container.
   * @type {number | string | undefined}
   */
  export let maxWidth = undefined;

  /**
   * Set to `true` to skip rendering code blocks (`pre`) and figures while
   * they are offscreen, with `content-visibility: auto`. They stay in find
   * in page, anchor navigation, and the accessibility tree. Each reserves
   * 10rem until it first renders, then its last rendered height.
   */
  export let deferOffscreen = false;

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
    deferOffscreen && "bx--prose--defer-offscreen",
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
