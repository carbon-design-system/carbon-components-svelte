<script lang="ts">
  import CatalogPage from "../../docs/src/catalog-page/CatalogPage.svelte";
  import { createMemorySource } from "../../docs/src/catalog-page/catalog-source.js";

  // ?n sizes the catalog, ?latency delays each query (ms), ?virtual=1 renders
  // only the rows in view, ?mode=button waits for "Load more", and ?size sets
  // the page size.
  const params = new URLSearchParams(window.location.search);
  const source = createMemorySource({
    size: Number(params.get("n") ?? 5000),
    latency: Number(params.get("latency") ?? 0),
  });
</script>

<div data-testid="fixture">
  <CatalogPage
    {source}
    syncUrl
    url={window.location.search}
    virtualize={params.get("virtual") === "1"}
    loadMode={params.get("mode") === "button" ? "button" : "infinite"}
    pageSize={Number(params.get("size") ?? 24)}
    itemHref={(item) => `/index.html#${item.id}`}
  />
</div>
