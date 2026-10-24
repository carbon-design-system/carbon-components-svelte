<script lang="ts">
  import SearchSkeleton from "carbon-components-svelte/Search/SearchSkeleton.svelte";
</script>

<SearchSkeleton
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
