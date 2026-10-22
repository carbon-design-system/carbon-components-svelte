<script lang="ts">
  import SequenceSunburst from "carbon-components-svelte/viz/SequenceSunburst/SequenceSunburst.svelte";

  type Row = { path: string; users: number };

  export let data: ReadonlyArray<Row> = [
    { path: "home/search/pdp/cart", users: 40 },
    { path: "home/search/pdp", users: 25 },
    { path: "home/pdp/cart", users: 20 },
    { path: "home/search", users: 15 },
  ];
  export let trail = true;
  export let onselect: (detail: unknown) => void = () => {};
  export let onhover: (detail: unknown) => void = () => {};
</script>

<SequenceSunburst
  {data}
  steps="path"
  value="users"
  {trail}
  rootLabel="Sessions"
  title="Checkout paths"
  data-testid="seq"
  on:select={(e) => onselect(e.detail)}
  on:hover={(e) => onhover(e.detail)}
/>
