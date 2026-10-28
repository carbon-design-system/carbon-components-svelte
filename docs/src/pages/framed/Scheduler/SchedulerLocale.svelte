<script>
  import {
    Scheduler,
    Select,
    SelectItem,
    Stack,
  } from "carbon-components-svelte";

  const at = (day, hour, minute = 0) =>
    new Date(Date.UTC(2026, 9, 26 + day, hour, minute));

  let locale = "de";
  let hourFormat = "auto";
  let timeZone = "Europe/Berlin";

  // Both start at 9:00 in Berlin, so the same instants show at other hours in
  // other zones.
  const events = [
    {
      id: 1,
      title: "Standup",
      start: at(1, 8),
      end: at(1, 8, 30),
      color: "teal",
    },
    {
      id: 2,
      title: "Planning",
      start: at(2, 8),
      end: at(2, 9, 30),
      color: "purple",
    },
  ];
</script>

<Stack gap={5}>
  <Select labelText="Language" bind:selected={locale}>
    <SelectItem value="de" text="Deutsch (week starts Monday)" />
    <SelectItem value="en-US" text="English, US (week starts Sunday)" />
    <SelectItem value="ar-EG" text="Arabic, Egypt (week starts Saturday)" />
  </Select>
  <Select labelText="Clock" bind:selected={hourFormat}>
    <SelectItem value="auto" text="Follow the language" />
    <SelectItem value="12" text="12-hour" />
    <SelectItem value="24" text="24-hour" />
  </Select>
  <Select labelText="Time zone" bind:selected={timeZone}>
    <SelectItem value="Europe/Berlin" text="Berlin" />
    <SelectItem value="America/Los_Angeles" text="Los Angeles" />
    <SelectItem value="Asia/Kolkata" text="Kolkata" />
  </Select>
  <Scheduler
    {events}
    {locale}
    {hourFormat}
    {timeZone}
    date={at(2, 12)}
    toolbar={false}
    readonly
    scrollHour={5}
    height="22rem"
  />
</Stack>
