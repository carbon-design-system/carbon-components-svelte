<script lang="ts">
  import { CodeSnippet } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let type: ComponentProps<CodeSnippet>["type"];
  export let copy: (code: string) => void | Promise<void> = async () => {};
  export let onCopy = () => {};
  export let onCopyError = (_detail: { error: unknown }) => {};
</script>

<CodeSnippet
  {type}
  code="npm install --save @carbon/icons"
  {copy}
  on:copy={onCopy}
  on:copy:error={(event) => onCopyError(event.detail)}
/>
