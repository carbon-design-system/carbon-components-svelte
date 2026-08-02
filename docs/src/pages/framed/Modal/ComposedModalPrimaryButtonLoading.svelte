<script>
  import {
    Button,
    ComposedModal,
    ModalBody,
    ModalFooter,
    ModalHeader,
  } from "carbon-components-svelte";

  let open = false;
  let saving = false;

  function onSave() {
    saving = true;
    setTimeout(() => {
      saving = false;
      open = false;
    }, 2000);
  }
</script>

<Button on:click={() => (open = true)}>Save changes</Button>

<ComposedModal bind:open preventCloseOnClickOutside={saving} on:submit={onSave}>
  <ModalHeader title="Save changes" />
  <ModalBody>
    <p>Save your changes to the Cloudant database configuration.</p>
  </ModalBody>
  <ModalFooter
    primaryButtonText="Save"
    secondaryButtonText="Cancel"
    primaryButtonLoading={saving}
    primaryButtonLoadingDescription="Saving..."
  />
</ComposedModal>
