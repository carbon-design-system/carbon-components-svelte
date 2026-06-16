<script>
  /**
   * Specify the size of the search menu.
   * @type {"xs" | "sm" | "lg" | "xl"}
   */
  export let size = "xl";

  /** Specify the number of skeleton menu items to render */
  export let count = 4;

  import SkeletonText from "../SkeletonText/SkeletonText.svelte";

  const widths = ["75%", "90%", "65%", "80%"];
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="bx--search-menu__menu bx--search-menu__menu--inline bx--search-menu__menu--{size}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#each Array.from({ length: count }, (_, i) => i) as item (item)}
    <div class="bx--search-menu-item bx--search-menu-item--skeleton">
      <SkeletonText width={widths[item % widths.length]} />
    </div>
  {/each}
</div>
