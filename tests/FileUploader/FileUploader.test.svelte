<script lang="ts">
  import { FileUploader } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  let files: ComponentProps<FileUploader>["files"] = [];

  export function getInputElement() {
    return document.querySelector('input[type="file"]') as HTMLInputElement;
  }
</script>

<form data-testid="file-form">
  <FileUploader multiple status="edit" buttonLabel="Add files" bind:files />
</form>
