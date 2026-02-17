<script>
  export let code = "";

  import { CodeSnippet } from "carbon-components-svelte";
  import copy from "clipboard-copy";
</script>

<CodeSnippet {code} type="inline" {copy} />
