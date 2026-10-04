<svelte:options accessors />

<script lang="ts">
  import HeaderSearch from "carbon-components-svelte/UIShell/HeaderSearch.svelte";
  import type { ComponentProps } from "svelte";

  export let results: ComponentProps<HeaderSearch>["results"] = [];
  export let onSelect: (detail: unknown) => void = () => {};
  export let onSubmit: (detail: unknown) => void = () => {};
  export let onClose: (detail: unknown) => void = () => {};

  export let value = "";
  export let active = true;
  export let selectedResultIndex = 0;
</script>

<HeaderSearch
  bind:value
  bind:active
  bind:selectedResultIndex
  {results}
  on:select={(e) => onSelect(e.detail)}
  on:submit={(e) => onSubmit(e.detail)}
  on:close={(e) => onClose(e.detail)}
/>
<a href="#main">Main content</a>
