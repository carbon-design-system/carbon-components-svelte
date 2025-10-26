<script>
  export let code = "";

  import { CodeSnippet } from "carbon-components-svelte";
  import copy from "clipboard-copy";
</script>

<div>
  <CodeSnippet {code} type="inline" copy={(text) => copy(text)} />
</div>

<style>
  div {
    margin-bottom: var(--cds-spacing-03);
  }
</style>
