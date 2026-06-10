<script lang="ts">
  import RichTextEditor from "carbon-components-svelte/RichTextEditor/RichTextEditor.svelte";
  import RichTextEditorProbe from "./RichTextEditorProbe.svelte";

  export let value = "";
  export let disabled = false;
</script>

<RichTextEditor
  bind:value
  {disabled}
  on:change={(e) => console.log("change", e.detail)}
>
  <RichTextEditorProbe />
</RichTextEditor>
