<script lang="ts">
  import HeaderSearch from "carbon-components-svelte/UIShell/HeaderSearch.svelte";
  import type { ComponentProps } from "svelte";

  export let debounce: ComponentProps<HeaderSearch>["debounce"] = 0;
  export let active = true;
  export let value = "";
  export let onSearch: (value: string) => void = () => {};

  const results = [
    { id: "1", href: "#", text: "Result 1" },
    { id: "2", href: "#", text: "Result 2" },
  ];
</script>

<HeaderSearch
  bind:active
  bind:value
  {debounce}
  {results}
  closeButtonLabelText="Clear"
  on:search={(event) => {
    onSearch(event.detail);
  }}
/>
