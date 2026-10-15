<script>
  import { Button, ConfirmModal } from "carbon-components-svelte";

  let open = false;
  let deleting = false;

  function handleConfirm() {
    deleting = true;
    setTimeout(() => {
      deleting = false;
      open = false;
    }, 300);
  }
</script>

<Button kind="danger" on:click={() => (open = true)}>Delete account</Button>

<ConfirmModal
  bind:open
  heading="Delete your account?"
  confirmText="Delete"
  loading={deleting}
  closeOnConfirm={false}
  on:confirm={handleConfirm}
>
  <p>This will permanently delete your account and all of its data.</p>
</ConfirmModal>
