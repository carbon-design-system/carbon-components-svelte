<script>
  /** @restProps {a | p} */

  /**
   * Set to `true` to click the tile.
   * @bindable readonly
   */
  export let clicked = false;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to disable the tile */
  export let disabled = false;

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

  import Link from "../Link/Link.svelte";

  $: linkClass = [
    "bx--tile",
    "bx--tile--clickable",
    clicked && "bx--tile--is-clicked",
    light && "bx--tile--light",
    $$restProps.class,
  ]
    .filter(Boolean)
    .join(" ");
</script>

<Link
  bind:ref
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
    if (event.key === " " || event.key === "Enter") {
      clicked = !clicked;
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
