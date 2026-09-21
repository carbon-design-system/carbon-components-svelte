<script>
  import {
    Button,
    Dropdown,
    ToggleButton,
    ToggleButtonGroup,
  } from "carbon-components-svelte";
  import Link from "carbon-icons-svelte/lib/Link.svelte";
  import ListBulleted from "carbon-icons-svelte/lib/ListBulleted.svelte";
  import ListNumbered from "carbon-icons-svelte/lib/ListNumbered.svelte";
  import Redo from "carbon-icons-svelte/lib/Redo.svelte";
  import TextAlignCenter from "carbon-icons-svelte/lib/TextAlignCenter.svelte";
  import TextAlignLeft from "carbon-icons-svelte/lib/TextAlignLeft.svelte";
  import TextAlignRight from "carbon-icons-svelte/lib/TextAlignRight.svelte";
  import TextBold from "carbon-icons-svelte/lib/TextBold.svelte";
  import TextItalic from "carbon-icons-svelte/lib/TextItalic.svelte";
  import TextStrikethrough from "carbon-icons-svelte/lib/TextStrikethrough.svelte";
  import TextUnderline from "carbon-icons-svelte/lib/TextUnderline.svelte";
  import Undo from "carbon-icons-svelte/lib/Undo.svelte";

  const paragraphStyles = [
    { id: "paragraph", text: "Paragraph" },
    { id: "h1", text: "Heading 1" },
    { id: "h2", text: "Heading 2" },
    { id: "h3", text: "Heading 3" },
  ];

  let paragraphStyle = "paragraph";
  let formatting = ["bold"];
  let alignment = ["left"];
  let list = [];

  const dividerStyle =
    "width: 1px; align-self: stretch; background: var(--cds-ui-03, #e0e0e0);";
</script>

<div
  style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.25rem; background: var(--cds-layer, #f4f4f4); border: 1px solid var(--cds-border-subtle, #e0e0e0);"
>
  <Button kind="ghost" size="small" icon={Undo} iconDescription="Undo" />
  <Button kind="ghost" size="small" icon={Redo} iconDescription="Redo" />

  <div style={dividerStyle}></div>

  <Dropdown
    type="inline"
    size="sm"
    hideLabel
    labelText="Paragraph style"
    items={paragraphStyles}
    bind:selectedId={paragraphStyle}
  />

  <div style={dividerStyle}></div>

  <ToggleButtonGroup
    size="sm"
    labelText="Text formatting"
    bind:selected={formatting}
  >
    <ToggleButton value="bold" icon={TextBold} iconDescription="Bold" />
    <ToggleButton value="italic" icon={TextItalic} iconDescription="Italic" />
    <ToggleButton
      value="underline"
      icon={TextUnderline}
      iconDescription="Underline"
    />
    <ToggleButton
      value="strikethrough"
      icon={TextStrikethrough}
      iconDescription="Strikethrough"
    />
  </ToggleButtonGroup>

  <div style={dividerStyle}></div>

  <ToggleButtonGroup
    size="sm"
    selectionMode="single"
    required
    labelText="Text alignment"
    bind:selected={alignment}
  >
    <ToggleButton
      value="left"
      icon={TextAlignLeft}
      iconDescription="Align left"
    />
    <ToggleButton
      value="center"
      icon={TextAlignCenter}
      iconDescription="Align center"
    />
    <ToggleButton
      value="right"
      icon={TextAlignRight}
      iconDescription="Align right"
    />
  </ToggleButtonGroup>

  <div style={dividerStyle}></div>

  <ToggleButtonGroup
    size="sm"
    selectionMode="single"
    labelText="Lists"
    bind:selected={list}
  >
    <ToggleButton
      value="bulleted"
      icon={ListBulleted}
      iconDescription="Bulleted list"
    />
    <ToggleButton
      value="numbered"
      icon={ListNumbered}
      iconDescription="Numbered list"
    />
  </ToggleButtonGroup>

  <div style={dividerStyle}></div>

  <Button kind="ghost" size="small" icon={Link} iconDescription="Insert link" />
</div>
