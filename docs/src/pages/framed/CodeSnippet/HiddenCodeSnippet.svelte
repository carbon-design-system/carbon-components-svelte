<script>
  import { CodeSnippet, Stack, Toggle } from "carbon-components-svelte";

  let toggled = false;

  const code = Array.from({ length: 20 }, (_, i) => i + 1).join("\n");
</script>

<Stack gap={5}>
  <Toggle
    size="sm"
    labelText="Show code snippets"
    bind:toggled
  />

{#if toggled}
  <h5>"Show more" will not render</h5>
  <br />
{/if}
<div class:hidden={!toggled}>
  <CodeSnippet type="multi" {code} />
</div>

{#if toggled}
  <br /><br />
  <h5>"Show more" will render</h5>
  <br />
  <div class:hidden={!toggled}>
    <CodeSnippet type="multi" {code} />
  </div>
{/if}
</Stack>

<style>
  .hidden {
    display: none;
  }
</style>
