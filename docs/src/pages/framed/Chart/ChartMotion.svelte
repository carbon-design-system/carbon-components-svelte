<script>
  import { Button, Stack } from "carbon-components-svelte";
  import { BarChart, TreemapChart } from "carbon-components-svelte/viz";

  const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
  const TEAMS = ["Cloud", "Data", "Security"];
  let seed = 1;
  $: deals = QUARTERS.flatMap((quarter, q) =>
    TEAMS.map((team, t) => ({
      quarter,
      team,
      deals: 10 + ((q * 7 + t * 5 + seed * 11) % 23),
    })),
  );
  $: spend = TEAMS.flatMap((team, t) =>
    ["Compute", "Storage", "Network"].map((service, s) => ({
      service: `${team} ${service}`,
      team,
      cost: 5 + ((t * 13 + s * 7 + seed * 5) % 31),
    })),
  );
</script>

<Stack gap={6}>
  <div>
    <Button kind="tertiary" size="small" on:click={() => (seed += 1)}>
      Shuffle the data
    </Button>
  </div>
  <BarChart
    data={deals}
    x="quarter"
    y="deals"
    series="team"
    title="Deals by quarter"
    height={200}
    transition
  />
  <TreemapChart
    data={spend}
    value="cost"
    label="service"
    group="team"
    title="Cloud spend"
    transition
  />
</Stack>
