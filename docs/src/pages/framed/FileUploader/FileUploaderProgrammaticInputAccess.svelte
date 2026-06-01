<script>
  import { Button, FileUploader, Stack } from "carbon-components-svelte";

  let inputRef = null;
</script>

<Stack gap={6}>
  <Button kind="secondary" on:click={() => inputRef?.click()}>
    Open file picker
  </Button>
  <FileUploader
    bind:ref={inputRef}
    multiple
    accept={[".jpg", ".jpeg", ".png"]}
    labelTitle="Upload files"
    buttonLabel="Browse files"
    labelDescription="Only image files are accepted."
  />
</Stack>
