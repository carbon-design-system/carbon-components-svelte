<script>
  import { Gantt } from "carbon-components-svelte";

  let tasks = [
    {
      id: "plan",
      text: "Planning",
      nodes: [
        {
          id: "brief",
          text: "Write the brief",
          start: "2026-03-02",
          end: "2026-03-06",
          progress: 100,
        },
        {
          id: "design",
          text: "Design review",
          start: "2026-03-09",
          end: "2026-03-13",
          progress: 60,
        },
        {
          id: "approved",
          text: "Plan approved",
          start: "2026-03-16",
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
          start: "2026-03-17",
          end: "2026-03-27",
          progress: 30,
        },
        {
          id: "ui",
          text: "Interface",
          start: "2026-03-20",
          end: "2026-04-03",
          progress: 10,
        },
      ],
    },
    { id: "ship", text: "Launch", start: "2026-04-08", milestone: true },
  ];

  const links = [
    { from: "brief", to: "design" },
    { from: "design", to: "approved" },
    { from: "approved", to: "api" },
    { from: "approved", to: "ui" },
    { from: "ui", to: "ship" },
  ];

  let expandedIds = ["plan", "build"];
</script>

<Gantt
  labelText="Launch plan"
  size="short"
  today="2026-03-11"
  {links}
  bind:tasks
  bind:expandedIds
/>
