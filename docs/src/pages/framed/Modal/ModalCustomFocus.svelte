<script>
  import { Button, Modal, Stack, TextInput } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Create database</Button>

<Modal
  bind:open
  modalHeading="Create database"
  primaryButtonText="Confirm"
  secondaryButtonText="Cancel"
  selectorPrimaryFocus="#advanced-options"
  on:click:button--secondary={() => (open = false)}
  on:open
  on:close
  on:submit
>
  <Stack gap={3}>
    <p>Create a new Cloudant database in the US South region.</p>
    <TextInput
      id="db-name"
      labelText="Database name"
      placeholder="Enter database name..."
    />
    <Button id="advanced-options" kind="ghost" size="small">
      Advanced options
    </Button>
  </Stack>
</Modal>
