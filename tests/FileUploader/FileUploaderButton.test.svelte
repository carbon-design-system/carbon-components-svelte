<script lang="ts">
  import { FileUploaderButton } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let files: ComponentProps<FileUploaderButton>["files"] = [];
  export let onchange:
    | ((e: CustomEvent<ReadonlyArray<File>>) => void)
    | undefined = undefined;
</script>

<FileUploaderButton bind:files on:change={onchange} {...$$restProps} />
