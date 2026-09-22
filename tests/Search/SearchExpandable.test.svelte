<script lang="ts">
  import Search from "carbon-components-svelte/Search/Search.svelte";

  export let fluid = false;
  export let disabled = false;
  export let labelText = "Expandable search";
  export let placeholder = "Search expandable...";

  let expanded = false;
  let value = "";
</script>

<Search
  bind:expanded
  bind:value
  expandable
  {fluid}
  {disabled}
  {labelText}
  {placeholder}
  on:expand={() => {
    console.log("expanded");
  }}
  on:collapse={() => {
    console.log("collapsed");
  }}
/>

<div>Status: {expanded ? "expanded" : "collapsed"}</div>
