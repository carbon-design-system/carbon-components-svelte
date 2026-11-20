<script>
  import {
    BookingSlots,
    slotsFromWindows,
    wallTimeToInstant,
  } from "carbon-components-svelte";

  const HOST_ZONE = "America/Toronto";

  // For demo purposes only.
  function workdays(count) {
    const windows = [];
    for (let i = 0; i < count; i++) {
      const day = new Date(Date.now() + i * 86_400_000)
        .toISOString()
        .slice(0, 10);
      const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
      if (weekday === 0 || weekday === 6) continue;
      windows.push({
        start: wallTimeToInstant(day, 9 * 60, HOST_ZONE),
        end: wallTimeToInstant(day, 15 * 60, HOST_ZONE),
      });
    }
    return slotsFromWindows(windows, { duration: 60 });
  }

  let value = null;
</script>

<BookingSlots view="week" slots={workdays(60)} duration={60} bind:value />
