<script>
  import { MultiSelect, Stack } from "carbon-components-svelte";
</script>

<Stack
  gap={4}
  style="overflow: hidden; border: 1px dashed var(--cds-border-subtle); padding: 1rem; max-height: 120px;"
>
  <div>
    This container has hidden overflow. Without <code>portalMenu</code>, the
    dropdown would be clipped.
  </div>
  <MultiSelect
    portalMenu
    labelText="Notification methods"
    label="Select methods..."
    items={[
      { id: "0", text: "Slack" },
      { id: "1", text: "Email" },
      { id: "2", text: "Fax" },
    ]}
  />
</Stack>
