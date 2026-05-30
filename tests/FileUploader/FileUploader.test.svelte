<svelte:options accessors />

<script lang="ts">
  import { FileUploader } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let files: ComponentProps<FileUploader>["files"] = [];
  export let ref: ComponentProps<FileUploader>["ref"] = null;
  export let fileUploader: FileUploader | undefined = undefined;

  export let onAdd:
    | ((e: CustomEvent<ReadonlyArray<File>>) => void)
    | undefined = undefined;
  export let onRemove:
    | ((e: CustomEvent<ReadonlyArray<File>>) => void)
    | undefined = undefined;
  export let onChange:
    | ((e: CustomEvent<ReadonlyArray<File>>) => void)
    | undefined = undefined;
  export let onClear: ((e: CustomEvent<void>) => void) | undefined = undefined;
  export let onRejected:
    | ((e: CustomEvent<Array<{ file: File; reason: string }>>) => void)
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
  export let maxFileSize: ComponentProps<FileUploader>["maxFileSize"] =
    undefined;
  export let preventDuplicate: ComponentProps<FileUploader>["preventDuplicate"] = false;
  export let orderFiles: ComponentProps<FileUploader>["orderFiles"] = "append";
  export let iconDescription: ComponentProps<FileUploader>["iconDescription"] =
    undefined;
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
    {maxFileSize}
    {preventDuplicate}
    {orderFiles}
    {iconDescription}
    bind:ref
    bind:files
    on:add={(e) => onAdd?.(e)}
    on:remove={(e) => onRemove?.(e)}
    on:change={(e) => onChange?.(e)}
    on:clear={(e) => onClear?.(e)}
    on:rejected={(e) => onRejected?.(e)}
  />
</form>
