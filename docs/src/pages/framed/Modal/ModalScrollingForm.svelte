<script>
  import { Button, Modal, Stack, TextInput } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Provision resource</Button>

<Modal
  bind:open
  size="sm"
  modalHeading="Provision resource"
  primaryButtonText="Provision"
  secondaryButtonText="Cancel"
  hasForm
  hasScrollingContent
  on:click:button--secondary={() => (open = false)}
>
  <Stack gap={5}>
    <TextInput labelText="Name" placeholder="Enter name" />
    <TextInput labelText="Email" type="email" placeholder="Enter email" />
    <TextInput labelText="Organization" placeholder="Enter organization" />
    <TextInput labelText="Region" placeholder="Enter region" />
    <TextInput labelText="Project" placeholder="Enter project" />
    <TextInput labelText="Resource name" placeholder="Enter resource name" />
    <TextInput labelText="Capacity" placeholder="Enter capacity" />
    <TextInput labelText="Notes" placeholder="Enter notes" />
  </Stack>
</Modal>
