<script lang="ts">
  import { MultiAddSelect } from "carbon-components-svelte";
  import { buildCatalog, catalogFilters } from "../../../add-select-catalog";

  // All 10,000 items are in memory: the component searches, filters and pages
  // them itself.
  const items = buildCatalog();

  let value: (string | number)[] = [];
</script>

<MultiAddSelect
  bind:value
  {items}
  filters={catalogFilters}
  labelText="Datasets"
  rootText="Catalog"
  commit="change"
/>
<p>{value.length} chosen</p>
