<script lang="ts">
  import TextBold from "carbon-components-svelte/icons/TextBold.svelte";
  import RichTextEditor from "carbon-components-svelte/RichTextEditor/RichTextEditor.svelte";
  import TextToolbar from "carbon-components-svelte/RichTextEditor/TextToolbar.svelte";
  import TextToolbarButton from "carbon-components-svelte/RichTextEditor/TextToolbarButton.svelte";
  import TextToolbarDivider from "carbon-components-svelte/RichTextEditor/TextToolbarDivider.svelte";
  import TextToolbarGroup from "carbon-components-svelte/RichTextEditor/TextToolbarGroup.svelte";
  import FakeAdapter from "./FakeAdapter.svelte";

  export let disabled = false;
  export let active: string[] = [];
</script>

<RichTextEditor {disabled}>
  <TextToolbar aria-label="Formatting">
    <TextToolbarGroup labelText="Inline">
      <TextToolbarButton
        command="bold"
        iconDescription="Bold"
        icon={TextBold}
      />
      <TextToolbarDivider />
      <TextToolbarButton command="undo" iconDescription="Undo" />
    </TextToolbarGroup>
  </TextToolbar>
  <FakeAdapter {active} onExecute={(c) => console.log("execute", c.command)} />
</RichTextEditor>
