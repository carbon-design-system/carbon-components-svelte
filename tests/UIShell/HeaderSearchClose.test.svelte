<svelte:options accessors />

<script lang="ts">
  import type { ComponentProps } from "svelte";
  import HeaderSearch from "../../src/UIShell/HeaderSearch.svelte";

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
