<script>
  import { Gantt, Stack } from "carbon-components-svelte";

  let tasks = [
    {
      id: "brief",
      text: "Write the brief",
      start: "2026-03-02",
      end: "2026-03-06",
      progress: 100,
      readonly: true,
    },
    {
      id: "design",
      text: "Design review",
      start: "2026-03-09",
      end: "2026-03-13",
      progress: 60,
    },
    {
      id: "api",
      text: "API",
      start: "2026-03-16",
      end: "2026-03-27",
      progress: 30,
    },
    { id: "ship", text: "Launch", start: "2026-04-01", milestone: true },
  ];

  const links = [
    { from: "brief", to: "design" },
    { from: "design", to: "api" },
    { from: "api", to: "ship" },
  ];

  let last = "Drag a bar, or focus one and press an arrow key.";

  /** Keep a task from starting before the brief is done. */
  function handleChange(event) {
    const { id, start, end, mode, source } = event.detail;
    if (start < "2026-03-09") {
      event.preventDefault();
      last = `Refused: ${id} cannot start before 2026-03-09`;
      return;
    }
    last = `${id}: ${start} to ${end} (${mode}, by ${source})`;
  }
</script>

<Stack gap={4}>
  <Gantt
    labelText="Launch plan"
    size="short"
    today="2026-03-11"
    {links}
    bind:tasks
    on:change={handleChange}
  />
  <div aria-live="polite">{last}</div>
</Stack>
