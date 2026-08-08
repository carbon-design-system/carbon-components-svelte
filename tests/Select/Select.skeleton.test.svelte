<script lang="ts">
  import SelectSkeleton from "carbon-components-svelte/Select/SelectSkeleton.svelte";
</script>

<SelectSkeleton
  data-testid="select-skeleton"
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
