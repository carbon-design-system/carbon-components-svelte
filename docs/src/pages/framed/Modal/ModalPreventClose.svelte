<script>
  import { Button, InlineNotification, Modal } from "carbon-components-svelte";

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

<Modal
  bind:open
  modalHeading="Edit profile"
  primaryButtonText="Save"
  secondaryButtonText="Discard changes"
  on:click:button--secondary={() => {
    hasUnsavedChanges = false;
    open = false;
  }}
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
  {#if showWarning}
    <InlineNotification
      kind="warning"
      title="Unsaved changes"
      subtitle="Please save or discard your changes before closing."
      hideCloseButton
    />
  {/if}
  <p>You have unsaved changes. Click "Save" to apply them.</p>
</Modal>
