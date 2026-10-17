<script lang="ts">
  import Search from "carbon-components-svelte/Search/Search.svelte";

  export let fluid = false;
  export let disabled = false;
  export let labelText = "Expandable search";
  export let placeholder = "Search expandable...";
  export let onExpand: () => void = () => {};
  export let onCollapse: () => void = () => {};

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
  on:expand={onExpand}
  on:collapse={onCollapse}
/>

<div>Status: {expanded ? "expanded" : "collapsed"}</div>
