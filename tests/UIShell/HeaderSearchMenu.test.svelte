<svelte:options accessors />

<script lang="ts">
  import SearchMenuGroup from "carbon-components-svelte/SearchMenu/SearchMenuGroup.svelte";
  import SearchMenuItem from "carbon-components-svelte/SearchMenu/SearchMenuItem.svelte";
  import HeaderSearch from "carbon-components-svelte/UIShell/HeaderSearch.svelte";
  import type { ComponentProps } from "svelte";

  export let active = true;
  export let value = "";
  export let size: ComponentProps<HeaderSearch>["size"] = undefined;

  export let selected: { value: string; submitted: boolean } = {
    value: "",
    submitted: false,
  };
  export let closeTrigger = "";

  const items = [
    "Databases for TestSQL",
    "AT&T IoT Data Plans",
    "Data Store for Memcache",
    "HazardHub Property Risk Data API",
  ];
</script>

<HeaderSearch
  bind:active
  bind:value
  {size}
  on:select={(e) => (selected = { value: e.detail.value, submitted: false })}
  on:submit={(e) => (selected = { value: e.detail.value, submitted: true })}
  on:close={(e) => (closeTrigger = e.detail.trigger)}
>
  <svelte:fragment slot="menu">
    <SearchMenuGroup label="Results">
      {#each items as text (text)}
        <SearchMenuItem {text} />
      {/each}
    </SearchMenuGroup>

    <SearchMenuGroup divider>
      <SearchMenuItem persistent value="__all__" text="Search everywhere" />
    </SearchMenuGroup>
  </svelte:fragment>

  <svelte:fragment slot="noResults">No results</svelte:fragment>
</HeaderSearch>

<div data-testid="result">
  {selected.submitted ? "submit:" : ""}{selected.value}
</div>
<div data-testid="close">{closeTrigger}</div>
