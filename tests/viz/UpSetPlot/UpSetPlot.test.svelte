<script lang="ts">
  import UpSetPlot from "carbon-components-svelte/viz/UpSetPlot/UpSetPlot.svelte";

  type Row = { id: number; tags: string[] };

  export let data: ReadonlyArray<Row> = [
    { id: 1, tags: ["a", "b", "c"] },
    { id: 2, tags: ["a", "b", "c"] },
    { id: 3, tags: ["a", "b"] },
    { id: 4, tags: ["a", "b"] },
    { id: 5, tags: ["a", "b"] },
    { id: 6, tags: ["a"] },
    { id: 7, tags: ["c"] },
  ];
  export let selectable = false;
  export let selected: string | null = null;
  export let valueType: "value" | "percent" = "value";
  export let onselect: (detail: unknown) => void = () => {};
  export let onhover: (detail: unknown) => void = () => {};
</script>

<UpSetPlot
  sets={[{ id: "a", label: "Alpha" }, { id: "b", label: "Beta" }, { id: "c", label: "Gamma" }]}
  {data}
  membership="tags"
  title="Tag combinations"
  locale="en-US"
  {valueType}
  {selectable}
  bind:selected
  data-testid="upset"
  on:select={(e) => onselect(e.detail)}
  on:hover={(e) => onhover(e.detail)}
/>
<output data-testid="selected">{selected ?? ""}</output>
