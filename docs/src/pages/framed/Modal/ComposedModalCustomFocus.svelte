<script>
  import {
    Button,
    ComposedModal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Stack,
    TextInput,
  } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Create database</Button>

<ComposedModal
  bind:open
  selectorPrimaryFocus="#advanced-options"
  on:submit={() => (open = false)}
>
  <ModalHeader title="Create database" />
  <ModalBody>
    <Stack gap={3}>
      <p>Create a new Cloudant database in the US South region.</p>
      <TextInput
        id="db-name"
        labelText="Database name"
        placeholder="Enter database name..."
      />
      <Button id="advanced-options" kind="ghost" size="small">
        Advanced options
      </Button>
    </Stack>
  </ModalBody>
  <ModalFooter
    primaryButtonText="Confirm"
    secondaryButtonText="Cancel"
    on:click:button--secondary={() => (open = false)}
  />
</ComposedModal>
