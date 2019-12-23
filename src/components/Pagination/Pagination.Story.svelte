<script>
  export let story = undefined;

  import Layout from '../../internal/ui/Layout.svelte';
  import Pagination from './Pagination.svelte';
  import PaginationSkeleton from './Pagination.Skeleton.svelte';
</script>

<Layout>
  <div style="width: 800px;">
    {#if story === 'multiple'}
      <Pagination {...$$props}>Pagination</Pagination>
      <Pagination {...$$props}>Pagination</Pagination>
    {:else if story === 'skeleton'}
      <PaginationSkeleton />
    {:else}
      <Pagination {...$$props}>Pagination</Pagination>
    {/if}
  </div>
</Layout>
