<script>
  import {
    Button,
    Popconfirm,
    Stack,
    TextArea,
  } from "carbon-components-svelte";

  const saved = "";
  let draft = "Root cause: the certificate renewed after the cache warmed.";

  // Nothing to lose when the draft matches what's saved.
  $: dirty = draft !== saved;
</script>

<Stack gap={5}>
  <TextArea labelText="Incident summary" rows={3} bind:value={draft} />
  <Stack orientation="horizontal" gap={3}>
    <Button kind="primary" size="small" disabled={!dirty}>Save</Button>
    {#if dirty}
      <Popconfirm
        kind="warning"
        title="Discard this draft?"
        description="Your changes are not saved."
        confirmText="Discard"
        cancelText="Keep editing"
        on:confirm={() => (draft = saved)}
      >
        <Button kind="tertiary" size="small">Discard draft</Button>
      </Popconfirm>
    {/if}
  </Stack>
</Stack>
