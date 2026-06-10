<svelte:options accessors />

<script lang="ts">
  import FileUploader from "carbon-components-svelte/FileUploader/FileUploader.svelte";
  import type { ComponentProps } from "svelte";

  export let files: ComponentProps<FileUploader>["files"] = [];
  export let onAdd:
    | ((e: CustomEvent<ReadonlyArray<File>>) => void)
    | undefined = undefined;
</script>

<FileUploader multiple bind:files on:add={(e) => onAdd?.(e)} />
