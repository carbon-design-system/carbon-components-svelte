<script>
  import {
    Button,
    Content,
    Stack,
    Tearsheet,
    TextInput,
  } from "carbon-components-svelte";

  let open = true;
</script>

<Content>
  <Button on:click={() => (open = true)}>Create environment</Button>
</Content>

<Tearsheet
  bind:open
  titleText="Create environment"
  descriptionText="Environments isolate configuration and secrets."
>
  <svelte:fragment slot="headerActions">
    <Button kind="ghost" size="small">Import template</Button>
  </svelte:fragment>
  <Stack gap={6}>
    <TextInput labelText="Name" placeholder="staging" />
    <TextInput labelText="Base branch" placeholder="main" />
  </Stack>
  <svelte:fragment slot="actions">
    <Button kind="secondary" on:click={() => (open = false)}>Cancel</Button>
    <Button on:click={() => (open = false)}>Create</Button>
  </svelte:fragment>
</Tearsheet>
