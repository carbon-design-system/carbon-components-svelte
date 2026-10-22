<script lang="ts">
  import HivePlot from "carbon-components-svelte/viz/HivePlot/HivePlot.svelte";

  type Node = { id: string; kind: string; load?: number };
  type Link = { from: string; to: string; rps: number };

  export let nodes: ReadonlyArray<Node> = [
    { id: "api", kind: "service", load: 80 },
    { id: "worker", kind: "service", load: 20 },
    { id: "pg", kind: "datastore", load: 50 },
    { id: "redis", kind: "datastore", load: 10 },
    { id: "jobs", kind: "queue", load: 30 },
  ];
  export let links: ReadonlyArray<Link> = [
    { from: "api", to: "pg", rps: 120 },
    { from: "api", to: "redis", rps: 300 },
    { from: "worker", to: "jobs", rps: 40 },
    { from: "jobs", to: "worker", rps: 40 },
    { from: "worker", to: "pg", rps: 15 },
  ];
  export let byLoad = false;
  export let selected: string | null = null;
  export let onselect: (detail: unknown) => void = () => {};
  export let onhover: (detail: unknown) => void = () => {};
</script>

<HivePlot
  {nodes}
  {links}
  id="id"
  axis="kind"
  position={byLoad ? "load" : undefined}
  source="from"
  target="to"
  value="rps"
  title="Runtime topology"
  bind:selected
  data-testid="hive"
  on:select={(e) => onselect(e.detail)}
  on:hover={(e) => onhover(e.detail)}
/>
<output data-testid="selected">{selected ?? ""}</output>
