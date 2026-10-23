<script>
  /** Specify the number of switches */
  export let count = 3;

  /**
   * Specify the size of the content switcher it stands in for.
   * Also accepts Carbon v11's `"md"` (the 40px default) and `"lg"` (`"xl"`).
   * @type {"sm" | "md" | "lg" | "xl"}
   */
  export let size = undefined;

  /** Set to `true` to stand in for icon-only switches */
  export let iconOnly = false;

  import { FIELD_SIZE_ALIASES, normalizeSize } from "../utils/size-aliases.js";

  $: effectiveSize = normalizeSize(size, FIELD_SIZE_ALIASES);
</script>

<div
  class:bx--content-switcher={true}
  class:bx--content-switcher--sm={effectiveSize === "sm"}
  class:bx--content-switcher--xl={effectiveSize === "xl"}
  class:bx--content-switcher--icon-only={iconOnly}
  class:bx--skeleton={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#each Array.from({ length: count }, (_, i) => i) as item (item)}
    <span class:bx--content-switcher__skeleton-switch={true}></span>
  {/each}
</div>
