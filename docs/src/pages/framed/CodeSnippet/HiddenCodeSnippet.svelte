<script>
  import { CodeSnippet, Stack, Toggle } from "carbon-components-svelte";

  let toggled = false;

  const code = Array.from({ length: 20 }, (_, i) => i + 1).join("\n");
</script>

<Stack gap={5}>
  <Toggle size="sm" labelText="Show code snippet" bind:toggled />
  <div class:hidden={!toggled}><CodeSnippet type="multi" {code} /></div>
</Stack>

<style>
  .hidden {
    display: none;
  }
</style>
