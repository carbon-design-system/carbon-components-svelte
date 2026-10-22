<script>
  import {
    ComposedModal,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
  } from "carbon-components-svelte";

  let open = false;
  let composedOpen = false;
  /** @type {"inactive" | "active" | "finished" | "error"} */
  let loadingStatus = "inactive";
  let successCount = 0;
</script>

<button type="button" data-testid="open-modal" on:click={() => (open = true)}>
  Open modal
</button>
<button
  type="button"
  data-testid="open-composed-modal"
  on:click={() => (composedOpen = true)}
>
  Open composed modal
</button>

<Modal
  data-testid="modal"
  bind:open
  modalLabel="Account settings"
  modalHeading="Save changes"
  primaryButtonText="Save"
  secondaryButtonText="Cancel"
  primaryButtonLoadingDescription="Saving"
  {loadingStatus}
  on:loading:success={() => (successCount += 1)}
>
  <p>Save your changes to the Cloudant database configuration.</p>
  <p data-testid="success-count">{successCount}</p>
  {#each ["inactive", "active", "finished", "error"] as status (status)}
    <button
      type="button"
      data-testid="status-{status}"
      on:click={() => (loadingStatus = status)}
    >
      Set {status}
    </button>
  {/each}
</Modal>

<ComposedModal
  data-testid="composed-modal"
  bind:open={composedOpen}
  selectorPrimaryFocus="#workspace-name"
>
  <ModalHeader label="Account settings" title="Rename workspace" />
  <ModalBody>
    <label for="workspace-name">Workspace name</label>
    <input id="workspace-name" value="Cloudant team">
  </ModalBody>
  <ModalFooter
    primaryButtonText="Rename"
    secondaryButtonText="Cancel"
    loadingStatus="active"
  />
</ComposedModal>
