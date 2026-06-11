<script>
  import { Button, Modal } from "carbon-components-svelte";

  let open = false;
  let events = [];
</script>

<button type="button" data-testid="open-modal" on:click={() => (open = true)}>
  Open modal
</button>

<p data-testid="events">{events.join(",")}</p>

<Modal
  data-testid="modal"
  bind:open
  modalHeading="Modal title"
  primaryButtonText="Save"
  secondaryButtonText="Cancel"
  on:click:button--primary={() => (events = [...events, "primary"])}
  on:click:button--secondary={() => (events = [...events, "secondary"])}
>
  <p data-testid="modal-body">Modal content</p>
</Modal>
