<script>
  import {
    Box,
    Button,
    Divider,
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
</script>

<Box
  display="inline-flex"
  align="center"
  gap={3}
  padding={2}
  fill="layer-01"
  border="subtle"
>
  <Button kind="ghost" size="small" icon={Undo} iconDescription="Undo" />
  <Button kind="ghost" size="small" icon={Redo} iconDescription="Redo" />

  <Divider orientation="vertical" />

  <Dropdown
    type="inline"
    size="sm"
    hideLabel
    labelText="Paragraph style"
    items={paragraphStyles}
    bind:selectedId={paragraphStyle}
  />

  <Divider orientation="vertical" />

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

  <Divider orientation="vertical" />

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

  <Divider orientation="vertical" />

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

  <Divider orientation="vertical" />

  <Button kind="ghost" size="small" icon={Link} iconDescription="Insert link" />
</Box>
