<script>
  import {
    ContainedList,
    ContainedListItem,
    PageHeader,
  } from "carbon-components-svelte";

  let stuck = false;

  const events = Array.from({ length: 24 }, (_, index) => ({
    id: index,
    text: `Backup ${24 - index} completed`,
  }));
</script>

<PageHeader
  sticky
  bind:stuck
  fill={stuck ? "layer-01" : "background"}
  title="db-prod-01"
  subtitle="PostgreSQL 16 · us-south"
>
  <ContainedList labelText="Recent activity" hideLabel>
    {#each events as event (event.id)}
      <ContainedListItem>{event.text}</ContainedListItem>
    {/each}
  </ContainedList>
</PageHeader>
