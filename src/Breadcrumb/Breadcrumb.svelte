<script>
  export let noTrailingSlash = false;
  export let skeleton = false;

  import BreadcrumbSkeleton from "./Breadcrumb.Skeleton.svelte";
</script>

{#if skeleton}
  <BreadcrumbSkeleton
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave />
{:else}
  <nav
    aria-label="Breadcrumb"
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave>
    <ol
      class:bx--breadcrumb={true}
      class:bx--breadcrumb--no-trailing-slash={noTrailingSlash}>
      <slot />
    </ol>
  </nav>
{/if}
