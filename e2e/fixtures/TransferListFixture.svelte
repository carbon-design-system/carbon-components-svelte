<script>
  import { Button, TransferList } from "carbon-components-svelte";

  const items = [
    { id: "billing", text: "Billing administrator" },
    { id: "audit", text: "Audit log viewer" },
    { id: "deploy", text: "Deploy to production" },
    { id: "keys", text: "Manage API keys" },
    { id: "members", text: "Invite members" },
    { id: "alerts", text: "Edit alert rules" },
    { id: "backups", text: "Restore backups" },
    { id: "sso", text: "Configure single sign-on", disabled: true },
    { id: "quota", text: "Raise usage quota" },
    { id: "support", text: "Open support cases" },
    { id: "export", text: "Export workspace data" },
    { id: "domains", text: "Verify domains" },
  ];

  let selectedIds = ["audit", "alerts"];
  let formData = "";
</script>

<form
  data-testid="form"
  on:submit|preventDefault={(event) => {
    const data = new FormData(event.currentTarget);
    formData = JSON.stringify(data.getAll("permissions"));
  }}
>
  <TransferList
    {items}
    bind:selectedIds
    filterable
    name="permissions"
    legendText="Workspace permissions"
    helperText="Reorder the selected permissions by priority."
  />
  <Button type="submit">Save</Button>
  <Button type="reset" kind="secondary">Reset</Button>
</form>
<p data-testid="selected">{selectedIds.join(",")}</p>
<p data-testid="form-data">{formData}</p>
