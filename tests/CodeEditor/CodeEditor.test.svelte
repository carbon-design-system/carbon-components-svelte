<script lang="ts">
  import CodeEditor from "carbon-components-svelte/CodeEditor/CodeEditor.svelte";
  import { tokenize } from "carbon-components-svelte/syntax";
  import type { ComponentProps } from "svelte";

  export let value: ComponentProps<CodeEditor>["value"] = "";
  export let language = "js";
  export let readonly = false;
  export let invalid = false;
  export let invalidText = "";
  export let helperText = "";
  export let indentWithTab = true;
  export let autoClose = false;
  export let indent: ComponentProps<CodeEditor>["indent"] = "spaces";
  export let name: string | undefined = undefined;
  export let withTokenizer = true;
</script>

<form data-testid="form">
  <CodeEditor
    labelText="Script"
    tokenize={withTokenizer ? tokenize : undefined}
    bind:value
    {language}
    {readonly}
    {invalid}
    {invalidText}
    {helperText}
    {indentWithTab}
    {autoClose}
    {indent}
    {name}
  />
  <button type="reset">Reset</button>
</form>
<p data-testid="bound">{value}</p>
