<script>
  import {
    Button,
    ComboBox,
    Content,
    DatePicker,
    DatePickerInput,
    Dropdown,
    Modal,
    OverflowMenu,
    OverflowMenuItem,
    Stack,
    Tearsheet,
  } from "carbon-components-svelte";

  let open = true;
  let confirmOpen = false;

  const regions = [
    { id: "us-east", text: "US East" },
    { id: "eu-central", text: "EU Central" },
    { id: "ap-south", text: "AP South" },
  ];
</script>

<Content>
  <Button on:click={() => (open = true)}>Schedule a backup</Button>
</Content>

<Tearsheet bind:open titleText="Schedule a backup" preventCloseOnClickOutside>
  <Stack gap={6}>
    <Dropdown labelText="Region" selectedId="us-east" items={regions} />
    <ComboBox
      labelText="Replicate to"
      placeholder="Choose a region"
      items={regions}
    />
    <DatePicker datePickerType="single">
      <DatePickerInput labelText="Start date" placeholder="mm/dd/yyyy" />
    </DatePicker>
    <OverflowMenu aria-label="More options">
      <OverflowMenuItem text="Copy schedule" />
      <OverflowMenuItem text="Export as JSON" />
    </OverflowMenu>
  </Stack>
  <svelte:fragment slot="actions">
    <Button kind="secondary" on:click={() => (confirmOpen = true)}>
      Discard
    </Button>
    <Button on:click={() => (open = false)}>Schedule</Button>
  </svelte:fragment>

  <Modal
    bind:open={confirmOpen}
    size="xs"
    modalHeading="Discard this schedule?"
    primaryButtonText="Discard"
    secondaryButtonText="Keep editing"
    on:click:button--secondary={() => (confirmOpen = false)}
    on:click:button--primary={() => {
      confirmOpen = false;
      open = false;
    }}
  >
    <p>Nothing has been scheduled yet.</p>
  </Modal>
</Tearsheet>
