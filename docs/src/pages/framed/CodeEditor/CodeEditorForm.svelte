<script>
  import { Button, CodeEditor, Form, Stack } from "carbon-components-svelte";
  import { tokenize } from "carbon-components-svelte/syntax";

  let submitted = "";

  function handleSubmit(event) {
    event.preventDefault();
    submitted = String(new FormData(event.currentTarget).get("manifest"));
  }
</script>

<Form on:submit={handleSubmit}>
  <Stack gap={5}>
    <CodeEditor
      name="manifest"
      labelText="Manifest"
      language="json"
      {tokenize}
      rows={5}
      value={'{\n  "service": "billing-api",\n  "port": 8080\n}'}
    />
    <Stack gap={3} orientation="horizontal">
      <Button type="submit">Deploy</Button>
      <Button type="reset" kind="secondary">Reset</Button>
    </Stack>
    <pre>{submitted}</pre>
  </Stack>
</Form>
