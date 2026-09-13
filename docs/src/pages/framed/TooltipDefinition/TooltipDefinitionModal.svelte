<script>
  import {
    Button,
    Modal,
    Portal,
    TooltipDefinition,
  } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Open modal</Button>

<Portal>
  <Modal
    bind:open
    size="sm"
    modalHeading="TooltipDefinition in modal"
    primaryButtonText="Done"
    secondaryButtonText="Cancel"
    on:click:button--secondary={() => (open = false)}
  >
    <TooltipDefinition
      direction="top"
      tooltipText="Single sign-on: one login for all connected applications."
    >
      SSO (top)
    </TooltipDefinition>
    <TooltipDefinition
      direction="bottom"
      tooltipText="Single sign-on: one login for all connected applications."
    >
      SSO (bottom)
    </TooltipDefinition>
  </Modal>
</Portal>
