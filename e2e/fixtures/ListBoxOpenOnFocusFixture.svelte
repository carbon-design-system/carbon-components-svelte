<script lang="ts">
  import {
    ComboBox,
    Modal,
    MultiSelect,
    Stack,
  } from "carbon-components-svelte";

  let open = false;

  const items = [
    { id: "0", text: "Production" },
    { id: "1", text: "Staging" },
    { id: "2", text: "Development" },
  ];
</script>

<button type="button" data-testid="open-modal" on:click={() => (open = true)}>
  Open modal
</button>

<!-- The Modal focuses its first field when it opens. -->
<Modal
  bind:open
  modalHeading="Deploy"
  primaryButtonText="Deploy"
  secondaryButtonText="Cancel"
  on:click:button--secondary={() => (open = false)}
>
  <Stack gap={4}>
    <MultiSelect
      filterable
      openOnFocus
      labelText="Environments"
      placeholder="Filter environments"
      {items}
    />
    <ComboBox
      openOnFocus
      labelText="Region"
      placeholder="Select a region"
      {items}
    />
  </Stack>
</Modal>
