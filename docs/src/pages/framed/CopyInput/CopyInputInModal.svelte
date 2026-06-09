<script>
  import { Button, CopyInput, Modal } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Open modal</Button>

<Modal
  bind:open
  modalHeading="API credentials"
  primaryButtonText="Done"
  secondaryButtonText="Cancel"
  on:click:button--secondary={() => (open = false)}
>
  <CopyInput labelText="API token" value="sk-1234567890abcdef" />
</Modal>
