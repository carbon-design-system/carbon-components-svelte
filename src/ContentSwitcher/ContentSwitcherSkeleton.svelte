<script>
  /** Specify the number of switches */
  export let count = 3;

  /**
   * Specify the size of the content switcher it stands in for.
   * @type {"sm" | "xl"}
   */
  export let size = undefined;

  /** Set to `true` to stand in for icon-only switches */
  export let iconOnly = false;
</script>

<div
  class:bx--content-switcher={true}
  class:bx--content-switcher--sm={size === "sm"}
  class:bx--content-switcher--xl={size === "xl"}
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
