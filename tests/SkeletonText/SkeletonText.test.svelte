<script lang="ts">
  import { SkeletonText } from "carbon-components-svelte";

  export let lines = 3;
  export let heading = false;
  export let paragraph = false;
  export let width = "100%";
</script>

<SkeletonText
  {lines}
  {heading}
  {paragraph}
  {width}
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
