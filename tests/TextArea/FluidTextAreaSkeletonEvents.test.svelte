<script lang="ts">
  import FluidTextAreaSkeleton from "carbon-components-svelte/TextArea/FluidTextAreaSkeleton.svelte";
</script>

<FluidTextAreaSkeleton
  data-testid="fluid-text-area-skeleton"
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
