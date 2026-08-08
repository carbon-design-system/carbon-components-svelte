<script lang="ts">
  import ProgressIndicatorSkeleton from "carbon-components-svelte/ProgressIndicator/ProgressIndicatorSkeleton.svelte";
</script>

<ProgressIndicatorSkeleton
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
