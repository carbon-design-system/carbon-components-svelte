<script lang="ts">
  import FileUploader from "carbon-components-svelte/FileUploader/FileUploader.svelte";
  import FileUploaderButton from "carbon-components-svelte/FileUploader/FileUploaderButton.svelte";
  import Form from "carbon-components-svelte/Form/Form.svelte";
  import type { ComponentProps } from "svelte";

  export let size: ComponentProps<Form>["size"] = undefined;
  export let files: ReadonlyArray<File> = [];
</script>

<Form {size}>
  <FileUploader buttonLabel="Add files" {files} status="edit" />
  <FileUploaderButton labelText="Add one file" />
  <FileUploaderButton labelText="Add a large file" size="lg" />
</Form>
