<script>
  import copy from "clipboard-copy";
  import { CodeSnippet } from "carbon-components-svelte";
</script>

<CodeSnippet
  code="yarn add -D carbon-components-svelte"
  copy="{(text) => copy(text)}"
/>
