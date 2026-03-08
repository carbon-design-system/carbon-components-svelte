<script>
  import { Search } from "carbon-components-svelte";

  let value = "";
</script>

<Search
  data-testid="search-query"
  labelText="Search"
  placeholder="Search..."
  bind:value
/>
