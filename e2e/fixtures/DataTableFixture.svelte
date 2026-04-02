<script>
  import { DataTable } from "carbon-components-svelte";

  const basicHeaders = [
    { key: "name", value: "Name" },
    { key: "value", value: "Value" },
  ];

  const basicRows = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    name: `Row ${i}`,
    value: `Value ${i}`,
  }));

  const sortHeaders = [
    { key: "name", value: "Name" },
    { key: "n", value: "N" },
  ];

  const sortRows = [
    { id: "s1", name: "Zebra", n: 1 },
    { id: "s2", name: "Alpha", n: 2 },
    { id: "s3", name: "Mike", n: 3 },
  ];

  const expandHeaders = [{ key: "name", value: "Name" }];

  const expandRows = [
    { id: "e1", name: "First" },
    { id: "e2", name: "Second" },
  ];

  const batchHeaders = [{ key: "name", value: "Product" }];

  const batchRows = [
    { id: "b1", name: "Item A" },
    { id: "b2", name: "Item B" },
  ];
</script>

<div data-testid="data-table-basic">
  <DataTable headers={basicHeaders} rows={basicRows} />
</div>

<div data-testid="data-table-sort">
  <DataTable sortable headers={sortHeaders} rows={sortRows} />
</div>

<div data-testid="data-table-expand">
  <DataTable expandable headers={expandHeaders} rows={expandRows}>
    <svelte:fragment slot="expandedRow" let:row>
      <p data-testid="expanded-detail">Extra row: {row.name}</p>
    </svelte:fragment>
  </DataTable>
</div>

<div data-testid="data-table-batch">
  <DataTable batchSelection headers={batchHeaders} rows={batchRows} />
</div>
