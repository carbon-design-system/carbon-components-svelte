<script lang="ts">
  import FluidSelectSkeleton from "carbon-components-svelte/Select/FluidSelectSkeleton.svelte";
</script>

<FluidSelectSkeleton
  data-testid="fluid-select-skeleton"
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
