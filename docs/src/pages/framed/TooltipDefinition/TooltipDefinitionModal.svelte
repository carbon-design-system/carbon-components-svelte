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
      tooltipText="IBM Corporate Headquarters is based in Armonk, New York."
    >
      Armonk (top)
    </TooltipDefinition>
    <TooltipDefinition
      direction="bottom"
      tooltipText="IBM Corporate Headquarters is based in Armonk, New York."
    >
      Armonk (bottom)
    </TooltipDefinition>
  </Modal>
</Portal>
