<script lang="ts">
  import FileUploaderDropContainer from "carbon-components-svelte/FileUploader/FileUploaderDropContainer.svelte";
  import type { ComponentProps } from "svelte";

  export let files: ComponentProps<FileUploaderDropContainer>["files"] = [];
  export let onadd:
    | ((e: CustomEvent<ReadonlyArray<File>>) => void)
    | undefined = undefined;
  export let onchange:
    | ((e: CustomEvent<ReadonlyArray<File>>) => void)
    | undefined = undefined;
  export let onrejected:
    | ((e: CustomEvent<Array<{ file: File; reason: string }>>) => void)
    | undefined = undefined;
</script>

<FileUploaderDropContainer
  bind:files
  on:add={(e) => onadd?.(e)}
  on:change={(e) => onchange?.(e)}
  on:rejected={(e) => onrejected?.(e)}
  {...$$restProps}
/>
