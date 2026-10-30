<script>
  import {
    ContentSwitcher,
    Gantt,
    Stack,
    Switch,
  } from "carbon-components-svelte";

  const zooms = ["day", "week", "month", "quarter"];

  let tasks = [
    {
      id: "plan",
      text: "Planning",
      nodes: [
        {
          id: "brief",
          text: "Write the brief",
          start: "2026-01-12",
          end: "2026-01-23",
          progress: 100,
        },
        {
          id: "design",
          text: "Design review",
          start: "2026-01-26",
          end: "2026-02-13",
          progress: 60,
        },
        {
          id: "approved",
          text: "Plan approved",
          start: "2026-02-16",
          milestone: true,
        },
      ],
    },
    {
      id: "build",
      text: "Build",
      nodes: [
        {
          id: "api",
          text: "API",
          start: "2026-02-17",
          end: "2026-04-10",
          progress: 30,
        },
        {
          id: "ui",
          text: "Interface",
          start: "2026-03-02",
          end: "2026-05-01",
          progress: 10,
        },
      ],
    },
    { id: "ship", text: "Launch", start: "2026-05-11", milestone: true },
  ];

  const links = [
    { from: "brief", to: "design" },
    { from: "design", to: "approved" },
    { from: "approved", to: "api" },
    { from: "approved", to: "ui" },
    { from: "ui", to: "ship" },
  ];

  let selectedIndex = 1;

  $: zoom = zooms[selectedIndex];
</script>

<Stack gap={4}>
  <ContentSwitcher size="sm" bind:selectedIndex>
    <Switch text="Day" />
    <Switch text="Week" />
    <Switch text="Month" />
    <Switch text="Quarter" />
  </ContentSwitcher>
  <Gantt
    labelText="Launch plan, by {zoom}"
    size="short"
    today="2026-02-20"
    {links}
    {zoom}
    bind:tasks
    expandedIds={["plan", "build"]}
  />
</Stack>
