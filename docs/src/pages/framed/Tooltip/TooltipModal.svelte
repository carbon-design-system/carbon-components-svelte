<script>
  import {
    Button,
    Modal,
    Portal,
    Stack,
    Tooltip,
  } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Open modal</Button>

<Portal>
  <Modal
    bind:open
    size="sm"
    modalHeading="Tooltip in modal"
    primaryButtonText="Done"
    secondaryButtonText="Cancel"
    on:click:button--secondary={() => (open = false)}
  >
    <Tooltip triggerText="Top" direction="top"><p>Top</p></Tooltip>
    <Tooltip triggerText="Right" direction="right"><p>Right</p></Tooltip>
    <Tooltip triggerText="Bottom" direction="bottom"><p>Bottom</p></Tooltip>
    <Tooltip triggerText="Left" direction="left"><p>Left</p></Tooltip>
  </Modal>
</Portal>
