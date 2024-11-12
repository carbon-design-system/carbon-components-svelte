<script>
  import { Button, Modal, TextInput } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Create database</Button>

<Modal
  bind:open
  modalHeading="Create database"
  primaryButtonText="Confirm"
  secondaryButtonText="Cancel"
  selectorPrimaryFocus="#db-name"
  on:click:button--secondary={() => (open = false)}
  on:open
  on:close
  on:submit
>
  <p>Create a new Cloudant database in the US South region.</p>
  <br />
  <TextInput
    id="db-name"
    labelText="Database name"
    placeholder="Enter database name..."
  />
</Modal>
