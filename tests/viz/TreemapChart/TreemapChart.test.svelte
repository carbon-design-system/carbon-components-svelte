<script lang="ts">
  import TreemapChart from "carbon-components-svelte/viz/TreemapChart/TreemapChart.svelte";

  type Row = { team: string; service: string; cost: number };

  export let data: ReadonlyArray<Row> = [
    { team: "Platform", service: "compute", cost: 4000 },
    { team: "Platform", service: "storage", cost: 2000 },
    { team: "Data", service: "warehouse", cost: 3950 },
    { team: "Web", service: "cdn", cost: 50 },
  ];
  // A prop with a default cannot be set back to `undefined` from a test.
  export let grouped = true;
  export let selectable = false;
  export let valueType: "value" | "percent" | "none" = "value";
  export let selected: string | null = null;
  export let onselect: (detail: unknown) => void = () => {};
  export let onhover: (detail: unknown) => void = () => {};
</script>

<TreemapChart
  {data}
  value="cost"
  label="service"
  group={grouped ? "team" : undefined}
  title="Cloud spend"
  locale="en-US"
  {valueType}
  {selectable}
  bind:selected
  data-testid="treemap"
  on:select={(e) => onselect(e.detail)}
  on:hover={(e) => onhover(e.detail)}
/>
<output data-testid="selected">{selected ?? ""}</output>
