<script>
  import {
    Button,
    createUnsavedChanges,
    Form,
    Modal,
    TextInput,
    trackUnsavedChanges,
    UnsavedChangesPrompt,
  } from "carbon-components-svelte";

  // Create one store per dialog so unrelated dialogs don't prompt each other.
  const unsaved = createUnsavedChanges({ beforeUnload: false });

  let open = false;
  let name = "Payments API";

  // A native `form.reset()` blanks a bound field, so assign the saved value.
  const close = unsaved.closeGuard(() => {
    open = false;
    name = "Payments API";
  });

  function save() {
    unsaved.markSaved();
    open = false;
  }
</script>

<Button on:click={() => (open = true)}>Edit service</Button>

<Modal
  bind:open
  modalHeading="Edit service"
  primaryButtonText="Save"
  secondaryButtons={[{ text: "Cancel" }]}
  on:close={close}
  on:click:button--secondary={() => close()}
  on:submit={save}
>
  <Form actions={[[trackUnsavedChanges, { store: unsaved }]]}>
    <TextInput labelText="Service name" bind:value={name} />
  </Form>
</Modal>

<UnsavedChangesPrompt store={unsaved} />
