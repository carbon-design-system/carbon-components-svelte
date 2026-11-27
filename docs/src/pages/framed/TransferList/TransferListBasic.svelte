<script>
  import { Stack, TransferList } from "carbon-components-svelte";

  const items = [
    { id: "billing", text: "Billing administrator" },
    { id: "audit", text: "Audit log viewer" },
    { id: "deploy", text: "Deploy to production" },
    { id: "keys", text: "Manage API keys" },
    { id: "members", text: "Invite members" },
    { id: "alerts", text: "Edit alert rules" },
    { id: "backups", text: "Restore backups" },
    { id: "quota", text: "Raise usage quota" },
    { id: "support", text: "Open support cases" },
    { id: "domains", text: "Verify domains" },
  ];

  let selectedIds = ["audit", "alerts"];
</script>

<Stack gap={5}>
  <TransferList
    {items}
    bind:selectedIds
    legendText="Workspace permissions"
    helperText="The selected permissions apply to every member of the workspace."
  />
  <p>Selected: {selectedIds.join(", ") || "none"}</p>
</Stack>
