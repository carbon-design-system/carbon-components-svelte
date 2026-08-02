<script>
  import {
    Button,
    ComposedModal,
    ModalBody,
    ModalFooter,
    ModalHeader,
  } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Review terms</Button>

<ComposedModal
  bind:open
  preventCloseOnClickOutside
  on:submit={() => (open = false)}
>
  <ModalHeader title="Accept terms of use" hideCloseButton />
  <ModalBody>
    <p>
      You must accept or decline the terms. The header close button is hidden,
      so use the footer actions to leave this dialog.
    </p>
  </ModalBody>
  <ModalFooter
    primaryButtonText="Accept"
    secondaryButtonText="Decline"
    on:click:button--secondary={() => (open = false)}
  />
</ComposedModal>
