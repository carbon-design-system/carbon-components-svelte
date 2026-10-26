<script>
  import { DateCalendar, Stack, Text } from "carbon-components-svelte";

  // Fares by day of the month, as a flight search might show them.
  const fares = new Map([
    [3, 89],
    [9, 120],
    [14, 74],
    [21, 99],
    [27, 65],
  ]);
</script>

<DateCalendar>
  <svelte:fragment slot="day" let:date let:outside>
    {#if !outside && fares.has(date.getDate())}
      <Stack gap={0} align="center">
        {date.getDate()}
        <Text type="label-01" color="success">${fares.get(date.getDate())}</Text
        >
      </Stack>
    {:else}
      {date.getDate()}
    {/if}
  </svelte:fragment>
</DateCalendar>
