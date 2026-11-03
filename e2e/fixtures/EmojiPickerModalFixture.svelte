<script>
  import { EmojiPicker, Modal } from "carbon-components-svelte";

  let open = true;
  let values = [];
</script>

<Modal
  data-testid="modal"
  bind:open
  modalHeading="React to the message"
  primaryButtonText="Send"
  secondaryButtonText="Cancel"
>
  <EmojiPicker
    items={() => import("carbon-components-svelte/emoji-data")}
    maxVersion={Number.POSITIVE_INFINITY}
    variant="button"
    selectionMode="multiple"
    labelText="Add reaction"
    searchLabelText="Search reactions"
    bind:values
  />
</Modal>
<output data-testid="values">{values.join(",")}</output>
<output data-testid="modal-open">{open}</output>
