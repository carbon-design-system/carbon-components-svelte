<script lang="ts">
  import ArcDiagram from "carbon-components-svelte/viz/ArcDiagram/ArcDiagram.svelte";

  type Node = { id: string; name: string; bundle?: string };
  type Link = { from: string; to: string; n: number };

  export let nodes: ReadonlyArray<Node> = [
    { id: "a", name: "app", bundle: "core" },
    { id: "b", name: "button", bundle: "ui" },
    { id: "c", name: "config", bundle: "core" },
    { id: "d", name: "dialog", bundle: "ui" },
  ];
  export let links: ReadonlyArray<Link> = [
    { from: "a", to: "b", n: 1 },
    { from: "a", to: "d", n: 5 },
    { from: "c", to: "a", n: 3 },
  ];
  export let withGroups = false;
  export let directed = false;
  export let selected: string | null = null;
  export let onselect: (detail: unknown) => void = () => {};
  export let onhover: (detail: unknown) => void = () => {};
</script>

<ArcDiagram
  {nodes}
  {links}
  id="id"
  label="name"
  group={withGroups ? "bundle" : undefined}
  source="from"
  target="to"
  value="n"
  {directed}
  title="Module imports"
  bind:selected
  data-testid="arc"
  on:select={(e) => onselect(e.detail)}
  on:hover={(e) => onhover(e.detail)}
/>
<output data-testid="selected">{selected ?? ""}</output>
