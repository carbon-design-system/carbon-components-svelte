<script lang="ts">
  import IcicleChart from "carbon-components-svelte/viz/IcicleChart/IcicleChart.svelte";

  type Row = {
    id: string;
    parent: string | null;
    name: string;
    bytes?: number;
  };

  export let data: ReadonlyArray<Row> = [
    { id: "bundle", parent: null, name: "bundle" },
    { id: "src", parent: "bundle", name: "src" },
    { id: "viz", parent: "src", name: "viz", bytes: 410 },
    { id: "core", parent: "src", name: "core", bytes: 230 },
    { id: "vendor", parent: "bundle", name: "vendor", bytes: 380 },
    { id: "assets", parent: "bundle", name: "assets" },
    { id: "css", parent: "assets", name: "css", bytes: 60 },
    { id: "img", parent: "assets", name: "img", bytes: 120 },
  ];
  export let orientation: "top" | "bottom" = "top";
  export let root: string | null = null;
  export let selectable = false;
  export let selected: string | null = null;
  export let valueType: "value" | "percent" | "none" = "value";
  export let onselect: (detail: unknown) => void = () => {};
  export let onhover: (detail: unknown) => void = () => {};
</script>

<IcicleChart
  {data}
  id="id"
  parent="parent"
  value="bytes"
  label="name"
  title="Bundle composition"
  locale="en-US"
  rowHeight={20}
  {orientation}
  {valueType}
  {selectable}
  bind:root
  bind:selected
  data-testid="icicle"
  on:select={(e) => onselect(e.detail)}
  on:hover={(e) => onhover(e.detail)}
/>
<output data-testid="root">{root ?? ""}</output>
<output data-testid="selected">{selected ?? ""}</output>
