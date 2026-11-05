<script lang="ts">
  import { FileUploader } from "carbon-components-svelte";

  let files: File[] = [];
</script>

<FileUploader
  data-testid="file-uploader"
  labelTitle="Upload files"
  buttonLabel="Add file"
  status="edit"
  iconDescription="Remove file"
  bind:files
/>
