<script>
  export let code = "yarn add -D carbon-component-svelte";

  import { CodeSnippet } from "carbon-components-svelte";
  import copy from "clipboard-copy";
</script>

<CodeSnippet on:click="{() => copy(code)}">{code}</CodeSnippet>
