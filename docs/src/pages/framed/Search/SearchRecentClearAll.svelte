<script>
  import { Link, Search, SearchRecent, Stack } from "carbon-components-svelte";

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
    removable
    on:select={(event) => {
      value = event.detail.query;
      searchRef?.focus();
    }}
    on:remove={(event) =>
      (queries = queries.filter((query) => query !== event.detail.query))}
  >
    <Link
      slot="action"
      href="#"
      on:click={(event) => {
        event.preventDefault();
        queries = [];
        searchRef?.focus();
      }}
    >
      Clear all
    </Link>
  </SearchRecent>
</Stack>
