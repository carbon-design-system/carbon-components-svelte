<script>
  import { CodeSnippet, RichTextEditor, Stack } from "carbon-components-svelte";

  let value = "<p>Hello <strong>world</strong></p>";
</script>

<Stack gap={5}>
  <RichTextEditor
    bind:value
    labelText="Notes"
    helperText="Select text, then use the toolbar or a shortcut"
    placeholder="Write something"
  />
  <CodeSnippet type="multi" code={value} wrapText />
</Stack>
