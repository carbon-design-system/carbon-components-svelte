<script lang="ts">
  import PaginationSkeleton from "carbon-components-svelte/Pagination/PaginationSkeleton.svelte";
</script>

<PaginationSkeleton
  on:mouseover={() => {
    console.log("mouseover");
  }}
  on:mouseenter={() => {
    console.log("mouseenter");
  }}
  on:mouseleave={() => {
    console.log("mouseleave");
  }}
/>
