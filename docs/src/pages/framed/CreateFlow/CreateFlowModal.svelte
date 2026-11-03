<script>
  import {
    Button,
    ComposedModal,
    Content,
    CreateFlowActions,
    CreateFlowForm,
    CreateFlowStep,
    CreateFlowSteps,
    createStepFlow,
    createUnsavedChanges,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
    TextInput,
    UnsavedChangesPrompt,
  } from "carbon-components-svelte";

  let open = true;
  let name = "";
  let subnet = "";
  let errors = {};

  const unsaved = createUnsavedChanges();
  const flow = createStepFlow({
    steps: [
      { id: "details", label: "Details" },
      { id: "networking", label: "Networking" },
      { id: "review", label: "Review" },
    ],
    validate(step) {
      errors = {};
      if (step.id === "details" && !name) errors.name = "Enter a name.";
      if (step.id === "networking" && !subnet) {
        errors.subnet = "Choose a subnet.";
      }
      return Object.keys(errors).length === 0;
    },
    submit: () => new Promise((resolve) => setTimeout(resolve, 300)),
    unsavedChanges: unsaved,
  });

  const guardClose = unsaved.closeGuard(() => {
    open = false;
  });
</script>

<Content>
  <Button on:click={() => (open = true)}>Add a server</Button>
</Content>

<ComposedModal bind:open size="lg" on:close={guardClose}>
  <ModalHeader title="Add a server" />
  <ModalBody>
    <CreateFlowSteps {flow} vertical={false} />
    <CreateFlowForm {flow} unsavedChanges={unsaved}>
      <CreateFlowStep {flow} id="details">
        <TextInput
          labelText="Name"
          data-modal-primary-focus
          bind:value={name}
          invalid={Boolean(errors.name)}
          invalidText={errors.name}
        />
      </CreateFlowStep>
      <CreateFlowStep {flow} id="networking">
        <Select
          labelText="Subnet"
          bind:selected={subnet}
          invalid={Boolean(errors.subnet)}
          invalidText={errors.subnet}
        >
          <SelectItem value="" text="Choose a subnet" />
          <SelectItem value="10.240.0.0/24" text="10.240.0.0/24" />
        </Select>
      </CreateFlowStep>
      <CreateFlowStep {flow} id="review">
        <p>{name} on {subnet}</p>
      </CreateFlowStep>
      <p slot="submitted">{name} was added.</p>
    </CreateFlowForm>
  </ModalBody>
  <ModalFooter>
    <CreateFlowActions
      {flow}
      submitText="Add"
      on:cancel={() => guardClose()}
      on:done={() => (open = false)}
    />
  </ModalFooter>
</ComposedModal>

<UnsavedChangesPrompt store={unsaved} />
