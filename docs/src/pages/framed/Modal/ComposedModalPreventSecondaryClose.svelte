<script>
  import {
    Button,
    ComposedModal,
    InlineNotification,
    ModalBody,
    ModalFooter,
    ModalHeader,
    TextInput,
  } from "carbon-components-svelte";

  let open = false;
  let name = "Ada Lovelace";
  let draft = name;
  let showWarning = false;

  $: isDirty = draft !== name;
</script>

<Button
  on:click={() => {
    open = true;
    draft = name;
    showWarning = false;
  }}
>
  Edit name
</Button>

<ComposedModal
  bind:open
  on:submit={() => {
    name = draft;
    open = false;
  }}
>
  <ModalHeader title="Edit name" />
  <ModalBody hasForm>
    {#if showWarning}
      <InlineNotification
        kind="warning"
        title="Unsaved changes"
        subtitle="Save your changes, or keep editing. Cancel stays open while the form is dirty."
        hideCloseButton
      />
    {/if}
    <TextInput labelText="Name" bind:value={draft} />
  </ModalBody>
  <ModalFooter
    primaryButtonText="Save"
    secondaryButtonText="Cancel"
    on:click:button--secondary={(e) => {
      if (isDirty) {
        e.preventDefault();
        showWarning = true;
      }
    }}
  />
</ComposedModal>
