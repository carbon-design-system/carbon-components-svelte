<script lang="ts">
  import DataTableSkeleton from "carbon-components-svelte/DataTable/DataTableSkeleton.svelte";
</script>

<DataTableSkeleton
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
