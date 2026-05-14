<script>
  /** @restProps {a | p} */

  /** Set to `true` to click the tile */
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
  on:keydown={({ key }) => {
    if (disabled) return;
    if (key === " " || key === "Enter") {
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
