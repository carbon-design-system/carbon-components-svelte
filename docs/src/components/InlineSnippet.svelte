<script>
  export let code = "";

  import { CodeSnippet } from "carbon-components-svelte";
</script>

<div>
  <CodeSnippet code="{code}" type="inline" />
</div>

<style>
  div {
    margin-bottom: var(--cds-spacing-04);
  }
</style>
