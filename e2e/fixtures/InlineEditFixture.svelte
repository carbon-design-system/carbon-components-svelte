<script>
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import InlineEdit from "carbon-components-svelte/InlineEdit/InlineEdit.svelte";

  const labels = {
    editLabel: "Edit",
    saveLabel: "Save",
    cancelLabel: "Cancel",
  };

  const tables = [
    { size: "compact", fieldSize: "xs", rowHeight: 24 },
    { size: "short", fieldSize: "xs", rowHeight: 32 },
    { size: "medium", fieldSize: "sm", rowHeight: 40 },
    { size: undefined, fieldSize: "md", rowHeight: 48 },
    { size: "tall", fieldSize: "lg", rowHeight: 64 },
  ];

  const headers = [
    { key: "item", value: "Item" },
    { key: "qty", value: "Quantity" },
  ];
</script>

<div data-testid="states">
  <InlineEdit labelText="Project name" value="Q3 roadmap" {...labels} />
  <InlineEdit
    labelText="Invalid name"
    value=""
    invalid
    invalidText="Project name is required"
    {...labels}
  />
  <InlineEdit
    labelText="Read-only name"
    value="Archived"
    readonly
    readonlyToggletipText="Archived projects can't be renamed"
    {...labels}
  />
  <InlineEdit labelText="Disabled name" value="Locked" disabled {...labels} />
</div>

{#each tables as table}
  <div
    data-testid="table-{table.size ?? 'default'}"
    data-row-height={table.rowHeight}
  >
    <DataTable
      size={table.size}
      {headers}
      rows={[{ id: "a", item: "Widget", qty: 2 }]}
    >
      <svelte:fragment slot="cell" let:row let:cell>
        {#if cell.key === "item"}
          <InlineEdit
            size={table.fieldSize}
            labelText="Item name"
            value={row.item}
            {...labels}
          />
        {:else}
          {cell.value}
        {/if}
      </svelte:fragment>
    </DataTable>
  </div>
{/each}
