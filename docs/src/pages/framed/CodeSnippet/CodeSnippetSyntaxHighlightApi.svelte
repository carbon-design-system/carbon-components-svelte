<script>
  import { CodeSnippet } from "carbon-components-svelte";
  import { highlightCode } from "carbon-components-svelte/syntax";

  const code = `<Button kind="ghost" on:click={() => count++}>
  Clicked {count} times
</Button>

{#if count > 10}
  <p class="note">That's a lot of clicks.</p>
{/if}`;
</script>

<div use:highlightCode={{ language: "svelte", code }}>
  <CodeSnippet type="multi" {code} />
</div>
