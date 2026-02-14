<script>
  import {
    Button,
    ComboBox,
    Dropdown,
    Modal,
    MultiSelect,
    Portal,
    Stack,
  } from "carbon-components-svelte";

  let open = false;

  const contactItems = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
    { id: "3", text: "Teams" },
    { id: "4", text: "Phone" },
  ];
</script>

<Button on:click={() => (open = true)}>Open modal</Button>

<Portal>
  <Modal
    bind:open
    size="sm"
    modalHeading="Add a contact"
    primaryButtonText="Add"
    secondaryButtonText="Cancel"
    on:click:button--secondary={() => (open = false)}
  >
    <Stack gap={4}>
      <ComboBox
        portalMenu
        light
        labelText="Contact method"
        placeholder="Select contact method"
        items={contactItems}
      />
      <Dropdown
        portalMenu
        labelText="Preferred channel"
        selectedId="0"
        items={contactItems}
      />
      <MultiSelect
        portalMenu
        labelText="Notification methods"
        label="Select methods..."
        items={contactItems}
      />
    </Stack>
  </Modal>
</Portal>
