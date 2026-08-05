<script lang="ts">
  import StructuredListSkeleton from "carbon-components-svelte/StructuredList/StructuredListSkeleton.svelte";
</script>

<StructuredListSkeleton
  data-testid="structured-list-skeleton"
  on:click={() => {
    console.log("click");
  }}
  on:mouseover={() => {
    console.log("mouseover");
  }}
  on:mouseenter={() => {
    console.log("mouseenter");
  }}
  on:mouseleave={() => {
    console.log("mouseleave");
  }}
  {...$$props}
/>
