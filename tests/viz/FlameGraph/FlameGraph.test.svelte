<script lang="ts">
  import FlameGraph from "carbon-components-svelte/viz/FlameGraph/FlameGraph.svelte";

  export let root: string | null = null;
  export let onselect: (detail: unknown) => void = () => {};
</script>

<FlameGraph
  data={[
    { id: "main", parent: null, fn: "main", ms: 100 },
    { id: "render", parent: "main", fn: "render", ms: 60 },
    { id: "layout", parent: "render", fn: "layout", ms: 35 },
    { id: "fetch", parent: "main", fn: "fetch", ms: 30 },
  ]}
  id="id"
  parent="parent"
  value="ms"
  label="fn"
  title="CPU profile"
  rowHeight={20}
  selectable
  bind:root
  data-testid="flame"
  on:select={(e) => {
    onselect(e.detail);
    root = e.detail.node.id;
  }}
/>
<output data-testid="root">{root ?? ""}</output>
