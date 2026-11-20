<svelte:options accessors />

<script lang="ts">
  import PivotFieldList from "carbon-components-svelte/PivotTable/PivotFieldList.svelte";
  import type { PivotConfig } from "carbon-components-svelte/PivotTable/pivot.js";

  export let fields = [
    { key: "region", label: "Region" },
    { key: "year", label: "Year", type: "number" as const },
    { key: "amount", label: "Amount", type: "number" as const },
  ];
  export let config: PivotConfig = {
    rows: ["region"],
    values: [{ field: "amount" }],
  };
  export let records: Record<string, unknown>[] | undefined = undefined;
  export let prevent = false;
  export let events: string[] = [];
</script>

<PivotFieldList
  {fields}
  {records}
  bind:config
  on:move={(e) => {
    events = [
      ...events,
      `move:${e.detail.field}:${e.detail.from}>${e.detail.to}`,
    ];
    if (prevent) e.preventDefault();
  }}
  on:change={() => (events = [...events, "change"])}
/>
<output data-testid="config">{JSON.stringify(config)}</output>
