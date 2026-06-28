<script>
  import { Button, Modal, Portal, UserAvatar } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Open modal</Button>

<Portal>
  <Modal
    bind:open
    size="sm"
    modalHeading="UserAvatar in modal"
    primaryButtonText="Done"
    secondaryButtonText="Cancel"
    on:click:button--secondary={() => (open = false)}
  >
    <UserAvatar
      name="Richard Hendricks"
      tooltipText="Richard Hendricks"
      direction="bottom"
    />
  </Modal>
</Portal>
