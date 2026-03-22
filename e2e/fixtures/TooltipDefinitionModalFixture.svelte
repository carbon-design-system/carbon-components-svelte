<script>
  import { Modal, TooltipDefinition } from "carbon-components-svelte";

  let open = false;
</script>

<button type="button" data-testid="open-modal" on:click={() => (open = true)}>
  Open modal
</button>

<Modal
  data-testid="modal"
  bind:open
  modalHeading="Modal for tooltip test"
  primaryButtonText="Save"
  secondaryButtonText="Cancel"
>
  <div
    data-testid="overflow-box"
    style="overflow: hidden; max-height: 3rem; padding: 0.5rem;"
  >
    <TooltipDefinition
      data-testid="tooltip-definition-modal"
      tooltipText="Portaled definition text"
    >
      Definition in modal
    </TooltipDefinition>
  </div>
</Modal>
