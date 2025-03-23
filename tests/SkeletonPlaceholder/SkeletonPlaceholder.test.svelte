<script lang="ts">
import { SkeletonPlaceholder } from "carbon-components-svelte";
</script>

<SkeletonPlaceholder
  data-testid="skeleton-placeholder"
  {...$$props}
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
