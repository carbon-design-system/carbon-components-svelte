<script lang="ts">
  import Search from "carbon-components-svelte/Search/Search.svelte";
  import type { ComponentProps } from "svelte";

  export let debounce: ComponentProps<Search>["debounce"] = 0;
  export let value = "";
  export let onSearch: (value: string) => void = () => {};
</script>

<Search
  bind:value
  {debounce}
  labelText="Debounced search"
  placeholder="Search"
  closeButtonLabelText="Clear"
  on:search={(event) => {
    onSearch(event.detail);
  }}
/>
