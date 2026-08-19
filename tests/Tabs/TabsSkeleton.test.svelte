<script lang="ts">
  import TabsSkeleton from "carbon-components-svelte/Tabs/TabsSkeleton.svelte";
  import type { ComponentProps } from "svelte";

  export let count = 4;
  export let type: ComponentProps<TabsSkeleton>["type"] = "default";
</script>

<TabsSkeleton
  {count}
  {type}
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
