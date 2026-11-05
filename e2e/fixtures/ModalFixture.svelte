<script>
  import { Modal, Select, SelectItem } from "carbon-components-svelte";

  // `?passive` renders a passive modal, which closes on an outside click.
  const passiveModal = new URLSearchParams(location.search).has("passive");

  // `?primary-disabled` disables the primary button and drops the select, so
  // the modal has no input and the first focus falls back to a button.
  const primaryDisabled = new URLSearchParams(location.search).has(
    "primary-disabled",
  );

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
  {passiveModal}
  modalHeading="Modal title"
  primaryButtonText="Save"
  primaryButtonDisabled={primaryDisabled}
  secondaryButtonText="Cancel"
  on:click:button--primary={() => (events = [...events, "primary"])}
  on:click:button--secondary={() => (events = [...events, "secondary"])}
  on:close={(e) =>
    (closeEvents = [...closeEvents, e.detail?.trigger ?? "null"])}
>
  <p data-testid="modal-body">Modal content</p>
  {#if !primaryDisabled}
    <Select data-testid="modal-select" labelText="Contact method">
      <SelectItem value="slack" text="Slack" />
      <SelectItem value="email" text="Email" />
    </Select>
  {/if}
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
