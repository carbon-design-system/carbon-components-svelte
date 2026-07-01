<script>
  import { Modal } from "carbon-components-svelte";

  let open = false;
  let events = [];
  let closeEvents = [];
</script>

<button type="button" data-testid="open-modal" on:click={() => (open = true)}>
  Open modal
</button>

<p data-testid="events">{events.join(",")}</p>
<p data-testid="close-events">{closeEvents.join(",")}</p>

<Modal
  data-testid="modal"
  bind:open
  modalHeading="Modal title"
  primaryButtonText="Save"
  secondaryButtonText="Cancel"
  on:click:button--primary={() => (events = [...events, "primary"])}
  on:click:button--secondary={() => (events = [...events, "secondary"])}
  on:close={(e) => (closeEvents = [...closeEvents, e.detail?.trigger ?? "null"])}
>
  <p data-testid="modal-body">Modal content</p>
  <!-- Custom in-modal control that closes via app code (sets `open = false`),
       not the built-in close affordance — exercises the "programmatic" trigger. -->
  <button
    type="button"
    data-testid="close-modal-programmatic"
    on:click={() => (open = false)}
  >
    Close programmatically
  </button>
</Modal>
