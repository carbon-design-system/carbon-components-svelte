<script lang="ts">
  import Mentions from "carbon-components-svelte/Mentions/Mentions.svelte";
  import TextArea from "carbon-components-svelte/TextArea/TextArea.svelte";

  let ref: null | HTMLTextAreaElement = null;
</script>

<TextArea bind:ref value="Hi @ali" labelText="Comment" />
<Mentions
  field={ref}
  triggers={[{ char: "@", items: [{ id: 1, text: "Alice" }] }]}
/>
