<script>
  import { Scheduler, Stack, Text } from "carbon-components-svelte";

  const at = (day, hour, minute = 0) =>
    new Date(Date.UTC(2026, 9, 26 + day, hour, minute));

  let nextId = 10;
  let lastChange = "Create, move or resize an event.";

  let events = [
    {
      id: 1,
      title: "Incident review",
      start: at(0, 9),
      end: at(0, 10),
      color: "red",
    },
    {
      id: 2,
      title: "Capacity planning",
      start: at(1, 13),
      end: at(1, 14, 30),
      color: "purple",
    },
    {
      id: 3,
      title: "Change freeze",
      start: at(2, 0),
      end: at(3, 0),
      allDay: true,
      color: "gray",
    },
  ];

  const time = new Intl.DateTimeFormat("en", {
    timeZone: "UTC",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  function handleCreate(event) {
    const { start, end, allDay } = event.detail;
    events = [
      ...events,
      { id: nextId++, title: "New event", start, end, allDay, color: "blue" },
    ];
    // The event now shows what was picked, so drop the highlight.
    event.preventDefault();
  }

  function handleChange(event) {
    const { event: moved, kind, start, end } = event.detail;
    lastChange = `${moved.title} ${kind === "move" ? "moved to" : "now"} ${time.format(start)} to ${time.format(end)}`;
  }
</script>

<Stack gap={5}>
  <Scheduler
    bind:events
    view="week"
    date={at(2, 12)}
    timeZone="UTC"
    toolbar={false}
    height="26rem"
    on:create={handleCreate}
    on:change={handleChange}
  />
  <Text>{lastChange}</Text>
</Stack>
