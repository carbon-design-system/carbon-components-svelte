<script>
  import { NaturalDateInput, Stack } from "carbon-components-svelte";

  let remindAt = null;
  let hasTime = false;
</script>

<Stack gap={6}>
  <NaturalDateInput
    labelText="Remind me"
    helperText="Try tomorrow 9am, fri 3pm or eod"
    time="required"
    valueType="iso"
    bind:value={remindAt}
    bind:hasTime
  />
  <p>Saved as: <code>{remindAt ?? "nothing yet"}</code></p>
</Stack>
