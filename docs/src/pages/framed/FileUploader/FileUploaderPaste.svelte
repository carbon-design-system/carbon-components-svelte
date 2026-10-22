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
    pasteTarget
    maxFileSize={5 * 1024 * 1024}
    preventDuplicate
    labelTitle="Bug report attachments"
    buttonLabel="Add files"
    labelDescription="Paste a screenshot or file anywhere on the page, or click Add files."
    status="edit"
    on:rejected={(e) => {
      rejectedFiles = e.detail;
    }}
  />

  {#each rejectedFiles as { file, reason }, i (`${file.name}-${file.lastModified}-${i}`)}
    <FileUploaderItem
      invalid
      id={`rejected-paste-${i}`}
      name={file.name}
      errorSubject={reason === "size"
        ? "File exceeds 5 MB limit"
        : "Duplicate file"}
      errorBody={reason === "size"
        ? "Please select a smaller file."
        : "This file is already in the list."}
      status="edit"
      on:delete={() => {
        rejectedFiles = rejectedFiles.filter((r) => r.file !== file);
      }}
    />
  {/each}
</Stack>
