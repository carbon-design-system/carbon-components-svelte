<script>
  import {
    BookingSlots,
    Button,
    slotsFromWindows,
    Stack,
    Tile,
    wallTimeToInstant,
  } from "carbon-components-svelte";

  const HOST_ZONE = "America/Toronto";

  // For demo purposes only: a real app reads the host's free time from a
  // server. Here the host is free on weekdays, 9:00 to 12:00 and 13:00 to
  // 17:00 in Toronto, for the next two months.
  function workdays(count) {
    const windows = [];
    for (let i = 0; i < count; i++) {
      const day = new Date(Date.now() + i * 86_400_000)
        .toISOString()
        .slice(0, 10);
      const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
      if (weekday === 0 || weekday === 6) continue;
      for (const [from, to] of [
        [9, 12],
        [13, 17],
      ]) {
        windows.push({
          start: wallTimeToInstant(day, from * 60, HOST_ZONE),
          end: wallTimeToInstant(day, to * 60, HOST_ZONE),
        });
      }
    }
    return slotsFromWindows(windows, { duration: 30 });
  }

  const slots = workdays(60);

  let value = null;
  let timeZone = "";
  let booked = false;

  $: when =
    value &&
    new Intl.DateTimeFormat("en", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone,
    }).format(new Date(value));
</script>

<Stack gap={6}>
  <BookingSlots
    {slots}
    duration={30}
    minNotice={120}
    bind:value
    bind:timeZone
    on:change={() => (booked = false)}
  />
  <Tile>
    <Stack gap={4}>
      {#if booked}
        <p>Booked: 30 minute demo, {when} ({timeZone}).</p>
      {:else if value}
        <p>30 minute demo, {when} ({timeZone}).</p>
        <div>
          <Button size="small" on:click={() => (booked = true)}>
            Confirm booking
          </Button>
        </div>
      {:else}
        <p>Choose a time to book a 30 minute demo.</p>
      {/if}
    </Stack>
  </Tile>
</Stack>
