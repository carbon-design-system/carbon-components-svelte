<script>
  import { Button, Modal } from "carbon-components-svelte";

  let open = false;
</script>

<Button kind="danger" on:click={() => (open = true)}>Delete all</Button>

<Modal
  alert
  danger
  bind:open
  modalHeading="Delete all instances"
  primaryButtonText="Delete"
  secondaryButtonText="Cancel"
  on:click:button--secondary={() => (open = false)}
>
  <p>This is a permanent action and cannot be undone.</p>
</Modal>
