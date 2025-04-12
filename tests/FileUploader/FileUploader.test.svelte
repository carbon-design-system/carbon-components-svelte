<script lang="ts">
  import { FileUploader } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let status: ComponentProps<FileUploader>["status"] = "uploading";
  export let disabled = false;
  export let accept: ComponentProps<FileUploader>["accept"] = [];
  export let multiple = false;
  export let labelTitle = "Test Upload";
  export let labelDescription = "Test Description";
  export let buttonLabel = "Add File";
  export let iconDescription = "Test icon";
  export let name = "test-upload";
  export let kind: ComponentProps<FileUploader>["kind"] = "primary";
  export let size: ComponentProps<FileUploader>["size"] = "small";
</script>

<FileUploader
  data-testid="file-uploader"
  {status}
  {disabled}
  {accept}
  {multiple}
  {labelTitle}
  {labelDescription}
  {buttonLabel}
  {iconDescription}
  {name}
  {kind}
  {size}
  on:add={(e) => {
    console.log("add", e.detail);
  }}
  on:remove={(e) => {
    console.log("remove", e.detail);
  }}
  on:change={(e) => {
    console.log("change", e.detail);
  }}
/>
