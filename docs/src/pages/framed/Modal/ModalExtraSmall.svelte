<script>
  import { Button, Modal } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Create database</Button>

<Modal
  size="xs"
  bind:open
  modalHeading="Create database"
  primaryButtonText="Confirm"
  secondaryButtonText="Cancel"
  on:click:button--secondary
  on:open
  on:close
  on:submit
>
  <p>Create a new Cloudant database in the US South region.</p>
</Modal>
