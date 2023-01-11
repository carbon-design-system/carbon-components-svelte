<script>
  /** @extends {"./BreadcrumbSkeleton.svelte"} BreadcrumbSkeletonProps */

  /** Set to `true` to hide the breadcrumb trailing slash */
  export let noTrailingSlash = false;

  /** Set to `true` to display skeleton state */
  export let skeleton = false;

  import BreadcrumbSkeleton from "./BreadcrumbSkeleton.svelte";
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
{#if skeleton}
  <BreadcrumbSkeleton
    noTrailingSlash="{noTrailingSlash}"
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  />
{:else}
  <nav
    aria-label="Breadcrumb"
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <ol
      class:bx--breadcrumb="{true}"
      class:bx--breadcrumb--no-trailing-slash="{noTrailingSlash}"
    >
      <slot />
    </ol>
  </nav>
{/if}
