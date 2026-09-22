<script lang="ts">
  import WaffleChart from "carbon-components-svelte/viz/WaffleChart/WaffleChart.svelte";

  export let data = [
    { id: "desktop", label: "Desktop", value: 52.5 },
    { id: "mobile", label: "Mobile", value: 31 },
    { id: "tablet", label: "Tablet", value: 11 },
    { id: "tv", label: "TV", value: 4 },
    { id: "watch", label: "Watch", value: 1.5 },
  ];
  export let selectedId: string | undefined = undefined;
  export let onselect: (detail: unknown) => void = () => {};
</script>

<WaffleChart {data} label="Sessions" data-testid="basic" />
<WaffleChart {data} legend={false} data-testid="decorative" />
<WaffleChart {data} data-testid="labelled" />
<WaffleChart {data} rows={2} columns={5} maxSegments={3} data-testid="small" />
<WaffleChart
  {data}
  selectable
  bind:selectedId
  label="Pick a device"
  data-testid="selectable"
  on:select={(e) => onselect(e.detail)}
/>
<output data-testid="selected">{selectedId ?? ""}</output>
