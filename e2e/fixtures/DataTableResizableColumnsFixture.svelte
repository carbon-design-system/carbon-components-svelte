<script>
  import { DataTable } from "carbon-components-svelte";

  // Options come from the query string: `batch`, `expandable`, `stickyHeader`,
  // `zebra`, `size=<name>`, `sortable`, `seed` (a saved layout), `rtl`, `rows=<count>`.
  const params = new URLSearchParams(location.search);
  const has = (name) => params.has(name);

  if (has("rtl")) document.documentElement.setAttribute("dir", "rtl");

  const headers = [
    { key: "name", value: "Name" },
    { key: "region", value: "Region", minWidth: "96px", maxWidth: 260 },
    { key: "service", value: "Service", width: "180px" },
    { key: "owner", value: "Owner", columnResizable: false },
    { key: "environment", value: "Environment" },
  ];

  const count = Number(params.get("rows") ?? 8);
  const rows = Array.from({ length: count }, (_, i) => ({
    id: `row-${i}`,
    name: `Load balancer ${i}`,
    region: "us-east-1",
    service: `payments-api-${i}`,
    owner: "platform-team",
    environment: "production",
  }));

  let columnWidths = has("seed")
    ? { name: 200, region: 120, service: 240, owner: 140, environment: 160 }
    : {};
  let log = [];
  let sorted = [];
</script>

<div data-testid="resizable-root" style="width: 640px; max-width: 100%;">
  <DataTable
    resizable
    {headers}
    {rows}
    sortable={has("sortable")}
    zebra={has("zebra")}
    size={params.get("size") ?? undefined}
    stickyHeader={has("stickyHeader")}
    stickyHeaderMaxHeight={has("stickyHeader") ? 240 : undefined}
    expandable={has("expandable")}
    batchSelection={has("batch")}
    bind:columnWidths
    on:resize={(event) => {
      log = [...log, event.detail];
    }}
    on:click:header={() => {
      sorted = [...sorted, "click:header"];
    }}
  />
</div>

<pre data-testid="resize-log">{JSON.stringify(log)}</pre>
<pre data-testid="widths">{JSON.stringify(columnWidths)}</pre>
<pre data-testid="header-clicks">{sorted.length}</pre>
