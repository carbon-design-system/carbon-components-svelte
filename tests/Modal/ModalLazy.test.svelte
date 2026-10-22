<script lang="ts">
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";

  export let open = false;
</script>

<Modal
  lazy
  bind:open
  modalHeading="Rename project"
  primaryButtonText="Save"
  secondaryButtonText="Cancel"
>
  <label>
    Name
    <input data-modal-primary-focus>
  </label>
</Modal>
