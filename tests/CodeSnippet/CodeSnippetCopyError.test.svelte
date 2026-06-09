<script lang="ts">
  import CodeSnippet from "carbon-components-svelte/CodeSnippet/CodeSnippet.svelte";
  import type { ComponentProps } from "svelte";

  export let type: ComponentProps<CodeSnippet>["type"];
  export let onCopyError = (_detail: { error: unknown }) => {};
</script>

<CodeSnippet
  {type}
  code="npm install --save @carbon/icons"
  copy={() => Promise.reject(new Error("copy failed"))}
  on:copy:error={(event) => onCopyError(event.detail)}
/>
