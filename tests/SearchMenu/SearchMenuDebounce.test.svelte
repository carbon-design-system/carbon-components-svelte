<script lang="ts">
  import SearchMenu from "carbon-components-svelte/SearchMenu/SearchMenu.svelte";
  import SearchMenuItem from "carbon-components-svelte/SearchMenu/SearchMenuItem.svelte";
  import type { ComponentProps } from "svelte";

  export let debounce: ComponentProps<SearchMenu>["debounce"] = 0;
  export let value = "";
  export let onSearch: (value: string) => void = () => {};

  const items = ["Databases for TestSQL", "Data Store for Memcache"];
</script>

<SearchMenu
  bind:value
  {debounce}
  placeholder="Search..."
  labelText="Search"
  closeButtonLabelText="Clear"
  on:search={(event) => {
    onSearch(event.detail);
  }}
>
  {#each items as text (text)}
    <SearchMenuItem {text} />
  {/each}
</SearchMenu>
