<script>
  import { Button, ConfirmModal } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Leave page</Button>

<ConfirmModal
  bind:open
  kind="warning"
  title="You have unsaved changes"
  confirmText="Leave"
  cancelText="Stay"
>
  <p>Changes you made will be lost if you leave this page.</p>
</ConfirmModal>
