<script lang="ts">
  import { PivotFieldList, PivotTable } from "carbon-components-svelte";
  import { onMount } from "svelte";
  import { makeSales, makeWide } from "./pivot-data";

  const fields = [
    { key: "region", label: "Region" },
    { key: "country", label: "Country" },
    { key: "product", label: "Product" },
    { key: "channel", label: "Channel" },
    { key: "year", label: "Year" },
    { key: "quarter", label: "Quarter" },
    { key: "amount", label: "Amount" },
    { key: "units", label: "Units" },
  ];
  const sales = makeSales(2000);
  const wide = makeWide(4000);

  let basicExpandedRows: string[] = [];
  let deep: PivotTable;
  const typed = fields.map((f) => ({
    ...f,
    type: ["amount", "units", "year"].includes(f.key)
      ? ("number" as const)
      : ("string" as const),
  }));
  let builder: Record<string, unknown> = {
    rows: ["region"],
    columns: ["year"],
    values: [{ field: "amount" }],
    filters: [],
  };
  let moves = "";
  let drilled = "";
  let toggles = "";

  onMount(() => deep.expandAll());
</script>

<div data-testid="basic">
  <PivotTable
    labelText="Sales by region"
    records={sales}
    {fields}
    size="short"
    height={360}
    bind:expandedRowIds={basicExpandedRows}
    config={{
      rows: ["region", "country"],
      columns: ["year"],
      values: [
        {
          field: "amount",
          format: {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          },
        },
      ],
    }}
    on:toggle:row={(e) =>
      (toggles += `${e.detail.label}:${e.detail.expanded};`)}
    on:drill={(e) =>
      (drilled = `${e.detail.rowPath.join("/")}|${e.detail.columnPath.join("/")}|${e.detail.records.length}`)}
  />
  <output data-testid="drilled">{drilled}</output>
  <output data-testid="toggles">{toggles}</output>
  <output data-testid="expanded">{basicExpandedRows.length}</output>
</div>

<div data-testid="multi">
  <PivotTable
    labelText="Amount and units"
    records={sales}
    {fields}
    size="short"
    height={320}
    config={{
      rows: ["region"],
      columns: ["year", "quarter"],
      values: [
        { field: "amount", aggregate: "sum" },
        {
          field: "units",
          aggregate: "avg",
          format: { maximumFractionDigits: 1 },
        },
      ],
    }}
  />
</div>

<div data-testid="deep">
  <PivotTable
    bind:this={deep}
    labelText="Four levels"
    records={sales}
    {fields}
    size="compact"
    height={320}
    config={{
      rows: ["region", "country", "product", "channel"],
      columns: ["year"],
      values: [{ field: "units" }],
    }}
  />
</div>

<div data-testid="wide">
  <PivotTable
    labelText="Fifty column groups"
    records={wide}
    size="short"
    height={320}
    rowHeaderWidth={200}
    config={{
      rows: ["team", "owner"],
      columns: ["group", "kind"],
      values: [{ field: "hours", format: { maximumFractionDigits: 0 } }],
    }}
  />
</div>

<div data-testid="builder">
  <PivotFieldList
    fields={typed}
    records={sales}
    bind:config={builder}
    on:move={(e) =>
      (moves += `${e.detail.field}:${e.detail.from}>${e.detail.to};`)}
  />
  <PivotTable
    labelText="Built pivot"
    records={sales}
    fields={typed}
    size="short"
    height={240}
    config={builder}
  />
  <output data-testid="moves">{moves}</output>
</div>
