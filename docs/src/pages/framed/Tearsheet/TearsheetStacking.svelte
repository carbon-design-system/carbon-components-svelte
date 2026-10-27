<script>
  import {
    Button,
    Content,
    Stack,
    Tearsheet,
    TextInput,
  } from "carbon-components-svelte";

  let first = true;
  let second = false;
  let third = false;
</script>

<Content>
  <Button on:click={() => (first = true)}>Create workspace</Button>
</Content>

<Tearsheet bind:open={first} title="Create workspace">
  <Stack gap={6}>
    <TextInput labelText="Workspace name" placeholder="payments" />
    <Button kind="tertiary" on:click={() => (second = true)}>
      Add a member
    </Button>
  </Stack>
</Tearsheet>

<Tearsheet bind:open={second} size="narrow" title="Add a member">
  <Stack gap={6}>
    <TextInput labelText="Email" placeholder="ada@example.com" />
    <Button kind="tertiary" on:click={() => (third = true)}>Set a role</Button>
  </Stack>
</Tearsheet>

<Tearsheet bind:open={third} size="narrow" title="Set a role">
  <TextInput labelText="Role" placeholder="Maintainer" />
  <svelte:fragment slot="actions">
    <Button kind="secondary" on:click={() => (third = false)}>Cancel</Button>
    <Button on:click={() => (third = false)}>Save</Button>
  </svelte:fragment>
</Tearsheet>
