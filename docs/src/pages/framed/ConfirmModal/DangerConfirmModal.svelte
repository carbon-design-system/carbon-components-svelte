<script>
  import { Button, ConfirmModal } from "carbon-components-svelte";

  let open = false;
</script>

<Button kind="danger" on:click={() => (open = true)}
  >Delete all instances</Button
>

<ConfirmModal
  bind:open
  kind="danger"
  heading="Delete all instances"
  confirmText="Delete"
>
  <p>This is a permanent action and cannot be undone.</p>
</ConfirmModal>
