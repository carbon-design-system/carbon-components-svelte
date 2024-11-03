<script lang="ts">
  export let copy = (text: string) => text;
  export let code = "yarn add carbon-component-svelte";

  import { CodeSnippet } from "../types";
</script>

<CodeSnippet on:click="{() => copy(code)}">{code}</CodeSnippet>
