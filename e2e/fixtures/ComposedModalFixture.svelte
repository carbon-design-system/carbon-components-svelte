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

<button type="button" data-testid="open-modal" on:click={() => (open = true)}>
  Open modal
</button>

<ComposedModal bind:open>
  <ModalHeader title="Modal title" />
  <ModalBody>
    <p data-testid="modal-body">Modal content</p>
    <input
      type="text"
      data-modal-primary-focus
      data-testid="modal-primary-focus"
      aria-label="Primary focus input"
    >
  </ModalBody>
  <ModalFooter>
    <Button data-testid="close-modal" on:click={() => (open = false)}>
      Close
    </Button>
  </ModalFooter>
</ComposedModal>
