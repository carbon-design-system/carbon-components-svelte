<script>
  import {
    Button,
    CodeEditor,
    CodeSnippet,
    FluidForm,
    Modal,
    Stack,
  } from "carbon-components-svelte";
  import { highlight, tokenize } from "carbon-components-svelte/syntax";
  import "carbon-components-svelte/css/syntax-tokens.css";
  import "carbon-components-svelte/css/syntax.css";

  let script = `import { writable } from "svelte/store";

// Count the clicks.
export function createCounter(start = 0) {
  const count = writable(start);
  return {
    subscribe: count.subscribe,
    increment: () => count.update((n) => n + 1),
  };
}
`;
  // The script as first shown, colored by CodeSnippet for comparison.
  const snippet = script;
  let json = `{
  "name": "carbon-components-svelte",
  "private": false,
  "keywords": ["svelte", "carbon"],
  "version": 1.5
}
`;
  let comment = "/* one\ntwo */ const x = 1;";
  const large = Array.from(
    { length: 5000 },
    (_, index) => `const line${index + 1} = ${index + 1};`,
  ).join("\n");
  let config = "key: value";
  let formData = "";
  let modalOpen = false;
  let modalValue = "";

  function handleSubmit(event) {
    event.preventDefault();
    formData = new URLSearchParams(
      new FormData(event.currentTarget),
    ).toString();
  }
</script>

<Stack gap={7}>
  <CodeEditor
    data-testid="code-editor-js"
    labelText="Script"
    helperText="Plain JavaScript"
    language="js"
    {tokenize}
    rows={8}
    bind:value={script}
  />
  <pre data-testid="code-editor-js-value">{script}</pre>
  <input data-testid="after-js" aria-label="After the script" />

  <CodeEditor
    data-testid="code-editor-comment"
    labelText="Comment"
    language="js"
    {tokenize}
    rows={4}
    bind:value={comment}
  />

  <CodeEditor
    data-testid="code-editor-pairs"
    labelText="Pairs"
    language="js"
    {tokenize}
    rows={4}
    autoClose
    value=""
  />

  <CodeEditor
    data-testid="code-editor-json"
    labelText="Config"
    language="json"
    {tokenize}
    rows={6}
    readonly
    value={json}
  />

  <CodeEditor
    data-testid="code-editor-invalid"
    labelText="Invalid"
    language="json"
    {tokenize}
    rows={3}
    invalid
    invalidText="Not valid JSON"
    value={'{ "a": }'}
  />

  <CodeEditor
    data-testid="code-editor-warn"
    labelText="Warn"
    language="json"
    {tokenize}
    rows={3}
    warn
    warnText="Deprecated keys"
    value={'{ "old": true }'}
  />

  <CodeEditor
    data-testid="code-editor-wrap"
    labelText="Wrapped"
    language="js"
    {tokenize}
    rows={4}
    wrapText
    value={"const message = 'a very long line that has to wrap because the editor is narrow and the line is not short at all, so it keeps going';\nconst b = 2;"}
  />

  <CodeEditor
    data-testid="code-editor-disabled"
    labelText="Disabled"
    language="js"
    {tokenize}
    rows={3}
    disabled
    value={"const disabled = true; // off"}
  />

  <CodeEditor
    data-testid="code-editor-small"
    labelText="Small, no numbers"
    language="js"
    {tokenize}
    size="sm"
    rows={3}
    lineNumbers={false}
    value={"const small = 1;\nconst two = 2;"}
  />

  <CodeEditor
    data-testid="code-editor-tabs"
    labelText="Tabs"
    language="js"
    {tokenize}
    rows={3}
    indent="tabs"
    tabSize={4}
    value=""
  />

  <CodeEditor
    data-testid="code-editor-no-tab"
    labelText="Tab moves focus"
    rows={3}
    indentWithTab={false}
    value=""
  />

  <CodeEditor
    data-testid="code-editor-large"
    labelText="Large"
    language="js"
    {tokenize}
    rows={8}
    value={large}
  />

  <form data-testid="form" on:submit={handleSubmit}>
    <CodeEditor
      data-testid="code-editor-form"
      labelText="Settings"
      name="config"
      rows={3}
      bind:value={config}
    />
    <Button type="submit">Save</Button>
    <Button type="reset" kind="secondary">Reset</Button>
    <pre data-testid="form-value">{formData}</pre>
    <pre data-testid="form-bound">{config}</pre>
  </form>

  <Button on:click={() => (modalOpen = true)}>Open modal</Button>
  <Modal bind:open={modalOpen} modalHeading="Edit" primaryButtonText="Close">
    <CodeEditor
      data-testid="code-editor-modal"
      labelText="In a modal"
      rows={3}
      bind:value={modalValue}
    />
  </Modal>

  <div data-testid="snippet">
    <CodeSnippet type="multi" code={snippet}>
      {@html highlight(snippet, "js")}
    </CodeSnippet>
  </div>
</Stack>

<div data-testid="fluid">
  <FluidForm>
    <CodeEditor
      data-testid="code-editor-fluid"
      labelText="Fluid"
      language="js"
      {tokenize}
      rows={4}
      value={"const fluid = true;"}
    />
  </FluidForm>
</div>
