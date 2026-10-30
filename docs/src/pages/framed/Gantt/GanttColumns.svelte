<script>
  import { Gantt } from "carbon-components-svelte";

  const headers = [
    { key: "text", value: "Task", width: "180px" },
    { key: "owner", value: "Owner", width: "100px" },
    {
      key: "progress",
      value: "Done",
      columnAlign: /** @type {const} */ ("end"),
      width: "100px",
      display: (value) => (value === undefined ? "" : `${value}%`),
    },
  ];

  const tasks = [
    {
      id: "brief",
      text: "Write the brief",
      owner: "Ana",
      start: "2026-03-02",
      end: "2026-03-06",
      progress: 100,
    },
    {
      id: "design",
      text: "Design review",
      owner: "Ben",
      start: "2026-03-09",
      end: "2026-03-13",
      progress: 60,
    },
    {
      id: "api",
      text: "API",
      owner: "Cy",
      start: "2026-03-16",
      end: "2026-03-27",
      progress: 30,
    },
    {
      id: "ship",
      text: "Launch",
      owner: "Di",
      start: "2026-04-01",
      milestone: true,
    },
  ];

  const links = [
    { from: "brief", to: "design" },
    { from: "design", to: "api" },
    { from: "api", to: "ship" },
  ];
</script>

<Gantt
  labelText="Launch plan"
  size="short"
  listWidth={380}
  today={false}
  {headers}
  {links}
  {tasks}
/>
