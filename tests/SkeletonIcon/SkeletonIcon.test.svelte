<script lang="ts">
  import { SkeletonIcon } from "carbon-components-svelte";
</script>

<SkeletonIcon
  data-testid="skeleton-icon"
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
