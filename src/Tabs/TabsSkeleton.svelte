<script>
  /** Specify the number of tabs to render */
  export let count = 4;

  /**
   * Specify the type of tabs.
   * @type {"default" | "container"}
   */
  export let type = "default";

  /**
   * Specify the size to match a sized `Tabs`. Unset by default.
   * Line tabs (`type="default"`) support up to `"lg"`; container tabs
   * support up to `"xl"`. An out-of-range value clamps to the type's max.
   * @type {"sm" | "md" | "lg" | "xl"}
   */
  export let size = undefined;

  import { resolveTabsSize } from "../utils/resolve-tabs-size.js";

  $: maxSizeIndex = type === "container" ? 3 : 2;
  $: resolvedSize = resolveTabsSize(size, maxSizeIndex);
</script>

<div
  class:bx--tabs={true}
  class:bx--skeleton={true}
  class:bx--tabs--scrollable={true}
  class:bx--tabs--scrollable--container={type === "container"}
  class:bx--layout--size-sm={resolvedSize === "sm"}
  class:bx--layout--size-md={resolvedSize === "md"}
  class:bx--layout--size-lg={resolvedSize === "lg"}
  class:bx--layout--size-xl={resolvedSize === "xl"}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <ul class:bx--tabs--scrollable__nav={true}>
    {#each Array.from({ length: count }, (_, i) => i) as item (item)}
      <li class:bx--tabs--scrollable__nav-item={true}>
        <div class:bx--tabs__nav-link={true}><span></span></div>
      </li>
    {/each}
  </ul>
</div>
