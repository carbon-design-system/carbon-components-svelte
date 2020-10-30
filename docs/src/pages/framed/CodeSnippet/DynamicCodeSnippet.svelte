<script>
  import { ToggleSmall, CodeSnippet } from "carbon-components-svelte";

  let toggled = false;

  $: length = toggled ? 20 : 10;
  $: code = Array.from({ length }, (_, i) => i + 1).join("\n");
</script>

<ToggleSmall
  style="margin-bottom: var(--cds-spacing-05)"
  labelText="Trigger snippet overflow"
  bind:toggled
/>
<CodeSnippet type="multi" code="{code}" />
