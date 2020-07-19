<script>
  export let story = undefined;
  export let noTrailingSlash = undefined;

  import Breadcrumb from "./Breadcrumb.svelte";
  import BreadcrumbItem from "./BreadcrumbItem.svelte";
  import BreadcrumbSkeleton from "./Breadcrumb.Skeleton.svelte";
</script>

{#if story === 'current page'}
  <Breadcrumb noTrailingSlash aria-label="Breadcrumb header">
    <BreadcrumbItem let:props>
      <a {...props} href="/#">Breadcrumb 1</a>
    </BreadcrumbItem>
    <BreadcrumbItem href="#">Breadcrumb 2</BreadcrumbItem>
    <BreadcrumbItem href="#" isCurrentPage>Breadcrumb 3</BreadcrumbItem>
  </Breadcrumb>
{:else if story === 'current page with aria-current'}
  <Breadcrumb noTrailingSlash>
    <BreadcrumbItem let:props>
      <a {...props} href="/#">Breadcrumb 1</a>
    </BreadcrumbItem>
    <BreadcrumbItem href="#">Breadcrumb 2</BreadcrumbItem>
    <BreadcrumbItem href="#" aria-current="page">Breadcrumb 3</BreadcrumbItem>
  </Breadcrumb>
{:else if story === 'skeleton'}
  <BreadcrumbSkeleton />
{:else}
  <Breadcrumb {noTrailingSlash}>
    <BreadcrumbItem let:props>
      <a {...props} href="/#">Breadcrumb 1</a>
    </BreadcrumbItem>
    <BreadcrumbItem href="#">Breadcrumb 2</BreadcrumbItem>
    <BreadcrumbItem href="#">Breadcrumb 3</BreadcrumbItem>
  </Breadcrumb>
{/if}
