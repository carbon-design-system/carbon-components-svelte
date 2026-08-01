<script>
  import { LinkDownload, Search, Stack } from "carbon-components-svelte";

  const loadBalancers = [
    { id: "1", name: "lb-east", region: "us-east-1" },
    { id: "2", name: "lb-west", region: "us-west-2" },
    { id: "3", name: "lb-central", region: "us-central-1" },
  ];

  let value = "";

  $: filteredRows = loadBalancers.filter((row) =>
    row.name.toLowerCase().includes(value.toLowerCase()),
  );

  $: csv = [
    "id,name,region",
    ...filteredRows.map((row) => `${row.id},${row.name},${row.region}`),
  ].join("\n");
</script>

<Stack gap={5}>
  <Search
    bind:value
    labelText="Filter load balancers"
    placeholder="Filter by name..."
  />
  <ul>
    {#each filteredRows as row (row.id)}
      <li>{row.name} ({row.region})</li>
    {/each}
  </ul>
  <LinkDownload
    data={csv}
    filename="load-balancers.csv"
    type="text/csv;charset=utf-8"
  >
    Download CSV
  </LinkDownload>
</Stack>
