<script>
  import { Gantt, Stack } from "carbon-components-svelte";

  const tasks = [
    {
      id: "brief",
      text: "Briefing",
      start: "2026-03-02",
      end: "2026-03-06",
      progress: 100,
    },
    {
      id: "design",
      text: "Design",
      start: "2026-03-09",
      end: "2026-03-13",
      progress: 60,
    },
    { id: "ship", text: "Start", start: "2026-03-16", milestone: true },
  ];

  const links = [
    { from: "brief", to: "design" },
    { from: "design", to: "ship" },
  ];

  const quarters = (quarter, year) => `${quarter}. Quartal ${year}`;
</script>

<Stack gap={6}>
  <Gantt
    labelText="Deutsch: the week starts on Monday"
    locale="de"
    size="short"
    zoom="day"
    today={false}
    height={200}
    {links}
    {tasks}
  />
  <Gantt
    labelText="English (US): the week starts on Sunday"
    locale="en-US"
    size="short"
    zoom="week"
    today={false}
    height={200}
    {links}
    {tasks}
  />
  <Gantt
    labelText="A quarter label has no Intl form"
    locale="de"
    size="short"
    zoom="quarter"
    formatQuarter={quarters}
    today={false}
    height={200}
    {links}
    {tasks}
  />
</Stack>
