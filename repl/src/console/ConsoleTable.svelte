<script>
  /** console.table as a sortable Carbon DataTable; cells keep remote previews. */
  import DataTable from "carbon-components-svelte/src/DataTable/DataTable.svelte";
  import { previewText } from "./store.js";
  import ValuePreview from "./ValuePreview.svelte";

  /** @type {{ columns: string[]; rows: { index: string; cells: Record<string, any> }[]; truncated?: boolean }} */
  export let table;

  // Column names can contain dots, which DataTable reads as paths: use safe keys.
  $: headers = [
    { key: "index", value: "(index)" },
    ...table.columns.map((c, i) => ({ key: `c${i}`, value: c })),
  ];
  $: previews = new Map(
    table.rows.map((r) => [r.index, table.columns.map((c) => r.cells[c])]),
  );
  $: rows = table.rows.map((r) => {
    const row = { id: r.index, index: r.index };
    table.columns.forEach((c, i) => {
      row[`c${i}`] = r.cells[c] ? previewText(r.cells[c]) : "";
    });
    return row;
  });
</script>

<div class="console-table">
  <DataTable size="compact" sortable {headers} {rows}>
    <svelte:fragment slot="cell" let:row let:cell let:cellIndex>
      {#if cell.key === "index"}
        {cell.value}
      {:else if previews.get(row.id)?.[cellIndex - 1]}
        <ValuePreview value={previews.get(row.id)[cellIndex - 1]} nested />
      {/if}
    </svelte:fragment>
  </DataTable>
  {#if table.truncated}
    <p class="note">Showing the first 1,000 rows</p>
  {/if}
</div>

<style>
  .console-table {
    margin: 0.25rem 0;
    max-width: 100%;
    overflow-x: auto;
  }

  .note {
    font-size: 0.75rem;
    color: var(--cds-text-02, #525252);
  }
</style>
