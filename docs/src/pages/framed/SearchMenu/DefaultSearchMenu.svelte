<script>
  import { SearchMenu, SearchMenuItem } from "carbon-components-svelte";

  let value = "Data";

  const resources = [
    { id: "svc-db-testsql", name: "Databases for TestSQL" },
    { id: "svc-att-iot", name: "AT&T IoT Data Plans" },
    { id: "svc-memcache", name: "Data Store for Memcache" },
    { id: "svc-hazardhub", name: "HazardHub Property Risk Data API" },
    { id: "svc-financial", name: "Managed Financial Data API" },
  ];
</script>

<SearchMenu bind:value labelText="Search" placeholder="Search...">
  {#each resources as resource (resource.id)}
    <SearchMenuItem
      text={resource.name}
      value={resource.id}
      on:select={(e) => console.log("select", e.detail)}
    />
  {/each}
</SearchMenu>
