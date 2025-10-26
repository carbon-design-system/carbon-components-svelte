<script>
  import {
    Button,
    ComposedModal,
    InlineNotification,
    ModalBody,
    ModalFooter,
    ModalHeader,
  } from "carbon-components-svelte";

  let open = false;
  let hasUnsavedChanges = true;
  let showWarning = false;
</script>

<Button
  on:click={() => {
    open = true;
    hasUnsavedChanges = true;
    showWarning = false;
  }}>Open modal with unsaved changes</Button
>

<ComposedModal
  bind:open
  on:close={(e) => {
    console.log("Close triggered by:", e.detail.trigger);
    if (hasUnsavedChanges) {
      e.preventDefault();
      showWarning = true;
    }
  }}
  on:submit={() => {
    hasUnsavedChanges = false;
    open = false;
  }}
>
  <ModalHeader title="Edit profile" />
  <ModalBody>
    {#if showWarning}
      <InlineNotification
        kind="warning"
        title="Unsaved changes"
        subtitle="Please save or discard your changes before closing."
        hideCloseButton
      />
    {/if}
    <p>You have unsaved changes. Click "Save" to apply them.</p>
  </ModalBody>
  <ModalFooter
    primaryButtonText="Save"
    secondaryButtonText="Discard changes"
    on:click:button--secondary={async () => {
      hasUnsavedChanges = false;
      showWarning = false;
      open = false;
    }}
  />
</ComposedModal>
