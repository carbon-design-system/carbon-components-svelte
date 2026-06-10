<script>
  import {
    RichTextEditor,
    RichTextEditorContent,
    TextToolbar,
    TextToolbarButton,
    TextToolbarGroup,
  } from "carbon-components-svelte";
  import TextBold from "carbon-icons-svelte/lib/TextBold.svelte";
  import TextItalic from "carbon-icons-svelte/lib/TextItalic.svelte";
  import TextUnderline from "carbon-icons-svelte/lib/TextUnderline.svelte";
</script>

<RichTextEditor disabled value="<p>This editor is disabled.</p>">
  <TextToolbar aria-label="Text formatting">
    <TextToolbarGroup labelText="Text styles">
      <TextToolbarButton
        command="bold"
        iconDescription="Bold"
        icon={TextBold}
      />
      <TextToolbarButton
        command="italic"
        iconDescription="Italic"
        icon={TextItalic}
      />
      <TextToolbarButton
        command="underline"
        iconDescription="Underline"
        icon={TextUnderline}
      />
    </TextToolbarGroup>
  </TextToolbar>
  <RichTextEditorContent aria-label="Editor" />
</RichTextEditor>
