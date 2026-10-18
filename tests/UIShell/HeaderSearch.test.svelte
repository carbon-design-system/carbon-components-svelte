<svelte:options accessors />

<script lang="ts">
  import HeaderSearch from "carbon-components-svelte/UIShell/HeaderSearch.svelte";
  import type { ComponentEvents, ComponentProps } from "svelte";

  export let active = false;
  export let value = "";
  export let selectedResultIndex = 0;
  export let results: ComponentProps<HeaderSearch>["results"] = [];

  export let ref: ComponentProps<HeaderSearch>["ref"] = null;
  export let onActive: () => void = () => {};
  export let onInactive: () => void = () => {};
  export let onClear: () => void = () => {};
  export let onSelect: (
    detail: ComponentEvents<HeaderSearch>["select"]["detail"],
  ) => void = () => {};
</script>

<HeaderSearch
  bind:ref
  bind:active
  bind:value
  bind:selectedResultIndex
  {results}
  {...$$restProps}
  on:active={() => onActive()}
  on:inactive={() => onInactive()}
  on:clear={() => onClear()}
  on:select={(e) => onSelect(e.detail)}
  let:result
  let:index
  let:selected
>
  <div data-testid="result-{index}" data-selected={selected}>{result.text}</div>
</HeaderSearch>
