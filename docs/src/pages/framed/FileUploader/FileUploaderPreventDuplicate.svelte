<script>
  import {
    FileUploader,
    FileUploaderItem,
    Stack,
  } from "carbon-components-svelte";

  let rejectedFiles = [];
</script>

<Stack gap={2}>
  <FileUploader
    multiple
    preventDuplicate
    labelTitle="Upload files"
    buttonLabel="Add files"
    labelDescription="Duplicate files are rejected."
    status="edit"
    on:rejected={(e) => {
      rejectedFiles = e.detail;
    }}
  />

  {#each rejectedFiles as { file }, i (`${file.name}-${file.lastModified}-${i}`)}
    <FileUploaderItem
      invalid
      id={`rejected-dup-${i}`}
      name={file.name}
      errorSubject="Duplicate file"
      errorBody="This file is already in the list."
      status="edit"
      on:delete={() => {
        rejectedFiles = rejectedFiles.filter((r) => r.file !== file);
      }}
    />
  {/each}
</Stack>
