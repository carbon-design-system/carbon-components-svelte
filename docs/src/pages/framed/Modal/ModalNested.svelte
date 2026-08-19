<script>
  import { Button, Modal, Portal } from "carbon-components-svelte";

  let open = false;
  let openConfirm = false;
</script>

<Button kind="danger-tertiary" on:click={() => (open = true)}>
  Delete database
</Button>

<Modal
  danger
  bind:open
  modalHeading="Delete database"
  primaryButtonText="Delete"
  secondaryButtonText="Cancel"
  on:click:button--secondary={() => (open = false)}
  on:submit={() => (openConfirm = true)}
>
  <p>This will permanently delete the database and all of its data.</p>

  <Portal>
    <Modal
      danger
      size="xs"
      bind:open={openConfirm}
      modalHeading="Are you absolutely sure?"
      primaryButtonText="Delete forever"
      secondaryButtonText="Cancel"
      on:click:button--secondary={() => (openConfirm = false)}
      on:submit={() => {
        openConfirm = false;
        open = false;
      }}
    >
      <p>This action cannot be undone.</p>
    </Modal>
  </Portal>
</Modal>
