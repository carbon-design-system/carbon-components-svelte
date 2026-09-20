<script>
  /** Set to `true` to hide the separator after the last breadcrumb item */
  export let noTrailingSlash = false;

  /** Specify the number of breadcrumb items to render */
  export let count = 3;

  /**
   * Specify the size of the breadcrumb.
   * @type {"sm" | "md"}
   */
  export let size = "md";

  /** Specify the separator character rendered between breadcrumb items */
  export let separator = "/";
</script>

<div
  aria-hidden="true"
  class:bx--skeleton={true}
  class:bx--breadcrumb={true}
  class:bx--breadcrumb--no-trailing-slash={noTrailingSlash}
  class:bx--breadcrumb--sm={size === "sm"}
  style:--ccs-separator="'{separator}'"
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
