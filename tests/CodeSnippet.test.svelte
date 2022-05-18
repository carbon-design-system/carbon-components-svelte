<script lang="ts">
  import { CodeSnippet } from "../types";
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
  yarn add -D carbon-components-svelte
</CodeSnippet>
