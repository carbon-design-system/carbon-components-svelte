<script>
  export let story = undefined;

  import Search from "./Search.svelte";
  import SearchSkeleton from "./Search.Skeleton.svelte";

  let value = "";

  $: {
    if (!value.length) {
      console.log("cleared");
    } else {
      console.log("value", value);
    }
  }
</script>

<div>
  {#if story === 'skeleton'}
    <SearchSkeleton />
  {:else}
    <Search {...$$props} bind:value />
  {/if}
</div>
