<script>
  /** @restProps {a} */

  /**
   * Whether the tile has been clicked.
   * Toggles on click and on Space/Enter.
   * @bindable readonly
   */
  export let clicked = false;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /**
   * Set the size: `"sm"` for a compact tile, such as a row in a list of
   * choices, with less padding and no minimum height.
   * @type {"sm" | "md"}
   */
  export let size = undefined;

  /** Set to `true` to disable the tile */
  export let disabled = false;

  /** Set to `true` to stretch the tile to fill the height of its container */
  export let fullHeight = false;

  /** Set to `true` to remove the tile's padding */
  export let noPadding = false;

  /**
   * Set the `href`.
   * @type {string}
   */
  export let href = undefined;

  /**
   * Obtain a reference to the underlying anchor HTML element.
   * @type {null | HTMLAnchorElement}
   * @bindable readonly
   */
  export let ref = null;

  import { resolveLinkRel } from "../utils/link-rel.js";

  // Without `href`, the anchor is neither focusable nor a link, so give it
  // button semantics for the Enter/Space handling below. Spread before
  // `$$restProps` so a consumer's own `role` or `tabindex` wins; omitted
  // entirely when disabled, where the anchor gets `role="link"`.
  $: buttonProps = href || disabled ? {} : { role: "button", tabindex: "0" };

  $: linkClass = [
    "bx--tile",
    "bx--tile--clickable",
    clicked && "bx--tile--is-clicked",
    light && "bx--tile--light",
    size === "sm" && "bx--tile--sm",
    fullHeight && "bx--tile--full-height",
    noPadding && "bx--tile--no-padding",
    $$restProps.class,
  ]
    .filter(Boolean)
    .join(" ");
</script>

<!-- Rendered as a plain anchor with Link's classes, not a Link: a tile
     grid would otherwise mount two components per tile. -->
{#if disabled}
  <a
    bind:this={ref}
    role="link"
    aria-disabled="true"
    class:bx--link={true}
    class:bx--link--disabled={true}
    {...$$restProps}
    class={linkClass}
    on:click={(event) => {
      event.preventDefault();
      event.stopPropagation();
    }}
    on:keydown
    on:keyup
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:focus
    on:blur
  >
    <slot />
  </a>
{:else}
  <a
    bind:this={ref}
    class:bx--link={true}
    rel={resolveLinkRel($$restProps.target)}
    {href}
    {...buttonProps}
    {...$$restProps}
    class={linkClass}
    on:click
    on:click={() => {
      clicked = !clicked;
    }}
    on:keydown
    on:keydown={(event) => {
      // A focused <a href> already fires a native click on Enter, and the
      // on:click handler above picks that up. Space never does, and Enter
      // does not without href. Dispatch click only in those cases so Enter
      // with href does not toggle `clicked` twice.
      if (event.key === " " || (event.key === "Enter" && !href)) {
        event.preventDefault();
        ref?.click();
      }
    }}
    on:keyup
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:focus
    on:blur
  >
    <slot />
  </a>
{/if}
