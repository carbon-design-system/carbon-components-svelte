<script>
  import { FileUploader } from "carbon-components-svelte";
</script>

<FileUploader
  multiple
  orderFiles="prepend"
  labelTitle="Upload files"
  buttonLabel="Add files"
  labelDescription="Newest files appear first."
  status="edit"
/>
