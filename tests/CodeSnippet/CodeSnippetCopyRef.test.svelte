<svelte:options accessors />

<script lang="ts">
  import CodeSnippet from "carbon-components-svelte/CodeSnippet/CodeSnippet.svelte";
  import type { ComponentProps } from "svelte";

  export let type: ComponentProps<CodeSnippet>["type"] = "inline";
  export let copyRef: ComponentProps<CodeSnippet>["copyRef"] = null;
</script>

<CodeSnippet {type} code="npm install" bind:copyRef />
