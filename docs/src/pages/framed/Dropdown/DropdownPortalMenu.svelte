<script>
  import { Button, Dropdown, Modal } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Open modal</Button>

<Modal
  bind:open
  size="sm"
  modalHeading="Add a contact"
  primaryButtonText="Add"
  secondaryButtonText="Cancel"
  on:click:button--secondary={() => (open = false)}
>
  <Dropdown
    portalMenu
    labelText="Preferred channel"
    selectedId="0"
    items={[
      { id: "0", text: "Slack" },
      { id: "1", text: "Email" },
      { id: "2", text: "Fax" },
      { id: "3", text: "Teams" },
      { id: "4", text: "Phone" },
    ]}
  />
</Modal>
