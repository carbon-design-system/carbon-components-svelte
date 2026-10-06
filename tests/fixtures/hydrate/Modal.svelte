<script>
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";
</script>

<Modal
  open
  modalHeading="Create database"
  primaryButtonText="Add"
  secondaryButtonText="Cancel"
  {...$$restProps}
>
  <p>Create a new Cloudant database in the US South region.</p>
</Modal>
