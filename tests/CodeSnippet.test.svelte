<script lang="ts">
  import { CodeSnippet } from "carbon-components-svelte";
</script>

<CodeSnippet
  type="inline"
  copy="{(text) => text}"
  code=""
  hideCopyButton
  disabled
  skeleton
  wrapText
  expanded
  on:animationend
  on:click
  on:copy
  on:expand
  on:collapse
>
  yarn add carbon-components-svelte
</CodeSnippet>
