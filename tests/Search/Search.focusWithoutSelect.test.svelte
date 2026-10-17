<script lang="ts">
  import Search from "carbon-components-svelte/Search/Search.svelte";

  export let value = "";
  export let selectTextOnFocus = false;

  let search: Search;
</script>

<Search
  bind:this={search}
  bind:value
  {selectTextOnFocus}
  labelText="Focus search"
  placeholder="Search"
/>

<button type="button" on:click={() => search.focusWithoutSelect()}>
  Focus without select
</button>
