<script>
  import { Button, Modal, TreeSelect } from "carbon-components-svelte";

  const nodes = [
    {
      id: "billing",
      text: "Billing",
      nodes: [
        { id: "invoices", text: "Invoices" },
        { id: "payments", text: "Payments" },
      ],
    },
    {
      id: "admin",
      text: "Administration",
      nodes: [
        { id: "users", text: "Users" },
        { id: "roles", text: "Roles" },
      ],
    },
  ];

  let open = false;
  let checkedIds = [];
</script>

<Button on:click={() => (open = true)}>Choose permissions</Button>

<Modal
  bind:open
  modalHeading="Permissions"
  primaryButtonText="Done"
  secondaryButtonText="Cancel"
  on:click:button--secondary={() => (open = false)}
  on:submit={() => (open = false)}
>
  <TreeSelect
    labelText="Permissions"
    label="Choose permissions"
    {nodes}
    selectionMode="checkbox"
    expandedIds={["billing"]}
    bind:checkedIds
  />
</Modal>
