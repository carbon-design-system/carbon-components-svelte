<script>
  import {
    Button,
    ComposedModal,
    ModalBody,
    ModalFooter,
    ModalHeader,
  } from "carbon-components-svelte";

  let open = false;
  let closeEvents = [];
</script>

<button type="button" data-testid="open-modal" on:click={() => (open = true)}>
  Open modal
</button>

<p data-testid="close-events">{closeEvents.join(",")}</p>

<ComposedModal
  bind:open
  on:close={(e) => (closeEvents = [...closeEvents, e.detail?.trigger ?? "null"])}
>
  <ModalHeader title="Modal title" />
  <ModalBody>
    <p data-testid="modal-body">Modal content</p>
    <input
      type="text"
      data-modal-primary-focus
      data-testid="modal-primary-focus"
      aria-label="Primary focus input"
    >
  </ModalBody>
  <ModalFooter>
    <!-- The footer "Close" closes via app code (sets `open = false`), not a
         built-in close affordance — exercises the "programmatic" trigger. -->
    <Button data-testid="close-modal" on:click={() => (open = false)}>
      Close
    </Button>
  </ModalFooter>
</ComposedModal>
