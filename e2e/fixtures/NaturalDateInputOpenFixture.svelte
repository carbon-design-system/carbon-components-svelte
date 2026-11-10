<script>
  import { NaturalDateInput } from "carbon-components-svelte";

  // A fixed clock: Thursday, November 12, 2026, 10:30 in New York.
  const now = "2026-11-12T15:30:00Z";
</script>

<div style="min-height: 26rem">
  <NaturalDateInput
    labelText="Due date"
    value="2026-11-18"
    open
    {now}
    timeZone="America/New_York"
    locale="en-US"
  />
</div>
