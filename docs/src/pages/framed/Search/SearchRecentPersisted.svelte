<script>
  import {
    Button,
    Link,
    LocalStorage,
    Search,
    SearchRecent,
    Stack,
  } from "carbon-components-svelte";
  import { addRecentQuery } from "carbon-components-svelte/src/Search/SearchRecent.svelte";

  const initialQueries = ["Storage buckets", "Cloud functions"];
  const MAX_QUERIES = 5;

  let value = "";
  let queries = [...initialQueries];
  let searchRef = null;

  function addQuery(query) {
    queries = addRecentQuery(queries, query, { max: MAX_QUERIES });
  }

  function resetDemo() {
    value = "";
    queries = [...initialQueries];
    searchRef?.focus();
  }
</script>

<Stack gap={5}>
  <LocalStorage key="search-recent-demo" bind:value={queries} />
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
  {#if queries.length === 0}
    <div>
      <Button kind="ghost" size="small" on:click={resetDemo}>
        Reset demo
      </Button>
    </div>
  {/if}
</Stack>
