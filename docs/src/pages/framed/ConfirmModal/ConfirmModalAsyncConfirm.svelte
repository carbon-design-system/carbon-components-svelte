<script>
  import {
    Button,
    ConfirmModal,
    InlineNotification,
  } from "carbon-components-svelte";

  let open = false;
  let error = "";

  // For demo purposes only: fails every other attempt.
  let attempts = 0;
  async function deleteAccount() {
    error = "";
    await new Promise((resolve) => setTimeout(resolve, 600));
    attempts += 1;
    if (attempts % 2 === 1) throw new Error("The server didn't respond.");
  }
</script>

<Button kind="danger" on:click={() => (open = true)}>Delete account</Button>

<ConfirmModal
  bind:open
  title="Delete your account?"
  confirmText="Delete"
  loadingDescription="Deleting"
  confirm={deleteAccount}
  on:confirm:error={(e) => {
    // The rejection can be any value; show its message when it's an Error.
    const reason = e.detail.error;
    error = reason instanceof Error ? reason.message : String(reason);
  }}
>
  <p>This will permanently delete your account and all of its data.</p>
  {#if error}
    <InlineNotification
      kind="error"
      title="Couldn't delete the account."
      subtitle={error}
      hideCloseButton
      lowContrast
    />
  {/if}
</ConfirmModal>
