<svelte:options accessors />

<script lang="ts">
  import {
    Button,
    DataTable,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";
  import FilterRowsSpy from "./FilterRowsSpy.svelte";

  export let filterRowsCount = 0;

  const rows = Array.from({ length: 10 }).map((_, i) => ({
    id: i,
    name: `Load Balancer ${i + 1}`,
    rule: i % 2 ? "Round robin" : "DNS delegation",
  }));

  // Unrelated reactive state that should NOT cause re-filtering when toggled.
  let unrelated = 0;
</script>

<Button on:click={() => (unrelated += 1)}>Bump unrelated</Button>

<DataTable
  headers={[
    { key: "name", value: "Name" },
    { key: "rule", value: "Rule" },
  ]}
  {rows}
>
  <Toolbar>
    <ToolbarContent>
      <FilterRowsSpy bind:count={filterRowsCount}>
        <ToolbarSearch shouldFilterRows value="round" tabindex={unrelated} />
      </FilterRowsSpy>
    </ToolbarContent>
  </Toolbar>
</DataTable>
