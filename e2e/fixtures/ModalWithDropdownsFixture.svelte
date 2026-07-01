<script>
  import {
    ComboBox,
    Dropdown,
    Modal,
    MultiSelect,
    Stack,
  } from "carbon-components-svelte";

  let open = false;
  let notificationIds = [];

  const contactItems = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
    { id: "3", text: "Teams" },
    { id: "4", text: "Phone" },
  ];
</script>

<button type="button" data-testid="open-modal" on:click={() => (open = true)}>
  Open modal
</button>

<!-- bind:selectedIds from MultiSelect. Outside the Modal so it stays on screen
     when the dialog closes; this pair failed to update during the bug. -->
<p data-testid="notification-ids">{[...notificationIds].sort().join(",")}</p>
<p data-testid="notification-count">{notificationIds.length}</p>

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
      light
      labelText="Contact method"
      placeholder="Select contact method"
      items={contactItems}
    />
    <Dropdown
      labelText="Preferred channel"
      selectedId="0"
      items={contactItems}
    />
    <MultiSelect
      labelText="Notification methods"
      label="Select methods..."
      items={contactItems}
      bind:selectedIds={notificationIds}
    />
  </Stack>
</Modal>
