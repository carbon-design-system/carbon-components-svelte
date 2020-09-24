<script>
  export let story = undefined;

  import Pagination from "./Pagination.svelte";
  import PaginationSkeleton from "./Pagination.Skeleton.svelte";
</script>

<div style="width: 800px;">
  {#if story === 'multiple'}
    <Pagination {...$$props}>Pagination</Pagination>
    <Pagination {...$$props}>Pagination</Pagination>
  {:else if story === 'skeleton'}
    <PaginationSkeleton />
  {:else}
    <Pagination
      {...$$props}
      on:update="{({ detail }) => {
        console.log(detail);
      }}"
    >
      Pagination
    </Pagination>
  {/if}
</div>
