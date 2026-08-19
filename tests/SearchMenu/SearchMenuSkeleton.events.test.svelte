<script lang="ts">
  import SearchMenuSkeleton from "carbon-components-svelte/SearchMenu/SearchMenuSkeleton.svelte";
</script>

<SearchMenuSkeleton
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
