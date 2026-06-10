<script>
  import { Search, SearchMenuSkeleton } from "carbon-components-svelte";
</script>

<div class="bx--search-menu">
  <div class="bx--search-menu__search">
    <Search skeleton labelText="Search" placeholder="Search..." />
    <SearchMenuSkeleton />
  </div>
</div>
