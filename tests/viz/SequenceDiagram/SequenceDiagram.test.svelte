<script lang="ts">
  import SequenceDiagram from "carbon-components-svelte/viz/SequenceDiagram/SequenceDiagram.svelte";

  type Row = { from: string; to: string; msg: string; kind?: string };

  export let data: ReadonlyArray<Row> = [
    { from: "client", to: "api", msg: "POST /orders" },
    { from: "api", to: "db", msg: "INSERT" },
    { from: "db", to: "api", msg: "row", kind: "return" },
    { from: "api", to: "api", msg: "audit" },
    { from: "api", to: "client", msg: "201", kind: "return" },
  ];
  export let onhover: (detail: unknown) => void = () => {};
  export let onselect: (detail: unknown) => void = () => {};
</script>

<SequenceDiagram
  {data}
  from="from"
  to="to"
  label="msg"
  kind="kind"
  title="Create an order"
  data-testid="sequence"
  on:hover={(e) => onhover(e.detail)}
  on:select={(e) => onselect(e.detail)}
/>
