<script lang="ts">
  import Link from "carbon-components-svelte/Link/Link.svelte";
  import SearchMenu from "carbon-components-svelte/SearchMenu/SearchMenu.svelte";
  import SearchMenuGroup from "carbon-components-svelte/SearchMenu/SearchMenuGroup.svelte";
  import SearchMenuItem from "carbon-components-svelte/SearchMenu/SearchMenuItem.svelte";

  export let value = "";
</script>

<SearchMenu
  bind:value
  placeholder="Search..."
  labelText="Search"
  portal={false}
>
  <SearchMenuGroup label="Recent searches" filter={false}>
    <SearchMenuItem text="virtual servers" />
    <SearchMenuItem text="vpc" />
  </SearchMenuGroup>

  <SearchMenuGroup label="Catalog results">
    <Link slot="action" href="/catalog">View all</Link>
    <SearchMenuItem text="Data Store for Memcache" href="#memcache" />
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
