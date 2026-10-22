<script lang="ts">
  import AlluvialChart from "carbon-components-svelte/viz/AlluvialChart/AlluvialChart.svelte";

  type Row = { from: string; to: string; users: number };

  export let data: ReadonlyArray<Row> = [
    { from: "Organic", to: "Signup", users: 60 },
    { from: "Paid", to: "Signup", users: 30 },
    { from: "Paid", to: "Signup", users: 10 },
    { from: "Signup", to: "Activated", users: 70 },
    { from: "Signup", to: "Churned", users: 30 },
  ];
  export let onhover: (detail: unknown) => void = () => {};
  export let onselect: (detail: unknown) => void = () => {};
</script>

<AlluvialChart
  {data}
  source="from"
  target="to"
  value="users"
  title="Acquisition flow"
  locale="en-US"
  on:hover={(e) => onhover(e.detail)}
  on:select={(e) => onselect(e.detail)}
/>
