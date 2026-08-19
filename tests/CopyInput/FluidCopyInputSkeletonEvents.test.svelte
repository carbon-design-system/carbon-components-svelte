<script lang="ts">
  import FluidCopyInputSkeleton from "carbon-components-svelte/CopyInput/FluidCopyInputSkeleton.svelte";
</script>

<FluidCopyInputSkeleton
  data-testid="fluid-copy-input-skeleton"
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
