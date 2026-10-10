<script lang="ts">
  import SunburstChart from "carbon-components-svelte/viz/SunburstChart/SunburstChart.svelte";

  type Row = {
    id: string;
    parent: string | null;
    name: string;
    bytes?: number;
  };

  export let data: ReadonlyArray<Row> = [
    { id: "bundle", parent: null, name: "bundle" },
    { id: "src", parent: "bundle", name: "src" },
    { id: "viz", parent: "src", name: "viz", bytes: 400 },
    { id: "core", parent: "src", name: "core", bytes: 200 },
    { id: "vendor", parent: "bundle", name: "vendor", bytes: 400 },
  ];
  export let root: string | null = null;
  export let onselect: (detail: unknown) => void = () => {};
  export let onhover: (detail: unknown) => void = () => {};
</script>

<SunburstChart
  {data}
  id="id"
  parent="parent"
  value="bytes"
  label="name"
  title="Bundle composition"
  locale="en-US"
  diameter={200}
  bind:root
  data-testid="sunburst"
  on:select={(e) => {
    onselect(e.detail);
    root = e.detail.node.id;
  }}
  on:hover={(e) => onhover(e.detail)}
/>
<output data-testid="root">{root ?? ""}</output>
