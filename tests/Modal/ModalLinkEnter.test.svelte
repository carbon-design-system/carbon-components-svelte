<script lang="ts">
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";

  export let open = true;
  export let shouldSubmitOnEnter = true;
  export let onsubmit: ((event: CustomEvent) => void) | undefined = undefined;
  export let onclickbuttonprimary: ((event: CustomEvent) => void) | undefined =
    undefined;
</script>

<Modal
  bind:open
  modalHeading="Link Modal"
  primaryButtonText="Save"
  secondaryButtonText="Cancel"
  {shouldSubmitOnEnter}
  on:submit={(e) => onsubmit?.(e)}
  on:click:button--primary={(e) => onclickbuttonprimary?.(e)}
>
  <a href="#details" data-testid="modal-link">Learn more</a>
  <input data-testid="modal-input">
</Modal>
