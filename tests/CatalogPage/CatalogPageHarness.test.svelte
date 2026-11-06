<script lang="ts">
  import CatalogPage from "../../docs/src/catalog-page/CatalogPage.svelte";
  import type {
    CatalogResult,
    CatalogSource,
  } from "../../docs/src/catalog-page/catalog-source.js";
  import type { CatalogState } from "../../docs/src/catalog-page/catalog-url.js";

  export let source: CatalogSource;
  export let url = "";
  export let initial:
    { state: CatalogState; result: CatalogResult } | undefined = undefined;
  export let pageSize = 24;
  export let virtualize = false;
  export let syncUrl = false;
</script>

<CatalogPage
  {source}
  {url}
  {initial}
  {pageSize}
  {virtualize}
  {syncUrl}
  loadMode="button"
/>
