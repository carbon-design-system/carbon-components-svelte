<script>
  import { calendarRange, TimeRangePicker } from "carbon-components-svelte";

  const ranges = [
    {
      id: "1h",
      text: "Last hour",
      from: "now-1h",
      to: "now",
      group: "Incident",
    },
    {
      id: "3h",
      text: "Last 3 hours",
      from: "now-3h",
      to: "now",
      group: "Incident",
    },
    {
      id: "deploy",
      text: "Since the 09:00 deploy",
      from: "now/d+9h",
      to: "now",
      group: "Incident",
    },
    {
      id: "7d",
      text: "Past 7 calendar days",
      ...calendarRange(7, "d"),
      group: "Reports",
    },
    {
      id: "month",
      text: "Previous month",
      from: "now-1M/M",
      to: "now-1M/M",
      group: "Reports",
    },
  ];

  let value = { from: "now-1h", to: "now" };
</script>

<TimeRangePicker {ranges} bind:value />
