<script>
  import { Search } from "carbon-components-svelte";

  let value = "";
  let valueExpandable = "";
  let expanded = false;
</script>

<Search
  data-testid="search-query"
  labelText="Search"
  placeholder="Search..."
  bind:value
/>

<Search
  data-testid="search-expandable"
  labelText="Expandable search"
  placeholder="Search..."
  expandable={true}
  bind:expanded
  bind:value={valueExpandable}
/>
