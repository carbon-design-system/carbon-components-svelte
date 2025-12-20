<script lang="ts">
  import { FileUploaderDropContainer } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let files: ComponentProps<FileUploaderDropContainer>["files"] = [];
  export let onadd:
    | ((e: CustomEvent<ReadonlyArray<File>>) => void)
    | undefined = undefined;
  export let onchange:
    | ((e: CustomEvent<ReadonlyArray<File>>) => void)
    | undefined = undefined;
</script>

<FileUploaderDropContainer
  bind:files
  on:add={onadd}
  on:change={onchange}
  {...$$restProps}
/>

