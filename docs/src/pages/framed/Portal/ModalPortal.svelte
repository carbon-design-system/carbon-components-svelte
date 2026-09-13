<script>
  import { Button, Modal, Portal, Stack } from "carbon-components-svelte";

  let open = false;
</script>

<Stack gap={5} style="overflow: hidden; position: relative; height: 200px;">
  <p>
    This container hides overflowing content. Without a portal, the modal would
    be clipped.
  </p>
  <div><Button on:click={() => (open = true)}>Deploy build #4213</Button></div>
  <Portal>
    <Modal
      bind:open
      modalHeading="Confirm deployment"
      primaryButtonText="Deploy"
      secondaryButtonText="Cancel"
      on:click:button--secondary={() => (open = false)}
    >
      <p>
        Deploying build #4213 to production cannot be undone. This modal is
        rendered in a portal, escaping the parent container's overflow
        constraints and ensuring it appears above all other content.
      </p>
    </Modal>
  </Portal>
</Stack>
