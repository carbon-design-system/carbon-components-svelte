<svelte:options accessors />

<script lang="ts">
  import FileUploaderButton from "carbon-components-svelte/FileUploader/FileUploaderButton.svelte";
  import type { ComponentProps } from "svelte";

  export let files: ComponentProps<FileUploaderButton>["files"] = [];
  export let onchange:
    | ((e: CustomEvent<ReadonlyArray<File>>) => void)
    | undefined = undefined;
  export let onrejected:
    | ((
        e: CustomEvent<Array<{ file: File; reason: "size" | "duplicate" }>>,
      ) => void)
    | undefined = undefined;
</script>

<FileUploaderButton
  bind:files
  on:change={(e) => onchange?.(e)}
  on:rejected={(e) => onrejected?.(e)}
  {...$$restProps}
/>
