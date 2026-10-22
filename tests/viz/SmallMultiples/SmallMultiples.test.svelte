<script lang="ts">
  import LineChart from "carbon-components-svelte/viz/LineChart/LineChart.svelte";
  import SmallMultiples from "carbon-components-svelte/viz/SmallMultiples/SmallMultiples.svelte";

  export let data = ["a", "b", "c"].flatMap((region, r) =>
    [0, 1, 2].map((day) => ({ region, day, revenue: (r + 1) * 30 + day * 5 })),
  );
  export let sharedY = true;
  export let sharedX = true;
  export let syncHover = true;
  export let columns = 3;
  export let onhover: (facet: string, detail: unknown) => void = () => {};
</script>

<SmallMultiples
  {data}
  facet="region"
  x="day"
  y="revenue"
  {sharedY}
  {sharedX}
  {syncHover}
  {columns}
  title="Revenue by region"
  data-testid="facets"
  let:facet
  let:rows
  let:yDomain
  let:xDomain
  let:syncId
>
  <LineChart
    data={rows}
    x="day"
    y="revenue"
    title={facet}
    {yDomain}
    {xDomain}
    {syncId}
    width={200}
    height={120}
    legend={false}
    on:hover={(e) => onhover(facet, e.detail)}
  />
</SmallMultiples>
