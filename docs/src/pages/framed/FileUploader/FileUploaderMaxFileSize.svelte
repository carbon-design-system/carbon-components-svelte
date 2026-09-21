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
    maxFileSize={1000 * 1000}
    fileSize
    labelTitle="Upload files"
    buttonLabel="Add files"
    labelDescription="Maximum file size: 1 MB"
    status="edit"
    on:rejected={(e) => {
      rejectedFiles = e.detail;
    }}
  />

  {#each rejectedFiles as { file }, i (`${file.name}-${file.lastModified}-${i}`)}
    <FileUploaderItem
      invalid
      id={`rejected-size-${i}`}
      name={file.name}
      fileSize={file.size}
      errorSubject="File exceeds 1 MB limit"
      errorBody="Please select a smaller file."
      status="edit"
      on:delete={() => {
        rejectedFiles = rejectedFiles.filter((r) => r.file !== file);
      }}
    />
  {/each}
</Stack>
