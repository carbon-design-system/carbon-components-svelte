<script lang="ts">
  import RichTextEditor from "carbon-components-svelte/RichTextEditor/RichTextEditor.svelte";

  export let value =
    '<p onclick="x()">Hello <b>world</b></p><ul><li>one</li></ul><script>alert(1)</scr' +
    "ipt>";
</script>

<RichTextEditor
  id="notes"
  name="notes"
  labelText="Notes"
  placeholder="Write something"
  {value}
/>
