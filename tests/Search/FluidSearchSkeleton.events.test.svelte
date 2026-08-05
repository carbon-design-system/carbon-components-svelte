<script lang="ts">
  import FluidSearchSkeleton from "carbon-components-svelte/Search/FluidSearchSkeleton.svelte";
</script>

<FluidSearchSkeleton
  data-testid="fluid-search-skeleton"
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
/>
