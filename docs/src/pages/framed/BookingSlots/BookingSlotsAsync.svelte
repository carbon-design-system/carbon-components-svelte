<script>
  import {
    BookingSlots,
    slotsFromWindows,
    Stack,
    Tile,
    wallTimeToInstant,
  } from "carbon-components-svelte";

  const HOST_ZONE = "America/Toronto";

  let loaded = [];
  let value = null;

  // For demo purposes only: stands in for a request to your server. The
  // answer is the slots that start between `from` and `to`.
  async function loadSlots({ from, to, month }) {
    loaded = [...loaded, month];
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const windows = [];
    for (let t = +from; t < +to; t += 86_400_000) {
      const day = new Date(t).toISOString().slice(0, 10);
      const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
      if (weekday === 0 || weekday === 6) continue;
      windows.push({
        start: wallTimeToInstant(day, 9 * 60, HOST_ZONE),
        end: wallTimeToInstant(day, 17 * 60, HOST_ZONE),
      });
    }
    return slotsFromWindows(windows, { duration: 30 }).filter(
      (slot) => slot.start >= +from && slot.start < +to,
    );
  }
</script>

<Stack gap={6}>
  <BookingSlots {loadSlots} bind:value />
  <Tile>
    <p>
      Months requested: {loaded.length > 0 ? loaded.join(", ") : "none yet"}
    </p>
  </Tile>
</Stack>
