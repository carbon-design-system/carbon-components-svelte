<svelte:options accessors />

<script lang="ts">
  import SearchMenuGroup from "carbon-components-svelte/SearchMenu/SearchMenuGroup.svelte";
  import SearchMenuItem from "carbon-components-svelte/SearchMenu/SearchMenuItem.svelte";
  import HeaderSearch from "carbon-components-svelte/UIShell/HeaderSearch.svelte";
  import type { ComponentProps } from "svelte";

  export let active = true;
  export let value = "";
  export let size: ComponentProps<HeaderSearch>["size"] = undefined;

  export let debounce: ComponentProps<HeaderSearch>["debounce"] = 0;
  export let onSelect: (detail: { value: string }) => void = () => {};
  export let onSubmit: (detail: { value: string }) => void = () => {};
  export let onClose: (detail: { trigger: string }) => void = () => {};
  export let onSearch: (value: string) => void = () => {};

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
  {debounce}
  on:select={(e) => onSelect(e.detail)}
  on:submit={(e) => onSubmit(e.detail)}
  on:close={(e) => onClose(e.detail)}
  on:search={(e) => onSearch(e.detail)}
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
