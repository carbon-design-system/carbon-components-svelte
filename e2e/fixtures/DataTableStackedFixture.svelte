<script>
  import {
    Button,
    DataTable,
    OverflowMenu,
    OverflowMenuItem,
    Tag,
    Toolbar,
    ToolbarBatchActions,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";

  // `?w=320&stacked=auto&bp=md&f=select,sort,expand`. The page is the
  // container, so `w` sets the width of the box the table sits in.
  const params = new URLSearchParams(location.search);
  // The layout sweep opens the page with no query, so give it a table that
  // uses most of the features.
  const features = new Set(
    (
      params.get("f") ??
      "primary,actions,select,batch,sort,expand,zebra,toolbar"
    )
      .split(",")
      .filter(Boolean),
  );
  const width = params.get("w") ?? "100%";
  const stacked = params.get("stacked") ?? "auto";
  const breakpoint = params.get("bp") ?? "md";
  const size = params.get("size") ?? undefined;

  const has = (feature) => features.has(feature);

  const headers = [
    { key: "name", value: "Name", primary: has("primary") },
    { key: "protocol", value: "Protocol" },
    {
      key: "port",
      value: "Port",
      columnAlign: has("align") ? "end" : undefined,
      stackedLabel: has("stackedLabel") ? "Port number" : undefined,
    },
    { key: "status", value: "Status" },
    ...(has("hidden")
      ? [{ key: "rule", value: "Rule", stackedHidden: true }]
      : []),
    ...(has("hiddenColumn")
      ? [{ key: "owner", value: "Owner", columnHidden: true }]
      : []),
    ...(has("actions")
      ? [{ key: "overflow", empty: true, columnMenu: true, value: "Actions" }]
      : []),
  ];

  const rows = Array.from(
    { length: Number(params.get("rows") ?? 6) },
    (_, i) => ({
      id: `row-${i}`,
      name: `Load balancer ${i + 1}`,
      protocol: ["HTTP", "HTTPS", "TCP"][i % 3],
      port: 80 + i * 7,
      status: ["Active", "Disabled", "Pending"][i % 3],
      rule: `Rule ${i + 1}`,
      owner: "Team",
      description: `Details for load balancer ${i + 1}`,
    }),
  );

  let selectedRowIds = has("preselect") ? ["row-1"] : [];
  let sortKey = null;
  let sortDirection = "none";
  let expandedRowIds = [];
  let sortEvents = 0;
</script>

<div data-testid="stacked-root" style="width: {width};">
  <DataTable
    title="Load balancers"
    description="Listeners and their ports"
    {headers}
    {rows}
    {stacked}
    stackedBreakpoint={breakpoint}
    {size}
    sortable={has("sort")}
    zebra={has("zebra")}
    selectable={has("select") || has("batch")}
    batchSelection={has("batch")}
    radio={has("radio")}
    expandable={has("expand")}
    batchExpansion={has("batchExpand")}
    stickyHeader={has("sticky")}
    stickyHeaderMaxHeight={has("sticky") ? 240 : undefined}
    useStaticWidth={has("static")}
    fixedLayout={has("fixed")}
    virtualize={has("virtualize") ? { threshold: 1 } : undefined}
    pageSize={has("page") ? 3 : 0}
    page={1}
    highlightedRowIds={has("highlight") ? ["row-2"] : []}
    nonSelectableRowIds={has("nonSelectable") ? ["row-3"] : []}
    nonExpandableRowIds={has("nonExpandable") ? ["row-2"] : []}
    bind:selectedRowIds
    bind:sortKey
    bind:sortDirection
    bind:expandedRowIds
    on:sort={() => (sortEvents += 1)}
  >
    {#if has("toolbar")}
      <Toolbar>
        {#if has("batch")}
          <ToolbarBatchActions>
            <Button>Delete</Button>
          </ToolbarBatchActions>
        {/if}
        <ToolbarContent>
          <ToolbarSearch />
        </ToolbarContent>
      </Toolbar>
    {/if}
    <svelte:fragment slot="cell" let:cell let:row>
      {#if cell.key === "overflow"}
        <OverflowMenu flipped>
          <OverflowMenuItem text="Edit" />
          <OverflowMenuItem text="Delete" danger />
        </OverflowMenu>
      {:else if cell.key === "status" && has("cellSlot")}
        <Tag type={cell.value === "Active" ? "green" : "gray"}>{cell.value}</Tag
        >
      {:else}
        {cell.value}
      {/if}
    </svelte:fragment>
    <svelte:fragment slot="expandedRow" let:row>
      <p data-testid="expanded-detail">{row.description}</p>
    </svelte:fragment>
    <svelte:fragment slot="footerCell" let:header>
      {#if has("footer")}
        {header.value}
      {:else if header.key === "port"}
        Total
      {/if}
    </svelte:fragment>
  </DataTable>
  <output data-testid="sort-events">{sortEvents}</output>
  <output data-testid="selected">{selectedRowIds.join(",")}</output>
</div>
