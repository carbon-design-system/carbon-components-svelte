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

<div
  class:bx--search-menu__menu={true}
  class:bx--search-menu__menu--inline={true}
  class:bx--search-menu__menu--xs={size === "xs"}
  class:bx--search-menu__menu--sm={size === "sm"}
  class:bx--search-menu__menu--lg={size === "lg"}
  class:bx--search-menu__menu--xl={size === "xl"}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#each Array.from({ length: count }, (_, i) => i) as item (item)}
    <div
      class:bx--search-menu-item={true}
      class:bx--search-menu-item--skeleton={true}
    >
      <SkeletonText width={widths[item % widths.length]} />
    </div>
  {/each}
</div>
