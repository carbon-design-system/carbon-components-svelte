<script lang="ts">
  import TileGridMap from "carbon-components-svelte/viz/TileGridMap/TileGridMap.svelte";

  type Row = { state: string; signups: number | null };

  export let data: ReadonlyArray<Row> = [
    { state: "CA", signups: 400 },
    { state: "CA", signups: 500 },
    { state: "TX", signups: 300 },
    { state: "NY", signups: 100 },
    { state: "WA", signups: null },
  ];
  export let selectable = false;
  export let selected: string | null = null;
  export let onhover: (detail: unknown) => void = () => {};
  export let onselect: (detail: unknown) => void = () => {};
</script>

<TileGridMap
  {data}
  region="state"
  value="signups"
  title="Signups by state"
  locale="en-US"
  {selectable}
  bind:selected
  on:hover={(e) => onhover(e.detail)}
  on:select={(e) => onselect(e.detail)}
/>
<output data-testid="selected">{selected ?? ""}</output>
