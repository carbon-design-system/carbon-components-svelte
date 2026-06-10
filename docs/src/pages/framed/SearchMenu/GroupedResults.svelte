<script>
  import {
    Link,
    SearchMenu,
    SearchMenuGroup,
    SearchMenuItem,
  } from "carbon-components-svelte";
  import Catalog from "carbon-icons-svelte/lib/Catalog.svelte";
  import DataBase from "carbon-icons-svelte/lib/DataBase.svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";

  let value = "data";

  const resources = [
    {
      id: "res-pg-test",
      name: "Databases for PostgreSQL-Test",
      icon: DataBase,
    },
  ];
  const catalog = [
    { id: "cat-att-iot", name: "AT&T IoT Data Plans", icon: Catalog },
    { id: "cat-memcache", name: "Data Store for Memcache", icon: DataBase },
    {
      id: "cat-hazardhub",
      name: "HazardHub Property Risk Data API",
      icon: Catalog,
    },
    {
      id: "cat-financial",
      name: "Managed Financial Data API",
      icon: Catalog,
    },
  ];
</script>

<SearchMenu bind:value labelText="Search" placeholder="Search...">
  <SearchMenuGroup label="Resource results">
    <Link slot="action" href="/resources">View all</Link>
    {#each resources as item (item.id)}
      <SearchMenuItem
        text={item.name}
        value={item.id}
        icon={item.icon}
        href="#resource"
      />
    {/each}
  </SearchMenuGroup>

  <SearchMenuGroup label="Catalog results">
    <Link slot="action" href="/catalog">View all</Link>
    {#each catalog as item (item.id)}
      <SearchMenuItem
        text={item.name}
        value={item.id}
        icon={item.icon}
        href="#catalog"
      />
    {/each}
  </SearchMenuGroup>

  <SearchMenuGroup divider>
    <SearchMenuItem
      persistent
      iconRight={Launch}
      href="#support"
      text={`Search "${value}" in Support cases`}
    />
    <SearchMenuItem
      persistent
      iconRight={Launch}
      href="#docs"
      text={`Search "${value}" in Docs`}
    />
  </SearchMenuGroup>
</SearchMenu>
