<script>
  import { Timeline } from "carbon-components-svelte";

  const now = Date.UTC(2026, 10, 6, 15, 0);
  const at = (days, hour = 8) => Date.UTC(2026, 10, 6 - days, hour);

  const releases = [
    {
      id: "2.4.0",
      time: at(0),
      title: "2.4.0",
      description: "Added dark mode. It follows the system setting.",
    },
    {
      id: "2.3.2",
      time: at(1),
      title: "2.3.2",
      description: "Fixed the export dialog.",
    },
    { id: "2.3.1", time: at(3), title: "2.3.1", description: "Faster search." },
    {
      id: "2.3.0",
      time: at(8),
      title: "2.3.0",
      description: "New keyboard shortcuts.",
    },
    {
      id: "2.2.0",
      time: at(15),
      title: "2.2.0",
      description: "Improved onboarding.",
    },
    {
      id: "2.0.0",
      time: at(40),
      title: "2.0.0",
      description: "A new navigation.",
    },
    {
      id: "1.0.0",
      time: at(400),
      title: "1.0.0",
      description: "Initial release.",
    },
  ];

  let expanded = false;
</script>

<Timeline
  aria-label="Release notes"
  items={releases}
  order="desc"
  groupBy="day"
  size="sm"
  limit={3}
  bind:expanded
  {now}
  timeZone="UTC"
/>
