<script>
  import { Button, ConfirmModal } from "carbon-components-svelte";

  let open = false;
</script>

<Button kind="danger" on:click={() => (open = true)}>Delete project</Button>

<ConfirmModal
  bind:open
  title="Delete this project?"
  confirmText="Delete"
  confirmationPhrase="delete-project"
>
  <p>All resources associated with this project will be permanently removed.</p>
</ConfirmModal>
