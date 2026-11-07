<script>
  import { PermissionsMatrix } from "carbon-components-svelte";

  const roles = [
    { id: "member", label: "Member" },
    { id: "contractor", label: "Contractor", parent: "member" },
    {
      id: "owner",
      label: "Owner",
      locked: "The owner keeps every permission",
    },
  ];

  const permissions = [
    {
      id: "data",
      label: "Customer data",
      children: [
        { id: "data.view", label: "View records" },
        { id: "data.export", label: "Export records" },
        {
          id: "data.delete",
          label: "Delete records",
          locked: "Deleting needs approval",
        },
      ],
    },
    { id: "billing", label: "Billing" },
  ];

  let value = {
    member: { "data.view": true },
    owner: {
      "data.view": true,
      "data.export": true,
      "data.delete": true,
      billing: true,
    },
  };

  // A policy decides, so the reason comes from a function.
  function lockReason(role, permission) {
    if (role.id === "contractor" && permission.id === "data.export") {
      return "Contractors cannot export under the data processing agreement";
    }
  }
</script>

<PermissionsMatrix
  bind:value
  labelText="Access policy"
  {roles}
  {permissions}
  {lockReason}
  height={360}
/>
