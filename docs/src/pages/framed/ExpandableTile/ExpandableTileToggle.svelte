<script>
  import { Checkbox, ExpandableTile, Stack } from "carbon-components-svelte";

  let acknowledged = false;
  let lastToggle = "None yet";
</script>

<Stack gap={5}>
  <Checkbox
    labelText="I understand this incident report contains customer data"
    bind:checked={acknowledged}
  />
  <div>Last toggle: <strong>{lastToggle}</strong></div>
  <ExpandableTile
    tileCollapsedLabel="View details"
    tileExpandedLabel="Hide details"
    on:toggle={(e) => {
      const { expanded } = e.detail;
      // Keep the details hidden until the reader acknowledges the notice.
      if (expanded && !acknowledged) {
        e.preventDefault();
        lastToggle = "Blocked until acknowledged";
        return;
      }
      lastToggle = expanded ? "Expanded" : "Collapsed";
    }}
  >
    <svelte:fragment slot="above">
      INC-2041: Payments API elevated error rate
    </svelte:fragment>
    <svelte:fragment slot="below">
      312 merchant accounts affected. Root cause: an expired TLS certificate on
      the card vault proxy, rotated at 14:32 UTC.
    </svelte:fragment>
  </ExpandableTile>
</Stack>
