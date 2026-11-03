<script>
  import { Box, EmojiPicker, TextArea } from "carbon-components-svelte";

  let value = "Shipped the fix ";
  /** @type {null | HTMLTextAreaElement} */
  let ref = null;

  // A button reports the choice and keeps none, so the app inserts it
  // where the caret is.
  function insert({ detail }) {
    if (!ref) return;
    const start = ref.selectionStart;
    value =
      value.slice(0, start) + detail.emoji + value.slice(ref.selectionEnd);
    const caret = start + detail.emoji.length;
    requestAnimationFrame(() => {
      ref?.focus();
      ref?.setSelectionRange(caret, caret);
    });
  }
</script>

<Box maxWidth="24rem">
  <TextArea bind:ref bind:value labelText="Comment" rows={3} />
  <EmojiPicker
    variant="button"
    size="sm"
    labelText="Insert emoji"
    searchLabelText="Search emoji to insert"
    items={() => import("carbon-components-svelte/emoji-data")}
    on:select={insert}
  />
</Box>
