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
    maxFiles={3}
    labelTitle="Upload documents"
    buttonLabel="Add files"
    labelDescription="Up to 3 documents."
    status="edit"
    on:rejected={(e) => {
      rejectedFiles = e.detail;
    }}
  />

  {#each rejectedFiles as { file }, i (`${file.name}-${file.lastModified}-${i}`)}
    <FileUploaderItem
      invalid
      id={`rejected-count-${i}`}
      name={file.name}
      errorSubject="Too many files"
      errorBody="You can attach up to 3 documents."
      status="edit"
      on:delete={() => {
        rejectedFiles = rejectedFiles.filter((r) => r.file !== file);
      }}
    />
  {/each}
</Stack>
