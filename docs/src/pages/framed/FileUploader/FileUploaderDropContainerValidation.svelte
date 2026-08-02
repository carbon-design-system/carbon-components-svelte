<script>
  import {
    FileUploaderDropContainer,
    FileUploaderItem,
    Stack,
  } from "carbon-components-svelte";

  let files = [];
  let rejectedFiles = [];
</script>

<Stack gap={2}>
  <FileUploaderDropContainer
    multiple
    maxFileSize={1024}
    preventDuplicate
    labelText="Drag and drop files here or click to upload"
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

  {#each rejectedFiles as { file, reason }, i (`${file.name}-${reason}-${i}`)}
    <FileUploaderItem
      invalid
      id={`rejected-${i}`}
      name={file.name}
      errorSubject={reason === "size"
        ? "File exceeds 1 kB limit"
        : reason === "duplicate"
          ? "Duplicate file"
          : "File rejected"}
      errorBody={reason === "size"
        ? "Please select a smaller file."
        : reason === "duplicate"
          ? "This file is already in the list."
          : "The file did not pass validation."}
      status="edit"
      on:delete={() => {
        rejectedFiles = rejectedFiles.filter((r) => r.file !== file);
      }}
    />
  {/each}
</Stack>
