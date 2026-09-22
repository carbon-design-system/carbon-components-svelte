<script lang="ts">
  import SearchMenuItem from "carbon-components-svelte/SearchMenu/SearchMenuItem.svelte";
  import HeaderSearch from "carbon-components-svelte/UIShell/HeaderSearch.svelte";
  import type { ComponentProps } from "svelte";

  export let debounce: ComponentProps<HeaderSearch>["debounce"] = 0;
  export let active = true;
  export let value = "";
  export let onSearch: (value: string) => void = () => {};

  const items = ["Databases for TestSQL", "Data Store for Memcache"];
</script>

<HeaderSearch
  bind:active
  bind:value
  {debounce}
  closeButtonLabelText="Clear"
  on:search={(event) => {
    onSearch(event.detail);
  }}
>
  <svelte:fragment slot="menu">
    {#each items as text (text)}
      <SearchMenuItem {text} />
    {/each}
  </svelte:fragment>
</HeaderSearch>
