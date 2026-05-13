<script>
  /** @extends {"./BreadcrumbSkeleton.svelte"} BreadcrumbSkeletonProps */

  /** Set to `true` to hide the breadcrumb trailing slash */
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

  import BreadcrumbSkeleton from "./BreadcrumbSkeleton.svelte";
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
{#if skeleton}
  <BreadcrumbSkeleton
    {noTrailingSlash}
    {size}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  />
{:else}
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
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
    >
      <slot />
    </ol>
  </nav>
{/if}
