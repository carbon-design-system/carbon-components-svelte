<script>
  export let code = "";

  import copy from "clipboard-copy";
  import { CodeSnippet } from "carbon-components-svelte";
</script>

<div>
  <CodeSnippet
    code="{code}"
    type="inline"
    copy="{(text) => copy(text)}"
    class="code-override"
  />
</div>

<style>
  div {
    margin-bottom: var(--cds-spacing-03);
  }
</style>
