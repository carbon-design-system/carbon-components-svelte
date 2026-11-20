<script>
  import {
    Button,
    ComboBox,
    DatePicker,
    DatePickerInput,
    Dropdown,
    Modal,
    OverflowMenu,
    OverflowMenuItem,
    Portal,
    Stack,
    Tearsheet,
    TextInput,
  } from "carbon-components-svelte";

  // `?size=narrow`, `?passive` (no actions), `?long` (scrolling body),
  // `?closed`, `?modal` (a Modal inside the tearsheet) and `?inmodal` (a
  // Tearsheet inside a Modal, rendered through a Portal).
  const params = new URLSearchParams(location.search);
  const size = params.get("size") === "narrow" ? "narrow" : "wide";
  const passive = params.has("passive");
  const long = params.has("long");
  const withModal = params.has("modal");
  const inModal = params.has("inmodal");

  let open = !params.has("closed") && !inModal;
  let modalOpen = false;
  let outerModalOpen = inModal;
  let closeTriggers = [];

  const items = [
    { id: "0", text: "PostgreSQL" },
    { id: "1", text: "Snowflake" },
    { id: "2", text: "BigQuery" },
  ];
</script>

<button type="button" data-testid="open" on:click={() => (open = true)}>
  Open tearsheet
</button>
<p data-testid="close-triggers">{closeTriggers.join(",")}</p>
<p>Integrations</p>

{#if passive}
  <!-- An empty \`actions\` slot still makes a tearsheet transactional, so a
       passive one leaves the slot out. -->
  <Tearsheet
    bind:open
    {size}
    titleText="Create integration"
    descriptionText="Connect a data source and map its fields."
    on:close={(event) =>
      (closeTriggers = [...closeTriggers, event.detail.trigger])}
  >
    <TextInput labelText="Connection name" />
  </Tearsheet>
{:else if !inModal}
  <Tearsheet
    bind:open
    {size}
    titleText="Create integration"
    labelText="Step 2 of 4"
    descriptionText="Connect a data source and map its fields."
    on:close={(event) =>
      (closeTriggers = [...closeTriggers, event.detail.trigger])}
  >
    <svelte:fragment slot="headerActions">
      <Button kind="ghost" size="small">Preview</Button>
    </svelte:fragment>
    <Stack gap={5}>
      <TextInput labelText="Connection name" data-modal-primary-focus />
      <Dropdown
        labelText="Source"
        selectedId="0"
        {items}
        data-testid="dropdown"
      />
      <ComboBox labelText="Target" placeholder="Choose a target" {items} />
      <DatePicker datePickerType="single">
        <DatePickerInput labelText="Start date" placeholder="mm/dd/yyyy" />
      </DatePicker>
      <OverflowMenu aria-label="More options" data-testid="overflow">
        <OverflowMenuItem text="Rename" />
        <OverflowMenuItem text="Duplicate" />
      </OverflowMenu>
      {#if withModal}
        <Button on:click={() => (modalOpen = true)}>Discard changes</Button>
        <Modal
          bind:open={modalOpen}
          size="xs"
          modalHeading="Discard changes?"
          primaryButtonText="Discard"
          secondaryButtonText="Keep editing"
          on:click:button--secondary={() => (modalOpen = false)}
        >
          <p>Unsaved mappings are lost.</p>
        </Modal>
      {/if}
      {#if long}
        {#each Array.from({ length: 24 }, (_, index) => index) as index (index)}
          <TextInput labelText="Field mapping {index + 1}" />
        {/each}
      {/if}
    </Stack>
    <svelte:fragment slot="actions">
      <Button kind="secondary" on:click={() => (open = false)}>Cancel</Button>
      <Button>Next</Button>
    </svelte:fragment>
  </Tearsheet>
{/if}

{#if inModal}
  <Modal bind:open={outerModalOpen} modalHeading="Add a source" passiveModal>
    <Button data-testid="open-inner" on:click={() => (open = true)}>
      Configure in a tearsheet
    </Button>
    <Portal>
      <Tearsheet bind:open titleText="Configure source" size="narrow">
        <TextInput labelText="Host" />
      </Tearsheet>
    </Portal>
  </Modal>
{/if}
