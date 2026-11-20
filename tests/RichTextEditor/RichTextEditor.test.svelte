<script lang="ts">
  import RichTextEditor from "carbon-components-svelte/RichTextEditor/RichTextEditor.svelte";
  import type { ComponentProps } from "svelte";

  export let value = "";
  export let fieldProps: Partial<ComponentProps<RichTextEditor>> = {};
  export let onPaste:
    ((event: CustomEvent<{ html: string; text: string }>) => void) | undefined =
    undefined;
</script>

<RichTextEditor
  labelText="Notes"
  bind:value
  {...fieldProps}
  on:input
  on:change
  on:paste={(event) => onPaste?.(event)}
/>
<output data-testid="value">{value}</output>
