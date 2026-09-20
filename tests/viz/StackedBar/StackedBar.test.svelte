<script lang="ts">
  import StackedBar from "carbon-components-svelte/viz/StackedBar/StackedBar.svelte";

  export let data = [
    { id: "desktop", label: "Desktop", value: 50 },
    { id: "mobile", label: "Mobile", value: 30 },
    { id: "tablet", label: "Tablet", value: 15 },
    { id: "tv", label: "TV", value: 5 },
  ];
  export let selectedId: string | undefined = undefined;
  export let onselect: (detail: unknown) => void = () => {};
</script>

<StackedBar {data} label="Sessions" data-testid="basic" />
<StackedBar {data} data-testid="decorative" />
<StackedBar {data} labels="below" data-testid="labelled" />
<StackedBar
  {data}
  labels="below"
  valueType="value"
  format={{ style: "unit", unit: "percent" }}
  maxSegments={3}
  label="Folded"
  data-testid="folded"
/>
<StackedBar
  data={[
    { id: "ok", label: "Passed", value: 9, color: "success" },
    { id: "none", label: "Skipped", value: 0, color: 3 },
    { id: "bad", label: "Failed", value: 1, color: "#da1e28" },
  ]}
  size="sm"
  data-testid="colors"
/>
<StackedBar
  {data}
  labels="below"
  selectable
  bind:selectedId
  label="Pick a device"
  data-testid="selectable"
  on:select={(e) => onselect(e.detail)}
/>
<output data-testid="selected">{selectedId ?? ""}</output>
