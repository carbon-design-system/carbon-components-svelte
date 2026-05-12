<script>
  import { Button, Modal, PasswordInput } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Open modal</Button>

<Modal
  bind:open
  modalHeading="Sign in"
  primaryButtonText="Submit"
  secondaryButtonText="Cancel"
  on:click:button--secondary={() => (open = false)}
>
  <PasswordInput labelText="Password" placeholder="Enter password..." />
</Modal>
