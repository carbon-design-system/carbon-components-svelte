<script>
  import { Button, Modal, PasswordInput } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Reset password</Button>

<Modal
  bind:open
  modalHeading="Reset password"
  primaryButtonText="Reset password"
  secondaryButtonText="Cancel"
  on:click:button--secondary={() => (open = false)}
>
  <PasswordInput
    labelText="New password"
    placeholder="Enter new password..."
    helperText="Must be at least 12 characters and include a number and symbol."
  />
</Modal>
