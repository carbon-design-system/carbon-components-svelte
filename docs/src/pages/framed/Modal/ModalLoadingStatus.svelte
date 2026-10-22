<script>
  import { Button, Checkbox, Modal } from "carbon-components-svelte";

  let open = false;
  let failSave = false;
  let loadingStatus = "inactive";

  $: loadingDescription =
    loadingStatus === "error"
      ? "Save failed"
      : loadingStatus === "finished"
        ? "Saved"
        : "Saving...";

  async function save() {
    loadingStatus = "active";
    // For demo purposes only: simulate a network request.
    await new Promise((resolve) => setTimeout(resolve, 1500));
    loadingStatus = failSave ? "error" : "finished";
    if (failSave) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      loadingStatus = "inactive";
    }
  }
</script>

<Button on:click={() => (open = true)}>Save changes</Button>

<Modal
  bind:open
  modalHeading="Save changes"
  primaryButtonText="Save"
  secondaryButtonText="Cancel"
  {loadingStatus}
  primaryButtonLoadingDescription={loadingDescription}
  preventCloseOnClickOutside={loadingStatus !== "inactive"}
  on:submit={save}
  on:click:button--secondary={() => (open = false)}
  on:loading:success={() => {
    open = false;
    loadingStatus = "inactive";
  }}
>
  <p>Save your changes to the Cloudant database configuration.</p>
  <Checkbox labelText="Simulate a failed save" bind:checked={failSave} />
</Modal>
