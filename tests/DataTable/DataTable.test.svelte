<script lang="ts">
  import { DataTable } from "carbon-components-svelte";
  import type DataTableComponent from "carbon-components-svelte/DataTable/DataTable.svelte";
  import type { DataTableSortValue } from "carbon-components-svelte/DataTable/data-table-utils";
  import type { ComponentEvents, ComponentProps } from "svelte";

  type BaseRow = {
    id: string;
    [key: string]: string | number | boolean | Record<string, unknown>;
  };

  type DataTableHeader = {
    key: string;
    value: string;
    width?: string;
    minWidth?: string;
    display?: (value: string | number | boolean) => string;
    sort?:
      | false
      | ((
          a: DataTableSortValue<BaseRow>,
          b: DataTableSortValue<BaseRow>,
        ) => number);
    sortAlways?: boolean;
  };

  export let headers: readonly DataTableHeader[] = [
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
  ] as const;

  export let rows: readonly BaseRow[] = [
    {
      id: "a",
      name: "Load Balancer 3",
      protocol: "HTTP",
      port: 3000,
      rule: "Round robin",
    },
    {
      id: "b",
      name: "Load Balancer 1",
      protocol: "HTTP",
      port: 443,
      rule: "Round robin",
    },
    {
      id: "c",
      name: "Load Balancer 2",
      protocol: "HTTP",
      port: 80,
      rule: "DNS delegation",
    },
  ];

  export let title = "";
  export let description = "";
  export let size: ComponentProps<DataTable>["size"] = undefined;
  export let zebra = false;
  export let sortable = false;
  export let sortAlways = false;
  export let sort: ComponentProps<DataTable>["sort"] = undefined;
  export let stickyHeader = false;
  export let useStaticWidth = false;
  export let expandable = false;
  export let batchExpansion = false;
  export let selectable = false;
  export let radio = false;
  export let batchSelection = false;
  export let nonSelectableRowIds: ComponentProps<DataTable>["nonSelectableRowIds"] =
    [];
  export let nonExpandableRowIds: ComponentProps<DataTable>["nonExpandableRowIds"] =
    [];
  export let selectedRowIds: ComponentProps<DataTable>["selectedRowIds"] = [];
  export let expandedRowIds: ComponentProps<DataTable>["expandedRowIds"] = [];
  export let pageSize = 0;
  export let page = 0;
  export let sortKey: ComponentProps<DataTable>["sortKey"] = undefined;
  export let sortDirection: ComponentProps<DataTable>["sortDirection"] = "none";
  export let virtualize: ComponentProps<DataTable>["virtualize"] = undefined;
  export let scrollContainerRef: ComponentProps<DataTable>["scrollContainerRef"] =
    null;
  export let tableHeaderTranslateWithId: ComponentProps<DataTable>["tableHeaderTranslateWithId"] =
    undefined;
  export let onsort:
    | ((e: ComponentEvents<DataTableComponent>["sort"]) => void)
    | undefined = undefined;
  export let rowClass: ComponentProps<DataTable>["rowClass"] = undefined;
</script>

<DataTable
  {headers}
  {rows}
  {title}
  {description}
  {size}
  {zebra}
  {sortable}
  {sortAlways}
  {sort}
  {stickyHeader}
  {useStaticWidth}
  {expandable}
  {batchExpansion}
  {selectable}
  {radio}
  {batchSelection}
  {nonSelectableRowIds}
  {nonExpandableRowIds}
  {selectedRowIds}
  {expandedRowIds}
  {pageSize}
  {page}
  {rowClass}
  {sortKey}
  {sortDirection}
  {virtualize}
  bind:scrollContainerRef
  {tableHeaderTranslateWithId}
  on:click={(e) => {
    console.log("click", e.detail);
  }}
  on:click:header={(e) => {
    console.log("click:header", e.detail);
  }}
  on:click:row={(e) => {
    console.log("click:row", e.detail);
  }}
  on:click:cell={(e) => {
    console.log("click:cell", e.detail);
  }}
  on:mouseenter:row={(e) => {
    console.log("mouseenter:row", e.detail);
  }}
  on:mouseleave:row={(e) => {
    console.log("mouseleave:row", e.detail);
  }}
  on:sort={(e) => onsort?.(e)}
>
  <slot />
</DataTable>
