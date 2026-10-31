<script lang="ts">
  import FilterChips from "carbon-components-svelte/viz/FilterChips/FilterChips.svelte";
  import { createDashboard } from "carbon-components-svelte/viz/utils/dashboard.js";

  export let onremove: (detail: unknown) => void = () => {};
  const board = createDashboard();
  board.filter("region", "EMEA");
  board.filter("product", "Cloud");
</script>

<FilterChips
  {board}
  labels={{ region: "Region" }}
  on:remove={(e) => onremove(e.detail)}
/>
<output data-testid="count">{$board.filters.length}</output>
