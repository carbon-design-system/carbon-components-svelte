<script>
  import { CodeSnippet } from "carbon-components-svelte";
  import copy from "clipboard-copy";
</script>

<CodeSnippet
  code="npm i carbon-components-svelte"
  copy={(text) => copy(text)}
/>
