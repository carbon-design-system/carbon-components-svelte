<script>
  export let code = "";

  import { CodeSnippet } from "carbon-components-svelte";
  import copy from "clipboard-copy";
</script>

<div>
  <CodeSnippet
    code="{code}"
    type="inline"
    on:click="{() => {
      copy(code);
    }}"
  />
</div>

<style>
  div {
    margin-bottom: var(--cds-spacing-04);
  }
</style>
