<script>
  import {
    createAutosave,
    InlineEdit,
    SavingStatus,
    Stack,
  } from "carbon-components-svelte";
  import { onMount } from "svelte";

  let name = "Untitled document";

  // A stand-in for your API.
  async function rename() {
    await new Promise((resolve) => setTimeout(resolve, 900));
  }

  // A rename commits when the title is saved, so there is nothing to wait
  // for: save at once.
  const autosave = createAutosave(rename, { debounce: 0 });
  onMount(() => autosave.destroy);
</script>

<Stack orientation="horizontal" gap={5} align="center">
  <InlineEdit
    labelText="Document title"
    editLabel="Edit title"
    saveLabel="Save"
    cancelLabel="Cancel"
    bind:value={name}
    on:save={() => autosave.change(name)}
  />
  <SavingStatus {autosave} size="sm" />
</Stack>
