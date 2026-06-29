<script lang="ts">
  import CodeSnippet from "carbon-components-svelte/CodeSnippet/CodeSnippet.svelte";
  import type { ComponentProps } from "svelte";

  export let type: ComponentProps<CodeSnippet>["type"];
  export let copy: (code: string) => void | Promise<void> = async () => {};
  export let onCopy = () => {};
  export let onCopyError = (_detail: { error: unknown }) => {};
  export let tooltipPosition: ComponentProps<CodeSnippet>["tooltipPosition"] =
    "bottom";
</script>

<CodeSnippet
  {type}
  code="npm install --save @carbon/icons"
  {copy}
  {tooltipPosition}
  on:copy={onCopy}
  on:copy:error={(event) => onCopyError(event.detail)}
/>
