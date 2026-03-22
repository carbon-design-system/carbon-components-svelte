<script>
  import { Modal, TooltipIcon } from "carbon-components-svelte";
  import Information from "carbon-icons-svelte/lib/Information.svelte";

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
    <TooltipIcon
      data-testid="tooltip-icon-modal"
      tooltipText="Portaled icon tooltip"
      icon={Information}
    />
  </div>
</Modal>
