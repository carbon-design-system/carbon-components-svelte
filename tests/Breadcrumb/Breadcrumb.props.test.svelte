<script lang="ts">
  import Breadcrumb from "carbon-components-svelte/Breadcrumb/Breadcrumb.svelte";
  import BreadcrumbItem from "carbon-components-svelte/Breadcrumb/BreadcrumbItem.svelte";

  /** Also render a skeleton that takes the same props. */
  export let withSkeleton = false;
</script>

<Breadcrumb {...$$restProps}>
  <BreadcrumbItem href="/">Home</BreadcrumbItem>
  <BreadcrumbItem href="/settings" isCurrentPage>Settings</BreadcrumbItem>
</Breadcrumb>
{#if withSkeleton}
  <Breadcrumb skeleton count={2} {...$$restProps} />
{/if}
