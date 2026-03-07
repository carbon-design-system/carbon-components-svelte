<script>
  import { Button, Modal } from "carbon-components-svelte";

  let open = false;
</script>

<button type="button" data-testid="open-modal" on:click={() => (open = true)}>
  Open modal
</button>

<Modal
  data-testid="modal"
  bind:open
  modalHeading="Modal title"
  primaryButtonText="Save"
  secondaryButtonText="Cancel"
>
  <p data-testid="modal-body">Modal content</p>
</Modal>
