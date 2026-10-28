<script>
  import { Gantt, Stack } from "carbon-components-svelte";

  const tasks = [
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
      ],
    },
    { id: "ship", text: "Launch", start: "2026-03-16", milestone: true },
  ];

  const links = [
    { from: "brief", to: "design" },
    { from: "design", to: "ship" },
  ];

  const sizes = ["compact", "short", "medium", undefined, "tall"];
</script>

<Stack gap={6}>
  {#each sizes as size}
    <Gantt
      labelText={size ?? "Unset (default)"}
      {size}
      {links}
      {tasks}
      today={false}
      height={320}
      expandedIds={["plan"]}
    />
  {/each}
</Stack>
