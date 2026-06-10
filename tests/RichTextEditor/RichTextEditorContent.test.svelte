<script lang="ts">
  import RichTextEditor from "carbon-components-svelte/RichTextEditor/RichTextEditor.svelte";
  import RichTextEditorContent from "carbon-components-svelte/RichTextEditor/RichTextEditorContent.svelte";

  export let value = "";
  export let disabled = false;
  export let placeholder = "Write something";
</script>

<RichTextEditor
  bind:value
  {disabled}
  on:change={(e) => console.log("change", e.detail)}
>
  <RichTextEditorContent {placeholder} aria-label="Editor" />
</RichTextEditor>
