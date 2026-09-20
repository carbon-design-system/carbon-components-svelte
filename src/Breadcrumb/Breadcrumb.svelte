<script>
  /** @extends {"./BreadcrumbSkeleton.svelte"} BreadcrumbSkeletonProps */

  /** Set to `true` to hide the separator after the last breadcrumb item */
  export let noTrailingSlash = false;

  /** Set to `true` to display skeleton state */
  export let skeleton = false;

  /** Specify the ARIA label for the nav */
  export let labelText = "Breadcrumb";

  /**
   * Specify the size of the breadcrumb.
   * @type {"sm" | "md"}
   */
  export let size = "md";

  /** Specify the separator character rendered between breadcrumb items */
  export let separator = "/";

  import BreadcrumbSkeleton from "./BreadcrumbSkeleton.svelte";
</script>

{#if skeleton}
  <BreadcrumbSkeleton
    {noTrailingSlash}
    {size}
    {separator}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  />
{:else}
  <nav
    aria-label={labelText}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <ol
      class:bx--breadcrumb={true}
      class:bx--breadcrumb--no-trailing-slash={noTrailingSlash}
      class:bx--breadcrumb--sm={size === "sm"}
      style:--ccs-separator="'{separator}'"
    >
      <slot />
    </ol>
  </nav>
{/if}
