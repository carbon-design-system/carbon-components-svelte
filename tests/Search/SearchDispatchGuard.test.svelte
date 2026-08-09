<script lang="ts">
  import Search from "carbon-components-svelte/Search/Search.svelte";
  import type { ComponentProps } from "svelte";

  export let expanded: ComponentProps<Search>["expanded"] = false;
  export let onExpand: () => void = () => {};
  export let onCollapse: () => void = () => {};
</script>

<Search
  expandable
  bind:expanded
  labelText="Search"
  placeholder="Search"
  closeButtonLabelText="Clear"
  on:expand={onExpand}
  on:collapse={onCollapse}
/>
