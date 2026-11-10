<script lang="ts">
  import {
    BookingSlots,
    slotsFromWindows,
    wallTimeToInstant,
  } from "carbon-components-svelte";

  const params = new URLSearchParams(location.search);
  const delay = Number(params.get("delay") ?? 0);

  const HOST = "America/Toronto";
  // A Saturday with no times, so the calendar's tab stop is a disabled day.
  const NOW = "2026-11-07T12:00:00Z";

  /** Add days to a YYYY-MM-DD string. */
  function addDays(day: string, days: number) {
    const date = new Date(`${day}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  /** Weekdays, 09:00 to 12:00 and 13:00 to 17:00 in the host's zone. */
  function workdays(from: string, days: number) {
    const windows = [];
    for (let i = 0; i < days; i++) {
      const day = addDays(from, i);
      const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
      if (weekday === 0 || weekday === 6) continue;
      for (const [start, end] of [
        [9, 12],
        [13, 17],
      ]) {
        windows.push({
          start: wallTimeToInstant(day, start * 60, HOST),
          end: wallTimeToInstant(day, end * 60, HOST),
        });
      }
    }
    return slotsFromWindows(windows, { duration: 30 });
  }

  const demoSlots = workdays("2026-11-06", 60).filter((_, i) => i % 3 !== 1);

  // Every hour of the week the clocks go back in New York (25 hours on Nov 1).
  const dstSlots = slotsFromWindows(
    [
      {
        start: "2026-10-30T04:00:00Z",
        end: "2026-11-03T05:00:00Z",
      },
    ],
    { duration: 60 },
  );

  const loads: string[] = [];
  let loadLog = "";
  async function loadSlots({
    month,
    from,
    to,
  }: {
    month: string;
    from: Date;
    to: Date;
  }) {
    loads.push(month);
    loadLog = loads.join(",");
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    return demoSlots.filter((slot) => slot.start >= +from && slot.start < +to);
  }

  let demoValue: string | null = null;
  let demoZone = "America/Toronto";
  let dstValue: string | null = null;
  let weekValue: string | null = null;
  let asyncValue: string | null = null;
</script>

<div data-testid="demo">
  <BookingSlots
    bind:value={demoValue}
    bind:timeZone={demoZone}
    slots={demoSlots}
    now={NOW}
    timeZones={["America/Toronto", "Europe/Berlin", "Asia/Tokyo"]}
  />
</div>
<p data-testid="demo-value">{demoValue ?? "none"}</p>
<p data-testid="demo-zone">{demoZone}</p>

<div data-testid="dst">
  <BookingSlots
    bind:value={dstValue}
    slots={dstSlots}
    now="2026-10-28T12:00:00Z"
    timeZone="America/New_York"
    date="2026-11-01"
    duration={60}
  />
</div>
<p data-testid="dst-value">{dstValue ?? "none"}</p>

<div data-testid="week">
  <BookingSlots
    bind:value={weekValue}
    slots={demoSlots}
    now={NOW}
    timeZone="America/Toronto"
    date="2026-11-11"
    view="week"
  />
</div>
<p data-testid="week-value">{weekValue ?? "none"}</p>

<div data-testid="async">
  <BookingSlots
    bind:value={asyncValue}
    {loadSlots}
    now={NOW}
    timeZone="America/Toronto"
  />
</div>
<p data-testid="load-log">{loadLog}</p>
