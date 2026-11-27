<script>
  import {
    Button,
    createUnsavedChanges,
    Form,
    SidePanel,
    TextInput,
    trackUnsavedChanges,
    UnsavedChangesPrompt,
  } from "carbon-components-svelte";

  const unsaved = createUnsavedChanges({ beforeUnload: false });

  let open = false;
  let region = "eu-west-1";

  const close = unsaved.closeGuard(() => {
    open = false;
    region = "eu-west-1";
  });
</script>

<Button on:click={() => (open = true)}>Edit deployment</Button>

<SidePanel bind:open title="Edit deployment" on:close={close}>
  <Form actions={[[trackUnsavedChanges, { store: unsaved }]]}>
    <TextInput labelText="Region" bind:value={region} />
  </Form>
</SidePanel>

<UnsavedChangesPrompt store={unsaved} />
