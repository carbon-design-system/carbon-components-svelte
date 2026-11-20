<script>
  import {
    Button,
    Content,
    InlineNotification,
    Stack,
    Tearsheet,
    TextInput,
  } from "carbon-components-svelte";

  let open = true;
  let dirty = false;
  let blocked = false;

  function handleClose(event) {
    if (event.detail.trigger !== "programmatic" && dirty) {
      event.preventDefault();
      blocked = true;
    }
  }

  function discard() {
    dirty = false;
    blocked = false;
    open = false;
  }
</script>

<Content>
  <Button on:click={() => (open = true)}>Edit alert rule</Button>
</Content>

<Tearsheet
  bind:open
  size="narrow"
  titleText="Edit alert rule"
  on:close={handleClose}
>
  <Stack gap={5}>
    {#if blocked}
      <InlineNotification
        lowContrast
        hideCloseButton
        kind="warning"
        title="Unsaved changes"
        subtitle="Discard them to close."
      />
    {/if}
    <TextInput
      labelText="Rule name"
      value="High error rate"
      on:input={() => (dirty = true)}
    />
  </Stack>
  <svelte:fragment slot="actions">
    <Button kind="secondary" on:click={discard}>Discard</Button>
    <Button on:click={() => (open = false)}>Save</Button>
  </svelte:fragment>
</Tearsheet>
