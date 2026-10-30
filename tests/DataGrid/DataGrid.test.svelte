<script lang="ts">
  import DataGrid from "carbon-components-svelte/DataGrid/DataGrid.svelte";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<DataGrid>;

  export let rows: Props["rows"] = [];
  export let columns: Props["columns"] = [];
  export let frozenRows = 0;
  export let frozenColumns = 0;
  export let rowHeaders = true;
  export let height = 320;
  export let size: Props["size"] = "short";
  export let dir: "ltr" | "rtl" | undefined = undefined;
  export let withButton = false;
  export let onPaste: ((event: CustomEvent) => void) | undefined = undefined;
  export let onCopy: ((event: CustomEvent) => void) | undefined = undefined;

  export let activeCell: Props["activeCell"] = { row: 0, column: 0 };
  export let selection: Props["selection"] = null;

  let grid: DataGrid;

  function handlePaste(event: CustomEvent) {
    onPaste?.(event);
  }

  function handleCopy(event: CustomEvent) {
    onCopy?.(event);
  }
</script>

<div {dir}>
  <DataGrid
    bind:this={grid}
    bind:activeCell
    bind:selection
    {columns}
    {rows}
    {frozenRows}
    {frozenColumns}
    {rowHeaders}
    {height}
    {size}
    labelText="Sales"
    {...$$restProps}
    on:paste={handlePaste}
    on:copy={handleCopy}
  >
    <svelte:fragment slot="cell" let:value let:rowIndex let:columnIndex>
      {#if withButton && rowIndex === 0 && columnIndex === 1}
        <button type="button">{value}</button>
      {:else}
        {value}
      {/if}
    </svelte:fragment>
  </DataGrid>
  <button type="button" on:click={() => grid.focusCell(40, 3)}
    >Go to cell</button
  >
  <output data-testid="active"
    >{activeCell ? `${activeCell.row},${activeCell.column}` : "none"}</output
  >
  <output data-testid="selection"
    >{selection
      ? `${selection.startRow},${selection.startColumn}:${selection.endRow},${selection.endColumn}`
      : "none"}</output
  >
</div>
