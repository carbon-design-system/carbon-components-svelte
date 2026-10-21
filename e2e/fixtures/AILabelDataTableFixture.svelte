<script lang="ts">
  import { AILabel, DataTable } from "carbon-components-svelte";

  const headers = [
    { key: "service", value: "Service" },
    { key: "forecast", value: "Forecast" },
  ];
  const rows = [
    { id: "a", service: "billing-api", forecast: "+12%" },
    { id: "b", service: "search", forecast: "+3%" },
  ];
</script>

<!-- The AI column ends at the table's right edge, so a start-aligned
     explanation would run past the scroll container. -->
<div data-testid="table" style="width: 480px">
  <DataTable {headers} {rows}>
    <svelte:fragment slot="headerDecorator" let:header>
      {#if header.key === "forecast"}
        <AILabel>
          <p>Every value in this column is generated from 90 days of usage.</p>
        </AILabel>
      {/if}
    </svelte:fragment>
  </DataTable>
</div>
