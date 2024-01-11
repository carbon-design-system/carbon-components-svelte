<script>
  /** @restProps {a | p} */

  /** Set to `true` to click the tile */
  export let clicked = false;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to disable the tile */
  export let disabled = false;

  /**
   * Set the `href`
   * @type {string}
   */
  export let href = undefined;

  import Link from "../Link/Link.svelte";
</script>

<Link
  {...$$restProps}
  disabled="{disabled}"
  class="bx--tile bx--tile--clickable {clicked &&
    'bx--tile--is-clicked'} {light && 'bx--tile--light'} {$$restProps.class}"
  href="{href}"
  on:click
  on:click="{() => {
    clicked = !clicked;
  }}"
  on:keydown
  on:keydown="{({ key }) => {
    if (key === ' ' || key === 'Enter') {
      clicked = !clicked;
    }
  }}"
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</Link>
