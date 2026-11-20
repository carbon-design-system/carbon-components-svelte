<script>
  import { PermissionsMatrix } from "carbon-components-svelte";

  const roles = [
    { id: "viewer", label: "Viewer" },
    { id: "editor", label: "Editor", parent: "viewer" },
    { id: "admin", label: "Administrator", parent: "editor" },
    { id: "billing", label: "Billing manager" },
  ];

  const permissions = [
    {
      id: "billing",
      label: "Billing",
      children: [
        { id: "billing.view", label: "View invoices" },
        { id: "billing.pay", label: "Pay invoices" },
        { id: "billing.update", label: "Update payment method" },
      ],
    },
    {
      id: "projects",
      label: "Projects",
      children: [
        { id: "projects.view", label: "View projects" },
        { id: "projects.create", label: "Create projects" },
        { id: "projects.delete", label: "Delete projects" },
      ],
    },
    { id: "audit", label: "Read the audit log" },
  ];

  let value = {
    viewer: { "billing.view": true, "projects.view": true },
    editor: { "projects.create": true },
    billing: {
      "billing.view": true,
      "billing.pay": true,
      "billing.update": true,
    },
  };
</script>

<PermissionsMatrix
  bind:value
  labelText="Role permissions"
  {roles}
  {permissions}
  height={400}
/>
