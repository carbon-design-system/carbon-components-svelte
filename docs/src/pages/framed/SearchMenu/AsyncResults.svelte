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

  // Simulate a server endpoint. Swap the body for a real `fetch()`.
  function fetchResults(query) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const q = query.toLowerCase();
        resolve(database.filter((record) => record.toLowerCase().includes(q)));
      }, 600);
    });
  }

  function resetResults() {
    results = [];
    loading = false;
  }

  // Fires immediately, before the debounce pause. Reset right away on an
  // empty value instead of waiting for the debounced `search`, so stale
  // results don't linger. Otherwise show loading as soon as typing starts.
  function handleInput(event) {
    if (event.target.value.trim() === "") {
      resetResults();
    } else {
      loading = true;
    }
  }

  // `search` fires only after typing pauses. `shouldFilter={false}` defers
  // filtering to the server; the client still highlights the query in
  // each result.
  async function handleSearch(query) {
    const trimmed = query.trim();
    if (trimmed === "") return;
    results = await fetchResults(trimmed);
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
  on:input={handleInput}
  on:search={(e) => handleSearch(e.detail)}
  on:clear={resetResults}
>
  {#each results as result (result)}
    <SearchMenuItem text={result} />
  {/each}
  <svelte:fragment slot="noResults">No results for "{value}"</svelte:fragment>
</SearchMenu>
