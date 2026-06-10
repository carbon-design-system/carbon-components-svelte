<script>
  import {
    LinkEditor,
    RichTextEditor,
    RichTextEditorContent,
    TextToolbar,
    TextToolbarButton,
    TextToolbarDivider,
    TextToolbarGroup,
  } from "carbon-components-svelte";
  import Link from "carbon-icons-svelte/lib/Link.svelte";
  import TextBold from "carbon-icons-svelte/lib/TextBold.svelte";
  import TextItalic from "carbon-icons-svelte/lib/TextItalic.svelte";
  import Undo from "carbon-icons-svelte/lib/Undo.svelte";

  let value = "";
</script>

<RichTextEditor bind:value>
  <TextToolbar aria-label="Text formatting">
    <TextToolbarGroup labelText="History">
      <TextToolbarButton
        command="undo"
        iconDescription="Undo"
        icon={Undo}
        data-testid="undo"
      />
    </TextToolbarGroup>
    <TextToolbarDivider />
    <TextToolbarGroup labelText="Text styles">
      <TextToolbarButton
        command="bold"
        iconDescription="Bold"
        icon={TextBold}
        data-testid="bold"
      />
      <TextToolbarButton
        command="italic"
        iconDescription="Italic"
        icon={TextItalic}
        data-testid="italic"
      />
    </TextToolbarGroup>
    <TextToolbarDivider />
    <LinkEditor iconDescription="Insert link" icon={Link} />
  </TextToolbar>
  <RichTextEditorContent
    data-testid="editor"
    aria-label="Editor"
    placeholder="Write something..."
  />
</RichTextEditor>

<pre data-testid="value">{value}</pre>
