<script>
  import { Button, Modal } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Review terms</Button>

<Modal
  bind:open
  hideCloseButton
  preventCloseOnClickOutside
  modalHeading="Accept terms of use"
  primaryButtonText="Accept"
  secondaryButtonText="Decline"
  on:click:button--secondary={() => (open = false)}
  on:submit={() => (open = false)}
>
  <p>
    You must accept or decline the terms. The header close button is hidden, so
    use the footer actions to leave this dialog.
  </p>
</Modal>
