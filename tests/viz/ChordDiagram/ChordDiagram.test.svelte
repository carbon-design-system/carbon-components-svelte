<script lang="ts">
  import ChordDiagram from "carbon-components-svelte/viz/ChordDiagram/ChordDiagram.svelte";

  type Row = { from: string; to: string; n: number };

  export let data: ReadonlyArray<Row> = [
    { from: "Eng", to: "Design", n: 12 },
    { from: "Eng", to: "Sales", n: 4 },
    { from: "Design", to: "Eng", n: 8 },
    { from: "Sales", to: "Support", n: 3 },
    { from: "Support", to: "Eng", n: 2 },
  ];
  export let selected: string | null = null;
  export let onselect: (detail: unknown) => void = () => {};
  export let onhover: (detail: unknown) => void = () => {};
</script>

<ChordDiagram
  {data}
  source="from"
  target="to"
  value="n"
  title="Cross-team handoffs"
  bind:selected
  data-testid="chord"
  on:select={(e) => onselect(e.detail)}
  on:hover={(e) => onhover(e.detail)}
/>
<output data-testid="selected">{selected ?? ""}</output>
