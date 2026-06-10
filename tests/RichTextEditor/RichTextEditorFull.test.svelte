<script lang="ts">
  import Link from "carbon-components-svelte/icons/Link.svelte";
  import ListBulleted from "carbon-components-svelte/icons/ListBulleted.svelte";
  import ListNumbered from "carbon-components-svelte/icons/ListNumbered.svelte";
  import Redo from "carbon-components-svelte/icons/Redo.svelte";
  import TextAlignCenter from "carbon-components-svelte/icons/TextAlignCenter.svelte";
  import TextAlignJustify from "carbon-components-svelte/icons/TextAlignJustify.svelte";
  import TextAlignLeft from "carbon-components-svelte/icons/TextAlignLeft.svelte";
  import TextAlignRight from "carbon-components-svelte/icons/TextAlignRight.svelte";
  import TextBold from "carbon-components-svelte/icons/TextBold.svelte";
  import TextIndentLess from "carbon-components-svelte/icons/TextIndentLess.svelte";
  import TextIndentMore from "carbon-components-svelte/icons/TextIndentMore.svelte";
  import TextItalic from "carbon-components-svelte/icons/TextItalic.svelte";
  import TextUnderline from "carbon-components-svelte/icons/TextUnderline.svelte";
  import Undo from "carbon-components-svelte/icons/Undo.svelte";
  import RichTextEditor from "carbon-components-svelte/RichTextEditor/RichTextEditor.svelte";
  import TextToolbar from "carbon-components-svelte/RichTextEditor/TextToolbar.svelte";
  import TextToolbarButton from "carbon-components-svelte/RichTextEditor/TextToolbarButton.svelte";
  import TextToolbarDivider from "carbon-components-svelte/RichTextEditor/TextToolbarDivider.svelte";
  import TextToolbarGroup from "carbon-components-svelte/RichTextEditor/TextToolbarGroup.svelte";
  import FakeAdapter from "./FakeAdapter.svelte";

  export let active: string[] = [];
</script>

<RichTextEditor>
  <TextToolbar aria-label="Formatting">
    <TextToolbarGroup labelText="History">
      <TextToolbarButton command="undo" iconDescription="Undo" icon={Undo} />
      <TextToolbarButton command="redo" iconDescription="Redo" icon={Redo} />
    </TextToolbarGroup>
    <TextToolbarDivider />
    <TextToolbarGroup labelText="Inline">
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
  </TextToolbar>
  <FakeAdapter {active} onExecute={(c) => console.log("execute", c.command)} />
</RichTextEditor>
