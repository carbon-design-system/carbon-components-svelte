<script lang="ts">
  import Search from "carbon-components-svelte/Search/Search.svelte";

  export let portalTooltip = false;
  export let expanded = false;
  export let disabled = false;
  export let hideTooltip = false;
  export let onParentKeydown: (event: KeyboardEvent) => void = () => {};
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div on:keydown={onParentKeydown}>
  <Search
    expandable
    bind:expanded
    {disabled}
    {portalTooltip}
    {hideTooltip}
    labelText="Search catalog"
  />
  <input aria-label="Other control" />
</div>
