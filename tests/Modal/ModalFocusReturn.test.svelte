<script lang="ts">
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";

  export let moveFocusOnClose = false;

  let open = false;
  let elsewhere: HTMLInputElement;
</script>

<button type="button" on:click={() => (open = true)}>Open Modal</button>
<Modal
  bind:open
  modalHeading="Focus Return Test"
  primaryButtonText="Save"
  secondaryButtonText="Cancel"
  on:close={() => {
    if (moveFocusOnClose) elsewhere.focus();
  }}
/>

<input aria-label="Elsewhere" bind:this={elsewhere}>
