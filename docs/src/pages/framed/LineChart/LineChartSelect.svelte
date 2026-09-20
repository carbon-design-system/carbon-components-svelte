<script>
  import { LineChart } from "carbon-components-svelte/viz";

  const data = ["EMEA", "APAC", "AMER"].flatMap((region, r) =>
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, i) => ({
      month,
      region,
      revenue: 30 + r * 12 + Math.round(Math.sin(i + r) * 10) + i * 3,
    })),
  );

  let selected = null;
  let hidden = [];
</script>

<LineChart
  {data}
  x="month"
  y="revenue"
  series="region"
  title="Revenue by region"
  points="all"
  bind:selected
  bind:hidden
  on:select={(e) => console.log("select", e.detail)}
  on:legend:toggle={(e) => console.log("legend:toggle", e.detail)}
/>

<p>
  Selected:
  {selected ? `${selected.series}, point ${selected.index + 1}` : "none"}.
  Hidden: {hidden.length ? hidden.join(", ") : "none"}.
</p>
