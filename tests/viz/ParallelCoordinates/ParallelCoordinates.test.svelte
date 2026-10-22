<script lang="ts">
  import ParallelCoordinates from "carbon-components-svelte/viz/ParallelCoordinates/ParallelCoordinates.svelte";

  type Row = {
    name: string;
    tier: string;
    cpu: number;
    mem: number | null;
    cost: number;
  };

  export let data: ReadonlyArray<Row> = [
    { name: "a", tier: "small", cpu: 10, mem: 4, cost: 20 },
    { name: "b", tier: "small", cpu: 30, mem: 8, cost: 45 },
    { name: "c", tier: "large", cpu: 90, mem: null, cost: 200 },
  ];
  export let brushes: Record<string, readonly [number, number]> = {};
  export let hidden: ReadonlyArray<string> = [];
  export let onhover: (detail: unknown) => void = () => {};
  export let onselect: (detail: unknown) => void = () => {};
  export let onbrush: (detail: unknown) => void = () => {};
</script>

<ParallelCoordinates
  {data}
  dimensions={["cpu", "mem", { key: "cost", label: "Cost", domain: [0, 250] }]}
  series="tier"
  label="name"
  title="Instances"
  width={400}
  height={240}
  locale="en-US"
  bind:brushes
  bind:hidden
  data-testid="parallel"
  on:hover={(e) => onhover(e.detail)}
  on:select={(e) => onselect(e.detail)}
  on:brush={(e) => onbrush(e.detail)}
/>
<output data-testid="brushes">{JSON.stringify(brushes)}</output>
<output data-testid="hidden">{hidden.join(",")}</output>
