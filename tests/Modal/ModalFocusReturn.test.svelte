<script lang="ts">
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";
  import type { ComponentProps } from "svelte";

  export let moveFocusOnClose = false;
  export let passiveModal = false;
  export let hideCloseButton = false;
  export let returnFocusTo: ComponentProps<Modal>["returnFocusTo"] = null;

  let open = false;
  let elsewhere: HTMLInputElement;
</script>

<button type="button" on:click={() => (open = true)}>Open Modal</button>
<Modal
  bind:open
  modalHeading="Focus Return Test"
  primaryButtonText="Save"
  secondaryButtonText="Cancel"
  {passiveModal}
  {hideCloseButton}
  {returnFocusTo}
  on:close={() => {
    if (moveFocusOnClose) elsewhere.focus();
  }}
/>

<input aria-label="Elsewhere" bind:this={elsewhere}>
