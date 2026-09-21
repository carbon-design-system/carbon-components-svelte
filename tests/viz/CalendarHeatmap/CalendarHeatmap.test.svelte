<script lang="ts">
  import CalendarHeatmap from "carbon-components-svelte/viz/CalendarHeatmap/CalendarHeatmap.svelte";

  type Row = { day: Date; commits: number };

  export let data: ReadonlyArray<Row> = [
    { day: new Date(2026, 0, 5), commits: 2 },
    { day: new Date(2026, 0, 5), commits: 3 },
    { day: new Date(2026, 0, 6), commits: 0 },
    { day: new Date(2026, 0, 12), commits: 10 },
  ];
  export let selectable = false;
  export let weekStart = 0;
  export let selected: string | null = null;
  export let onselect: (detail: unknown) => void = () => {};
</script>

<CalendarHeatmap
  {data}
  date="day"
  value="commits"
  year={2026}
  {weekStart}
  title="Contributions in 2026"
  locale="en-US"
  hue="teal"
  {selectable}
  bind:selected
  data-testid="calendar"
  on:select={(e) => onselect(e.detail)}
/>
<output data-testid="selected">{selected ?? ""}</output>
