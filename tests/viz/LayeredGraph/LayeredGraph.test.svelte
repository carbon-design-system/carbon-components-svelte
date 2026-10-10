<script lang="ts">
  import LayeredGraph from "carbon-components-svelte/viz/LayeredGraph/LayeredGraph.svelte";

  type Node = { id: string; name: string; tier?: string; health?: string };

  export let data: ReadonlyArray<Node> = [
    { id: "app", name: "app", tier: "edge", health: "success" },
    { id: "api", name: "api", tier: "services", health: "warning" },
    { id: "web", name: "web", tier: "edge" },
    { id: "db", name: "postgres", tier: "data", health: "error" },
    { id: "auth", name: "auth", tier: "services", health: "bogus" },
  ];
  export let links = [
    { source: "app", target: "api" },
    { source: "app", target: "web" },
    { source: "api", target: "db" },
    { source: "api", target: "auth" },
    { source: "web", target: "auth" },
    { source: "auth", target: "app" },
  ];
  export let withLanes = false;
  export let withGroups = false;
  export let withStatus = false;
  export let rankDir: "TB" | "LR" = "TB";
  export let edge: "straight" | "orthogonal" = "straight";
  export let collapsed: ReadonlyArray<string> = [];
  export let selected: string | null = null;
  export let onselect: (detail: unknown) => void = () => {};
  export let ontoggle: (detail: unknown) => void = () => {};
  export let onhover: (detail: unknown) => void = () => {};
</script>

<LayeredGraph
  {data}
  {links}
  id="id"
  label="name"
  lane={withLanes ? "tier" : undefined}
  lanes={withLanes ? ["edge", "services", "data"] : undefined}
  group={withGroups ? "tier" : undefined}
  status={withStatus ? "health" : undefined}
  {rankDir}
  {edge}
  title="Service dependencies"
  bind:collapsed
  bind:selected
  data-testid="graph"
  on:select={(e) => onselect(e.detail)}
  on:toggle={(e) => ontoggle(e.detail)}
  on:hover={(e) => onhover(e.detail)}
/>
<output data-testid="collapsed">{collapsed.join(",")}</output>
<output data-testid="selected">{selected ?? ""}</output>
