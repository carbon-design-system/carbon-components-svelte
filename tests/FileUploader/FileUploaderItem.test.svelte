<script lang="ts">
  import { FileUploaderItem } from "carbon-components-svelte";

  export let ondelete: ((e: CustomEvent<string>) => void) | undefined =
    undefined;
  export let onmouseover: ((e: MouseEvent) => void) | undefined = undefined;
  export let onmouseenter: ((e: MouseEvent) => void) | undefined = undefined;
  export let onmouseleave: ((e: MouseEvent) => void) | undefined = undefined;
</script>

<FileUploaderItem
  on:delete={ondelete}
  on:mouseover={onmouseover}
  on:mouseenter={onmouseenter}
  on:mouseleave={onmouseleave}
  {...$$restProps}
/>

