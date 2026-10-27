<script lang="ts">
  import RichTextEditor from "carbon-components-svelte/RichTextEditor/RichTextEditor.svelte";
  import type { ComponentProps } from "svelte";

  export let value = "";
  export let fieldProps: Partial<ComponentProps<RichTextEditor>> = {};
</script>

<RichTextEditor
  labelText="Notes"
  bind:value
  {...fieldProps}
  on:input
  on:change
/>
<output data-testid="value">{value}</output>
