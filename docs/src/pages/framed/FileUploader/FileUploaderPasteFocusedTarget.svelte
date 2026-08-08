<script>
  import {
    FileUploader,
    FileUploaderItem,
    Stack,
    TextArea,
    TextInput,
  } from "carbon-components-svelte";

  /** @type {HTMLFormElement | undefined} */
  let form;

  let rejectedFiles = [];
</script>

<form bind:this={form}>
  <Stack gap={5}>
    <TextInput labelText="Title" placeholder="Brief summary" />
    <TextArea
      labelText="Description"
      placeholder="Describe the issue. Focus here and paste a screenshot to attach it."
      rows={4}
    />
    <FileUploader
      multiple
      pasteTarget={form}
      maxFileSize={5 * 1024 * 1024}
      preventDuplicate
      labelTitle="Attachments"
      buttonLabel="Add files"
      labelDescription="Paste a screenshot while focused in this form, or click Add files."
      status="edit"
      on:rejected={(e) => {
        rejectedFiles = e.detail;
      }}
    />

    {#each rejectedFiles as { file, reason }, i (`${file.name}-${file.lastModified}-${i}`)}
      <FileUploaderItem
        invalid
        id={`rejected-paste-target-${i}`}
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
</form>
