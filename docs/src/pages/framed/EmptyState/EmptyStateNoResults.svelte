<script>
  import {
    Button,
    EmptyState,
    ListItem,
    Search,
    Stack,
    UnorderedList,
  } from "carbon-components-svelte";
  import Binocular from "carbon-pictograms-svelte/lib/Binocular.svelte";

  const reports = ["Invoices by month", "Spend by service", "Usage forecast"];

  let query = "invoces";

  $: results = reports.filter((report) =>
    report.toLowerCase().includes(query.trim().toLowerCase()),
  );
</script>

<Stack gap={5}>
  <Search bind:value={query} labelText="Search reports" />
  {#if results.length > 0}
    <UnorderedList>
      {#each results as report (report)}
        <ListItem>{report}</ListItem>
      {/each}
    </UnorderedList>
  {/if}
  <div role="status">
    {#if results.length === 0}
      <EmptyState
        title="No results for “{query}”"
        subtitle="Check the spelling, or try a shorter, broader term."
      >
        <Binocular slot="illustration" />
        <Button kind="tertiary" on:click={() => (query = "")}>
          Clear search
        </Button>
      </EmptyState>
    {/if}
  </div>
</Stack>
