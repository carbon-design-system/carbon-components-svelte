<script>
  import {
    Button,
    FileUploaderDropContainer,
    Stack,
  } from "carbon-components-svelte";

  let inputRef = null;
</script>

<Stack gap={6}>
  <Button kind="secondary" on:click={() => inputRef?.click()}>
    Open file picker
  </Button>
  <FileUploaderDropContainer
    bind:ref={inputRef}
    multiple
    labelText="Drag and drop files here or click to upload"
  />
</Stack>
