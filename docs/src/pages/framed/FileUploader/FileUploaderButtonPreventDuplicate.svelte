<script>
  import {
    FileUploaderButton,
    FileUploaderItem,
    Stack,
  } from "carbon-components-svelte";

  let files = [];
  let rejectedFiles = [];
</script>

<Stack gap={2}>
  <FileUploaderButton
    multiple
    preventDuplicate
    disableLabelChanges
    labelText="Add files"
    bind:files
    on:rejected={(e) => {
      rejectedFiles = [...rejectedFiles, ...e.detail];
    }}
  />

  {#each files as file, i (`${file.name}-${file.lastModified}-${i}`)}
    <FileUploaderItem
      id={`accepted-${i}`}
      name={file.name}
      status="edit"
      on:delete={() => {
        files = files.filter((f) => f !== file);
      }}
    />
  {/each}

  {#each rejectedFiles as { file }, i (`${file.name}-${file.lastModified}-${i}`)}
    <FileUploaderItem
      invalid
      id={`rejected-duplicate-${i}`}
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
