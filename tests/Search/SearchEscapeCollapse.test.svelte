<script lang="ts">
  import Search from "carbon-components-svelte/Search/Search.svelte";
  import type { ComponentProps } from "svelte";

  export let expandable = true;
  export let expanded: ComponentProps<Search>["expanded"] = false;
  export let value: ComponentProps<Search>["value"] = "";
  export let onClear: () => void = () => {};
</script>

<Search
  {expandable}
  bind:expanded
  bind:value
  labelText="Search"
  placeholder="Search"
  closeButtonLabelText="Clear"
  on:clear={onClear}
/>
