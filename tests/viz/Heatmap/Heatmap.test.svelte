<script lang="ts">
  import Heatmap from "carbon-components-svelte/viz/Heatmap/Heatmap.svelte";

  type Row = { day: string; block: string; requests: number };

  export let data: ReadonlyArray<Row> = [
    { day: "Mon", block: "AM", requests: 0 },
    { day: "Tue", block: "AM", requests: 10 },
    { day: "Mon", block: "PM", requests: 4 },
    { day: "Wed", block: "PM", requests: 6 },
  ];
  export let selectable = false;
  export let cellLabels = false;
  export let palette: "blue" | "red-cyan" = "blue";
  export let selected: { row: string; column: string } | null = null;
  export let onselect: (detail: unknown) => void = () => {};
</script>

<Heatmap
  {data}
  x="day"
  y="block"
  value="requests"
  title="Requests by day"
  rowHeader="Block"
  {palette}
  {selectable}
  {cellLabels}
  bind:selected
  data-testid="heatmap"
  on:select={(e) => onselect(e.detail)}
/>
<output data-testid="selected"
  >{selected ? `${selected.row}/${selected.column}` : ""}</output
>
