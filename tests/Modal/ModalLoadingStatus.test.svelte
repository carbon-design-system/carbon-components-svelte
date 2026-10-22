<script lang="ts">
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";
  import type { ComponentProps } from "svelte";

  export let loadingStatus: ComponentProps<Modal>["loadingStatus"] = "inactive";
  export let primaryButtonLoading = false;
  export let primaryButtonLoadingIconDescription: ComponentProps<Modal>["primaryButtonLoadingIconDescription"] =
    undefined;
  export let secondaryButtons: ComponentProps<Modal>["secondaryButtons"] = [];
  export let onsubmit: (() => void) | undefined = undefined;
  export let onsecondary: (() => void) | undefined = undefined;
  export let onloadingsuccess: (() => void) | undefined = undefined;
</script>

<Modal
  open
  modalHeading="Save changes"
  primaryButtonText="Save"
  secondaryButtonText="Cancel"
  primaryButtonLoadingDescription="Saving"
  selectorPrimaryFocus={null}
  {loadingStatus}
  {primaryButtonLoading}
  {primaryButtonLoadingIconDescription}
  {secondaryButtons}
  on:submit={() => onsubmit?.()}
  on:click:button--secondary={() => onsecondary?.()}
  on:loading:success={() => onloadingsuccess?.()}
>
  <input data-testid="field">
</Modal>
