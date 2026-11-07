<script>
  import {
    ActionBar,
    ActionBarButton,
    ActionBarGroup,
    Stack,
  } from "carbon-components-svelte";
  import TextBold from "carbon-icons-svelte/lib/TextBold.svelte";
  import TextItalic from "carbon-icons-svelte/lib/TextItalic.svelte";
  import TextUnderline from "carbon-icons-svelte/lib/TextUnderline.svelte";

  let bold = true;
  let italic = false;
  let underline = false;
</script>

<Stack gap={6}>
  <ActionBar labelText="Text style">
    <ActionBarGroup labelText="Marks">
      <ActionBarButton
        labelText="Bold"
        icon={TextBold}
        shortcut="mod+b"
        pressed={bold}
        on:click={() => (bold = !bold)}
      />
      <ActionBarButton
        labelText="Italic"
        icon={TextItalic}
        shortcut="mod+i"
        pressed={italic}
        on:click={() => (italic = !italic)}
      />
      <ActionBarButton
        labelText="Underline"
        icon={TextUnderline}
        shortcut="mod+u"
        pressed={underline}
        on:click={() => (underline = !underline)}
      />
    </ActionBarGroup>
  </ActionBar>
  <p>
    Pressed: {[bold && "bold", italic && "italic", underline && "underline"]
      .filter(Boolean)
      .join(", ") || "none"}
  </p>
</Stack>
