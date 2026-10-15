<script>
  import {
    ComposedModal,
    Modal,
    ModalBody,
    ModalHeader,
  } from "carbon-components-svelte";

  // An open aria-modal dialog hides the rest of the page from the
  // accessibility tree, so each dialog gets its own page.
  const variant = new URLSearchParams(location.search).get("variant");
</script>

<p id="note">Extra note</p>
<p id="dialog-label">Delete project</p>

{#if variant === "modal"}
  <Modal
    open
    alert
    modalHeading="Delete"
    primaryButtonText="Delete"
    secondaryButtonText="Cancel"
    aria-labelledby="dialog-label"
    aria-describedby="note"
  >
    This cannot be undone.
  </Modal>
{:else}
  <ComposedModal open alert aria-describedby="note">
    <ModalHeader title="Remove member" />
    <ModalBody>They lose access today.</ModalBody>
  </ComposedModal>
{/if}
