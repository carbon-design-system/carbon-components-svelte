<script lang="ts">
  import Search from "carbon-components-svelte/Search/Search.svelte";
  import SearchMenuSkeleton from "carbon-components-svelte/SearchMenu/SearchMenuSkeleton.svelte";
</script>

<div class="bx--search-menu">
  <div class="bx--search-menu__search">
    <Search skeleton labelText="Search" />
    <SearchMenuSkeleton count={3} />
  </div>
</div>
