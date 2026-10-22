<script lang="ts">
  import ComposedModal from "carbon-components-svelte/ComposedModal/ComposedModal.svelte";
  import ModalBody from "carbon-components-svelte/ComposedModal/ModalBody.svelte";
  import ModalFooter from "carbon-components-svelte/ComposedModal/ModalFooter.svelte";
  import ModalHeader from "carbon-components-svelte/ComposedModal/ModalHeader.svelte";
  import type { ComponentProps } from "svelte";

  export let loadingStatus: ComponentProps<ModalFooter>["loadingStatus"] =
    "inactive";
  export let primaryButtonLoading = false;
  export let onsubmit: (() => void) | undefined = undefined;
  export let onsecondary: (() => void) | undefined = undefined;
  export let onloadingsuccess: (() => void) | undefined = undefined;
</script>

<ComposedModal open selectorPrimaryFocus={null} on:submit={() => onsubmit?.()}>
  <ModalHeader title="Save changes" />
  <ModalBody>Save your changes.</ModalBody>
  <ModalFooter
    primaryButtonText="Save"
    secondaryButtonText="Cancel"
    primaryButtonLoadingDescription="Saving"
    {loadingStatus}
    {primaryButtonLoading}
    on:click:button--secondary={() => onsecondary?.()}
    on:loading:success={() => onloadingsuccess?.()}
  />
</ComposedModal>
