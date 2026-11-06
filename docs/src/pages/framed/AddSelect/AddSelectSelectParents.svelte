<script lang="ts">
  import { MultiAddSelect } from "carbon-components-svelte";
  import { buildCatalog } from "../../../add-select-catalog";

  // A schema can be chosen as a whole, or opened to choose its datasets.
  const items = buildCatalog();

  let value: (string | number)[] = ["d0"];
</script>

<MultiAddSelect
  bind:value
  {items}
  selectParents
  labelText="Datasets"
  rootText="Catalog"
  commit="change"
/>
