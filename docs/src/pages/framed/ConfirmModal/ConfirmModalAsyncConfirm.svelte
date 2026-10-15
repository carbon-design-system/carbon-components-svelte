<script>
  import { Button, ConfirmModal, Toggle } from "carbon-components-svelte";

  let open = false;
  let fail = false;

  const deleteAccount = () =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        if (fail) reject(new Error("The account has an unpaid invoice."));
        else resolve();
      }, 800);
    });
</script>

<Toggle labelText="Make the request fail" bind:toggled={fail} />

<br>

<Button kind="danger" on:click={() => (open = true)}>Delete account</Button>

<ConfirmModal
  bind:open
  heading="Delete your account?"
  confirmText="Delete"
  loadingDescription="Deleting"
  onConfirm={deleteAccount}
>
  <p>This will permanently delete your account and all of its data.</p>
</ConfirmModal>
