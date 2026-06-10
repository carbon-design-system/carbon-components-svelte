<script>
  import { SearchMenu, SearchMenuItem } from "carbon-components-svelte";

  let value = "Data";

  const resources = [
    { id: "svc-db-testsql", name: "Databases for TestSQL", disabled: false },
    { id: "svc-memcache", name: "Data Store for Memcache", disabled: true },
    {
      id: "svc-financial",
      name: "Managed Financial Data API",
      disabled: false,
    },
    {
      id: "svc-hazardhub",
      name: "HazardHub Property Risk Data API",
      disabled: true,
    },
  ];
</script>

<SearchMenu bind:value labelText="Search" placeholder="Search...">
  {#each resources as resource (resource.id)}
    <SearchMenuItem
      text={resource.name}
      value={resource.id}
      disabled={resource.disabled}
    />
  {/each}
</SearchMenu>
