<script>
  import {
    Button,
    ComposedModal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Tag,
  } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Create database</Button>

<ComposedModal bind:open on:submit={() => (open = false)}>
  <ModalHeader title="Create database">
    <Tag type="green" size="sm">Beta</Tag>
  </ModalHeader>
  <ModalBody>
    <p>Create a new Cloudant database in the US South region.</p>
  </ModalBody>
  <ModalFooter
    primaryButtonText="Confirm"
    secondaryButtonText="Cancel"
    on:click:button--secondary={() => (open = false)}
  />
</ComposedModal>
