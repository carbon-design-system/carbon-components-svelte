<script>
  import { Scheduler } from "carbon-components-svelte";

  // Times are UTC so the example reads the same for every visitor.
  const at = (day, hour, minute = 0) =>
    new Date(Date.UTC(2026, 9, 26 + day, hour, minute));

  let view = "week";
  let date = at(2, 12);

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
      start: at(1, 10),
      end: at(1, 11, 30),
      color: "purple",
    },
    {
      id: 3,
      title: "us-south rollout",
      start: at(1, 10, 30),
      end: at(1, 12),
      color: "teal",
    },
    {
      id: 4,
      title: "Support handoff",
      start: at(1, 11),
      end: at(1, 12),
      color: "blue",
    },
    {
      id: 5,
      title: "Quarterly planning",
      start: at(2, 0),
      end: at(5, 0),
      allDay: true,
      color: "cyan",
    },
    {
      id: 6,
      title: "On-call: platform",
      start: at(3, 14),
      end: at(3, 15),
      color: "green",
    },
    {
      id: 7,
      title: "Release night",
      start: at(4, 22),
      end: at(5, 2),
      color: "magenta",
    },
  ];
</script>

<Scheduler
  bind:events
  bind:view
  bind:date
  timeZone="UTC"
  scrollHour={8}
  height="32rem"
/>
