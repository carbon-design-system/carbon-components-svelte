<script>
  import { NaturalDateInput, Stack } from "carbon-components-svelte";

  // A fixed clock: Thursday, November 12, 2026, 10:30 in New York.
  const now = "2026-11-12T15:30:00Z";
  const timeZone = "America/New_York";

  let due = null;
  let reminder = null;
  let reminderText = "";
</script>

<Stack gap={7}>
  <div data-testid="due">
    <NaturalDateInput
      labelText="Due date"
      helperText="Try tomorrow, next Fri or in 2 weeks"
      bind:value={due}
      {now}
      {timeZone}
      locale="en-US"
      name="due"
    />
    <output data-testid="due-value">{due ? due.toISOString() : "none"}</output>
  </div>

  <div data-testid="reminder">
    <NaturalDateInput
      labelText="Remind me"
      time="required"
      bind:value={reminder}
      bind:text={reminderText}
      {now}
      {timeZone}
      locale="en-US"
    />
    <output data-testid="reminder-value"
      >{reminder ? reminder.toISOString() : "none"}</output
    >
  </div>

  <div data-testid="invalid">
    <NaturalDateInput
      labelText="Start date"
      invalid
      invalidText="Start date is required"
      {now}
      {timeZone}
    />
  </div>

  <div data-testid="small">
    <NaturalDateInput
      labelText="End date"
      size="sm"
      value="2026-12-03"
      {now}
      {timeZone}
    />
  </div>

  <div data-testid="gb">
    <NaturalDateInput
      labelText="Datum"
      locale="de"
      timeZone="Europe/Berlin"
      value={new Date("2026-12-03T14:30:00Z")}
      {now}
    />
  </div>

  <!-- A box that cuts the calendar off, so the popover moves to a portal. -->
  <div data-testid="clipped" style="overflow: hidden; height: 6.5rem">
    <NaturalDateInput labelText="Clipped" {now} {timeZone} locale="en-US" />
  </div>

  <div data-testid="disabled">
    <NaturalDateInput
      labelText="Archived"
      disabled
      value="2026-01-02"
      {now}
      {timeZone}
    />
  </div>
</Stack>
