<script lang="ts">
  import NodeEditor from "carbon-components-svelte/viz/NodeEditor/NodeEditor.svelte";

  type Node = { id: string; name: string; x: number; y: number };
  type Edge = {
    source: string;
    target: string;
    sourcePort?: string;
    targetPort?: string;
  };

  export let nodes: Node[] = [
    { id: "src", name: "source", x: 0, y: 0 },
    { id: "map", name: "map", x: 240, y: 0 },
    { id: "sink", name: "sink", x: 480, y: 0 },
  ];
  export let edges: Edge[] = [{ source: "src", target: "map" }];
  export let refuse: string | null = null;
  export let readonly = false;
  export let edge: "straight" | "orthogonal" | "curved" = "orthogonal";
  export let ontransform: (detail: unknown) => void = () => {};
  export let selected = { nodes: [] as string[], edges: [] as string[] };
  export let onmove: (detail: unknown) => void = () => {};
  export let onconnect: (detail: unknown) => void = () => {};
  export let onremove: (detail: unknown) => void = () => {};
  export let onchange: (detail: unknown) => void = () => {};
  export let onselect: (detail: unknown) => void = () => {};
</script>

<NodeEditor
  bind:nodes
  bind:edges
  bind:selected
  id="id"
  label="name"
  {readonly}
  {edge}
  transform={{ k: 1, tx: 0, ty: 0 }}
  on:transform={(e) => ontransform(e.detail)}
  title="Pipeline"
  data-testid="editor"
  on:move={(e) => onmove(e.detail)}
  on:connect={(e) => {
    onconnect(e.detail);
    if (refuse && e.detail.target === refuse) e.preventDefault();
  }}
  on:remove={(e) => onremove(e.detail)}
  on:change={(e) => onchange(e.detail)}
  on:select={(e) => onselect(e.detail)}
/>
<output data-testid="nodes"
  >{nodes.map((n) => `${n.id}@${n.x},${n.y}`).join(" ")}</output
>
<output data-testid="edges"
  >{edges.map((e) => `${e.source}>${e.target}`).join(" ")}</output
>
<output data-testid="selected"
  >{[...selected.nodes, ...selected.edges].join(",")}</output
>
