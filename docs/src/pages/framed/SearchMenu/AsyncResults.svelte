<script>
  import { SearchMenu, SearchMenuItem } from "carbon-components-svelte";

  let value = "";
  let results = [];
  let loading = false;

  const database = [
    "Databases for PostgreSQL",
    "Databases for MongoDB",
    "Databases for Redis",
    "Db2 on Cloud",
    "Data Store for Memcache",
    "Cloud Object Storage",
    "Watson Machine Learning",
    "Key Protect",
  ];

  // Simulate a server endpoint. The boolean predicate is the server-side match
  // decision -- swap the body for a real `fetch()`.
  function fetchResults(query) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const q = query.toLowerCase();
        resolve(database.filter((record) => record.toLowerCase().includes(q)));
      }, 600);
    });
  }

  // `debounce` fires `search` only after typing pauses; `shouldFilter={false}`
  // defers filtering to the server, while the client still highlights the
  // query within each returned result.
  async function handleSearch(query) {
    const trimmed = query.trim();
    if (trimmed === "") {
      // Backspacing to empty still waits out the debounce, so skip the
      // fetch instead of flashing a loading state for an empty query.
      results = [];
      loading = false;
      return;
    }
    loading = true;
    results = await fetchResults(trimmed);
    loading = false;
  }

  // Clearing is always instant, not debounced -- reset results immediately.
  function handleClear() {
    results = [];
    loading = false;
  }
</script>

<SearchMenu
  bind:value
  {loading}
  debounce={300}
  shouldFilter={false}
  labelText="Search"
  placeholder="Search..."
  on:search={(e) => handleSearch(e.detail)}
  on:clear={handleClear}
>
  {#each results as result (result)}
    <SearchMenuItem text={result} />
  {/each}
  <svelte:fragment slot="noResults">No results for "{value}"</svelte:fragment>
</SearchMenu>
