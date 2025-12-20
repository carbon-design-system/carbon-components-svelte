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

  export let disabled: ComponentProps<FileUploader>["disabled"] = false;
  export let accept: ComponentProps<FileUploader>["accept"] = [];
  export let multiple: ComponentProps<FileUploader>["multiple"] = true;
  export let status: ComponentProps<FileUploader>["status"] = "edit";
  export let labelTitle: ComponentProps<FileUploader>["labelTitle"] = "";
  export let labelDescription: ComponentProps<FileUploader>["labelDescription"] =
    "";
  export let buttonLabel: ComponentProps<FileUploader>["buttonLabel"] =
    "Add files";
  export let name: ComponentProps<FileUploader>["name"] = "";

  // Allow initial files to be set
  $: if (typeof $$props.files !== "undefined" && $$props.files !== files) {
    files = $$props.files;
  }

  export function getInputElement() {
    const input = document.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);
    return input;
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
    {multiple}
    {status}
    {buttonLabel}
    {disabled}
    {accept}
    {labelTitle}
    {labelDescription}
    {name}
    bind:files
    on:add={onAdd}
    on:remove={onRemove}
    on:change={onChange}
  />
</form>
