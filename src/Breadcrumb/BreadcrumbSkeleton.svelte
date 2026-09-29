<script>
  /**
   * @template [Separator=any]
   */

  /** Set to `true` to hide the separator after the last breadcrumb item */
  export let noTrailingSlash = false;

  /** Specify the number of breadcrumb items to render */
  export let count = 3;

  /**
   * Specify the size of the breadcrumb.
   * @type {"sm" | "md"}
   */
  export let size = "md";

  /**
   * Specify the orientation of the breadcrumb.
   * By default, items stack vertically below the `md` breakpoint
   * and lay out horizontally above it.
   * Set to `"vertical"` to always stack items, or `"horizontal"` to never stack them.
   * @type {"horizontal" | "vertical" | undefined}
   */
  export let orientation = undefined;

  /**
   * Specify the separator rendered between breadcrumb items.
   * A component reference renders as no separator in the skeleton state.
   * @type {string | Separator}
   */
  export let separator = /** @type {string | Separator} */ ("/");
</script>

<div
  aria-hidden="true"
  class:bx--skeleton={true}
  class:bx--breadcrumb={true}
  class:bx--breadcrumb--no-trailing-slash={noTrailingSlash}
  class:bx--breadcrumb--sm={size === "sm"}
  class:bx--breadcrumb--horizontal={orientation === "horizontal"}
  class:bx--breadcrumb--vertical={orientation === "vertical"}
  class:bx--breadcrumb--separator-icon={typeof separator !== "string"}
  style:--ccs-separator={typeof separator === "string"
    ? `'${separator}'`
    : "''"}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#each Array.from({ length: count }, (_, i) => i) as item (item)}
    <div class:bx--breadcrumb-item={true}>
      <span class:bx--link={true}>&nbsp;</span>
    </div>
  {/each}
</div>
