<script>
  import { Button, Modal, Portal, Stack } from "carbon-components-svelte";

  let open = false;
</script>

<Stack gap={5} style="overflow: hidden; position: relative; height: 200px;">
  <p>
    This container hides overflowing content. Without a portal, the modal would
    be clipped.
  </p>
  <div>
    <Button on:click={() => (open = true)}>Open modal</Button>
  </div>
  <Portal>
    <Modal
      bind:open
      modalHeading="Modal in Portal"
      primaryButtonText="Confirm"
      secondaryButtonText="Cancel"
      on:click:button--secondary={() => (open = false)}
    >
      <p>
        This modal is rendered in a portal, escaping the parent container's
        overflow constraints and ensuring it appears above all other content.
      </p>
    </Modal>
  </Portal>
</Stack>
