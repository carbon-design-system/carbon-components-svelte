<svelte:options accessors />

<script lang="ts">
  import HeaderSearch from "carbon-components-svelte/UIShell/HeaderSearch.svelte";
  import type { ComponentProps } from "svelte";

  export let active = false;
  export let value = "";
  export let results: ComponentProps<HeaderSearch>["results"] = [];
  export let onClose: (e: CustomEvent<{ trigger: string }>) => void = () => {};
  export let onSelect: () => void = () => {};
</script>

<HeaderSearch
  bind:active
  bind:value
  {results}
  on:close={onClose}
  on:select={onSelect}
  let:result
  let:index
>
  <div data-testid="result-{index}">{result.text}</div>
</HeaderSearch>
