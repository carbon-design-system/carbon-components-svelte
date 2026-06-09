<script lang="ts">
  import Search from "carbon-components-svelte/Search/Search.svelte";
  import SearchSkeleton from "carbon-components-svelte/Search/SearchSkeleton.svelte";
</script>

<Search skeleton labelText="Default skeleton" />

<Search size="lg" skeleton labelText="Large skeleton" />

<Search size="sm" skeleton labelText="Small skeleton" />

<SearchSkeleton hideLabel data-testid="skeleton-hide-label" />
