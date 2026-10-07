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
   * @bindable readonly
   */
  export let ref = null;

  import { writable } from "svelte/store";
  import Link from "../Link/Link.svelte";
  import TileWrapper from "./TileWrapper.svelte";

  // Without `href`, the anchor is neither focusable nor a link, so give it
  // button semantics for the Enter/Space handling below. Spread before
  // `$$restProps` so a consumer's own `role` or `tabindex` wins; omitted
  // entirely when disabled, where Link renders its own `role="link"`.
  $: buttonProps = href || disabled ? {} : { role: "button", tabindex: "0" };

  /** @type {import("svelte/store").Writable<undefined | "active" | "revert">} */
  const aiLabelState = writable(undefined);

  $: linkClass = [
    "bx--tile",
    "bx--tile--clickable",
    clicked && "bx--tile--is-clicked",
    light && "bx--tile--light",
    fullHeight && "bx--tile--full-height",
    noPadding && "bx--tile--no-padding",
    $$slots.decorator && "bx--tile--decorator",
    $aiLabelState === "active" && "bx--tile--ai-label",
    $$restProps.class,
  ]
    .filter(Boolean)
    .join(" ");
</script>

<TileWrapper
  decorated={$$slots.decorator}
  state={aiLabelState}
  class="bx--tile__wrapper--clickable"
>
  <Link
    bind:ref
    {...buttonProps}
    {...$$restProps}
    {disabled}
    class={linkClass}
    {href}
    on:click
    on:click={() => {
      if (disabled) return;
      clicked = !clicked;
    }}
    on:keydown
    on:keydown={(event) => {
      if (disabled) return;
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
  </Link>
  <svelte:fragment slot="decorator">
    <slot name="decorator" />
  </svelte:fragment>
</TileWrapper>
