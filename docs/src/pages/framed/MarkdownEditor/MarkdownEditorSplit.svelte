<script>
  import { MarkdownEditor } from "carbon-components-svelte";

  let value =
    '# Split view\n\nType on the left. The preview follows on the right once you pause.\n\n```js\nconsole.log("hello");\n```\n';
  let splitActive = false;
</script>

<MarkdownEditor
  labelText="Document"
  helperText={splitActive
    ? "Showing both panes"
    : "Too narrow for both panes: showing tabs"}
  split
  rows={10}
  bind:value
  bind:splitActive
/>
