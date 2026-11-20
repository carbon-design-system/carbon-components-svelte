<svelte:options accessors />

<script lang="ts">
  import PivotTable from "carbon-components-svelte/PivotTable/PivotTable.svelte";
  import type { ComponentProps } from "svelte";

  export let records: ComponentProps<PivotTable>["records"] = [
    { region: "EMEA", country: "France", year: 2023, amount: 10 },
    { region: "EMEA", country: "France", year: 2024, amount: 20 },
    { region: "EMEA", country: "Spain", year: 2024, amount: 30 },
    { region: "APAC", country: "Japan", year: 2023, amount: 40 },
  ];
  export let config: ComponentProps<PivotTable>["config"] = {
    rows: ["region", "country"],
    columns: ["year"],
    values: [{ field: "amount" }],
  };
  export let expandedRowIds: string[] = [];
  export let expandedColumnIds: string[] = [];
  export let drillDown = true;
  export let maxCells: number | undefined = undefined;
  export let events: string[] = [];
  export let prevent = false;
  export let table: PivotTable | undefined = undefined;
</script>

<PivotTable
  bind:this={table}
  {records}
  {config}
  {drillDown}
  {...maxCells ? { maxCells } : {}}
  bind:expandedRowIds
  bind:expandedColumnIds
  labelText="Sales"
  on:toggle:row={(e) =>
    (events = [...events, `row:${e.detail.label}:${e.detail.expanded}`])}
  on:toggle:column={(e) =>
    (events = [...events, `column:${e.detail.label}:${e.detail.expanded}`])}
  on:drill={(e) => {
    events = [
      ...events,
      `drill:${e.detail.rowPath.join("/")}|${e.detail.columnPath.join("/")}|${e.detail.records.length}`,
    ];
    if (prevent) e.preventDefault();
  }}
  on:pivot:error={(e) => (events = [...events, `error:${e.detail.error.name}`])}
/>
<output data-testid="rows">{expandedRowIds.length}</output>
