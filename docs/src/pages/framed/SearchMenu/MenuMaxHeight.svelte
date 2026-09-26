<script>
  import { SearchMenu, SearchMenuItem } from "carbon-components-svelte";

  const services = [
    "Databases for PostgreSQL",
    "Databases for MongoDB",
    "Databases for Redis",
    "Databases for Elasticsearch",
    "Db2 on Cloud",
    "Data Store for Memcache",
    "Cloud Object Storage",
    "Watson Machine Learning",
    "Key Protect",
    "Secrets Manager",
    "Certificate Manager",
    "Activity Tracker",
  ];
</script>

<SearchMenu menuMaxHeight={200} labelText="Search" placeholder="Search...">
  {#each services as service (service)}
    <SearchMenuItem text={service} />
  {/each}
</SearchMenu>
