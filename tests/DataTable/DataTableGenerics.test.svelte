<script lang="ts">
  import type {
    DataTableEmptyHeader,
    DataTableHeader,
    DataTableKey,
    DataTableNonEmptyHeader,
    DataTableRow,
  } from "carbon-components-svelte/DataTable/DataTable.svelte";
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";

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

  const discriminantHeaders = [
    { key: "name", value: "Name" },
    { key: "overflow", empty: true },
  ] as const satisfies ReadonlyArray<DataTableHeader<Row>>;

  function readHeader(h: DataTableHeader<Row>) {
    if (h.empty === true) {
      const _empty: DataTableEmptyHeader<Row> = h;
      return _empty.key;
    }
    const _nonEmpty: DataTableNonEmptyHeader<Row> = h;
    return _nonEmpty.value;
  }
  void readHeader;

  // @ts-expect-error
  const _badEmpty: DataTableEmptyHeader<Row> = { key: "x", empty: false };
  void _badEmpty;

  type ProductSortDetail =
    | { key: null; direction: "none" }
    | {
        key: DataTableKey<ProductRow>;
        direction: "ascending" | "descending";
      };

  function readSortDetail(detail: ProductSortDetail) {
    if (detail.direction === "none") {
      return detail.key;
    }
    return detail.key;
  }
  void readSortDetail;

  export let onRowSelect: ((row: Row) => void) | undefined = undefined;
  export let onNumericRowSelect: ((row: NumericRow) => void) | undefined =
    undefined;
  export let onProductRowClick: ((row: ProductRow) => void) | undefined =
    undefined;
  export let onProductRowExpand: ((row: ProductRow) => void) | undefined =
    undefined;
  export let onProductSort:
    ((e: CustomEvent<ProductSortDetail>) => void) | undefined = undefined;
</script>

<DataTable
  {headers}
  {rows}
  selectable
  batchSelection
  bind:selectedRowIds
  on:click:row--select={(e) => onRowSelect?.(e.detail.row)}
/>

<DataTable
  headers={numericHeaders}
  rows={numericRows}
  selectable
  batchSelection
  bind:selectedRowIds={numericSelectedRowIds}
  on:click:row--select={(e) => onNumericRowSelect?.(e.detail.row)}
/>

<DataTable
  headers={productHeaders}
  rows={productRows}
  sortable
  selectable
  expandable
  batchSelection
  batchExpansion
  bind:selectedRowIds={productSelectedRowIds}
  bind:expandedRowIds={productExpandedRowIds}
  on:click:row={(e) => onProductRowClick?.(e.detail.row)}
  on:click:row--expand={(e) => onProductRowExpand?.(e.detail.row)}
  on:sort={(e) => {
    readSortDetail(e.detail);
    onProductSort?.(e);
  }}
>
  <svelte:fragment slot="expandedRow" let:row>
    <p>Expanded content for {row.name}</p>
  </svelte:fragment>
</DataTable>

<DataTable
  headers={discriminantHeaders}
  rows={[{ id: "row-1", name: "Item" }]}
/>
