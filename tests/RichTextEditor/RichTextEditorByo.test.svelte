<svelte:options accessors />

<script lang="ts">
  import RichTextEditor from "carbon-components-svelte/RichTextEditor/RichTextEditor.svelte";
  import TextToolbar from "carbon-components-svelte/RichTextEditor/TextToolbar.svelte";
  import TextToolbarButton from "carbon-components-svelte/RichTextEditor/TextToolbarButton.svelte";
  import FakeAdapter from "./FakeAdapter.svelte";

  export let mounted = true;
  export let active: string[] = [];
</script>

<RichTextEditor>
  <TextToolbar aria-label="Formatting">
    <TextToolbarButton command="bold" iconDescription="Bold" />
    <TextToolbarButton
      command="createLink"
      value={{ href: "https://x.com" }}
      iconDescription="Link"
    />
  </TextToolbar>
  {#if mounted}
    <FakeAdapter
      {active}
      onExecute={(c) => console.log("execute", c.command, c.value?.href ?? "")}
    />
  {/if}
</RichTextEditor>
