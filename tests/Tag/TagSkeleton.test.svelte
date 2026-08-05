<script lang="ts">
  import TagSkeleton from "carbon-components-svelte/Tag/TagSkeleton.svelte";
  import type { ComponentProps } from "svelte";

  export let size: ComponentProps<TagSkeleton>["size"] = "default";
</script>

<TagSkeleton
  {size}
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
