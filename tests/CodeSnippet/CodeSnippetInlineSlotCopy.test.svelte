<script lang="ts">
  import CodeSnippet from "carbon-components-svelte/CodeSnippet/CodeSnippet.svelte";

  export let copy: ((code: string) => void | Promise<void>) | undefined =
    undefined;
  export let onCopy = () => {};
</script>

<CodeSnippet type="inline" {...copy ? { copy } : {}} on:copy={onCopy}
  >npm i foo</CodeSnippet
>
