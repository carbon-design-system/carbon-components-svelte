<script>
  import { Button, Modal, Portal, TooltipIcon } from "carbon-components-svelte";
  import Filter from "carbon-icons-svelte/lib/Filter.svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Open modal</Button>

<Portal>
  <Modal
    bind:open
    size="sm"
    modalHeading="TooltipIcon in modal"
    primaryButtonText="Done"
    secondaryButtonText="Cancel"
    on:click:button--secondary={() => (open = false)}
  >
    <TooltipIcon tooltipText="Top" direction="top" icon={Filter} />
    <TooltipIcon tooltipText="Right" direction="right" icon={Filter} />
    <TooltipIcon tooltipText="Bottom" direction="bottom" icon={Filter} />
    <TooltipIcon tooltipText="Left" direction="left" icon={Filter} />
  </Modal>
</Portal>
