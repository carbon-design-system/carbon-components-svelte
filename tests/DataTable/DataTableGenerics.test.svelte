<script lang="ts">
  import { DataTable } from "carbon-components-svelte";
  import type {
    DataTableHeader,
    DataTableRow,
  } from "carbon-components-svelte/DataTable/DataTable.svelte";

  const rows = [
    { id: "row-1", name: "Laptop", price: 999 },
    { id: "row-2", name: "Phone", price: 599 },
    { id: "row-3", name: "Desk", price: 299 },
  ] as const;

  type Row = (typeof rows)[number];

  const headers: ReadonlyArray<DataTableHeader<Row>> = [
    { key: "id", value: "ID" },
    { key: "name", value: "Name" },
    { key: "price", value: "Price" },
  ];

  let selectedRowIds: ReadonlyArray<Row["id"]> = ["row-1"];

  const numericRows = [
    { id: 1, name: "Item 1" },
    { id: 2, name: "Item 2" },
    { id: 3, name: "Item 3" },
  ] as const;

  type NumericRow = (typeof numericRows)[number];

  const numericHeaders: ReadonlyArray<DataTableHeader<NumericRow>> = [
    { key: "id", value: "ID" },
    { key: "name", value: "Name" },
  ];

  let numericSelectedRowIds: ReadonlyArray<NumericRow["id"]> = [1, 2];

  interface ProductRow extends DataTableRow<string> {
    name: string;
    price: number;
    inStock: boolean;
  }

  const productRows: ReadonlyArray<ProductRow> = [
    { id: "prod-1", name: "Widget", price: 10, inStock: true },
    { id: "prod-2", name: "Gadget", price: 20, inStock: false },
  ];

  const productHeaders: ReadonlyArray<DataTableHeader<ProductRow>> = [
    { key: "id", value: "ID" },
    { key: "name", value: "Name" },
    { key: "price", value: "Price" },
    { key: "inStock", value: "In Stock" },
  ];

  let productSelectedRowIds: ReadonlyArray<ProductRow["id"]> = ["prod-1"];
  let productExpandedRowIds: ReadonlyArray<ProductRow["id"]> = [];
</script>

<DataTable
  {headers}
  {rows}
  selectable
  batchSelection
  bind:selectedRowIds
  on:click:row--select={(e) => {
    // e.detail.row should be typed as Row
    const row = e.detail.row;
    console.log(row.id, row.name, row.price);
  }}
/>

<DataTable
  headers={numericHeaders}
  rows={numericRows}
  selectable
  batchSelection
  bind:selectedRowIds={numericSelectedRowIds}
  on:click:row--select={(e) => {
    // e.detail.row should be typed as NumericRow
    const row = e.detail.row;
    console.log(row.id, row.name);
  }}
/>

<DataTable
  headers={productHeaders}
  rows={productRows}
  selectable
  expandable
  batchSelection
  batchExpansion
  bind:selectedRowIds={productSelectedRowIds}
  bind:expandedRowIds={productExpandedRowIds}
  on:click:row={(e) => {
    // e.detail.row should be typed as ProductRow
    const row = e.detail.row;
    console.log(row.id, row.name, row.price, row.inStock);
  }}
  on:click:row--expand={(e) => {
    // e.detail.row should be typed as ProductRow
    const row = e.detail.row;
    console.log("Expanded:", row.id);
  }}
>
  <svelte:fragment slot="expanded-row" let:row>
    <p>Expanded content for {row.name}</p>
  </svelte:fragment>
</DataTable>
