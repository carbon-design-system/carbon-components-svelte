<script lang="ts">
  import { DataTable } from "carbon-components-svelte";

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
          a: string | number | boolean,
          b: string | number | boolean,
        ) => number);
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
  export let size: "compact" | "short" | "medium" | "tall" | undefined =
    undefined;
  export let zebra = false;
  export let sortable = false;
  export let stickyHeader = false;
  export let useStaticWidth = false;
  export let expandable = false;
  export let batchExpansion = false;
  export let selectable = false;
  export let radio = false;
  export let batchSelection = false;
  export let nonSelectableRowIds: string[] = [];
  export let nonExpandableRowIds: string[] = [];
  export let selectedRowIds: string[] = [];
  export let expandedRowIds: string[] = [];
  export let pageSize = 0;
  export let page = 0;
  export let sortKey: string | undefined = undefined;
  export let sortDirection: "none" | "ascending" | "descending" = "none";
  export let virtualize:
    | undefined
    | boolean
    | {
        itemHeight?: number;
        maxVisibleRows?: number;
        containerHeight?: number;
        overscan?: number;
        threshold?: number;
        maxItems?: number;
      } = undefined;
  export let scrollContainerRef: HTMLDivElement | null = null;
  export let tableHeaderTranslateWithId: ((id: string) => string) | undefined =
    undefined;
  export let rowClass:
    | string
    | ((row: {
        row: BaseRow;
        rowIndex: number;
        selected: boolean;
        expanded: boolean;
      }) => string | undefined)
    | undefined = undefined;
</script>

<DataTable
  {headers}
  {rows}
  {title}
  {description}
  {size}
  {zebra}
  {sortable}
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
>
  <slot />
</DataTable>
