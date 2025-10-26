<script>
  import { CodeSnippet, Toggle } from "carbon-components-svelte";

  let toggled = false;

  $: length = toggled ? 20 : 10;
  $: code = Array.from({ length }, (_, i) => i + 1).join("\n");
</script>

<Toggle
  bind:toggled
  size="sm"
  labelText="Trigger snippet overflow"
  style="margin-bottom: var(--cds-spacing-05)"
/>
<CodeSnippet type="multi" {code} />
