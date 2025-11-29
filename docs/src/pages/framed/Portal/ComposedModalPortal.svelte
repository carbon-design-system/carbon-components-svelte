<script>
  import {
    Button,
    ComposedModal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Portal,
    Stack,
  } from "carbon-components-svelte";

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
    <ComposedModal bind:open>
      <ModalHeader title="Composed Modal in Portal" />
      <ModalBody>
        <p>
          This composed modal is rendered in a portal, ensuring it appears above
          all z-index stacking contexts and parent overflow constraints.
        </p>
      </ModalBody>
      <ModalFooter
        primaryButtonText="Confirm"
        secondaryButtonText="Cancel"
        on:click:button--secondary={() => (open = false)}
      />
    </ComposedModal>
  </Portal>
</Stack>
