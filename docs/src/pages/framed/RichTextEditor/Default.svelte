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
  import ListBulleted from "carbon-icons-svelte/lib/ListBulleted.svelte";
  import ListNumbered from "carbon-icons-svelte/lib/ListNumbered.svelte";
  import Redo from "carbon-icons-svelte/lib/Redo.svelte";
  import TextAlignCenter from "carbon-icons-svelte/lib/TextAlignCenter.svelte";
  import TextAlignJustify from "carbon-icons-svelte/lib/TextAlignJustify.svelte";
  import TextAlignLeft from "carbon-icons-svelte/lib/TextAlignLeft.svelte";
  import TextAlignRight from "carbon-icons-svelte/lib/TextAlignRight.svelte";
  import TextBold from "carbon-icons-svelte/lib/TextBold.svelte";
  import TextIndentLess from "carbon-icons-svelte/lib/TextIndentLess.svelte";
  import TextIndentMore from "carbon-icons-svelte/lib/TextIndentMore.svelte";
  import TextItalic from "carbon-icons-svelte/lib/TextItalic.svelte";
  import TextUnderline from "carbon-icons-svelte/lib/TextUnderline.svelte";
  import Undo from "carbon-icons-svelte/lib/Undo.svelte";

  let value = "<p>This is editable text inside a text area.</p>";
</script>

<RichTextEditor bind:value>
  <TextToolbar aria-label="Text formatting">
    <TextToolbarGroup labelText="History">
      <TextToolbarButton command="undo" iconDescription="Undo" icon={Undo} />
      <TextToolbarButton command="redo" iconDescription="Redo" icon={Redo} />
    </TextToolbarGroup>
    <TextToolbarDivider />
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
    <TextToolbarDivider />
    <TextToolbarGroup labelText="Lists">
      <TextToolbarButton
        command="insertUnorderedList"
        iconDescription="Bulleted list"
        icon={ListBulleted}
      />
      <TextToolbarButton
        command="insertOrderedList"
        iconDescription="Numbered list"
        icon={ListNumbered}
      />
      <TextToolbarButton
        command="indent"
        iconDescription="Increase indent"
        icon={TextIndentMore}
      />
      <TextToolbarButton
        command="outdent"
        iconDescription="Decrease indent"
        icon={TextIndentLess}
      />
    </TextToolbarGroup>
    <TextToolbarDivider />
    <TextToolbarGroup labelText="Alignment">
      <TextToolbarButton
        command="justifyLeft"
        iconDescription="Align left"
        icon={TextAlignLeft}
      />
      <TextToolbarButton
        command="justifyCenter"
        iconDescription="Align center"
        icon={TextAlignCenter}
      />
      <TextToolbarButton
        command="justifyRight"
        iconDescription="Align right"
        icon={TextAlignRight}
      />
      <TextToolbarButton
        command="justifyFull"
        iconDescription="Justify"
        icon={TextAlignJustify}
      />
    </TextToolbarGroup>
    <TextToolbarDivider />
    <LinkEditor iconDescription="Insert link" icon={Link} />
  </TextToolbar>
  <RichTextEditorContent aria-label="Editor" placeholder="Write something..." />
</RichTextEditor>
