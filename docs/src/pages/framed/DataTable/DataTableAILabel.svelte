<script>
  import { AILabel, DataTable } from "carbon-components-svelte";

  const headers = [
    { key: "service", value: "Service" },
    { key: "region", value: "Region" },
    { key: "forecast", value: "Forecast" },
  ];

  const rows = [
    {
      id: "a",
      service: "billing-api",
      region: "us-east-1",
      forecast: "+12%",
      generated: true,
    },
    {
      id: "b",
      service: "search",
      region: "eu-west-1",
      forecast: "+3%",
      generated: false,
    },
    {
      id: "c",
      service: "auth",
      region: "us-west-2",
      forecast: "-1%",
      generated: true,
    },
  ];
</script>

<DataTable
  title="Monthly spend"
  description="Forecast for next month"
  {headers}
  {rows}
>
  <svelte:fragment slot="decorator">
    <AILabel>
      <p>Forecasts are generated from 90 days of billing data.</p>
    </AILabel>
  </svelte:fragment>
  <svelte:fragment slot="headerDecorator" let:header>
    {#if header.key === "forecast"}
      <AILabel>
        <p>Every value in this column is generated.</p>
      </AILabel>
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="rowDecorator" let:row>
    {#if row.generated}
      <AILabel>
        <p>This service was added by the cost assistant.</p>
      </AILabel>
    {/if}
  </svelte:fragment>
</DataTable>
