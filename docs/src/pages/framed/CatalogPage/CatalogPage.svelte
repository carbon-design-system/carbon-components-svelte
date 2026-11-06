<script>
  // The pieces are drafts that the library does not export yet, so the
  // example imports them from their paths.
  import CatalogPage from "../../../catalog-page/CatalogPage.svelte";
  import { createMemorySource } from "../../../catalog-page/catalog-source.js";

  // 5,000 items, searched, filtered, sorted and paged by a cursor. A real
  // page passes a source that calls its own API.
  const source = createMemorySource({ size: 5000, latency: 150 });
</script>

<CatalogPage {source} />
