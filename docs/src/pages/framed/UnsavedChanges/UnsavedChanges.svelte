<script>
  import {
    Button,
    createUnsavedChanges,
    Form,
    Stack,
    Tag,
    TextArea,
    TextInput,
    trackUnsavedChanges,
  } from "carbon-components-svelte";

  // The frame is a page of its own; skip the browser's leave prompt here.
  const unsaved = createUnsavedChanges({ beforeUnload: false });
  const { dirty } = unsaved;

  let name = "Payments API";
  let description = "Authorizes card payments.";

  async function save(event) {
    event.preventDefault();
    await new Promise((resolve) => setTimeout(resolve, 300));
    unsaved.markSaved();
  }
</script>

<Form actions={[[trackUnsavedChanges, { store: unsaved }]]} on:submit={save}>
  <Stack gap={5}>
    <TextInput labelText="Service name" bind:value={name} />
    <TextArea labelText="Description" bind:value={description} />
    <Stack orientation="horizontal" gap={5} align="center">
      <Button type="submit">Save</Button>
      <Button type="reset" kind="secondary">Reset</Button>
      {#if $dirty}
        <Tag type="warm-gray">Unsaved changes</Tag>
      {:else}
        <Tag type="green">Saved</Tag>
      {/if}
    </Stack>
  </Stack>
</Form>
