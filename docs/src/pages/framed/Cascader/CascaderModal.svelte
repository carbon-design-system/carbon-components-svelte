<script>
  import { Button, Cascader, Modal } from "carbon-components-svelte";

  const nodes = [
    {
      id: "billing",
      text: "Billing",
      nodes: [
        {
          id: "invoices",
          text: "Invoices",
          nodes: [
            { id: "view", text: "View" },
            { id: "send", text: "Send" },
          ],
        },
        {
          id: "payments",
          text: "Payments",
          nodes: [{ id: "refund", text: "Refund" }],
        },
      ],
    },
    {
      id: "admin",
      text: "Administration",
      nodes: [
        {
          id: "users",
          text: "Users",
          nodes: [{ id: "invite", text: "Invite" }],
        },
      ],
    },
  ];

  let open = false;
  let value = [];
</script>

<Button on:click={() => (open = true)}>Choose a permission</Button>

<Modal
  bind:open
  modalHeading="Permission"
  primaryButtonText="Done"
  secondaryButtonText="Cancel"
  on:click:button--secondary={() => (open = false)}
  on:submit={() => (open = false)}
>
  <Cascader
    labelText="Permission"
    label="Choose a permission"
    {nodes}
    bind:value
  />
</Modal>
<p>Value: {JSON.stringify(value)}</p>
