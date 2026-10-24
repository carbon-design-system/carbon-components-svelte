<script>
  /**
   * Specify the size of the search menu.
   * Also accepts Carbon v11's `"md"` (`"lg"`, 40px). `"lg"` keeps this
   * library's 40px; Carbon v11's 48px `lg` is `"xl"` here.
   * @type {"xs" | "sm" | "md" | "lg" | "xl"}
   */
  export let size = "lg";

  /** Specify the number of skeleton menu items to render */
  export let count = 4;

  import SkeletonText from "../SkeletonText/SkeletonText.svelte";
  import { normalizeSize, SEARCH_SIZE_ALIASES } from "../utils/size-aliases.js";

  const widths = ["75%", "90%", "65%", "80%"];

  $: effectiveSize = normalizeSize(size, SEARCH_SIZE_ALIASES);
</script>

<div
  class:bx--search-menu__menu={true}
  class:bx--search-menu__menu--inline={true}
  class:bx--search-menu__menu--xs={effectiveSize === "xs"}
  class:bx--search-menu__menu--sm={effectiveSize === "sm"}
  class:bx--search-menu__menu--lg={effectiveSize === "lg"}
  class:bx--search-menu__menu--xl={effectiveSize === "xl"}
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
