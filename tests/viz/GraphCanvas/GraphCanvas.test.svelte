<script lang="ts">
  import GraphCanvas from "carbon-components-svelte/viz/GraphCanvas/GraphCanvas.svelte";

  type Node = { id: string; name: string; tier?: string };

  export let nodes: ReadonlyArray<Node> = [
    { id: "app", name: "app", tier: "edge" },
    { id: "api", name: "api", tier: "services" },
    { id: "web", name: "web", tier: "edge" },
    { id: "db", name: "postgres", tier: "data" },
    { id: "auth", name: "auth", tier: "services" },
  ];
  export let links = [
    { source: "app", target: "api" },
    { source: "app", target: "web" },
    { source: "api", target: "db" },
    { source: "api", target: "auth" },
    { source: "web", target: "auth" },
  ];
  export let withGroups = false;
  export let transform: { k: number; tx: number; ty: number } | null = null;
  export let collapsed: ReadonlyArray<string> = [];
  export let selected: string | null = null;
  export let onselect: (detail: unknown) => void = () => {};
  export let ontoggle: (detail: unknown) => void = () => {};
  export let onhover: (detail: unknown) => void = () => {};
  export let ontransform: (detail: unknown) => void = () => {};
</script>

<GraphCanvas
  {nodes}
  {links}
  id="id"
  label="name"
  group={withGroups ? "tier" : undefined}
  title="Service map"
  bind:transform
  bind:collapsed
  bind:selected
  data-testid="canvas"
  on:select={(e) => onselect(e.detail)}
  on:toggle={(e) => ontoggle(e.detail)}
  on:hover={(e) => onhover(e.detail)}
  on:transform={(e) => ontransform(e.detail)}
/>
<output data-testid="transform"
  >{transform
    ? `${transform.k},${transform.tx},${transform.ty}`
    : "fit"}</output
>
<output data-testid="collapsed">{collapsed.join(",")}</output>
<output data-testid="selected">{selected ?? ""}</output>
