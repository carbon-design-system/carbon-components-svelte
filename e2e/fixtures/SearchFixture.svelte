<script>
  import { Search } from "carbon-components-svelte";

  let value = "";
</script>

<div class="fixture-container">
  <Search
    data-testid="search-query"
    labelText="Search"
    placeholder="Search..."
    bind:value
  />
</div>

<style>
  .fixture-container {
    padding: 2rem;
  }
</style>
