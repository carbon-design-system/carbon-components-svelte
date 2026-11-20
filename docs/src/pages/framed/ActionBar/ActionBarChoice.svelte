<script>
  import {
    ActionBar,
    ActionBarButton,
    ActionBarGroup,
    Stack,
  } from "carbon-components-svelte";
  import TextAlignCenter from "carbon-icons-svelte/lib/TextAlignCenter.svelte";
  import TextAlignLeft from "carbon-icons-svelte/lib/TextAlignLeft.svelte";
  import TextAlignRight from "carbon-icons-svelte/lib/TextAlignRight.svelte";

  let align = "left";
</script>

<Stack gap={6}>
  <ActionBar labelText="Paragraph">
    <ActionBarGroup labelText="Alignment" selection="single" bind:value={align}>
      <ActionBarButton
        labelText="Align left"
        icon={TextAlignLeft}
        value="left"
      />
      <ActionBarButton
        labelText="Align center"
        icon={TextAlignCenter}
        value="center"
      />
      <ActionBarButton
        labelText="Align right"
        icon={TextAlignRight}
        value="right"
      />
    </ActionBarGroup>
  </ActionBar>
  <p>Alignment: {align}</p>
</Stack>
