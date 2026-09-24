<script lang="ts">
  import SearchRecent from "../../src/Search/SearchRecent.svelte";

  export let queries: string[] = ["b", "a"];
  export let hideLabel = false;
</script>

<SearchRecent {queries} {hideLabel}>
  <button slot="action" type="button" on:click={() => console.log("clear all")}>
    Clear all
  </button>
</SearchRecent>
