<script>
  import {
    ContentSwitcher,
    createUnsavedChanges,
    Form,
    Stack,
    Switch,
    Text,
    TextInput,
    trackUnsavedChanges,
    UnsavedChangesPrompt,
  } from "carbon-components-svelte";

  const unsaved = createUnsavedChanges({ beforeUnload: false });

  let selectedIndex = 0;
  let switcherKey = 0;
  let name = "Payments API";

  // `change` isn't cancelable, so the switcher has already moved when the
  // guard runs. Put the selection back on decline by remounting it.
  async function handleChange(event) {
    const next = event.detail.index;
    if (await unsaved.guard()) {
      selectedIndex = next;
    } else {
      switcherKey += 1;
    }
  }
</script>

<Stack gap={5}>
  {#key switcherKey}
    <ContentSwitcher {selectedIndex} on:change={handleChange}>
      <Switch text="Details" />
      <Switch text="Billing" />
    </ContentSwitcher>
  {/key}
  {#if selectedIndex === 0}
    <Form actions={[[trackUnsavedChanges, { store: unsaved }]]}>
      <TextInput labelText="Service name" bind:value={name} />
    </Form>
  {:else}
    <Text>Billing</Text>
  {/if}
</Stack>

<UnsavedChangesPrompt store={unsaved} />
