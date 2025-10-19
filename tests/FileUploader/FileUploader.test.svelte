<script lang="ts">
  import { FileUploader } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  let files: ComponentProps<FileUploader>["files"] = [];
  let fileUploader: FileUploader;

  export let onAdd:
    | ((e: CustomEvent<ReadonlyArray<File>>) => void)
    | undefined = undefined;
  export let onRemove:
    | ((e: CustomEvent<ReadonlyArray<File>>) => void)
    | undefined = undefined;
  export let onChange:
    | ((e: CustomEvent<ReadonlyArray<File>>) => void)
    | undefined = undefined;

  export function getInputElement() {
    return document.querySelector('input[type="file"]') as HTMLInputElement;
  }

  export function clearFiles() {
    fileUploader.clearFiles();
  }

  export function setFiles(newFiles: ComponentProps<FileUploader>["files"]) {
    files = newFiles;
  }
</script>

<form data-testid="file-form">
  <FileUploader
    bind:this={fileUploader}
    multiple
    status="edit"
    buttonLabel="Add files"
    bind:files
    on:add={onAdd}
    on:remove={onRemove}
    on:change={onChange}
  />
</form>
