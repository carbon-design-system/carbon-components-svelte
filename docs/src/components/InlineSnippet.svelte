<script>
  export let code = "";

  import copy from "clipboard-copy";
  import { CodeSnippet } from "carbon-components-svelte";
</script>

<div>
  <CodeSnippet {code} type="inline" copy={(text) => copy(text)} />
</div>

<style>
  div {
    margin-bottom: var(--cds-spacing-03);
  }
</style>
