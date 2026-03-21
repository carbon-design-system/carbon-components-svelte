<script>
  import { FileUploader, InlineNotification } from "carbon-components-svelte";

  let rejectedFiles = [];
</script>

<FileUploader
  multiple
  maxFileSize={1024 * 1024}
  labelTitle="Upload files"
  buttonLabel="Add files"
  labelDescription="Maximum file size: 1 MB"
  status="edit"
  on:rejected={(e) => {
    rejectedFiles = e.detail;
  }}
/>

{#each rejectedFiles as { file, reason }}
  <InlineNotification
    kind="error"
    title="Rejected:"
    subtitle="{file.name} ({reason})"
    on:close={() => {
      rejectedFiles = rejectedFiles.filter((r) => r.file !== file);
    }}
  />
{/each}
