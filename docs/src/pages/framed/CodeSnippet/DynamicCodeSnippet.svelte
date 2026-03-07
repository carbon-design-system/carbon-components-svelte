<script>
  import { CodeSnippet, Stack, Toggle } from "carbon-components-svelte";

  let toggled = false;

  $: length = toggled ? 20 : 10;
  $: code = Array.from({ length }, (_, i) => i + 1).join("\n");
</script>

<Stack gap={5}>
  <Toggle
    bind:toggled
    size="sm"
    labelText="Trigger snippet overflow"
  />
  <CodeSnippet type="multi" {code} />
</Stack>
