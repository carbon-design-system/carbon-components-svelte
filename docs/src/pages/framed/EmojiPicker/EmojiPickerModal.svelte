<script>
  import { Button, EmojiPicker, Modal } from "carbon-components-svelte";

  let open = false;
  let values = [];
</script>

<Button on:click={() => (open = true)}>React to message</Button>
<Modal
  bind:open
  modalHeading="React to the message"
  primaryButtonText="Done"
  on:click:button--primary={() => (open = false)}
>
  <EmojiPicker
    variant="button"
    selectionMode="multiple"
    labelText="Add reaction"
    searchLabelText="Search reactions"
    items={() => import("carbon-components-svelte/emoji-data")}
    bind:values
  />
  <p>Reactions: {values.join(", ") || "none"}</p>
</Modal>
