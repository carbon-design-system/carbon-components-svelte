<script>
  import {
    Button,
    Checkbox,
    ComposedModal,
    ModalBody,
    ModalFooter,
    ModalHeader,
  } from "carbon-components-svelte";

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

<ComposedModal
  bind:open
  preventCloseOnClickOutside={loadingStatus !== "inactive"}
  on:submit={save}
>
  <ModalHeader title="Save changes" />
  <ModalBody>
    <p>Save your changes to the Cloudant database configuration.</p>
    <Checkbox labelText="Simulate a failed save" bind:checked={failSave} />
  </ModalBody>
  <ModalFooter
    primaryButtonText="Save"
    secondaryButtonText="Cancel"
    {loadingStatus}
    primaryButtonLoadingDescription={loadingDescription}
    on:loading:success={() => {
      open = false;
      loadingStatus = "inactive";
    }}
  />
</ComposedModal>
