<script>
  import { Stack, TransferList } from "carbon-components-svelte";

  const items = [
    { id: "billing", text: "Billing administrator" },
    { id: "audit", text: "Audit log viewer" },
    { id: "deploy", text: "Deploy to production" },
    { id: "keys", text: "Manage API keys" },
    { id: "sso", text: "Configure single sign-on", disabled: true },
  ];
</script>

<Stack gap={7}>
  <TransferList
    {items}
    selectedIds={["audit", "keys"]}
    filterable
    rows={4}
    legendText="Default"
    helperText="Reorder the selected permissions by priority."
  />
  <TransferList
    {items}
    selectedIds={["audit"]}
    rows={4}
    disabled
    legendText="Disabled"
  />
  <TransferList
    {items}
    selectedIds={["audit"]}
    rows={4}
    invalid
    invalidText="Select at most 2 permissions."
    helperText="Reorder the selected permissions by priority."
    legendText="Invalid"
  />
</Stack>
