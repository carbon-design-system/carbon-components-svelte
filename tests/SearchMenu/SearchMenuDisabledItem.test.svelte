<script lang="ts">
  import SearchMenu from "carbon-components-svelte/SearchMenu/SearchMenu.svelte";
  import SearchMenuItem from "carbon-components-svelte/SearchMenu/SearchMenuItem.svelte";

  export let onSelect: (value: string) => void = () => {};
</script>

<SearchMenu
  placeholder="Search..."
  labelText="Search"
  on:select={(e) => onSelect(e.detail.value)}
>
  <SearchMenuItem text="Enabled item" />
  <SearchMenuItem text="Disabled item" disabled />
</SearchMenu>
