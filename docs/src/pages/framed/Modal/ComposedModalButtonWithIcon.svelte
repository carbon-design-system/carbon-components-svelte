<script>
  import {
    Button,
    ComposedModal,
    ModalBody,
    ModalFooter,
    ModalHeader,
  } from "carbon-components-svelte";
  import Send from "carbon-icons-svelte/lib/Send.svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Invite someone</Button>

<ComposedModal bind:open on:submit={() => (open = false)}>
  <ModalHeader title="Invite someone" />
  <ModalBody>
    <p>Do you really want to invite someone?</p>
  </ModalBody>
  <ModalFooter
    primaryButtonText="Send invitation"
    primaryButtonIcon={Send}
    secondaryButtonText="Cancel"
    on:click:button--secondary={() => (open = false)}
  />
</ComposedModal>
