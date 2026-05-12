<script>
  import { Button, CopyButton, Modal } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Open modal</Button>

<Modal
  bind:open
  modalHeading="Copy example"
  primaryButtonText="Done"
  secondaryButtonText="Cancel"
  on:click:button--secondary={() => (open = false)}
>
  <CopyButton text="Carbon svelte" />
</Modal>
