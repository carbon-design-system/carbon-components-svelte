<script lang="ts">
  import ProgressIndicatorSkeleton from "carbon-components-svelte/ProgressIndicator/ProgressIndicatorSkeleton.svelte";
</script>

<ProgressIndicatorSkeleton
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
