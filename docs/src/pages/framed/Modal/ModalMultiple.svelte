<script>
  import { Button, Modal } from "carbon-components-svelte";

  let openCreate = false;
  let openDelete = false;
</script>

<Button on:click={() => (openCreate = true)}>Create database</Button>
<Button kind="danger-tertiary" on:click={() => (openDelete = true)}>
  Delete database
</Button>

<Modal
  bind:open={openCreate}
  modalHeading="Create database"
  primaryButtonText="Confirm"
  secondaryButtonText="Cancel"
  on:click:button--secondary={() => (openCreate = false)}
  on:open
  on:close
  on:submit
>
  <p>Create a new Cloudant database in the US South region.</p>
</Modal>

<Modal
  danger
  bind:open={openDelete}
  modalHeading="Delete database"
  primaryButtonText="Delete"
  secondaryButtonText="Cancel"
  on:click:button--secondary={() => (openDelete = false)}
  on:open
  on:close
  on:submit
>
  <p>This is a permanent action and cannot be undone.</p>
</Modal>
