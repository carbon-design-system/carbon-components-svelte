<script>
  /** Specify the number of rows */
  export let count = 4;

  /**
   * Specify the size of the tree view it stands in for.
   * Also accepts Carbon v11's `"sm"` (`"default"`, 32px) and `"xs"`
   * (`"compact"`, 24px).
   * @type {"default" | "compact" | "sm" | "xs"}
   */
  export let size = "default";

  /** Set to `true` to leave out the label bar, as TreeView's `hideLabel` does */
  export let hideLabel = false;

  import {
    normalizeSize,
    TREE_VIEW_SIZE_ALIASES,
  } from "../utils/size-aliases.js";

  $: effectiveSize = normalizeSize(size, TREE_VIEW_SIZE_ALIASES);
</script>

<div
  class:bx--tree__skeleton={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if !hideLabel}
    <span class:bx--label={true} class:bx--skeleton={true}></span>
  {/if}
  <ul
    class:bx--tree={true}
    class:bx--tree--default={effectiveSize === "default"}
    class:bx--tree--compact={effectiveSize === "compact"}
    class:bx--skeleton={true}
  >
    {#each Array.from({ length: count }, (_, i) => i) as item (item)}
      <li class:bx--tree-node={true} class:bx--tree-leaf-node={true}>
        <div class:bx--tree-node__label={true}>
          <span class:bx--tree-node__skeleton={true}></span>
        </div>
      </li>
    {/each}
  </ul>
</div>
