<script>
  import { MarkdownEditor } from "carbon-components-svelte";

  let value = "Anything you type shows here as the preview slot receives it.";
</script>

<MarkdownEditor labelText="Plain preview" bind:value>
  <pre slot="preview" let:value>{value.toUpperCase()}</pre>
</MarkdownEditor>
