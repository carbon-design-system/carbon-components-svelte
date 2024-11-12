<script lang="ts">
  export let copy = (text: string) => text;
  export let code = "npm i carbon-component-svelte";

  import { CodeSnippet } from "carbon-components-svelte";
</script>

<CodeSnippet on:click={() => copy(code)}>{code}</CodeSnippet>
