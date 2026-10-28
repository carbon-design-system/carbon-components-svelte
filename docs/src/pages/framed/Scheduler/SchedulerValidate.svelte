<script>
  import { Scheduler, Stack, Text } from "carbon-components-svelte";

  const at = (day, hour, minute = 0) =>
    new Date(Date.UTC(2026, 9, 26 + day, hour, minute));

  let message = "Try to move an event outside 8:00 to 18:00.";

  let events = [
    {
      id: 1,
      title: "Customer call",
      start: at(1, 10),
      end: at(1, 11),
      color: "teal",
    },
    {
      id: 2,
      title: "Deploy window",
      start: at(2, 14),
      end: at(2, 15, 30),
      color: "purple",
    },
  ];

  function handleChange(event) {
    const { start, end } = event.detail;
    if (start.getUTCHours() < 8 || end.getUTCHours() > 18) {
      // Cancel the change: `events` keeps the old times.
      event.preventDefault();
      message = "Rejected: events stay between 8:00 and 18:00.";
    } else {
      message = "Saved.";
    }
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
    on:change={handleChange}
  />
  <Text>{message}</Text>
</Stack>
