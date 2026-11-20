<script>
  import {
    BookingSlots,
    slotsFromWindows,
    Stack,
    Tile,
  } from "carbon-components-svelte";

  // For demo purposes only: support is staffed 13:00 to 21:00 UTC on
  // weekdays, so the same 15 minute callbacks land on a different day and
  // hour in each zone.
  function supportHours(count) {
    const windows = [];
    for (let i = 0; i < count; i++) {
      const day = new Date(Date.now() + i * 86_400_000)
        .toISOString()
        .slice(0, 10);
      const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
      if (weekday === 0 || weekday === 6) continue;
      windows.push({ start: `${day}T13:00:00Z`, end: `${day}T21:00:00Z` });
    }
    return slotsFromWindows(windows, { duration: 15 });
  }

  const slots = supportHours(45);
  const timeZones = [
    "America/Los_Angeles",
    "America/New_York",
    "Europe/London",
    "Europe/Berlin",
    "Asia/Kolkata",
    "Australia/Sydney",
  ];

  let value = null;
  let timeZone = "";

  $: callback =
    value &&
    new Intl.DateTimeFormat("en", {
      dateStyle: "full",
      timeStyle: "long",
      timeZone,
    }).format(new Date(value));
</script>

<Stack gap={6}>
  <BookingSlots {slots} {timeZones} duration={15} bind:value bind:timeZone />
  <Tile>
    {#if value}
      <p>Callback: {callback}</p>
      <p>Sent to support as {value}</p>
    {:else}
      <p>Choose a time for a callback.</p>
    {/if}
  </Tile>
</Stack>
