<script lang="ts">
  import Link from "carbon-components-svelte/icons/Link.svelte";
  import LinkEditor from "carbon-components-svelte/RichTextEditor/LinkEditor.svelte";
  import RichTextEditor from "carbon-components-svelte/RichTextEditor/RichTextEditor.svelte";
  import TextToolbar from "carbon-components-svelte/RichTextEditor/TextToolbar.svelte";
  import FakeAdapter from "./FakeAdapter.svelte";
</script>

<RichTextEditor>
  <TextToolbar aria-label="Formatting">
    <LinkEditor iconDescription="Insert link" icon={Link} />
  </TextToolbar>
  <FakeAdapter
    onExecute={(c) => console.log("execute", c.command, c.value?.href ?? "")}
  />
</RichTextEditor>
