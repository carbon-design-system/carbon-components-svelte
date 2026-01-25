<script lang="ts">
  import {
    DataTable,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";
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

  let filteredRowIds: ReadonlyArray<Row["id"]> = [];
  let searchValue = "";

  const numericRows = [
    { id: 1, name: "Item 1", category: "Electronics" },
    { id: 2, name: "Item 2", category: "Furniture" },
    { id: 3, name: "Item 3", category: "Electronics" },
  ] as const;

  type NumericRow = (typeof numericRows)[number];

  const numericHeaders: ReadonlyArray<DataTableHeader<NumericRow>> = [
    { key: "id", value: "ID" },
    { key: "name", value: "Name" },
    { key: "category", value: "Category" },
  ];

  let numericFilteredRowIds: ReadonlyArray<NumericRow["id"]> = [];
  let numericSearchValue = "";

  interface ProductRow extends DataTableRow<string> {
    name: string;
    price: number;
    inStock: boolean;
  }

  const productRows: ReadonlyArray<ProductRow> = [
    { id: "prod-1", name: "Widget", price: 10, inStock: true },
    { id: "prod-2", name: "Gadget", price: 20, inStock: false },
    { id: "prod-3", name: "Thing", price: 15, inStock: true },
  ];

  const productHeaders: ReadonlyArray<DataTableHeader<ProductRow>> = [
    { key: "id", value: "ID" },
    { key: "name", value: "Name" },
    { key: "price", value: "Price" },
    { key: "inStock", value: "In Stock" },
  ];

  let productFilteredRowIds: ReadonlyArray<ProductRow["id"]> = [];
  let productSearchValue = "";

  const customProductFilter = (row: ProductRow, value: string | number) => {
    const search = String(value).toLowerCase();
    return (
      row.name.toLowerCase().includes(search) ||
      row.id.toLowerCase().includes(search)
    );
  };
</script>

<DataTable {headers} {rows}>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch
        bind:value={searchValue}
        shouldFilterRows
        bind:filteredRowIds
        on:input={(e) => {
          // filteredRowIds should be typed as ReadonlyArray<Row["id"]>
          // which is ReadonlyArray<"row-1" | "row-2" | "row-3">
          console.log("Filtered IDs:", filteredRowIds);
        }}
      />
    </ToolbarContent>
  </Toolbar>
</DataTable>

<div data-testid="filtered-ids-1">
  {JSON.stringify(filteredRowIds)}
</div>

<DataTable headers={numericHeaders} rows={numericRows}>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch
        bind:value={numericSearchValue}
        shouldFilterRows
        bind:filteredRowIds={numericFilteredRowIds}
        on:input={(e) => {
          // numericFilteredRowIds should be typed as ReadonlyArray<NumericRow["id"]>
          // which is ReadonlyArray<1 | 2 | 3>
          console.log("Numeric filtered IDs:", numericFilteredRowIds);
        }}
      />
    </ToolbarContent>
  </Toolbar>
</DataTable>

<div data-testid="filtered-ids-2">
  {JSON.stringify(numericFilteredRowIds)}
</div>

<DataTable headers={productHeaders} rows={productRows}>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch
        bind:value={productSearchValue}
        shouldFilterRows={customProductFilter}
        bind:filteredRowIds={productFilteredRowIds}
        on:input={(e) => {
          // productFilteredRowIds should be typed as ReadonlyArray<ProductRow["id"]>
          // which is ReadonlyArray<string>
          // customProductFilter receives ProductRow type, not DataTableRow<any>
          console.log("Product filtered IDs:", productFilteredRowIds);
        }}
      />
    </ToolbarContent>
  </Toolbar>
</DataTable>

<div data-testid="filtered-ids-3">
  {JSON.stringify(productFilteredRowIds)}
</div>
