<script lang="ts">
  import Search from "carbon-components-svelte/Search/Search.svelte";

  export let fluid = false;

  let expanded = false;
  let value = "";
</script>

<Search
  bind:expanded
  bind:value
  expandable
  {fluid}
  labelText="Expandable search"
  placeholder="Search expandable..."
  on:expand={() => {
    console.log("expanded");
  }}
  on:collapse={() => {
    console.log("collapsed");
  }}
/>

<div>Status: {expanded ? "expanded" : "collapsed"}</div>
