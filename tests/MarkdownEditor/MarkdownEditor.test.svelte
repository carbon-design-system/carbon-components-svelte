<script lang="ts">
  import MarkdownEditor from "carbon-components-svelte/MarkdownEditor/MarkdownEditor.svelte";
  import type { ComponentProps } from "svelte";

  export let value: ComponentProps<MarkdownEditor>["value"] = "";
  export let view: ComponentProps<MarkdownEditor>["view"] = "write";
  export let readonly = false;
  export let disabled = false;
  export let maxCount: number | undefined = undefined;
  export let split = false;
  export let name: string | undefined = undefined;
  export let toolbar: ComponentProps<MarkdownEditor>["toolbar"] | undefined =
    undefined;
</script>

<form data-testid="form">
  <MarkdownEditor
    labelText="Notes"
    bind:value
    bind:view
    {readonly}
    {disabled}
    {maxCount}
    {split}
    {name}
    {...toolbar ? { toolbar } : {}}
  />
</form>

<output data-testid="bound">{value}</output>
<output data-testid="view">{view}</output>
