<script lang="ts">
  import { MultiAddSelect } from "carbon-components-svelte";
  import { buildCatalog } from "../../../add-select-catalog";

  // With `searchScope="all"` a search always looks at every level, and each
  // result shows the path it lives at.
  const items = buildCatalog();

  let value: (string | number)[] = [];
</script>

<MultiAddSelect
  bind:value
  {items}
  searchScope="all"
  labelText="Datasets"
  rootText="Catalog"
  commit="change"
/>
