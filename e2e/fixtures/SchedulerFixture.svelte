<script>
  import { Scheduler } from "carbon-components-svelte";

  const params = new URLSearchParams(window.location.search);
  const timeZone = params.get("tz") || "America/Los_Angeles";

  // Wall-clock time in Los Angeles. The week of Oct 25 to 31, 2026 ends the
  // day before the clocks fall back, so `?week=dst` shows Nov 1.
  const base = Date.UTC(2026, 9, 25, 7);
  const DAY = 86_400_000;
  function at(day, hour, minute = 0) {
    return new Date(base + day * DAY + (hour * 60 + minute) * 60_000);
  }

  let view = params.get("view") || "week";
  let date =
    params.get("week") === "spring"
      ? new Date(Date.UTC(2026, 2, 8, 20))
      : at(params.get("week") === "dst" ? 7 : 3, 5);
  let locale = params.get("locale") || "en";
  let hourFormat = params.get("hour") || "auto";

  function stress() {
    const items = [];
    for (let i = 0; i < 20; i++) {
      items.push({
        id: `crowd-${i}`,
        title: `Crowd ${i}`,
        start: at(2, 10),
        end: at(2, 10, 30),
        color: ["blue", "teal", "purple", "magenta", "green"][i % 5],
      });
    }
    for (let i = 0; i < 480; i++) {
      const day = i % 7;
      const hour = 7 + ((i * 5) % 12);
      items.push({
        id: `e${i}`,
        title: `Event ${i}`,
        start: at(day, hour, (i % 4) * 15),
        end: at(day, hour + 1),
        color: ["blue", "cyan", "gray", "red"][i % 4],
      });
    }
    return items;
  }

  // Nov 1 in Los Angeles is 25 hours long: 01:30 PDT to 01:30 PST is an
  // hour, and 00:30 PDT to 03:30 PST is four.
  const dstEvents = [
    {
      id: "backup",
      title: "Backup",
      start: new Date(Date.UTC(2026, 10, 1, 8, 30)),
      end: new Date(Date.UTC(2026, 10, 1, 9, 30)),
      color: "teal",
    },
    {
      id: "maintenance",
      title: "Maintenance",
      start: new Date(Date.UTC(2026, 10, 1, 7, 30)),
      end: new Date(Date.UTC(2026, 10, 1, 11, 30)),
      color: "purple",
    },
  ];

  // Mar 8 is 23 hours long: 02:00 to 03:00 does not exist, so 01:30 PST to
  // 03:30 PDT is one hour.
  const springEvents = [
    {
      id: "cron",
      title: "Cron job",
      start: new Date(Date.UTC(2026, 2, 8, 9, 30)),
      end: new Date(Date.UTC(2026, 2, 8, 10, 30)),
      color: "teal",
    },
  ];

  let events = params.has("stress")
    ? stress()
    : params.get("week") === "spring"
      ? springEvents
      : params.get("week") === "dst"
        ? dstEvents
        : [
            {
              id: "standup",
              title: "Standup",
              start: at(1, 9),
              end: at(1, 9, 30),
              color: "teal",
            },
            {
              id: "review",
              title: "Design review",
              start: at(1, 9, 15),
              end: at(1, 10, 30),
              color: "purple",
            },
            {
              id: "sync",
              title: "Roadmap sync",
              start: at(1, 10),
              end: at(1, 11),
              color: "blue",
            },
            {
              id: "lunch",
              title: "Lunch",
              start: at(2, 12),
              end: at(2, 13),
              color: "green",
            },
            {
              id: "quick",
              title: "Quick call",
              start: at(2, 14),
              end: at(2, 14, 10),
              color: "magenta",
            },
            {
              id: "late",
              title: "Release night",
              start: at(3, 22),
              end: at(4, 2),
              color: "red",
            },
            {
              id: "locked",
              title: "Locked",
              start: at(4, 15),
              end: at(4, 16),
              color: "gray",
              readonly: true,
            },
            {
              id: "holiday",
              title: "Company holiday",
              start: at(5, 0),
              end: at(6, 0),
              allDay: true,
              color: "cyan",
            },
            {
              id: "trip",
              title: "Offsite",
              start: at(1, 0),
              end: at(4, 0),
              allDay: true,
              color: "blue",
            },
          ];

  let createLog = "";
  let changeLog = "";
  let clicks = 0;
  let cancelNext = false;
  let selection = null;

  function handleCreate(event) {
    createLog = `${event.detail.start.toISOString()}|${event.detail.end.toISOString()}|${event.detail.allDay}|${event.detail.trigger}`;
    if (cancelNext) event.preventDefault();
  }

  function handleChange(event) {
    changeLog = `${event.detail.event.id}|${event.detail.kind}|${event.detail.start.toISOString()}|${event.detail.end.toISOString()}|${event.detail.trigger}`;
    if (cancelNext) event.preventDefault();
  }
</script>

<div style="padding: 1rem; max-width: 1100px;">
  <Scheduler
    data-testid="scheduler"
    bind:events
    bind:view
    bind:date
    bind:selection
    {timeZone}
    {locale}
    {hourFormat}
    height={params.get("height") || "36rem"}
    scrollHour={Number(params.get("scroll") ?? 8)}
    on:create={handleCreate}
    on:change={handleChange}
    on:click:event={() => clicks++}
  />
  <label>
    <input type="checkbox" data-testid="cancel" bind:checked={cancelNext} />
    Cancel changes
  </label>
  <div data-testid="create-log">{createLog}</div>
  <div data-testid="change-log">{changeLog}</div>
  <div data-testid="clicks">{clicks}</div>
  <div data-testid="selection">{selection ? "selected" : "none"}</div>
</div>
