<script>
  import {
    Button,
    FilePreview,
    FileUploaderButton,
    Stack,
  } from "carbon-components-svelte";
  import { tokenize } from "carbon-components-svelte/syntax";

  /** @type {File | undefined} */
  let file;
  let confirmed = false;

  function pick(event) {
    file = event.detail[0];
    confirmed = false;
  }
</script>

<Stack gap={5}>
  <FileUploaderButton
    labelText="Choose a file"
    accept={[".csv", ".json", ".md", ".txt", ".png", ".jpg", ".pdf"]}
    disableLabelChanges
    on:change={pick}
  />

  {#if file}
    <FilePreview {file} highlight={tokenize} />
    <Stack orientation="horizontal" gap={4}>
      <Button disabled={confirmed} on:click={() => (confirmed = true)}>
        Upload {file.name}
      </Button>
      <Button kind="ghost" on:click={() => (file = undefined)}
        >Choose another</Button
      >
    </Stack>
    {#if confirmed}
      <p role="status">Uploading {file.name}</p>
    {/if}
  {/if}
</Stack>
