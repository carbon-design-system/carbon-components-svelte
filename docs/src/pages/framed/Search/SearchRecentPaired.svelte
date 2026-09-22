<script>
  import { Search, SearchRecent, Stack } from "carbon-components-svelte";

  let value = "";
  let queries = ["Storage buckets", "Cloud functions"];
  let searchRef = null;

  function addQuery(query) {
    if (!query || queries.includes(query)) return;
    queries = [query, ...queries];
  }
</script>

<Stack gap={5}>
  <Search
    bind:value
    bind:ref={searchRef}
    labelText="Search catalog"
    on:keydown={(event) => {
      if (event.key === "Enter") addQuery(value);
    }}
  />
  <SearchRecent
    {queries}
    on:select={(event) => {
      value = event.detail.query;
      searchRef?.focus();
    }}
  />
</Stack>
