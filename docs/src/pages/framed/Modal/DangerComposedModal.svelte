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

<Button kind="danger" on:click={() => (open = true)}>Delete all</Button>

<ComposedModal danger bind:open on:open on:close>
  <ModalHeader title="Delete all instances" />
  <ModalBody>
    <p>This is a permanent action and cannot be undone.</p>
  </ModalBody>
  <ModalFooter
    primaryButtonText="Delete"
    secondaryButtonText="Cancel"
    danger
    on:submit={() => (open = false)}
  />
</ComposedModal>
