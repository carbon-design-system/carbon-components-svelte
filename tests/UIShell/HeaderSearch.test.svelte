<svelte:options accessors />

<script lang="ts">
  import { HeaderSearch } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let active = false;
  export let value = "";
  export let selectedResultIndex = 0;
  export let results: ComponentProps<HeaderSearch>["results"] = [];

  let ref: ComponentProps<HeaderSearch>["ref"] = null;
  let activeEvent = false;
  let inactiveEvent = false;
  let clearEvent = false;
  let selectEvent: any = null;

  function handleActive() {
    activeEvent = true;
  }

  function handleInactive() {
    inactiveEvent = true;
  }

  function handleClear() {
    clearEvent = true;
  }

  function handleSelect(event: any) {
    selectEvent = event.detail;
  }
</script>

<HeaderSearch
  bind:ref
  bind:active
  bind:value
  bind:selectedResultIndex
  {results}
  on:active={handleActive}
  on:inactive={handleInactive}
  on:clear={handleClear}
  on:select={handleSelect}
  let:result
  let:index
>
  <div data-testid="result-{index}">{result.text}</div>
</HeaderSearch>

<div data-testid="active-event">{activeEvent}</div>
<div data-testid="inactive-event">{inactiveEvent}</div>
<div data-testid="clear-event">{clearEvent}</div>
<div data-testid="select-event">{JSON.stringify(selectEvent)}</div>
<div data-testid="ref-type">{ref ? "HTMLInputElement" : "null"}</div>
