<script lang="ts">
  import type DataTableComponent from "carbon-components-svelte/DataTable/DataTable.svelte";
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import ToolbarSearch from "carbon-components-svelte/DataTable/ToolbarSearch.svelte";
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
    columnAlign?: "start" | "end";
    display?: (value: string | number | boolean) => string;
    sort?:
      | boolean
      | ((
          a: DataTableSortValue<BaseRow>,
          b: DataTableSortValue<BaseRow>,
        ) => number);
    sortAlways?: boolean;
    columnHidden?: boolean;
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
  export let stickyHeaderMaxHeight: ComponentProps<DataTable>["stickyHeaderMaxHeight"] =
    undefined;
  export let useStaticWidth = false;
  export let fixedLayout = false;
  export let expandable = false;
  export let batchExpansion = false;
  export let selectable = false;
  export let radio = false;
  export let allowDeselect = false;
  export let batchSelection = false;
  export let nonSelectableRowIds: ComponentProps<DataTable>["nonSelectableRowIds"] =
    [];
  export let nonExpandableRowIds: ComponentProps<DataTable>["nonExpandableRowIds"] =
    [];
  export let selectedRowIds: ComponentProps<DataTable>["selectedRowIds"] = [];
  export let expandedRowIds: ComponentProps<DataTable>["expandedRowIds"] = [];
  export let highlightedRowIds: ComponentProps<DataTable>["highlightedRowIds"] =
    [];
  export let inputForm: ComponentProps<DataTable>["inputForm"] = undefined;
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
    ((e: ComponentEvents<DataTableComponent>["sort"]) => void) | undefined =
    undefined;
  export let rowClass: ComponentProps<DataTable>["rowClass"] = undefined;
  export let cellClass: ComponentProps<DataTable>["cellClass"] = undefined;
  /** When true, `on:sort` calls preventDefault() so the table does not apply client-side sort. */
  export let preventSortDefault = false;
  /** Receives every forwarded click, hover, and scrollend event in dispatch order. */
  export let filterMode: ComponentProps<DataTable>["filterMode"] = "remove";
  /** When true, renders a row-filtering ToolbarSearch inside the table. */
  export let search = false;
  /** Receives `selectedRowIds` whenever it changes, including internal updates. */
  export let onselectedrowids:
    | ((selectedRowIds: ComponentProps<DataTable>["selectedRowIds"]) => void)
    | undefined = undefined;
  export let onevent: ((name: string, detail: unknown) => void) | undefined =
    undefined;

  $: onselectedrowids?.(selectedRowIds);
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
  {stickyHeaderMaxHeight}
  {useStaticWidth}
  {fixedLayout}
  {expandable}
  {batchExpansion}
  {selectable}
  {radio}
  {allowDeselect}
  {batchSelection}
  {nonSelectableRowIds}
  {nonExpandableRowIds}
  bind:selectedRowIds
  {expandedRowIds}
  {highlightedRowIds}
  {inputForm}
  {pageSize}
  {page}
  {rowClass}
  {cellClass}
  {sortKey}
  {sortDirection}
  {virtualize}
  {filterMode}
  bind:scrollContainerRef
  {tableHeaderTranslateWithId}
  on:click={(e) => onevent?.("click", e.detail)}
  on:click:header={(e) => onevent?.("click:header", e.detail)}
  on:click:row={(e) => onevent?.("click:row", e.detail)}
  on:click:cell={(e) => onevent?.("click:cell", e.detail)}
  on:click:header--expand={(e) => onevent?.("click:header--expand", e.detail)}
  on:click:header--select={(e) => onevent?.("click:header--select", e.detail)}
  on:click:row--expand={(e) => onevent?.("click:row--expand", e.detail)}
  on:click:row--select={(e) => onevent?.("click:row--select", e.detail)}
  on:mouseenter:row={(e) => onevent?.("mouseenter:row", e.detail)}
  on:mouseleave:row={(e) => onevent?.("mouseleave:row", e.detail)}
  on:scrollend={(e) => onevent?.("scrollend", e.detail)}
  on:sort={(e) => {
    onsort?.(e);
    if (preventSortDefault) e.preventDefault();
  }}
>
  {#if search}
    <Toolbar>
      <ToolbarContent>
        <ToolbarSearch persistent shouldFilterRows />
      </ToolbarContent>
    </Toolbar>
  {/if}
  <slot />
</DataTable>
