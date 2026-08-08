<script lang="ts">
  import FluidMultiSelectSkeleton from "carbon-components-svelte/MultiSelect/FluidMultiSelectSkeleton.svelte";
</script>

<FluidMultiSelectSkeleton
  data-testid="fluid-multi-select-skeleton"
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
