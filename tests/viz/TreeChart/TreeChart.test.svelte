<script lang="ts">
  import TreeChart from "carbon-components-svelte/viz/TreeChart/TreeChart.svelte";

  type Row = { id: string; parent: string | null; name: string };

  export let data: ReadonlyArray<Row> = [
    { id: "root", parent: null, name: "Company" },
    { id: "eng", parent: "root", name: "Engineering" },
    { id: "ops", parent: "root", name: "Operations" },
    { id: "web", parent: "eng", name: "Web" },
    { id: "api", parent: "eng", name: "API" },
  ];
  export let collapsed: ReadonlyArray<string> = [];
  export let onselect: (detail: unknown) => void = () => {};
  export let ontoggle: (detail: unknown) => void = () => {};
</script>

<TreeChart
  {data}
  id="id"
  parent="parent"
  label="name"
  title="Org chart"
  bind:collapsed
  on:select={(e) => onselect(e.detail)}
  on:toggle={(e) => ontoggle(e.detail)}
/>
<output data-testid="collapsed">{collapsed.join(",")}</output>
