<script lang="ts">
  import { MultiAddSelect, Stack } from "carbon-components-svelte";
  import {
    buildCatalog,
    createCatalogSource,
  } from "../../../add-select-catalog";

  // Type "boom" to make the catalog fail, then use the retry button. The
  // request takes two seconds, so the loading state stays long enough to see.
  const slow = createCatalogSource(buildCatalog(), {
    latency: 2000,
    failOn: "boom",
  });

  let value: (string | number)[] = [];
</script>

<Stack gap={7}>
  <MultiAddSelect
    bind:value
    source={slow}
    labelText="Slow catalog"
    rootText="Catalog"
    commit="change"
  />
  <MultiAddSelect
    items={[]}
    labelText="Empty catalog"
    emptyText="No datasets are shared with this project yet."
    commit="change"
  />
</Stack>
