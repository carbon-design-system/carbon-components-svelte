<script lang="ts">
  import SearchMenu from "carbon-components-svelte/SearchMenu/SearchMenu.svelte";
  import SearchMenuGroup from "carbon-components-svelte/SearchMenu/SearchMenuGroup.svelte";
  import SearchMenuItem from "carbon-components-svelte/SearchMenu/SearchMenuItem.svelte";

  export let value = "docs";
</script>

<SearchMenu
  bind:value
  placeholder="Search..."
  labelText="Search"
  portal={false}
>
  <SearchMenuGroup label="Catalog results">
    <SearchMenuItem text="Data Store for Memcache" />
    <SearchMenuItem text="AT&T IoT Data Plans" />
  </SearchMenuGroup>

  <SearchMenuGroup divider>
    <SearchMenuItem
      persistent
      text={`Search "${value}" in Docs`}
      value="docs"
    />
  </SearchMenuGroup>
</SearchMenu>
