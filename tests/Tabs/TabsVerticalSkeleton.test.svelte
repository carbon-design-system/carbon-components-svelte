<script lang="ts">
  import TabsVerticalSkeleton from "carbon-components-svelte/Tabs/TabsVerticalSkeleton.svelte";

  export let count = 4;
</script>

<TabsVerticalSkeleton
  {count}
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
